// server/services/farcaster.ts
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

interface FarcasterCastRequest {
  text: string;
  embeds?: Array<{
    url?: string;
    castId?: {
      fid: number;
      hash: string;
    };
  }>;
  embedsDeprecated?: string[];
  mentions?: number[];
  mentionsPositions?: number[];
}

interface FarcasterCastResponse {
  hash: string;
  success: boolean;
}

export class FarcasterService {
  private hubUrl: string;
  private warpcastApiUrl: string;
  private neynarClient: NeynarAPIClient | null = null;

  constructor() {
    // Using Farcaster Hub API for direct casting
    this.hubUrl = process.env.FARCASTER_HUB_URL || 'https://hub.farcaster.xyz';
    this.warpcastApiUrl = 'https://api.warpcast.com';
    
    // Initialize Neynar client if API key is available
    if (process.env.NEYNAR_API_KEY) {
      this.neynarClient = new NeynarAPIClient({ apiKey: process.env.NEYNAR_API_KEY });
    }
  }

  async prepareCast(
    fid: string, 
    text: string, 
    imageUrl?: string
  ): Promise<{ castContent: string; farcasterUrl: string; ready: boolean }> {
    try {
      // Prepare cast for manual submission
      console.log('Preparing Farcaster cast for FID:', fid);
      console.log('Cast content:', text);
      if (imageUrl) {
        console.log('With image:', imageUrl);
      }
      
      // Simulate preparation delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create direct Farcaster cast URL for manual posting
      const encodedText = encodeURIComponent(text);
      let farcasterUrl = `https://warpcast.com/~/compose?text=${encodedText}`;
      
      if (imageUrl) {
        const encodedImage = encodeURIComponent(imageUrl);
        farcasterUrl += `&embeds[]=${encodedImage}`;
      }
      
      return {
        castContent: text,
        farcasterUrl,
        ready: true,
      };
    } catch (error) {
      console.error('Error preparing cast:', error);
      throw new Error('Failed to prepare cast for Farcaster');
    }
  }

  async getUserProfile(fid: string): Promise<any> {
    try {
      const response = await fetch(`${this.hubUrl}/v1/userDataByFid?fid=${fid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Farcaster user profile:', error);
      throw new Error('Failed to fetch user profile from Farcaster');
    }
  }

  async getUserByWalletAddress(walletAddress: string): Promise<any> {
    try {
      // Use Neynar API if available
      if (this.neynarClient) {
        // Neynar requires lowercase addresses
        const normalizedAddress = walletAddress.toLowerCase();
        console.log('🔍 Fetching Farcaster user via Neynar for wallet:', normalizedAddress);
        
        try {
          const result = await this.neynarClient.fetchBulkUsersByEthOrSolAddress({ addresses: [normalizedAddress] });
          console.log('📊 Neynar API response:', JSON.stringify(result, null, 2));
          
          if (result && result[normalizedAddress] && result[normalizedAddress].length > 0) {
            const user = result[normalizedAddress][0];
            console.log('✅ Neynar user found:', user.username);
            
            // Fetch Neynar score if available (from experimental field)
            let neynarScore = null;
            if (user.experimental?.neynar_user_score) {
              // Score is 0-1, multiply by 100 to show as percentage
              neynarScore = Math.round(user.experimental.neynar_user_score * 100);
              console.log('🎯 Neynar score:', neynarScore);
            }
            
            return {
              fid: user.fid?.toString(),
              username: user.username,
              displayName: user.display_name,
              pfpUrl: user.pfp_url,
              bio: user.profile?.bio?.text,
              followerCount: user.follower_count || 0,
              followingCount: user.following_count || 0,
              verifiedAddresses: user.verified_addresses?.eth_addresses || [],
              neynarScore: neynarScore,
            };
          }
          
          console.log('⚠️ No Farcaster user found for wallet via Neynar');
          return null;
        } catch (neynarError: any) {
          console.error('❌ Neynar API error:', neynarError.message);
          // Fallback to Warpcast if Neynar fails
        }
      }
      
      // Fallback to Warpcast API
      console.log('🔍 Fetching Farcaster user via Warpcast API for wallet:', walletAddress);
      const response = await fetch(`${this.warpcastApiUrl}/v2/user-by-verification?address=${walletAddress}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // User not found on Farcaster
        }
        throw new Error(`Failed to fetch user by wallet: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        fid: data.result?.user?.fid,
        username: data.result?.user?.username,
        displayName: data.result?.user?.displayName,
        pfpUrl: data.result?.user?.pfp?.url,
      };
    } catch (error) {
      console.error('Error fetching Farcaster user by wallet:', error);
      return null; // Return null instead of throwing to allow user creation without Farcaster
    }
  }
}

export const farcasterService = new FarcasterService();