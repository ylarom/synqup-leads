import {
  users,
  accounts,
  people,
  conversations,
  messages,
  triggers,
  type User,
  type UpsertUser,
  type Account,
  type InsertAccount,
  type Person,
  type InsertPerson,
  type PersonWithAccount,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type MessageWithDetails,
  type Trigger,
  type InsertTrigger,
  type TriggerWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Account operations
  getAccounts(limit?: number, offset?: number, search?: string): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account>;
  deleteAccount(id: number): Promise<void>;
  getAccountsCount(search?: string): Promise<number>;

  // People operations
  getPeople(limit?: number, offset?: number, search?: string, accountId?: number): Promise<PersonWithAccount[]>;
  getPerson(id: number): Promise<PersonWithAccount | undefined>;
  createPerson(person: InsertPerson): Promise<Person>;
  updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person>;
  deletePerson(id: number): Promise<void>;
  getPeopleCount(search?: string, accountId?: number): Promise<number>;

  // Conversation operations
  getConversations(personId?: number): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation>;

  // Message operations
  getMessages(limit?: number, offset?: number, status?: string, personId?: number): Promise<MessageWithDetails[]>;
  getMessage(id: number): Promise<MessageWithDetails | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<InsertMessage>): Promise<Message>;
  deleteMessage(id: number): Promise<void>;
  getMessagesCount(status?: string, personId?: number): Promise<number>;
  getMessagesByStatus(status: string): Promise<MessageWithDetails[]>;

  // Trigger operations
  getTriggers(limit?: number, offset?: number, status?: string): Promise<TriggerWithDetails[]>;
  getTrigger(id: number): Promise<TriggerWithDetails | undefined>;
  createTrigger(trigger: InsertTrigger): Promise<Trigger>;
  updateTrigger(id: number, trigger: Partial<InsertTrigger>): Promise<Trigger>;
  deleteTrigger(id: number): Promise<void>;
  getTriggersCount(status?: string): Promise<number>;
  getTriggersByStatus(status: string): Promise<TriggerWithDetails[]>;

  // Statistics
  getStats(): Promise<{
    totalAccounts: number;
    activePeople: number;
    messagesSent: number;
    activeTriggers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Account operations
  async getAccounts(limit = 50, offset = 0, search?: string): Promise<Account[]> {
    let query = db.select().from(accounts);
    
    if (search) {
      query = query.where(
        or(
          like(accounts.name, `%${search}%`),
          like(accounts.field, `%${search}%`)
        )
      ) as any;
    }
    
    return await query
      .orderBy(desc(accounts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account> {
    const [updatedAccount] = await db
      .update(accounts)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<void> {
    await db.delete(accounts).where(eq(accounts.id, id));
  }

  async getAccountsCount(search?: string): Promise<number> {
    let query = db.select({ count: count() }).from(accounts);
    
    if (search) {
      query = query.where(
        or(
          like(accounts.name, `%${search}%`),
          like(accounts.field, `%${search}%`)
        )
      ) as any;
    }
    
    const [result] = await query;
    return result.count;
  }

  // People operations
  async getPeople(limit = 50, offset = 0, search?: string, accountId?: number): Promise<PersonWithAccount[]> {
    let query = db
      .select({
        id: people.id,
        accountId: people.accountId,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
        phone: people.phone,
        title: people.title,
        linkedin: people.linkedin,
        facebook: people.facebook,
        instagram: people.instagram,
        twitter: people.twitter,
        details: people.details,
        description: people.description,
        createdAt: people.createdAt,
        updatedAt: people.updatedAt,
        account: accounts,
      })
      .from(people)
      .leftJoin(accounts, eq(people.accountId, accounts.id));

    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(people.firstName, `%${search}%`),
          like(people.lastName, `%${search}%`),
          like(people.email, `%${search}%`)
        )
      );
    }
    
    if (accountId) {
      conditions.push(eq(people.accountId, accountId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query
      .orderBy(desc(people.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getPerson(id: number): Promise<PersonWithAccount | undefined> {
    const [person] = await db
      .select({
        id: people.id,
        accountId: people.accountId,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
        phone: people.phone,
        title: people.title,
        linkedin: people.linkedin,
        facebook: people.facebook,
        instagram: people.instagram,
        twitter: people.twitter,
        details: people.details,
        description: people.description,
        createdAt: people.createdAt,
        updatedAt: people.updatedAt,
        account: accounts,
      })
      .from(people)
      .leftJoin(accounts, eq(people.accountId, accounts.id))
      .where(eq(people.id, id));
    
    return person;
  }

  async createPerson(person: InsertPerson): Promise<Person> {
    const [newPerson] = await db.insert(people).values(person).returning();
    return newPerson;
  }

  async updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person> {
    const [updatedPerson] = await db
      .update(people)
      .set({ ...person, updatedAt: new Date() })
      .where(eq(people.id, id))
      .returning();
    return updatedPerson;
  }

  async deletePerson(id: number): Promise<void> {
    await db.delete(people).where(eq(people.id, id));
  }

  async getPeopleCount(search?: string, accountId?: number): Promise<number> {
    let query = db.select({ count: count() }).from(people);
    
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(people.firstName, `%${search}%`),
          like(people.lastName, `%${search}%`),
          like(people.email, `%${search}%`)
        )
      );
    }
    
    if (accountId) {
      conditions.push(eq(people.accountId, accountId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const [result] = await query;
    return result.count;
  }

  // Conversation operations
  async getConversations(personId?: number): Promise<Conversation[]> {
    let query = db.select().from(conversations);
    
    if (personId) {
      query = query.where(eq(conversations.personId, personId)) as any;
    }
    
    return await query.orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db.insert(conversations).values(conversation).returning();
    return newConversation;
  }

  async updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation> {
    const [updatedConversation] = await db
      .update(conversations)
      .set({ ...conversation, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updatedConversation;
  }

  // Message operations
  async getMessages(limit = 50, offset = 0, status?: string, personId?: number): Promise<MessageWithDetails[]> {
    let query = db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        personId: messages.personId,
        triggerId: messages.triggerId,
        media: messages.media,
        address: messages.address,
        from: messages.from,
        subject: messages.subject,
        content: messages.content,
        status: messages.status,
        sentAt: messages.sentAt,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        person: people,
        trigger: triggers,
        conversation: conversations,
      })
      .from(messages)
      .leftJoin(people, eq(messages.personId, people.id))
      .leftJoin(triggers, eq(messages.triggerId, triggers.id))
      .leftJoin(conversations, eq(messages.conversationId, conversations.id));

    const conditions = [];
    
    if (status) {
      conditions.push(eq(messages.status, status));
    }
    
    if (personId) {
      conditions.push(eq(messages.personId, personId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset) as any;
  }

  async getMessage(id: number): Promise<MessageWithDetails | undefined> {
    const [message] = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        personId: messages.personId,
        triggerId: messages.triggerId,
        media: messages.media,
        address: messages.address,
        from: messages.from,
        subject: messages.subject,
        content: messages.content,
        status: messages.status,
        sentAt: messages.sentAt,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        person: people,
        trigger: triggers,
        conversation: conversations,
      })
      .from(messages)
      .leftJoin(people, eq(messages.personId, people.id))
      .leftJoin(triggers, eq(messages.triggerId, triggers.id))
      .leftJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(eq(messages.id, id));
    
    return message as any;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async updateMessage(id: number, message: Partial<InsertMessage>): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ ...message, updatedAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  async getMessagesCount(status?: string, personId?: number): Promise<number> {
    let query = db.select({ count: count() }).from(messages);
    
    const conditions = [];
    
    if (status) {
      conditions.push(eq(messages.status, status));
    }
    
    if (personId) {
      conditions.push(eq(messages.personId, personId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const [result] = await query;
    return result.count;
  }

  async getMessagesByStatus(status: string): Promise<MessageWithDetails[]> {
    return await this.getMessages(1000, 0, status);
  }

  // Trigger operations
  async getTriggers(limit = 50, offset = 0, status?: string): Promise<TriggerWithDetails[]> {
    let query = db
      .select({
        id: triggers.id,
        accountId: triggers.accountId,
        personId: triggers.personId,
        media: triggers.media,
        url: triggers.url,
        content: triggers.content,
        triggerType: triggers.triggerType,
        status: triggers.status,
        createdAt: triggers.createdAt,
        updatedAt: triggers.updatedAt,
        account: accounts,
        person: people,
      })
      .from(triggers)
      .leftJoin(accounts, eq(triggers.accountId, accounts.id))
      .leftJoin(people, eq(triggers.personId, people.id));

    if (status) {
      query = query.where(eq(triggers.status, status)) as any;
    }

    return await query
      .orderBy(desc(triggers.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getTrigger(id: number): Promise<TriggerWithDetails | undefined> {
    const [trigger] = await db
      .select({
        id: triggers.id,
        accountId: triggers.accountId,
        personId: triggers.personId,
        media: triggers.media,
        url: triggers.url,
        content: triggers.content,
        triggerType: triggers.triggerType,
        status: triggers.status,
        createdAt: triggers.createdAt,
        updatedAt: triggers.updatedAt,
        account: accounts,
        person: people,
      })
      .from(triggers)
      .leftJoin(accounts, eq(triggers.accountId, accounts.id))
      .leftJoin(people, eq(triggers.personId, people.id))
      .where(eq(triggers.id, id));
    
    return trigger;
  }

  async createTrigger(trigger: InsertTrigger): Promise<Trigger> {
    const [newTrigger] = await db.insert(triggers).values(trigger).returning();
    return newTrigger;
  }

  async updateTrigger(id: number, trigger: Partial<InsertTrigger>): Promise<Trigger> {
    const [updatedTrigger] = await db
      .update(triggers)
      .set({ ...trigger, updatedAt: new Date() })
      .where(eq(triggers.id, id))
      .returning();
    return updatedTrigger;
  }

  async deleteTrigger(id: number): Promise<void> {
    await db.delete(triggers).where(eq(triggers.id, id));
  }

  async getTriggersCount(status?: string): Promise<number> {
    let query = db.select({ count: count() }).from(triggers);
    
    if (status) {
      query = query.where(eq(triggers.status, status)) as any;
    }
    
    const [result] = await query;
    return result.count;
  }

  async getTriggersByStatus(status: string): Promise<TriggerWithDetails[]> {
    return await this.getTriggers(1000, 0, status);
  }

  // Statistics
  async getStats(): Promise<{
    totalAccounts: number;
    activePeople: number;
    messagesSent: number;
    activeTriggers: number;
  }> {
    const [accountsCount] = await db.select({ count: count() }).from(accounts);
    const [peopleCount] = await db.select({ count: count() }).from(people);
    const [sentMessagesCount] = await db
      .select({ count: count() })
      .from(messages)
      .where(eq(messages.status, "sent"));
    const [activeTriggersCount] = await db
      .select({ count: count() })
      .from(triggers)
      .where(eq(triggers.status, "new"));

    return {
      totalAccounts: accountsCount.count,
      activePeople: peopleCount.count,
      messagesSent: sentMessagesCount.count,
      activeTriggers: activeTriggersCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
