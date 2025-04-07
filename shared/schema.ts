import { pgTable, text, serial, integer, boolean, varchar, decimal, timestamp, date, primaryKey, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (keeping the existing one)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients).pick({
  name: true,
  address: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Qualities table
export const qualities = pgTable("qualities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  denier: integer("denier").notNull(),
  blend: varchar("blend", { length: 50 }).notNull(),
  shadeNumber: varchar("shade_number", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQualitySchema = createInsertSchema(qualities).pick({
  name: true,
  denier: true,
  blend: true,
  shadeNumber: true,
});

export type InsertQuality = z.infer<typeof insertQualitySchema>;
export type Quality = typeof qualities.$inferSelect;

// Reports table
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reportDate: date("report_date").notNull(),
  clientId: integer("client_id").notNull(),
  challanNo: integer("challan_no").notNull(),
  qualityName: varchar("quality_name", { length: 50 }).notNull(),
  shadeNumber: varchar("shade_number", { length: 50 }),
  denier: integer("denier").notNull(),
  blend: varchar("blend", { length: 50 }).notNull(),
  lotNumber: integer("lot_number").notNull(),
  totalBags: integer("total_bags").notNull(),
  totalGrossWeight: decimal("total_gross_weight", { precision: 10, scale: 2 }).notNull(),
  totalTareWeight: decimal("total_tare_weight", { precision: 10, scale: 2 }).notNull(),
  totalNetWeight: decimal("total_net_weight", { precision: 10, scale: 2 }).notNull(),
  totalCones: integer("total_cones").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
}).extend({
  // Explicitly define decimal fields as strings for Zod validation
  totalGrossWeight: z.string(),
  totalTareWeight: z.string(),
  totalNetWeight: z.string(),
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// Report Items table
export const reportItems = pgTable("report_items", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  bagNo: integer("bag_no").notNull(),
  grossWeight: decimal("gross_weight", { precision: 10, scale: 2 }).notNull(),
  tareWeight: decimal("tare_weight", { precision: 10, scale: 2 }).notNull(),
  netWeight: decimal("net_weight", { precision: 10, scale: 2 }).notNull(),
  cones: integer("cones").notNull(),
});

export const insertReportItemSchema = createInsertSchema(reportItems).omit({
  id: true,
}).extend({
  // Explicitly define decimal fields as strings for Zod validation
  grossWeight: z.string(),
  tareWeight: z.string(),
  netWeight: z.string(),
});

export type InsertReportItem = z.infer<typeof insertReportItemSchema>;
export type ReportItem = typeof reportItems.$inferSelect;

// Combined schemas for API requests
export const createReportSchema = z.object({
  report: insertReportSchema,
  items: z.array(insertReportItemSchema.omit({ reportId: true }))
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

// Report with items for frontend
export const reportWithItemsSchema = z.object({
  report: z.object({
    id: z.number(),
    reportDate: z.string(),
    clientId: z.number(),
    challanNo: z.number(),
    qualityName: z.string(),
    shadeNumber: z.string().nullable(),
    denier: z.number(),
    blend: z.string(),
    lotNumber: z.number(),
    totalBags: z.number(),
    totalGrossWeight: z.number(),
    totalTareWeight: z.number(),
    totalNetWeight: z.number(),
    totalCones: z.number(),
    createdAt: z.string(),
    clientName: z.string(),
    clientAddress: z.string()
  }),
  items: z.array(z.object({
    id: z.number(),
    reportId: z.number(),
    bagNo: z.number(),
    grossWeight: z.number(),
    tareWeight: z.number(),
    netWeight: z.number(),
    cones: z.number()
  }))
});

export type ReportWithItems = z.infer<typeof reportWithItemsSchema>;
