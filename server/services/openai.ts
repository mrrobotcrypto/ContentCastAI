import { GoogleGenAI } from "@google/genai";
import { cryptoDataService } from "./crypto-data.js";

// Using Gemini 2.5 Flash as the default model for content generation
// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export class AIService {
  async generateContent(topic: string, contentType: string, tone: string): Promise<string> {
    try {
      const prompt = await this.buildContentPrompt(topic, contentType, tone);

      const systemInstruction = "You are a creative human content creator sharing genuine thoughts on Farcaster. Write naturally and authentically - like a real person would post, not a robot. Use conversational language, personal touches, and varied sentence structures. Make it feel spontaneous and organic, not templated or artificial. Include emojis naturally where they feel right, not forced.";
      
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        config: {
          systemInstruction,
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const content = response.text;
      if (!content) {
        throw new Error("No content generated");
      }

      return content;
    } catch (error: any) {
      console.error("Error generating content with OpenAI:", error);
      if (error.code === 'invalid_api_key') {
        throw new Error("Invalid Gemini API key. Please check your configuration.");
      }
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  private async buildContentPrompt(topic: string, contentType: string, tone: string): Promise<string> {
    // Check if topic is crypto-related and add current market data
    let marketContext = "";
    if (cryptoDataService.detectCryptoTopic(topic)) {
      marketContext = await cryptoDataService.getCurrentBTCContext();
    }
    
    const basePrompt = `Create a ${contentType.toLowerCase()} about "${topic}" in a ${tone.toLowerCase()} tone for Farcaster.${marketContext ? ` ${marketContext}` : ''}`;
    
    let specificInstructions = "";

    switch (contentType.toLowerCase()) {
      case "educational":
        specificInstructions = `
        - Share one interesting insight like you're explaining it to a curious friend
        - Break it down in simple terms anyone can understand
        - Add natural emojis where they enhance the point
        - Maybe end with a thought that makes people curious
        - Keep it flowing and conversational, not lecture-like`;
        break;
      
      case "news":
        specificInstructions = `
        - Share the news like you're telling a friend something interesting
        - Explain why it caught your attention or matters
        - Keep the energy natural and engaging
        - Use emojis that match the vibe of the news`;
        break;
      
      case "personal":
        specificInstructions = `
        - Share from the heart, like you're talking to close friends
        - Be real and vulnerable where it feels right
        - Include a genuine takeaway or realization
        - Make it personal but relatable - "we've all been there" vibes`;
        break;
      
      case "analysis":
        specificInstructions = `
        - Share one key insight that stood out to you
        - Mention the data or trend that caught your eye
        - Explain what it might mean in everyday terms
        - Add your take on where this could be heading`;
        break;
      
      case "creative":
        specificInstructions = `
        - Tell a quick story that pulls people in
        - Use vivid details or imagery that feels fresh
        - Connect emotionally - make them feel something
        - Wrap it up in a way that sticks with them`;
        break;
      
      default:
        specificInstructions = `
        - Create something people will want to share or respond to
        - Use emojis naturally - where they add flavor, not just decoration
        - Keep it punchy but give them something to chew on
        - Maybe ask something or invite them to join the conversation`;
    }

    const toneGuidance = this.getToneGuidance(tone.toLowerCase());

    return `${basePrompt}

Requirements:
${specificInstructions}

Tone guidance:
${toneGuidance}

Natural Writing Style:
- Write like a real human posting casually on social media
- Use natural language flow - vary sentence length and structure
- Add personality and genuine voice to the content
- Include emojis where they feel natural, not forced
- Aim for 150-280 characters (social media sweet spot)
- Make it conversational and authentic, avoid robotic patterns
- Use contractions, casual phrases, and natural expressions
- Think "how would I actually say this?" not "what's the template?"
- Create content that feels spontaneous and real, not AI-generated

Write as if you're sharing with friends, not filling out a form.`;
  }

  private getToneGuidance(tone: string): string {
    switch (tone) {
      case "professional":
        return `
        - Sound knowledgeable but keep it human and approachable
        - Use industry terms when needed, but don't overdo it
        - Be credible without being stiff or corporate
        - Focus on sharing real value, not just showing off expertise`;
      
      case "casual":
        return `
        - Talk like you're chatting with friends over coffee
        - Throw in casual phrases and expressions naturally
        - Be super relatable - keep it real and grounded
        - Make it feel like a conversation, not a broadcast`;
      
      case "humorous":
        return `
        - Add humor that feels natural, not forced
        - Drop a clever observation or witty comparison
        - Keep it playful but still give them something useful
        - Aim for a smile or a chuckle, maybe even a "lol that's so true"`;
      
      default:
        return `
        - Write clearly but with personality
        - Be yourself - authentic beats perfect every time
        - Give people something worth their time and attention`;
    }
  }

  async analyzeContent(content: string): Promise<{
    sentiment: string;
    readability: string;
    engagement_potential: string;
    suggestions: string[];
  }> {
    try {
      const systemInstruction = `You are a social media content analyst. Analyze content for Farcaster and provide insights in JSON format with these fields:
            - sentiment: overall sentiment (positive/negative/neutral)
            - readability: how easy it is to read (high/medium/low)
            - engagement_potential: likelihood of engagement (high/medium/low)
            - suggestions: array of 2-3 specific improvement suggestions`;
      
      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              sentiment: { type: "string" },
              readability: { type: "string" },
              engagement_potential: { type: "string" },
              suggestions: { type: "array", items: { type: "string" } }
            },
            required: ["sentiment", "readability", "engagement_potential", "suggestions"]
          }
        },
        contents: `Analyze this Farcaster content: "${content}"`
      });

      const analysis = JSON.parse(response.text || "{}");
      return {
        sentiment: analysis.sentiment || "neutral",
        readability: analysis.readability || "medium",
        engagement_potential: analysis.engagement_potential || "medium",
        suggestions: analysis.suggestions || []
      };
    } catch (error: any) {
      console.error("Error analyzing content:", error);
      throw new Error("Failed to analyze content");
    }
  }

  async generateImagePrompt(content: string): Promise<string> {
    try {
      const systemInstruction = "You are an expert at creating search queries for stock photos. Based on content, generate a concise search term that would find relevant, professional images.";
      
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        config: {
          systemInstruction,
        },
        contents: `Generate a search term for finding relevant images for this content: "${content.slice(0, 500)}"`
      });

      return response.text?.trim() || "technology";
    } catch (error: any) {
      console.error("Error generating image prompt:", error);
      return "technology"; // Fallback
    }
  }
}

export const aiService = new AIService();
