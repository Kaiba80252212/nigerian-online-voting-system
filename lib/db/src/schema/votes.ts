import { pgTable, serial, timestamp, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { electionsTable } from "./elections";
import { candidatesTable } from "./candidates";
import { votersTable } from "./voters";

export const votesTable = pgTable("votes", {
  id: serial("id").primaryKey(),
  voterId: integer("voter_id").notNull().references(() => votersTable.id),
  electionId: integer("election_id").notNull().references(() => electionsTable.id),
  candidateId: integer("candidate_id").notNull().references(() => candidatesTable.id),
  receiptCode: text("receipt_code").notNull().unique(),
  state: text("state"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVoteSchema = createInsertSchema(votesTable).omit({ id: true, createdAt: true });
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votesTable.$inferSelect;
