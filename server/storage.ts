import { type User, type InsertUser, type ContentDraft, type InsertContentDraft, type Feedback, type InsertFeedback, type UserQuest, type InsertUserQuest, type DailyCastLimit, type InsertDailyCastLimit, type SbtBadge, type InsertSbtBadge } from "@shared/schema";
import { randomUUID } from "crypto";
import { getTurkeyResetDate, getSecondsUntilNextTurkeyReset } from "./time-utils";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Content draft methods
  getContentDraft(id: string): Promise<ContentDraft | undefined>;
  getContentDraftsByUserId(userId: string): Promise<ContentDraft[]>;
  createContentDraft(draft: InsertContentDraft): Promise<ContentDraft>;
  updateContentDraft(id: string, updates: Partial<ContentDraft>): Promise<ContentDraft | undefined>;
  deleteContentDraft(id: string): Promise<boolean>;

  // Feedback methods
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;

  // Quest methods
  getUserQuest(userId: string, questType: string): Promise<UserQuest | undefined>;
  createOrUpdateUserQuest(userId: string, questType: string, points: number): Promise<UserQuest>;
  getUserTotalPoints(userId: string): Promise<number>;
  canCompleteQuest(userId: string, questType: string): Promise<boolean>;
  getCurrentStreak(userId: string): Promise<number>;
  markQuestAsCompleted(userId: string, questType: string): Promise<void>;

  // Daily cast limit methods
  getDailyCastLimit(userId: string, date: string): Promise<DailyCastLimit | undefined>;
  incrementDailyCastCount(userId: string): Promise<{ count: number; canCast: boolean; resetIn?: number }>;
  canUserCast(userId: string): Promise<boolean>;

  // Leaderboard methods
  getLeaderboard(limit?: number): Promise<Array<{
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
  }>>;

  // SBT Badge methods
  getUserSbtBadge(userId: string): Promise<SbtBadge | undefined>;
  mintSbtBadge(userId: string, paymentAmount: number): Promise<SbtBadge>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private contentDrafts: Map<string, ContentDraft>;
  private feedback: Map<string, Feedback>;
  private userQuests: Map<string, UserQuest>;
  private dailyCastLimits: Map<string, DailyCastLimit>;
  private sbtBadges: Map<string, SbtBadge>;

  constructor() {
    this.users = new Map();
    this.contentDrafts = new Map();
    this.feedback = new Map();
    this.userQuests = new Map();
    this.dailyCastLimits = new Map();
    this.sbtBadges = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === walletAddress,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      id,
      farcasterFid: insertUser.farcasterFid || null,
      farcasterUsername: insertUser.farcasterUsername || null,
      farcasterDisplayName: insertUser.farcasterDisplayName || null,
      farcasterAvatar: insertUser.farcasterAvatar || null,
      farcasterBio: insertUser.farcasterBio || null,
      baseUsername: insertUser.baseUsername || null,
      ensUsername: insertUser.ensUsername || null,
      followerCount: insertUser.followerCount || 0,
      followingCount: insertUser.followingCount || 0,
      xUrl: insertUser.xUrl || null,
      githubUrl: insertUser.githubUrl || null,
      farcasterUrl: insertUser.farcasterUrl || null,
      neynarScore: insertUser.neynarScore || null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getContentDraft(id: string): Promise<ContentDraft | undefined> {
    return this.contentDrafts.get(id);
  }

  async getContentDraftsByUserId(userId: string): Promise<ContentDraft[]> {
    return Array.from(this.contentDrafts.values()).filter(
      (draft) => draft.userId === userId,
    );
  }

  async createContentDraft(insertDraft: InsertContentDraft): Promise<ContentDraft> {
    const id = randomUUID();
    const draft: ContentDraft = {
      id,
      userId: insertDraft.userId,
      topic: insertDraft.topic,
      contentType: insertDraft.contentType,
      tone: insertDraft.tone,
      generatedContent: insertDraft.generatedContent || null,
      selectedImage: insertDraft.selectedImage || null,
      isPublished: insertDraft.isPublished || false,
      farcasterCastHash: insertDraft.farcasterCastHash || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contentDrafts.set(id, draft);
    return draft;
  }

  async updateContentDraft(id: string, updates: Partial<ContentDraft>): Promise<ContentDraft | undefined> {
    const draft = this.contentDrafts.get(id);
    if (!draft) return undefined;
    
    const updatedDraft = { 
      ...draft, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.contentDrafts.set(id, updatedDraft);
    return updatedDraft;
  }

  async deleteContentDraft(id: string): Promise<boolean> {
    return this.contentDrafts.delete(id);
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = randomUUID();
    const feedback: Feedback = {
      id,
      type: insertFeedback.type,
      message: insertFeedback.message,
      userAgent: insertFeedback.userAgent || null,
      createdAt: new Date(),
    };
    this.feedback.set(id, feedback);
    return feedback;
  }

  async getUserQuest(userId: string, questType: string): Promise<UserQuest | undefined> {
    const questKey = `${userId}-${questType}`;
    return this.userQuests.get(questKey);
  }

  async createOrUpdateUserQuest(userId: string, questType: string, points: number): Promise<UserQuest> {
    const questKey = `${userId}-${questType}`;
    const existing = this.userQuests.get(questKey);
    const now = new Date();
    
    // Check if this is a bonus quest (one-time quest)
    const bonusQuests = ['follow_farcaster', 'follow_x', 'add_miniapp'];
    const isOneTime = bonusQuests.includes(questType);
    
    if (existing) {
      const updated: UserQuest = {
        ...existing,
        lastCompletedAt: now,
        totalPoints: (parseFloat(existing.totalPoints) + points).toString(),
        completionCount: existing.completionCount + 1,
        updatedAt: now,
      };
      this.userQuests.set(questKey, updated);
      return updated;
    } else {
      const id = randomUUID();
      const newQuest: UserQuest = {
        id,
        userId,
        questType,
        lastCompletedAt: now,
        totalPoints: points.toString(),
        completionCount: 1,
        isOneTime: isOneTime,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      };
      this.userQuests.set(questKey, newQuest);
      return newQuest;
    }
  }

  async getUserTotalPoints(userId: string): Promise<number> {
    let total = 0;
    const questsArray = Array.from(this.userQuests.values());
    for (const quest of questsArray) {
      if (quest.userId === userId) {
        total += parseFloat(quest.totalPoints);
      }
    }
    return total;
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
    const dailyQuests = Array.from(this.userQuests.values()).filter(
      quest => quest.userId === userId && 
      (quest.questType === 'daily_checkin' || quest.questType === 'daily_gm')
    );

    if (dailyQuests.length === 0) return 0;

    // Sort by last completion date descending
    dailyQuests.sort((a, b) => {
      const dateA = a.lastCompletedAt ? new Date(a.lastCompletedAt).getTime() : 0;
      const dateB = b.lastCompletedAt ? new Date(b.lastCompletedAt).getTime() : 0;
      return dateB - dateA;
    });

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
    const questKey = `${userId}-${questType}`;
    const existing = this.userQuests.get(questKey);
    if (existing) {
      const updated: UserQuest = {
        ...existing,
        isCompleted: true,
        updatedAt: new Date(),
      };
      this.userQuests.set(questKey, updated);
    }
  }

  async getDailyCastLimit(userId: string, date: string): Promise<DailyCastLimit | undefined> {
    const key = `${userId}-${date}`;
    return this.dailyCastLimits.get(key);
  }

  async incrementDailyCastCount(userId: string): Promise<{ count: number; canCast: boolean; resetIn?: number }> {
    const today = getTurkeyResetDate(); // Turkey timezone with 03:00 reset
    const key = `${userId}-${today}`;
    const existing = this.dailyCastLimits.get(key);
    
    if (existing) {
      const newCount = existing.castCount + 1;
      const updatedLimit: DailyCastLimit = {
        ...existing,
        castCount: newCount,
        updatedAt: new Date(),
      };
      this.dailyCastLimits.set(key, updatedLimit);
      const resetIn = getSecondsUntilNextTurkeyReset();
      return {
        count: newCount,
        canCast: newCount < 10, // Max 10 casts per day
        resetIn: resetIn,
      };
    } else {
      const id = randomUUID();
      const newLimit: DailyCastLimit = {
        id,
        userId,
        date: today,
        castCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.dailyCastLimits.set(key, newLimit);
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
  }>> {
    // Get all users with their total points
    const userPointsMap: Map<string, number> = new Map();
    
    // Calculate total points per user
    Array.from(this.userQuests.values()).forEach(quest => {
      const currentPoints = userPointsMap.get(quest.userId) || 0;
      userPointsMap.set(quest.userId, currentPoints + parseFloat(quest.totalPoints));
    });

    // Get user details and build leaderboard
    const leaderboardEntries: Array<{
      id: string;
      walletAddress: string;
      username?: string;
      totalPoints: number;
      rank: number;
      streak: number;
      weeklyPoints: number;
      monthlyPoints: number;
      yearlyPoints: number;
    }> = [];

    for (const [userId, totalPoints] of Array.from(userPointsMap.entries())) {
      const user = this.users.get(userId);
      if (user && totalPoints > 0) {
        leaderboardEntries.push({
          id: user.id,
          walletAddress: user.walletAddress,
          username: user.farcasterUsername || undefined,
          totalPoints,
          rank: 0, // Will be calculated below
          streak: await this.getCurrentStreak(user.id),
          weeklyPoints: totalPoints, // For now, use total as weekly
          monthlyPoints: totalPoints, // For now, use total as monthly
          yearlyPoints: totalPoints, // For now, use total as yearly
        });
      }
    }

    // Sort by total points descending
    leaderboardEntries.sort((a, b) => b.totalPoints - a.totalPoints);

    // Assign ranks
    leaderboardEntries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Return all results or limited if specified
    return limit ? leaderboardEntries.slice(0, limit) : leaderboardEntries;
  }

  async getUserSbtBadge(userId: string): Promise<SbtBadge | undefined> {
    return Array.from(this.sbtBadges.values()).find(
      (badge) => badge.userId === userId
    );
  }

  async mintSbtBadge(userId: string, paymentAmount: number): Promise<SbtBadge> {
    const existingBadge = await this.getUserSbtBadge(userId);
    
    if (existingBadge) {
      const updatedBadge: SbtBadge = {
        ...existingBadge,
        mintCount: existingBadge.mintCount + 1,
        totalPaid: (parseFloat(existingBadge.totalPaid) + paymentAmount).toString(),
        lastMintedAt: new Date(),
        updatedAt: new Date(),
      };
      this.sbtBadges.set(existingBadge.id, updatedBadge);
      return updatedBadge;
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

    const newBadge: SbtBadge = {
      id: randomUUID(),
      userId,
      mintCount: 1,
      totalPaid: paymentAmount.toString(),
      badgeMetadata,
      lastMintedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sbtBadges.set(newBadge.id, newBadge);
    return newBadge;
  }
}

// Export database storage for production use
export { storage } from "./database.js";

// Keep MemStorage for development/testing if needed
export const memStorage = new MemStorage();
