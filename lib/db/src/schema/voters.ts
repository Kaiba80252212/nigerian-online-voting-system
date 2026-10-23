import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const votersTable = pgTable("voters", {
  id: serial("id").primaryKey(),
  nin: text("nin").notNull().unique(),
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  state: text("state").notNull(),
  lga: text("lga").notNull(),
  pollingUnit: text("polling_unit").notNull(),
  phoneNumber: text("phone_number"),
  status: text("status").notNull().default("registered"),
  faceDescriptor: jsonb("face_descriptor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVoterSchema = createInsertSchema(votersTable).omit({ id: true, createdAt: true });
export type InsertVoter = z.infer<typeof insertVoterSchema>;
export type Voter = typeof votersTable.$inferSelect;
