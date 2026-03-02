import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Participants table for Caixinha Comunitária
 */
export const participants = mysqlTable("participants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  totalLoan: decimal("totalLoan", { precision: 10, scale: 2 }).default("0").notNull(),
  currentDebt: decimal("currentDebt", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = typeof participants.$inferInsert;

/**
 * Monthly payments table for tracking which months have been paid
 */
export const monthlyPayments = mysqlTable("monthlyPayments", {
  id: int("id").autoincrement().primaryKey(),
  participantId: int("participantId").notNull(),
  month: varchar("month", { length: 20 }).notNull(),
  year: int("year").notNull(),
  paid: int("paid").default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonthlyPayment = typeof monthlyPayments.$inferSelect;
export type InsertMonthlyPayment = typeof monthlyPayments.$inferInsert;

/**
 * Transactions table for tracking all payments and amortizations
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  participantId: int("participantId").notNull(),
  type: mysqlEnum("type", ["loan", "payment", "amortization"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  month: varchar("month", { length: 20 }), // "janeiro", "fevereiro", etc
  year: int("year"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Monthly summary table for tracking arrecadação
 */
export const monthlySummary = mysqlTable("monthlySummary", {
  id: int("id").autoincrement().primaryKey(),
  month: varchar("month", { length: 20 }).notNull(), // "janeiro", "fevereiro", etc
  year: int("year").notNull(),
  totalFeesCollected: decimal("totalFeesCollected", { precision: 10, scale: 2 }).default("0").notNull(),
  totalInterestCollected: decimal("totalInterestCollected", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonthlySummary = typeof monthlySummary.$inferSelect;
export type InsertMonthlySummary = typeof monthlySummary.$inferInsert;

/**
 * Audit log table for tracking all changes to payments
 */
export const auditLog = mysqlTable("auditLog", {
  id: int("id").autoincrement().primaryKey(),
  participantId: int("participantId").notNull(),
  participantName: varchar("participantName", { length: 255 }).notNull(),
  action: mysqlEnum("action", ["payment_marked", "payment_unmarked", "amortization_added", "participant_created", "participant_deleted"]).notNull(),
  month: varchar("month", { length: 20 }),
  year: int("year"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;
/**
 * Caixinha sharing table - allows sharing a caixinha with multiple users
 */
export const caixinhaShares = mysqlTable("caixinhaShares", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id),
  sharedWithUserId: int("sharedWithUserId").notNull().references(() => users.id),
  role: mysqlEnum("role", ["viewer", "editor", "admin"]).default("viewer").notNull(),
  shareCode: varchar("shareCode", { length: 32 }).unique(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CaixinhaShare = typeof caixinhaShares.$inferSelect;
export type InsertCaixinhaShare = typeof caixinhaShares.$inferInsert;

/**
 * Caixinha metadata table - stores metadata about each caixinha
 */
export const caixinhaMetadata = mysqlTable("caixinhaMetadata", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).default("Minha Caixinha").notNull(),
  description: text("description"),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CaixinhaMetadata = typeof caixinhaMetadata.$inferSelect;
export type InsertCaixinhaMetadata = typeof caixinhaMetadata.$inferInsert;
