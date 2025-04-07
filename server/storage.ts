import { 
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

  // Authentication no longer used

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
      .values([client])
      .returning();
    
    return newClient;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined> {
    await db
      .update(clients)
      .set(client)
      .where(eq(clients.id, id));
    return this.getClient(id);
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
      .values([quality])
      .returning();
    
    return newQuality;
  }

  async updateQuality(id: number, quality: Partial<InsertQuality>): Promise<Quality | undefined> {
    await db
      .update(qualities)
      .set(quality)
      .where(eq(qualities.id, id));
    return this.getQuality(id);
  }

  async deleteQuality(id: number): Promise<boolean> {
    await db
      .delete(qualities)
      .where(eq(qualities.id, id));
    return true;
  }

  // Report methods
  async getReports(): Promise<(Report & { clientName: string })[]> {
    // Need to select columns explicitly for type safety
    const result = await db
      .select({
        id: reports.id,
        reportDate: reports.reportDate,
        clientId: reports.clientId,
        challanNo: reports.challanNo,
        qualityName: reports.qualityName,
        shadeNumber: reports.shadeNumber,
        denier: reports.denier,
        blend: reports.blend,
        lotNumber: reports.lotNumber,
        totalBags: reports.totalBags,
        totalGrossWeight: reports.totalGrossWeight,
        totalTareWeight: reports.totalTareWeight,
        totalNetWeight: reports.totalNetWeight,
        totalCones: reports.totalCones,
        createdAt: reports.createdAt,
        clientName: clients.name
      })
      .from(reports)
      .innerJoin(clients, eq(reports.clientId, clients.id))
      .orderBy(desc(reports.reportDate));
    
    return result as (Report & { clientName: string })[];
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getReportWithItems(id: number): Promise<ReportWithItems | undefined> {
    // Use explicit column selection for type safety
    const reportResult = await db
      .select({
        id: reports.id,
        reportDate: reports.reportDate,
        clientId: reports.clientId,
        challanNo: reports.challanNo,
        qualityName: reports.qualityName,
        shadeNumber: reports.shadeNumber,
        denier: reports.denier,
        blend: reports.blend,
        lotNumber: reports.lotNumber,
        totalBags: reports.totalBags,
        totalGrossWeight: reports.totalGrossWeight,
        totalTareWeight: reports.totalTareWeight,
        totalNetWeight: reports.totalNetWeight,
        totalCones: reports.totalCones,
        createdAt: reports.createdAt,
        clientName: clients.name,
        clientAddress: clients.address
      })
      .from(reports)
      .innerJoin(clients, eq(reports.clientId, clients.id))
      .where(eq(reports.id, id));
    
    if (reportResult.length === 0) return undefined;
    
    const report = reportResult[0];

    const items = await db
      .select({
        id: reportItems.id,
        reportId: reportItems.reportId,
        bagNo: reportItems.bagNo,
        grossWeight: reportItems.grossWeight,
        tareWeight: reportItems.tareWeight,
        netWeight: reportItems.netWeight,
        cones: reportItems.cones
      })
      .from(reportItems)
      .where(eq(reportItems.reportId, id))
      .orderBy(reportItems.bagNo);

    // Converting to the right format for the frontend with explicit typing
    const reportData = {
      report: {
        id: report.id,
        reportDate: report.reportDate.toString(),
        clientId: report.clientId,
        challanNo: report.challanNo,
        qualityName: report.qualityName,
        shadeNumber: report.shadeNumber,
        denier: report.denier,
        blend: report.blend,
        lotNumber: report.lotNumber,
        totalBags: report.totalBags,
        totalGrossWeight: Number(report.totalGrossWeight),
        totalTareWeight: Number(report.totalTareWeight),
        totalNetWeight: Number(report.totalNetWeight),
        totalCones: report.totalCones,
        createdAt: report.createdAt.toString(),
        clientName: report.clientName,
        clientAddress: report.clientAddress
      },
      items: items.map(item => ({
        id: item.id,
        reportId: item.reportId,
        bagNo: item.bagNo,
        grossWeight: Number(item.grossWeight),
        tareWeight: Number(item.tareWeight),
        netWeight: Number(item.netWeight),
        cones: item.cones
      }))
    };
    
    return reportData as ReportWithItems;
  }

  async createReport(input: CreateReportInput): Promise<Report> {
    // Create the report first with returning to get the ID
    const [report] = await db
      .insert(reports)
      .values([input.report])
      .returning();
    
    // Create all report items
    if (input.items.length > 0) {
      const reportItemsData = input.items.map(item => ({
        ...item,
        reportId: report.id
      }));
      await db.insert(reportItems).values(reportItemsData);
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
    // Use explicit column selection for type safety
    let baseQuery = db
      .select({
        id: reports.id,
        reportDate: reports.reportDate,
        clientId: reports.clientId,
        challanNo: reports.challanNo,
        qualityName: reports.qualityName,
        shadeNumber: reports.shadeNumber,
        denier: reports.denier,
        blend: reports.blend,
        lotNumber: reports.lotNumber,
        totalBags: reports.totalBags,
        totalGrossWeight: reports.totalGrossWeight,
        totalTareWeight: reports.totalTareWeight,
        totalNetWeight: reports.totalNetWeight,
        totalCones: reports.totalCones,
        createdAt: reports.createdAt,
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
          CAST(${reports.challanNo} AS CHAR) LIKE ${searchTerm}
        )`
      );
    }

    let query = baseQuery;
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(desc(reports.reportDate));
    
    return result as (Report & { clientName: string })[];
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
