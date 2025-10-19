import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { aiService } from "./services/openai";
import { pexelsService } from "./services/pexels";
import { farcasterService } from "./services/farcaster";
import { generateContent } from "./services/generate";
import { insertUserSchema, insertContentDraftSchema, insertFeedbackSchema } from "@shared/schema";
import { z } from "zod";

const generateContentSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  contentType: z.string().min(1, "Content type is required"),
  tone: z.string().min(1, "Tone is required"),
});

const publishCastSchema = z.object({
  draftId: z.string().min(1, "Draft ID is required"),
  imageUrl: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Static assets route to bypass cache issues
  app.get("/api/static/icon.png", (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.resolve('client/public/icon.png'));
  });
  
  app.get("/api/static/splash.png", (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.resolve('client/public/splash.png'));
  });
  
  app.get("/api/static/og.png", (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.resolve('client/public/og.png'));
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByWalletAddress(userData.walletAddress);
      if (existingUser) {
        return res.json(existingUser);
      }

      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users/:walletAddress", async (req, res) => {
    try {
      let user = await storage.getUserByWalletAddress(req.params.walletAddress);
      
      // If user exists, try to enrich with Farcaster data
      if (user) {
        const farcasterData = await farcasterService.getUserByWalletAddress(req.params.walletAddress);
        
        if (farcasterData) {
          // Update user with Farcaster data if not already set
          const updates: any = {};
          
          if (!user.farcasterFid && farcasterData.fid) updates.farcasterFid = farcasterData.fid;
          if (!user.farcasterUsername && farcasterData.username) updates.farcasterUsername = farcasterData.username;
          if (!user.farcasterDisplayName && farcasterData.displayName) updates.farcasterDisplayName = farcasterData.displayName;
          if (!user.farcasterAvatar && farcasterData.pfpUrl) updates.farcasterAvatar = farcasterData.pfpUrl;
          if (!user.farcasterBio && farcasterData.bio) updates.farcasterBio = farcasterData.bio;
          if (!user.followerCount && farcasterData.followerCount) updates.followerCount = farcasterData.followerCount;
          if (!user.followingCount && farcasterData.followingCount) updates.followingCount = farcasterData.followingCount;
          if (farcasterData.neynarScore !== null && farcasterData.neynarScore !== undefined) updates.neynarScore = farcasterData.neynarScore;
          
          if (Object.keys(updates).length > 0) {
            user = await storage.updateUser(user.id, updates) || user;
          }
        }
        
        return res.json(user);
      }
      
      return res.status(404).json({ message: "User not found" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Content generation routes
  app.post("/api/content/generate", async (req, res) => {
    try {
      const { topic, contentType, tone } = generateContentSchema.parse(req.body);
      
      const generatedContent = await aiService.generateContent(topic, contentType, tone);
      res.json({ content: generatedContent });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Direct AI content generation with automatic language detection
  app.get("/api/generate", async (req, res) => {
    try {
      const prompt = req.query.prompt as string;
      const langParam = req.query.lang as string;
      const lang = (langParam === "tr" || langParam === "en") ? langParam : "";
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt parameter is required" });
      }

      const result = await generateContent({ prompt, lang });
      
      if (!result.ok) {
        return res.status(result.status || 500).json({ 
          message: result.message || "Content generation failed" 
        });
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Content draft routes
  app.post("/api/drafts", async (req, res) => {
    try {
      const draftData = insertContentDraftSchema.parse(req.body);
      const draft = await storage.createContentDraft(draftData);
      res.json(draft);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/drafts/user/:userId", async (req, res) => {
    try {
      const drafts = await storage.getContentDraftsByUserId(req.params.userId);
      res.json(drafts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/drafts/:id", async (req, res) => {
    try {
      const updates = req.body;
      const draft = await storage.updateContentDraft(req.params.id, updates);
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      res.json(draft);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/drafts/:id", async (req, res) => {
    try {
      const success = await storage.deleteContentDraft(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Draft not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Image search routes
  app.get("/api/images/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const perPage = parseInt(req.query.per_page as string) || 12;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const photos = await pexelsService.searchPhotos(query, perPage);
      res.json({ photos });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/images/featured", async (req, res) => {
    try {
      const perPage = parseInt(req.query.per_page as string) || 12;
      const photos = await pexelsService.getFeaturedPhotos(perPage);
      res.json({ photos });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/images/suggest-search", async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ message: "Content is required" });
      }

      // Use Gemini to analyze content and suggest image search term
      const searchTerm = await aiService.generateImagePrompt(content);
      res.json({ searchTerm });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Farcaster casting routes
  app.post("/api/farcaster/cast", async (req, res) => {
    try {
      const { draftId, imageUrl } = publishCastSchema.parse(req.body);
      
      const draft = await storage.getContentDraft(draftId);
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }

      const user = await storage.getUser(draft.userId);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      // Check daily cast limit
      const canCast = await storage.canUserCast(draft.userId);
      if (!canCast) {
        return res.status(429).json({ 
          message: "Günlük cast limitiniz dolmuştur. Günde maksimum 10 cast atabilirsiniz.",
          error: "DAILY_LIMIT_EXCEEDED",
          maxDailyCasts: 10
        });
      }
      
      // If user doesn't have Farcaster FID, use demo mode
      let farcasterFid = user.farcasterFid;
      if (!farcasterFid) {
        // Demo mode: Use a placeholder FID for testing
        farcasterFid = "123456";
        console.log("Demo mode: Using placeholder FID for casting");
      }

      // Prepare cast for manual submission instead of auto-posting
      const castPreparation = await farcasterService.prepareCast(
        farcasterFid,
        draft.generatedContent || "",
        imageUrl
      );

      // Increment daily cast count
      const castResult = await storage.incrementDailyCastCount(draft.userId);

      // Complete daily cast quest (award points for casting)
      try {
        const questPoints = 1; // 1 point for daily cast
        await storage.createOrUpdateUserQuest(draft.userId, 'daily_cast', questPoints);
        console.log(`Daily cast quest completed for user ${draft.userId}, awarded ${questPoints} points`);
      } catch (questError) {
        console.warn('Failed to complete daily cast quest:', questError);
        // Don't fail the cast if quest completion fails
      }

      // Mark as prepared but not yet published
      await storage.updateContentDraft(draftId, {
        isPublished: false, // Will be true when user manually posts
        farcasterCastHash: null, // Will be set when user provides it
      });

      res.json({
        ...castPreparation,
        message: "Cast prepared for manual posting to Farcaster",
        dailyCastInfo: {
          count: castResult.count,
          remaining: 20 - castResult.count,
          canCast: castResult.canCast,
          resetIn: castResult.resetIn
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/farcaster/profile/:fid", async (req, res) => {
    try {
      const profile = await farcasterService.getUserProfile(req.params.fid);
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/farcaster/user-by-wallet/:walletAddress", async (req, res) => {
    try {
      const farcasterUser = await farcasterService.getUserByWalletAddress(req.params.walletAddress);
      if (!farcasterUser) {
        return res.status(404).json({ message: "User not found on Farcaster" });
      }
      res.json(farcasterUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Webhook for Farcaster events
  app.post("/api/webhook", async (req, res) => {
    try {
      // Handle Farcaster server events (notifications, etc.)
      console.log("Farcaster webhook received:", req.body);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Quest completion endpoints
  app.post("/api/quests/complete", async (req, res) => {
    try {
      const { userId, questType } = req.body;
      
      if (!userId || !questType) {
        return res.status(400).json({ message: "userId and questType are required" });
      }

      // Check if quest can be completed (cooldown check)
      const canComplete = await storage.canCompleteQuest(userId, questType);
      if (!canComplete) {
        return res.status(429).json({ message: "Quest is on cooldown" });
      }

      // Define quest points
      const questPoints: Record<string, number> = {
        daily_checkin: 1,
        daily_gm: 0.25,
        daily_cast: 1,
        share_app: 1,
        nft_holding: 10,
        follow_farcaster: 1,
        follow_x: 1,
        add_miniapp: 1,
      };

      const points = questPoints[questType] || 0;
      
      // Check if this is a bonus quest (one-time quest)
      const bonusQuests = ['follow_farcaster', 'follow_x', 'add_miniapp'];
      const isOneTime = bonusQuests.includes(questType);
      
      const quest = await storage.createOrUpdateUserQuest(userId, questType, points);
      
      // Mark one-time quests as completed
      if (isOneTime && quest) {
        await storage.markQuestAsCompleted(userId, questType);
      }
      
      res.json({ 
        success: true, 
        quest,
        pointsEarned: points 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/quests/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const totalPoints = await storage.getUserTotalPoints(userId);
      const currentStreak = await storage.getCurrentStreak(userId);
      
      // Get quest states
      const dailyCheckin = await storage.getUserQuest(userId, "daily_checkin");
      const dailyGm = await storage.getUserQuest(userId, "daily_gm");
      const dailyCast = await storage.getUserQuest(userId, "daily_cast");
      const shareApp = await storage.getUserQuest(userId, "share_app");
      
      // Get bonus quest states
      const followFarcaster = await storage.getUserQuest(userId, "follow_farcaster");
      const followX = await storage.getUserQuest(userId, "follow_x");
      const addMiniapp = await storage.getUserQuest(userId, "add_miniapp");
      
      const canCompleteDailyCheckin = await storage.canCompleteQuest(userId, "daily_checkin");
      const canCompleteDailyGm = await storage.canCompleteQuest(userId, "daily_gm");
      const canCompleteDailyCast = await storage.canCompleteQuest(userId, "daily_cast");
      const canCompleteShareApp = await storage.canCompleteQuest(userId, "share_app");
      
      const canCompleteFollowFarcaster = await storage.canCompleteQuest(userId, "follow_farcaster");
      const canCompleteFollowX = await storage.canCompleteQuest(userId, "follow_x");
      const canCompleteAddMiniapp = await storage.canCompleteQuest(userId, "add_miniapp");
      
      res.json({
        totalPoints,
        currentStreak,
        dailyCastCount: dailyCast?.completionCount || 0, // Total daily casts completed
        quests: {
          daily_checkin: {
            ...dailyCheckin,
            canComplete: canCompleteDailyCheckin,
            timeUntilNext: dailyCheckin?.lastCompletedAt ? 
              Math.max(0, 24 * 60 * 60 * 1000 - (Date.now() - new Date(dailyCheckin.lastCompletedAt).getTime())) : 0
          },
          daily_gm: {
            ...dailyGm,
            canComplete: canCompleteDailyGm,
            timeUntilNext: dailyGm?.lastCompletedAt ? 
              Math.max(0, 24 * 60 * 60 * 1000 - (Date.now() - new Date(dailyGm.lastCompletedAt).getTime())) : 0
          },
          daily_cast: {
            ...dailyCast,
            canComplete: canCompleteDailyCast,
            timeUntilNext: 0 // Daily cast has no cooldown - unlimited daily
          },
          share_app: {
            ...shareApp,
            canComplete: canCompleteShareApp,
            timeUntilNext: shareApp?.lastCompletedAt ? 
              Math.max(0, 24 * 60 * 60 * 1000 - (Date.now() - new Date(shareApp.lastCompletedAt).getTime())) : 0
          }
        },
        bonusQuests: {
          follow_farcaster: {
            ...followFarcaster,
            canComplete: canCompleteFollowFarcaster,
            isCompleted: followFarcaster?.isCompleted || false,
          },
          follow_x: {
            ...followX,
            canComplete: canCompleteFollowX,
            isCompleted: followX?.isCompleted || false,
          },
          add_miniapp: {
            ...addMiniapp,
            canComplete: canCompleteAddMiniapp,
            isCompleted: addMiniapp?.isCompleted || false,
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // SBT Badge routes
  app.post("/api/sbt/mint", async (req, res) => {
    try {
      const { userId, transactionHash } = req.body;
      
      if (!userId || !transactionHash) {
        return res.status(400).json({ message: "userId and transactionHash are required" });
      }

      console.log(`✅ SBT mint request - User: ${userId}, TX: ${transactionHash}`);

      // Mint SBT badge in database
      const badge = await storage.mintSbtBadge(userId, 0.00125);
      
      // Award 50 points for minting
      await storage.createOrUpdateUserQuest(userId, "mint_sbt", 50);
      
      console.log(`🎉 SBT minted successfully - Points: 50, Badge:`, badge);
      
      res.json({ 
        success: true, 
        badge,
        pointsEarned: 50,
        transactionHash 
      });
    } catch (error: any) {
      console.error(`❌ SBT mint error:`, error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/sbt/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const badge = await storage.getUserSbtBadge(userId);
      
      res.json(badge || { mintCount: 0, totalPaid: "0" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Leaderboard routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rewards routes
  app.post("/api/rewards/claim-degen", async (req, res) => {
    try {
      const { userId, points } = req.body;
      
      if (!userId || !points) {
        return res.status(400).json({ message: "userId and points are required" });
      }

      const minimumPoints = 250;
      const degenPerPoint = 0.1;

      if (points < minimumPoints) {
        return res.status(400).json({ 
          message: `Minimum ${minimumPoints} points required to claim DEGEN` 
        });
      }

      const degenAmount = Math.floor(points * degenPerPoint);
      
      // TODO: Here you would integrate with the DEGEN contract to send tokens
      // For now, we'll simulate the claim without resetting points (for demo purposes)
      // In a real implementation, you would:
      // 1. Send DEGEN tokens to user's wallet via smart contract
      // 2. Record the claim transaction
      // 3. Reset or reduce user's claimable points accordingly
      
      console.log(`Simulating DEGEN claim: ${degenAmount} DEGEN tokens for user ${userId}`);

      res.json({ 
        success: true, 
        degenAmount,
        message: `Successfully claimed ${degenAmount} DEGEN tokens!`,
        contractAddress: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", // Base DEGEN contract
        chainId: 8453 // Base chain
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Daily cast limits routes
  app.get("/api/cast-limits/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { getTurkeyResetDate, getSecondsUntilNextTurkeyReset } = await import("./time-utils");
      const today = getTurkeyResetDate(); // Turkey timezone with 03:00 reset
      
      const dailyLimit = await storage.getDailyCastLimit(userId, today);
      const canCast = await storage.canUserCast(userId);
      
      const count = dailyLimit?.castCount || 0;
      const remaining = Math.max(0, 10 - count);
      const resetIn = getSecondsUntilNextTurkeyReset();
      
      res.json({
        date: today,
        count,
        remaining,
        maxDailyCasts: 10,
        canCast,
        limitReached: !canCast,
        resetIn: resetIn
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Feedback routes
  app.post("/api/feedback", async (req, res) => {
    try {
      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        userAgent: req.get('User-Agent') || 'Unknown'
      });
      
      const feedback = await storage.createFeedback(feedbackData);
      console.log("New feedback received:", feedback.type, feedback.message.slice(0, 50) + "...");
      
      res.json({
        success: true,
        message: "Feedback received successfully",
        id: feedback.id
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
