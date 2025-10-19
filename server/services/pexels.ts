// server/services/pexels.ts

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsSearchResponse {
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  total_results: number;
  next_page?: string;
}

export class PexelsService {
  async searchPhotos(query: string, perPage: number = 6): Promise<PexelsPhoto[]> {
    const key = process.env.PEXELS_API_KEY || "";
    if (!key) throw new Error("PEXELS_API_KEY missing in environment");

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      { headers: { Authorization: key, "Content-Type": "application/json" } }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
    }

    const data: PexelsSearchResponse = await response.json();
    return data.photos;
  }

  async getFeaturedPhotos(perPage: number = 8): Promise<PexelsPhoto[]> {
    const key = process.env.PEXELS_API_KEY || "";
    if (!key) {
      console.error("PEXELS_API_KEY missing in environment");
      throw new Error("PEXELS_API_KEY missing in environment");
    }

    console.log("Starting getFeaturedPhotos with perPage:", perPage);

    // 4 kategoride 2'şer resim = 8 resim toplamı
    const categories = [
      { name: "crypto", terms: ["cryptocurrency bitcoin", "blockchain technology", "ethereum digital currency"] },
      { name: "landscape", terms: ["mountain landscape", "ocean sunset", "forest nature scenery"] },
      { name: "ai", terms: ["artificial intelligence technology", "robot futuristic", "machine learning data"] },
      { name: "meme", terms: ["funny crypto meme", "doge cryptocurrency", "internet meme culture"] }
    ];

    const allPhotos: PexelsPhoto[] = [];

    for (const category of categories) {
      try {
        // Her kategoriden 2 resim al
        const randomTerm = category.terms[Math.floor(Math.random() * category.terms.length)];
        console.log(`Fetching ${category.name} images with term: "${randomTerm}"`);
        
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(randomTerm)}&per_page=2&orientation=landscape`,
          { 
            headers: { 
              Authorization: key, 
              "Content-Type": "application/json",
              "User-Agent": "FarcastAI/1.0"
            } 
          }
        );

        console.log(`Pexels API response for ${category.name}: Status ${response.status}`);

        if (response.ok) {
          const data: PexelsSearchResponse = await response.json();
          console.log(`Found ${data.photos.length} photos for ${category.name}`);
          
          // Her fotoğrafa kategori bilgisi ekle
          const categoryPhotos = data.photos.map(photo => ({
            ...photo,
            category: category.name
          }));
          allPhotos.push(...categoryPhotos);
        } else {
          const errorText = await response.text();
          console.error(`Pexels API error for ${category.name}: ${response.status} ${response.statusText} - ${errorText}`);
        }
      } catch (error) {
        console.error(`Error fetching ${category.name} images:`, error);
      }
    }

    // Eğer yeterli resim alınamadıysa fallback crypto resimleri
    if (allPhotos.length < 4) {
      const fallbackResponse = await fetch(
        `https://api.pexels.com/v1/search?query=cryptocurrency&per_page=${8 - allPhotos.length}&orientation=landscape`,
        { headers: { Authorization: key, "Content-Type": "application/json" } }
      );
      
      if (fallbackResponse.ok) {
        const fallbackData: PexelsSearchResponse = await fallbackResponse.json();
        allPhotos.push(...fallbackData.photos);
      }
    }

    return allPhotos.slice(0, 8);
  }
}

export const pexelsService = new PexelsService();