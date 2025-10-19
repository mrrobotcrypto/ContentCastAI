import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, or } from "drizzle-orm";
import { users, contentDrafts, feedback, userQuests, dailyCastLimits, sbtBadges, type User, type InsertUser, type ContentDraft, type InsertContentDraft, type Feedback, type InsertFeedback, type UserQuest, type InsertUserQuest, type DailyCastLimit, type InsertDailyCastLimit, type SbtBadge, type InsertSbtBadge } from "@shared/schema";
import type { IStorage } from "./storage.js";
import { getTurkeyResetDate, getSecondsUntilNextTurkeyReset } from "./time-utils";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getContentDraft(id: string): Promise<ContentDraft | undefined> {
    const result = await db.select().from(contentDrafts).where(eq(contentDrafts.id, id)).limit(1);
    return result[0];
  }

  async getContentDraftsByUserId(userId: string): Promise<ContentDraft[]> {
    return await db.select().from(contentDrafts).where(eq(contentDrafts.userId, userId));
  }

  async createContentDraft(insertDraft: InsertContentDraft): Promise<ContentDraft> {
    const result = await db.insert(contentDrafts).values(insertDraft).returning();
    return result[0];
  }

  async updateContentDraft(id: string, updates: Partial<ContentDraft>): Promise<ContentDraft | undefined> {
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };
    const result = await db.update(contentDrafts).set(updateData).where(eq(contentDrafts.id, id)).returning();
    return result[0];
  }

  async deleteContentDraft(id: string): Promise<boolean> {
    const result = await db.delete(contentDrafts).where(eq(contentDrafts.id, id)).returning();
    return result.length > 0;
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const result = await db.insert(feedback).values(insertFeedback).returning();
    return result[0];
  }

  async getUserQuest(userId: string, questType: string): Promise<UserQuest | undefined> {
    const result = await db.select().from(userQuests)
      .where(and(eq(userQuests.userId, userId), eq(userQuests.questType, questType)))
      .limit(1);
    return result[0];
  }

  async createOrUpdateUserQuest(userId: string, questType: string, points: number): Promise<UserQuest> {
    const existing = await this.getUserQuest(userId, questType);
    const now = new Date();
    
    // Check if this is a bonus quest (one-time quest)
    const bonusQuests = ['follow_farcaster', 'follow_x', 'add_miniapp'];
    const isOneTime = bonusQuests.includes(questType);
    
    if (existing) {
      const newTotalPoints = (parseFloat(existing.totalPoints) + points).toString();
      const updateData = {
        lastCompletedAt: now,
        totalPoints: newTotalPoints,
        completionCount: existing.completionCount + 1,
        updatedAt: now,
      };
      const result = await db.update(userQuests)
        .set(updateData)
        .where(eq(userQuests.id, existing.id))
        .returning();
      return result[0];
    } else {
      const insertData: InsertUserQuest = {
        userId,
        questType,
        lastCompletedAt: now,
        totalPoints: points.toString(),
        completionCount: 1,
        isOneTime: isOneTime,
        isCompleted: false,
      };
      const result = await db.insert(userQuests).values(insertData).returning();
      return result[0];
    }
  }

  async getUserTotalPoints(userId: string): Promise<number> {
    const results = await db.select().from(userQuests).where(eq(userQuests.userId, userId));
    return results.reduce((total, quest) => total + parseFloat(quest.totalPoints), 0);
  }

  async canCompleteQuest(userId: string, questType: string): Promise<boolean> {
    const quest = await this.getUserQuest(userId, questType);
    if (!quest || !quest.lastCompletedAt) return true;
    
    // Check if it's a one-time quest and already completed
    if (quest.isOneTime && quest.isCompleted) {
      return false;
    }
    
    const now = new Date();
    const lastCompleted = new Date(quest.lastCompletedAt);
    const hoursElapsed = (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60);
    
    return hoursElapsed >= 24; // 24 saatlik cooldown
  }

  async getCurrentStreak(userId: string): Promise<number> {
    // Get all daily quests for this user
    const dailyQuests = await db.select().from(userQuests)
      .where(and(
        eq(userQuests.userId, userId),
        or(eq(userQuests.questType, 'daily_checkin'), eq(userQuests.questType, 'daily_gm'))
      ));

    if (dailyQuests.length === 0) return 0;

    const now = new Date();
    let streak = 0;
    let checkDate = new Date(now);
    
    // Start from today and work backwards
    for (let i = 0; i < 365; i++) { // Check up to a year back
      const dateString = checkDate.toISOString().split('T')[0];
      
      // Check if any daily quest was completed on this date
      const completedOnDate = dailyQuests.some(quest => {
        if (!quest.lastCompletedAt) return false;
        const questDate = new Date(quest.lastCompletedAt).toISOString().split('T')[0];
        return questDate === dateString;
      });

      if (completedOnDate) {
        streak++;
      } else {
        // If today, allow it (streak continues if today hasn't been completed yet)
        if (i === 0) {
          // Check if there's a completion within the last 24 hours
          const last24Hours = dailyQuests.some(quest => {
            if (!quest.lastCompletedAt) return false;
            const hoursSince = (now.getTime() - new Date(quest.lastCompletedAt).getTime()) / (1000 * 60 * 60);
            return hoursSince < 24;
          });
          
          if (!last24Hours) {
            break; // Streak is broken
          }
        } else {
          break; // Streak is broken
        }
      }

      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  async markQuestAsCompleted(userId: string, questType: string): Promise<void> {
    await db.update(userQuests)
      .set({ 
        isCompleted: true, 
        updatedAt: new Date() 
      })
      .where(and(eq(userQuests.userId, userId), eq(userQuests.questType, questType)));
  }

  async getDailyCastLimit(userId: string, date: string): Promise<DailyCastLimit | undefined> {
    const result = await db.select().from(dailyCastLimits)
      .where(and(eq(dailyCastLimits.userId, userId), eq(dailyCastLimits.date, date)))
      .limit(1);
    return result[0];
  }

  async incrementDailyCastCount(userId: string): Promise<{ count: number; canCast: boolean; resetIn?: number }> {
    const today = getTurkeyResetDate(); // Turkey timezone with 03:00 reset
    const existing = await this.getDailyCastLimit(userId, today);
    
    if (existing) {
      const newCount = existing.castCount + 1;
      const updateData = {
        castCount: newCount,
        updatedAt: new Date(),
      };
      await db.update(dailyCastLimits)
        .set(updateData)
        .where(eq(dailyCastLimits.id, existing.id));
      
      const resetIn = getSecondsUntilNextTurkeyReset();
      return {
        count: newCount,
        canCast: newCount < 10, // Max 10 casts per day
        resetIn: resetIn,
      };
    } else {
      const insertData: InsertDailyCastLimit = {
        userId,
        date: today,
        castCount: 1,
      };
      await db.insert(dailyCastLimits).values(insertData);
      
      const resetIn = getSecondsUntilNextTurkeyReset();
      return {
        count: 1,
        canCast: true,
        resetIn: resetIn,
      };
    }
  }

  async canUserCast(userId: string): Promise<boolean> {
    const today = getTurkeyResetDate(); // Turkey timezone with 03:00 reset
    const dailyLimit = await this.getDailyCastLimit(userId, today);
    
    if (!dailyLimit) {
      return true; // İlk cast için izin ver
    }
    
    return dailyLimit.castCount < 10; // Max 10 cast per day
  }

  async getLeaderboard(limit?: number): Promise<Array<{
    id: string;
    walletAddress: string;
    username?: string;
    totalPoints: number;
    rank: number;
    streak: number;
    weeklyPoints: number;
    monthlyPoints: number;
    yearlyPoints: number;
    hasSbt?: boolean;
  }>> {
    // Get all users with their total quest points
    const userPointsQuery = await db
      .select({
        userId: userQuests.userId,
        totalPoints: userQuests.totalPoints
      })
      .from(userQuests);

    // Calculate total points per user
    const userPointsMap: Record<string, number> = {};
    userPointsQuery.forEach(quest => {
      const currentPoints = userPointsMap[quest.userId] || 0;
      userPointsMap[quest.userId] = currentPoints + parseFloat(quest.totalPoints);
    });

    // Get user details for users with points
    const userIds = Object.keys(userPointsMap).filter(userId => userPointsMap[userId] > 0);
    if (userIds.length === 0) {
      return [];
    }

    const usersData = await db
      .select({
        id: users.id,
        walletAddress: users.walletAddress,
        farcasterUsername: users.farcasterUsername
      })
      .from(users);

    // Get SBT holders
    const sbtHolders = await db
      .select({
        userId: sbtBadges.userId,
        mintCount: sbtBadges.mintCount
      })
      .from(sbtBadges);
    
    const sbtHoldersSet = new Set(sbtHolders.filter(s => s.mintCount > 0).map(s => s.userId));

    // Build leaderboard entries with streaks
    const usersWithPoints = usersData.filter(user => userPointsMap[user.id] > 0);
    
    const leaderboardEntries = await Promise.all(
      usersWithPoints.map(async user => ({
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.farcasterUsername || undefined,
        totalPoints: userPointsMap[user.id],
        rank: 0, // Will be calculated below
        streak: await this.getCurrentStreak(user.id),
        weeklyPoints: userPointsMap[user.id], // For now, use total as weekly
        monthlyPoints: userPointsMap[user.id], // For now, use total as monthly
        yearlyPoints: userPointsMap[user.id], // For now, use total as yearly
        hasSbt: sbtHoldersSet.has(user.id),
      }))
    );

    // Sort by points descending
    leaderboardEntries.sort((a, b) => b.totalPoints - a.totalPoints);

    // Assign ranks
    leaderboardEntries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Return all results or limited if specified
    return limit ? leaderboardEntries.slice(0, limit) : leaderboardEntries;
  }

  async getUserSbtBadge(userId: string): Promise<SbtBadge | undefined> {
    const result = await db.select().from(sbtBadges)
      .where(eq(sbtBadges.userId, userId))
      .limit(1);
    return result[0];
  }

  async mintSbtBadge(userId: string, paymentAmount: number): Promise<SbtBadge> {
    const existingBadge = await this.getUserSbtBadge(userId);
    
    if (existingBadge) {
      const result = await db.update(sbtBadges)
        .set({
          mintCount: existingBadge.mintCount + 1,
          totalPaid: (parseFloat(existingBadge.totalPaid) + paymentAmount).toString(),
          lastMintedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sbtBadges.id, existingBadge.id))
        .returning();
      return result[0];
    }

    const badgeMetadata = {
      imageUrl: "/icon.png",
      name: "ContentCastAI Profile SBT",
      description: "Official ContentCastAI Soulbound Token - Proof of Contribution",
      attributes: [
        { trait_type: "Type", value: "Profile SBT" },
        { trait_type: "Mint Count", value: 1 },
        { trait_type: "Total Contribution", value: `${paymentAmount} DEGEN` }
      ]
    };

    const result = await db.insert(sbtBadges).values({
      userId,
      mintCount: 1,
      totalPaid: paymentAmount.toString(),
      badgeMetadata: badgeMetadata as any,
      lastMintedAt: new Date(),
    }).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();