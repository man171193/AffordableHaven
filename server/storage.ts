import { 
  users, type User, type InsertUser,
  clients, type Client, type InsertClient,
  qualities, type Quality, type InsertQuality,
  reports, type Report, type InsertReport,
  reportItems, type ReportItem, type InsertReportItem,
  type CreateReportInput, type ReportWithItems
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, sql, isNull } from "drizzle-orm";
import session from "express-session";
import MemoryStore from "memorystore";

// Expanded storage interface
export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  getClientByName(name: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Qualities
  getQualities(): Promise<Quality[]>;
  getQuality(id: number): Promise<Quality | undefined>;
  getQualityByName(name: string): Promise<Quality | undefined>;
  createQuality(quality: InsertQuality): Promise<Quality>;
  updateQuality(id: number, quality: Partial<InsertQuality>): Promise<Quality | undefined>;
  deleteQuality(id: number): Promise<boolean>;

  // Reports
  getReports(): Promise<(Report & { clientName: string })[]>;
  getReport(id: number): Promise<Report | undefined>;
  getReportWithItems(id: number): Promise<ReportWithItems | undefined>;
  createReport(input: CreateReportInput): Promise<Report>;
  deleteReport(id: number): Promise<boolean>;
  searchReports(params: { 
    clientId?: number, 
    qualityName?: string, 
    startDate?: Date, 
    endDate?: Date,
    searchTerm?: string
  }): Promise<(Report & { clientName: string })[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const MemoryStoreSession = MemoryStore(session);
    this.sessionStore = new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Client methods
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(clients.name);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientByName(name: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.name, name));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values(client)
      .returning();
    return newClient;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set(client)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db
      .delete(clients)
      .where(eq(clients.id, id));
    return true;
  }

  // Quality methods
  async getQualities(): Promise<Quality[]> {
    return await db.select().from(qualities).orderBy(qualities.name);
  }

  async getQuality(id: number): Promise<Quality | undefined> {
    const [quality] = await db.select().from(qualities).where(eq(qualities.id, id));
    return quality;
  }

  async getQualityByName(name: string): Promise<Quality | undefined> {
    const [quality] = await db.select().from(qualities).where(eq(qualities.name, name));
    return quality;
  }

  async createQuality(quality: InsertQuality): Promise<Quality> {
    const [newQuality] = await db
      .insert(qualities)
      .values(quality)
      .returning();
    return newQuality;
  }

  async updateQuality(id: number, quality: Partial<InsertQuality>): Promise<Quality | undefined> {
    const [updatedQuality] = await db
      .update(qualities)
      .set(quality)
      .where(eq(qualities.id, id))
      .returning();
    return updatedQuality;
  }

  async deleteQuality(id: number): Promise<boolean> {
    await db
      .delete(qualities)
      .where(eq(qualities.id, id));
    return true;
  }

  // Report methods
  async getReports(): Promise<(Report & { clientName: string })[]> {
    const result = await db
      .select({
        ...reports,
        clientName: clients.name
      })
      .from(reports)
      .innerJoin(clients, eq(reports.clientId, clients.id))
      .orderBy(desc(reports.reportDate));
    
    return result;
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getReportWithItems(id: number): Promise<ReportWithItems | undefined> {
    const report = await db
      .select({
        ...reports,
        clientName: clients.name,
        clientAddress: clients.address
      })
      .from(reports)
      .innerJoin(clients, eq(reports.clientId, clients.id))
      .where(eq(reports.id, id))
      .then(res => res[0]);

    if (!report) return undefined;

    const items = await db
      .select()
      .from(reportItems)
      .where(eq(reportItems.reportId, id))
      .orderBy(reportItems.bagNo);

    return {
      report: {
        ...report,
        totalGrossWeight: Number(report.totalGrossWeight),
        totalTareWeight: Number(report.totalTareWeight),
        totalNetWeight: Number(report.totalNetWeight)
      },
      items: items.map(item => ({
        ...item,
        grossWeight: Number(item.grossWeight),
        tareWeight: Number(item.tareWeight),
        netWeight: Number(item.netWeight)
      }))
    };
  }

  async createReport(input: CreateReportInput): Promise<Report> {
    // Neon HTTP driver doesn't support transactions, so we need to do this in separate operations
    
    // Create the report first
    const [report] = await db
      .insert(reports)
      .values(input.report)
      .returning();

    // Create all report items
    if (input.items.length > 0) {
      await db.insert(reportItems).values(
        input.items.map(item => ({
          ...item,
          reportId: report.id
        }))
      );
    }

    return report;
  }

  async deleteReport(id: number): Promise<boolean> {
    // Neon HTTP driver doesn't support transactions, so we need to do this in separate operations
    
    // Delete all report items first
    await db
      .delete(reportItems)
      .where(eq(reportItems.reportId, id));

    // Then delete the report
    await db
      .delete(reports)
      .where(eq(reports.id, id));

    return true;
  }

  async searchReports(params: { 
    clientId?: number, 
    qualityName?: string, 
    startDate?: Date, 
    endDate?: Date,
    searchTerm?: string
  }): Promise<(Report & { clientName: string })[]> {
    let query = db
      .select({
        ...reports,
        clientName: clients.name
      })
      .from(reports)
      .innerJoin(clients, eq(reports.clientId, clients.id));

    const conditions = [];

    if (params.clientId) {
      conditions.push(eq(reports.clientId, params.clientId));
    }

    if (params.qualityName) {
      conditions.push(eq(reports.qualityName, params.qualityName));
    }

    if (params.startDate) {
      conditions.push(sql`${reports.reportDate} >= ${params.startDate}`);
    }

    if (params.endDate) {
      conditions.push(sql`${reports.reportDate} <= ${params.endDate}`);
    }

    if (params.searchTerm) {
      const searchTerm = `%${params.searchTerm}%`;
      conditions.push(
        sql`(
          ${like(clients.name, searchTerm)} OR
          ${like(reports.qualityName, searchTerm)} OR
          CAST(${reports.challanNo} AS TEXT) LIKE ${searchTerm}
        )`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(desc(reports.reportDate));
    
    return result;
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
