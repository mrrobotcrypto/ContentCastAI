import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, boolean, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  farcasterFid: text("farcaster_fid"),
  farcasterUsername: text("farcaster_username"),
  farcasterDisplayName: text("farcaster_display_name"),
  farcasterAvatar: text("farcaster_avatar"),
  farcasterBio: text("farcaster_bio"),
  baseUsername: text("base_username"),
  ensUsername: text("ens_username"),
  followerCount: integer("follower_count").default(0),
  followingCount: integer("following_count").default(0),
  xUrl: text("x_url"),
  githubUrl: text("github_url"),
  farcasterUrl: text("farcaster_url"),
  neynarScore: integer("neynar_score"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentDrafts = pgTable("content_drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  topic: text("topic").notNull(),
  contentType: text("content_type").notNull(),
  tone: text("tone").notNull(),
  generatedContent: text("generated_content"),
  selectedImage: json("selected_image").$type<{
    url: string;
    alt: string;
    photographer: string;
    source: string;
  }>(),
  isPublished: boolean("is_published").default(false).notNull(),
  farcasterCastHash: text("farcaster_cast_hash"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "bug" | "feature" | "general" | "compliment"
  message: text("message").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userQuests = pgTable("user_quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  questType: text("quest_type").notNull(), // "daily_checkin" | "daily_gm" | "daily_cast" | "nft_holding" | "follow_farcaster" | "follow_x" | "add_miniapp"
  lastCompletedAt: timestamp("last_completed_at"),
  totalPoints: decimal("total_points", { precision: 10, scale: 2 }).notNull().default("0"),
  completionCount: integer("completion_count").notNull().default(0),
  isOneTime: boolean("is_one_time").default(false).notNull(), // For bonus quests that can only be completed once
  isCompleted: boolean("is_completed").default(false).notNull(), // For one-time quests completion status
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dailyCastLimits = pgTable("daily_cast_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  castCount: integer("cast_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sbtBadges = pgTable("sbt_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  mintCount: integer("mint_count").notNull().default(0),
  totalPaid: decimal("total_paid", { precision: 18, scale: 6 }).notNull().default("0"),
  badgeMetadata: json("badge_metadata").$type<{
    imageUrl: string;
    name: string;
    description: string;
    attributes: Array<{ trait_type: string; value: string | number }>;
  }>(),
  lastMintedAt: timestamp("last_minted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertContentDraftSchema = createInsertSchema(contentDrafts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
});

export const insertUserQuestSchema = createInsertSchema(userQuests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  totalPoints: z.string().optional(),
  completionCount: z.number().optional(),
});

export const insertDailyCastLimitSchema = createInsertSchema(dailyCastLimits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSbtBadgeSchema = createInsertSchema(sbtBadges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  totalPaid: z.string().optional(),
  mintCount: z.number().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertContentDraft = z.infer<typeof insertContentDraftSchema>;
export type ContentDraft = typeof contentDrafts.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertUserQuest = z.infer<typeof insertUserQuestSchema>;
export type UserQuest = typeof userQuests.$inferSelect;
export type InsertDailyCastLimit = z.infer<typeof insertDailyCastLimitSchema>;
export type DailyCastLimit = typeof dailyCastLimits.$inferSelect;
export type InsertSbtBadge = z.infer<typeof insertSbtBadgeSchema>;
export type SbtBadge = typeof sbtBadges.$inferSelect;
