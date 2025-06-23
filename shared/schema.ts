import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("viewer"), // admin, editor, viewer
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  field: varchar("field"),
  address: text("address"),
  website: varchar("website"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const people = pgTable("people", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  title: varchar("title"),
  linkedin: varchar("linkedin"),
  facebook: varchar("facebook"),
  instagram: varchar("instagram"),
  twitter: varchar("twitter"),
  details: text("details"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").references(() => people.id).notNull(),
  firstMessageAt: timestamp("first_message_at"),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  personId: integer("person_id").references(() => people.id).notNull(),
  triggerId: integer("trigger_id").references(() => triggers.id),
  media: varchar("media").notNull(), // email, phone, twitter, linkedin, etc
  address: varchar("address").notNull(), // email address, phone number, social handle
  from: varchar("from").notNull(), // 'us' or 'lead'
  subject: varchar("subject"),
  content: text("content").notNull(),
  status: varchar("status").notNull().default("draft"), // draft, to_send, sent, failed
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const triggers = pgTable("triggers", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  personId: integer("person_id").references(() => people.id),
  media: varchar("media"), // source media where trigger was found
  url: varchar("url"),
  content: text("content").notNull(),
  triggerType: varchar("trigger_type").notNull(), // news, birthday, anniversary, social_post
  status: varchar("status").notNull().default("new"), // new, handled, ignored
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  // Users don't directly own other entities in this schema
}));

export const accountsRelations = relations(accounts, ({ many }) => ({
  people: many(people),
  triggers: many(triggers),
}));

export const peopleRelations = relations(people, ({ one, many }) => ({
  account: one(accounts, {
    fields: [people.accountId],
    references: [accounts.id],
  }),
  conversations: many(conversations),
  messages: many(messages),
  triggers: many(triggers),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  person: one(people, {
    fields: [conversations.personId],
    references: [people.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  person: one(people, {
    fields: [messages.personId],
    references: [people.id],
  }),
  trigger: one(triggers, {
    fields: [messages.triggerId],
    references: [triggers.id],
  }),
}));

export const triggersRelations = relations(triggers, ({ one, many }) => ({
  account: one(accounts, {
    fields: [triggers.accountId],
    references: [accounts.id],
  }),
  person: one(people, {
    fields: [triggers.personId],
    references: [people.id],
  }),
  messages: many(messages),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPersonSchema = createInsertSchema(people).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTriggerSchema = createInsertSchema(triggers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof people.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertTrigger = z.infer<typeof insertTriggerSchema>;
export type Trigger = typeof triggers.$inferSelect;

// Extended types for API responses
export type PersonWithAccount = Person & {
  account: Account | null;
};

export type MessageWithDetails = Message & {
  person: Person;
  trigger: Trigger | null;
  conversation: Conversation | null;
};

export type TriggerWithDetails = Trigger & {
  account: Account | null;
  person: Person | null;
};
