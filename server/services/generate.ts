// server/services/generate.ts
import { GoogleGenAI } from "@google/genai";

// Kısa metin + sonda #FarcastAI
function enforceShortOutput(text: string): string {
  if (!text) return "";
  let t = text
    .replace(/^(\s*[-*]\s+)/gm, "")        // "- " veya "* "
    .replace(/^(\s*\d+\.\s+)/gm, "")       // "1. "
    .replace(/^#{1,6}\s+/gm, "");          // "# Başlık"
  const paras = t.split(/\n{2,}/).map(p => p.trim()).filter(Boolean).slice(0, 2);
  t = paras.join("\n\n");
  if (t.length > 700) t = t.slice(0, 680).replace(/\s+\S*$/, "") + "…";
  // Removed automatic #FarcastAI hashtag per user request
  return t;
}

// Basit dil tespiti (heuristic)
function detectLangAuto(s: string): "tr" | "en" {
  const txt = (s || "").toLowerCase();

  // Açık talimatlar override
  if (/\bwrite (it|the answer)? in english\b|\benglish only\b/.test(txt)) return "en";
  if (/(türkçe yaz|türkçe cevapla|cevabı türkçe yaz)/.test(txt)) return "tr";

  // Türkçe karakter / kelime ipuçları
  const hasTrChar = /[çğıöşü]/i.test(txt);
  const trWords = /\b(ve|bir|nedir|nasıl|için|hakkında|olarak|çok|daha|ama|fiyat|kadar)\b/i.test(txt);

  // İngilizce ipuçları
  const enWords = /\b(the|and|what|how|why|is|are|with|about)\b/i.test(txt);

  if (hasTrChar || trWords) return "tr";
  if (enWords) return "en";

  // Latin-only ise çoğu zaman EN
  const latinOnly = /^[\x00-\x7F\s]+$/.test(txt);
  return latinOnly ? "en" : "tr";
}

export interface GenerateContentRequest {
  prompt: string;
  lang?: "tr" | "en" | "";
}

export interface GenerateContentResponse {
  ok: boolean;
  provider?: string;
  model?: string;
  lang?: "tr" | "en";
  text?: string;
  content?: string;
  result?: string;
  message?: string;
  status?: number;
  retryAfter?: string;
  body?: string;
}

export async function generateContent(req: GenerateContentRequest): Promise<GenerateContentResponse> {
  const { prompt, lang = "" } = req;

  if (!prompt) {
    return {
      ok: false,
      message: "Missing prompt/topic",
      status: 400
    };
  }

  // 1) Eğer lang param gelmişse onu kullan; 2) gelmemişse otomatik tespit
  const auto = detectLangAuto(prompt);
  const langFinal: "tr" | "en" = (lang === "tr" || lang === "en") ? lang : auto;

  // Kurallar (senin şablonun)
  const rulesTR = `Aşağıdaki isteğe ÇOK KISA ve ÖZ yanıt ver. Kurallar:
- SADECE 1 paragraf, maksimum 2-3 cümle.
- Liste/madde işareti kullanma; akıcı düz metin yaz.
- Gevezelik etme; çok kısa ve net ol.
- Sosyal medya için uygun kısa içerik üret.`;

  const rulesEN = `Respond VERY BRIEFLY and CLEARLY. Rules:
- ONLY 1 paragraph, maximum 2-3 sentences.
- Do not use lists or headings.
- No fluff; be extremely concise and concrete.
- Create short social media friendly content.`;

  const rules = langFinal === "en" ? rulesEN : rulesTR;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { 
    return {
      ok: false, 
      message: "GEMINI_API_KEY missing in environment",
      status: 503
    };
  }

  const finalPrompt = `${rules}\n\nUSER PROMPT:\n${prompt}`;

  try {
    // Use the official Google GenAI SDK
    const ai = new GoogleGenAI({ apiKey });
    
    console.log("Gemini API Request using @google/genai SDK:", { 
      model: "gemini-2.5-flash", 
      prompt: finalPrompt.slice(0, 200) + "..." 
    });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: finalPrompt,
    });

    console.log("Gemini API Response:", { 
      success: !!response.text, 
      textLength: response.text?.length || 0 
    });

    const raw = response.text || "";
    const text = enforceShortOutput(raw);

    return {
      ok: true,
      provider: "gemini",
      model: "gemini-2.5-flash",
      lang: langFinal,
      text,
      content: text,
      result: text,
      message: text
    };
  } catch (err: any) {
    console.error("Gemini generation error:", err);
    return {
      ok: false, 
      message: err?.message || "Internal Server Error",
      status: 500
    };
  }
}