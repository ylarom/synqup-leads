import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertAccountSchema, insertPersonSchema, insertMessageSchema, insertTriggerSchema } from "@shared/schema";
import { googleNewsService } from "./services/googleNews";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Stats endpoint
  app.get('/api/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Account routes
  app.get('/api/accounts', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      
      const [accounts, total] = await Promise.all([
        storage.getAccounts(limit, offset, search),
        storage.getAccountsCount(search)
      ]);
      
      res.json({ accounts, total });
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.get('/api/accounts/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getAccount(id);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json(account);
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });

  app.post('/api/accounts', isAuthenticated, async (req, res) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid account data", errors: error.errors });
      }
      console.error("Error creating account:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.put('/api/accounts/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accountData = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(id, accountData);
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid account data", errors: error.errors });
      }
      console.error("Error updating account:", error);
      res.status(500).json({ message: "Failed to update account" });
    }
  });

  app.delete('/api/accounts/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAccount(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // People routes
  app.get('/api/people', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
      
      const [people, total] = await Promise.all([
        storage.getPeople(limit, offset, search, accountId),
        storage.getPeopleCount(search, accountId)
      ]);
      
      res.json({ people, total });
    } catch (error) {
      console.error("Error fetching people:", error);
      res.status(500).json({ message: "Failed to fetch people" });
    }
  });

  app.get('/api/people/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const person = await storage.getPerson(id);
      
      if (!person) {
        return res.status(404).json({ message: "Person not found" });
      }
      
      res.json(person);
    } catch (error) {
      console.error("Error fetching person:", error);
      res.status(500).json({ message: "Failed to fetch person" });
    }
  });

  app.post('/api/people', isAuthenticated, async (req, res) => {
    try {
      const personData = insertPersonSchema.parse(req.body);
      const person = await storage.createPerson(personData);
      res.status(201).json(person);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid person data", errors: error.errors });
      }
      console.error("Error creating person:", error);
      res.status(500).json({ message: "Failed to create person" });
    }
  });

  app.put('/api/people/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const personData = insertPersonSchema.partial().parse(req.body);
      const person = await storage.updatePerson(id, personData);
      res.json(person);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid person data", errors: error.errors });
      }
      console.error("Error updating person:", error);
      res.status(500).json({ message: "Failed to update person" });
    }
  });

  app.delete('/api/people/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePerson(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting person:", error);
      res.status(500).json({ message: "Failed to delete person" });
    }
  });

  // Message routes
  app.get('/api/messages', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;
      const personId = req.query.personId ? parseInt(req.query.personId as string) : undefined;
      
      const [messages, total] = await Promise.all([
        storage.getMessages(limit, offset, status, personId),
        storage.getMessagesCount(status, personId)
      ]);
      
      res.json({ messages, total });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get('/api/messages/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const message = await storage.getMessage(id);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error fetching message:", error);
      res.status(500).json({ message: "Failed to fetch message" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.put('/api/messages/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const messageData = insertMessageSchema.partial().parse(req.body);
      const message = await storage.updateMessage(id, messageData);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error updating message:", error);
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  app.delete('/api/messages/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMessage(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Trigger routes
  app.get('/api/triggers', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;
      
      const [triggers, total] = await Promise.all([
        storage.getTriggers(limit, offset, status),
        storage.getTriggersCount(status)
      ]);
      
      res.json({ triggers, total });
    } catch (error) {
      console.error("Error fetching triggers:", error);
      res.status(500).json({ message: "Failed to fetch triggers" });
    }
  });

  app.get('/api/triggers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const trigger = await storage.getTrigger(id);
      
      if (!trigger) {
        return res.status(404).json({ message: "Trigger not found" });
      }
      
      res.json(trigger);
    } catch (error) {
      console.error("Error fetching trigger:", error);
      res.status(500).json({ message: "Failed to fetch trigger" });
    }
  });

  app.post('/api/triggers', isAuthenticated, async (req, res) => {
    try {
      const triggerData = insertTriggerSchema.parse(req.body);
      const trigger = await storage.createTrigger(triggerData);
      res.status(201).json(trigger);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trigger data", errors: error.errors });
      }
      console.error("Error creating trigger:", error);
      res.status(500).json({ message: "Failed to create trigger" });
    }
  });

  app.put('/api/triggers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const triggerData = insertTriggerSchema.partial().parse(req.body);
      const trigger = await storage.updateTrigger(id, triggerData);
      res.json(trigger);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trigger data", errors: error.errors });
      }
      console.error("Error updating trigger:", error);
      res.status(500).json({ message: "Failed to update trigger" });
    }
  });

  app.delete('/api/triggers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTrigger(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trigger:", error);
      res.status(500).json({ message: "Failed to delete trigger" });
    }
  });

  // Bulk operations
  app.post('/api/messages/send-drafts', isAuthenticated, async (req, res) => {
    try {
      const draftMessages = await storage.getMessagesByStatus('draft');
      
      // Update status to 'to_send' for all draft messages
      const updates = draftMessages.map(message => 
        storage.updateMessage(message.id, { status: 'to_send' })
      );
      
      await Promise.all(updates);
      
      res.json({ 
        message: `${draftMessages.length} messages marked for sending`,
        count: draftMessages.length 
      });
    } catch (error) {
      console.error("Error sending drafts:", error);
      res.status(500).json({ message: "Failed to send drafts" });
    }
  });

  // API key authentication middleware for external integrations
  const apiKeyAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const apiKey = req.headers['x-api-key'];
    
    // Extract Bearer token or use x-api-key header
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : apiKey;
    
    if (!token) {
      return res.status(401).json({ message: "API key required. Use 'Authorization: Bearer <key>' or 'X-API-Key: <key>' header" });
    }
    
    // In production, this would validate against a database of API keys
    // For now, we'll use the environment variable
    if (token !== process.env.GOOGLE_API_KEY) {
      return res.status(401).json({ message: "Invalid API key" });
    }
    next();
  };

  // News search endpoint - supports both session auth and API key auth
  app.get('/api/triggers/news/person/:id', (req: any, res: any, next: any) => {
    // Check if API key is provided for external access
    const authHeader = req.headers['authorization'];
    const apiKeyHeader = req.headers['x-api-key'];
    
    const hasApiKey = (authHeader && authHeader.startsWith('Bearer ')) || apiKeyHeader;
    
    if (hasApiKey) {
      return apiKeyAuth(req, res, next);
    } else {
      return isAuthenticated(req, res, next);
    }
  }, async (req, res) => {
    try {
      const personId = parseInt(req.params.id);
      if (isNaN(personId)) {
        return res.status(400).json({ message: "Invalid person ID" });
      }

      console.log(`Searching news for person ID: ${personId}`);
      const { articles, searchQuery } = await googleNewsService.searchPersonNews(personId);
      console.log(`Found ${articles.length} news articles`);
      
      res.json({ 
        searchQuery,
        articles, 
        total: articles.length 
      });
    } catch (error) {
      console.error("Error searching person news:", error);
      if (error.message === 'Person not found') {
        return res.status(404).json({ message: "Person not found" });
      }
      if (error.message === 'Google API key not configured') {
        return res.status(500).json({ message: "Google API key not configured" });
      }
      res.status(500).json({ message: "Failed to search news", error: error.message });
    }
  });





  const httpServer = createServer(app);
  return httpServer;
}
