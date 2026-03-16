import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  date,
  varchar,
  decimal,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

// ─────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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

// ─────────────────────────────────────────────────────
// CAIXINHA METADATA
// ─────────────────────────────────────────────────────
export const caixinhaMetadata = mysqlTable("caixinhaMetadata", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).default("Minha Caixinha").notNull(),
  description: text("description"),
  isPublic: boolean("isPublic").default(false).notNull(),
  startDate: date("startDate"),
  paymentDueDay: int("paymentDueDay").default(5).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CaixinhaMetadata = typeof caixinhaMetadata.$inferSelect;
export type InsertCaixinhaMetadata = typeof caixinhaMetadata.$inferInsert;

// ─────────────────────────────────────────────────────
// PARTICIPANTS
// ─────────────────────────────────────────────────────
export const participants = mysqlTable(
  "participants",
  {
    id: int("id").autoincrement().primaryKey(),
    caixinhaId: int("caixinhaId")
      .notNull()
      .references(() => caixinhaMetadata.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }),
    totalLoan: decimal("totalLoan", { precision: 10, scale: 2 }).default("0").notNull(),
    currentDebt: decimal("currentDebt", { precision: 10, scale: 2 }).default("0").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    role: mysqlEnum("role", ["member", "external"]).default("member").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    caixinhaIdx: index("idx_participants_caixinha").on(table.caixinhaId),
  }),
);

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = typeof participants.$inferInsert;

// ─────────────────────────────────────────────────────
// MONTHLY PAYMENTS
// ─────────────────────────────────────────────────────
export const monthlyPayments = mysqlTable(
  "monthlyPayments",
  {
    id: int("id").autoincrement().primaryKey(),
    participantId: int("participantId")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    month: varchar("month", { length: 7 }).notNull(), // "YYYY-MM"
    year: int("year").notNull(),
    paid: boolean("paid").default(false).notNull(),
    paidLate: boolean("paidLate").default(false).notNull(),
    paidAt: timestamp("paidAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    uniquePayment: uniqueIndex("uq_payment_participant_month_year").on(
      table.participantId,
      table.month,
      table.year,
    ),
  }),
);

export type MonthlyPayment = typeof monthlyPayments.$inferSelect;
export type InsertMonthlyPayment = typeof monthlyPayments.$inferInsert;

// ─────────────────────────────────────────────────────
// TRANSACTIONS
// ─────────────────────────────────────────────────────
export const transactions = mysqlTable(
  "transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    participantId: int("participantId")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", ["loan", "payment", "amortization", "reversal"]).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    balanceBefore: decimal("balanceBefore", { precision: 10, scale: 2 }).notNull(),
    balanceAfter: decimal("balanceAfter", { precision: 10, scale: 2 }).notNull(),
    month: varchar("month", { length: 7 }), // "YYYY-MM"
    year: int("year"),
    description: text("description"),
    idempotencyKey: varchar("idempotencyKey", { length: 36 }).unique(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    // Nota: sem updatedAt — transações são imutáveis por design
  },
  (table) => ({
    participantIdx: index("idx_transactions_participant").on(table.participantId),
    periodIdx: index("idx_transactions_period").on(table.participantId, table.month, table.year),
  }),
);

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// ─────────────────────────────────────────────────────
// MONTHLY SUMMARY
// ─────────────────────────────────────────────────────
export const monthlySummary = mysqlTable(
  "monthlySummary",
  {
    id: int("id").autoincrement().primaryKey(),
    caixinhaId: int("caixinhaId")
      .notNull()
      .references(() => caixinhaMetadata.id, { onDelete: "cascade" }),
    month: varchar("month", { length: 7 }).notNull(),
    year: int("year").notNull(),
    totalFeesCollected: decimal("totalFeesCollected", { precision: 10, scale: 2 }).default("0").notNull(),
    totalInterestCollected: decimal("totalInterestCollected", { precision: 10, scale: 2 }).default("0").notNull(),

    // 🟢 FIX: flag explícita de ciclo fechado — evita bloqueio acidental por registro parcial
    isClosed: boolean("isClosed").default(false).notNull(),
    // 🟢 FIX: timestamp do fechamento para auditoria e ordenação
    closedAt: timestamp("closedAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    uniqueSummary: uniqueIndex("uq_summary_caixinha_month_year").on(
      table.caixinhaId,
      table.month,
      table.year,
    ),
  }),
);

export type MonthlySummary = typeof monthlySummary.$inferSelect;
export type InsertMonthlySummary = typeof monthlySummary.$inferInsert;

// ─────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────
export const auditLog = mysqlTable(
  "auditLog",
  {
    id: int("id").autoincrement().primaryKey(),
    participantId: int("participantId")
      .references(() => participants.id, { onDelete: "set null" }),
    participantName: varchar("participantName", { length: 255 }).notNull(),

    // 🟢 FIX: enum expandido com as actions que estavam faltando
    action: mysqlEnum("action", [
      "payment_marked",
      "payment_unmarked",
      "amortization_added",
      "participant_created",
      "participant_deleted",
      "loan_added",
      "debt_updated",   // 🟢 novo: edição manual de currentDebt pelo admin
      "loan_updated",   // 🟢 novo: edição manual de totalLoan pelo admin
      "cycle_closed",   // 🟢 novo: fechamento de ciclo mensal (snapshot imutável)
    ]).notNull(),

    month: varchar("month", { length: 7 }),
    year: int("year"),
    amount: decimal("amount", { precision: 10, scale: 2 }),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    participantIdx: index("idx_audit_participant").on(table.participantId),
    createdIdx: index("idx_audit_created").on(table.createdAt),
  }),
);

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

// ─────────────────────────────────────────────────────
// CAIXINHA SHARES
// ─────────────────────────────────────────────────────
export const caixinhaShares = mysqlTable(
  "caixinhaShares",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id),

    // 🟢 FIX: referência à caixinha específica sendo compartilhada
    // Sem isso, um owner com múltiplas caixinhas não consegue compartilhar uma só
    caixinhaId: int("caixinhaId")
      .notNull()
      .references(() => caixinhaMetadata.id, { onDelete: "cascade" }),

    sharedWithUserId: int("sharedWithUserId").notNull().references(() => users.id),
    role: mysqlEnum("role", ["viewer", "editor", "admin"]).default("viewer").notNull(),
    shareCode: varchar("shareCode", { length: 32 }).unique(),

    // 🟢 FIX: expiresAt agora tem padrão de 30 dias via aplicação
    // Mantenha nullable no banco para flexibilidade, mas force valor no router
    expiresAt: timestamp("expiresAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    // 🟢 FIX: índice para buscas por caixinha e por usuário compartilhado
    caixinhaIdx: index("idx_shares_caixinha").on(table.caixinhaId),
    sharedWithIdx: index("idx_shares_shared_with").on(table.sharedWithUserId),
  }),
);

export type CaixinhaShare = typeof caixinhaShares.$inferSelect;
export type InsertCaixinhaShare = typeof caixinhaShares.$inferInsert;
