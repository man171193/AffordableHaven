import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertClientSchema, 
  insertQualitySchema, 
  createReportSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();

  // Error handling middleware
  const handleZodError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationError.details 
      });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  };

  // Initialize the database with sample data if needed
  apiRouter.post("/seed", async (req, res) => {
    try {
      // Seed clients
      const clients = [
        { name: "3AT INDIA INC", address: "123 Industrial Area, Phase 1, New Delhi - 110001, India" },
        { name: "ABDUL SAMAD SHABAN", address: "45 Cotton Street, Mumbai - 400001, India" },
        { name: "DICITEX FURNISHING PVT LTD", address: "Plot No. 15, MIDC, Andheri East, Mumbai - 400093, India" },
        { name: "EASTERN SILK INDUSTRIES LIMITED", address: "7 Silk Center, Bangalore - 560001, India" },
        { name: "FAZE THREE LTD", address: "29 Textile Park, Surat - 395003, Gujarat, India" }
      ];

      for (const client of clients) {
        const existingClient = await storage.getClientByName(client.name);
        if (!existingClient) {
          await storage.createClient(client);
        }
      }

      // Seed qualities
      const qualityList = [
        { name: "Rct 277", denier: 200, blend: "2000" },
        { name: "Plt 193", denier: 150, blend: "1500" },
        { name: "Vct 452", denier: 300, blend: "3000" },
        { name: "Kct 385", denier: 250, blend: "2500" }
      ];

      for (const quality of qualityList) {
        const existingQuality = await storage.getQualityByName(quality.name);
        if (!existingQuality) {
          await storage.createQuality(quality);
        }
      }

      res.json({ message: "Database seeded successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error seeding database" });
    }
  });

  // All API routes are accessible without authentication

  // Client endpoints
  apiRouter.get("/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  apiRouter.get("/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  apiRouter.post("/clients", async (req, res) => {
    try {
      const data = insertClientSchema.parse(req.body);
      const client = await storage.createClient(data);
      res.status(201).json(client);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  apiRouter.put("/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertClientSchema.parse(req.body);
      
      const updatedClient = await storage.updateClient(id, data);
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(updatedClient);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  apiRouter.delete("/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClient(id);
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Quality endpoints
  apiRouter.get("/qualities", async (req, res) => {
    try {
      const qualities = await storage.getQualities();
      res.json(qualities);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch qualities" });
    }
  });

  apiRouter.get("/qualities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quality = await storage.getQuality(id);
      
      if (!quality) {
        return res.status(404).json({ message: "Quality not found" });
      }
      
      res.json(quality);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch quality" });
    }
  });

  apiRouter.post("/qualities", async (req, res) => {
    try {
      const data = insertQualitySchema.parse(req.body);
      const quality = await storage.createQuality(data);
      res.status(201).json(quality);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  apiRouter.put("/qualities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertQualitySchema.parse(req.body);
      
      const updatedQuality = await storage.updateQuality(id, data);
      
      if (!updatedQuality) {
        return res.status(404).json({ message: "Quality not found" });
      }
      
      res.json(updatedQuality);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  apiRouter.delete("/qualities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteQuality(id);
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete quality" });
    }
  });

  // Report endpoints
  apiRouter.get("/reports", async (req, res) => {
    try {
      const { clientId, qualityName, startDate, endDate, q } = req.query;
      
      const searchParams: {
        clientId?: number;
        qualityName?: string;
        startDate?: Date;
        endDate?: Date;
        searchTerm?: string;
      } = {};
      
      if (clientId && !isNaN(Number(clientId))) {
        searchParams.clientId = Number(clientId);
      }
      
      if (qualityName && typeof qualityName === 'string') {
        searchParams.qualityName = qualityName;
      }
      
      if (startDate && typeof startDate === 'string') {
        searchParams.startDate = new Date(startDate);
      }
      
      if (endDate && typeof endDate === 'string') {
        searchParams.endDate = new Date(endDate);
      }
      
      if (q && typeof q === 'string') {
        searchParams.searchTerm = q;
      }
      
      const reports = Object.keys(searchParams).length > 0 
        ? await storage.searchReports(searchParams)
        : await storage.getReports();
        
      res.json(reports);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  apiRouter.get("/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getReportWithItems(id);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.json(report);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  apiRouter.post("/reports", async (req, res) => {
    try {
      const data = createReportSchema.parse(req.body);
      const report = await storage.createReport(data);
      res.status(201).json(report);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  apiRouter.delete("/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteReport(id);
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  // Mount the API router
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
