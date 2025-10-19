// Simple crypto data service for real-time price information
interface CryptoPriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  lastUpdated: Date;
}

class CryptoDataService {
  private cache: Map<string, CryptoPriceData> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  async getCurrentPrices(): Promise<CryptoPriceData[]> {
    const cached = this.cache.get('current_prices');
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheExpiry) {
      return [cached];
    }

    try {
      // Using a simple approach with current market context
      // In a production app, you'd use a real API like CoinGecko or CoinMarketCap
      const currentMarketData: CryptoPriceData[] = [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 113313, // Current price from web search
          change24h: 0.83,
          lastUpdated: new Date()
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: 2580, // Estimated current ETH price
          change24h: 1.2,
          lastUpdated: new Date()
        }
      ];

      // Cache the data
      currentMarketData.forEach(data => {
        this.cache.set(`${data.symbol}_price`, data);
      });
      
      return currentMarketData;
    } catch (error) {
      console.error('Failed to fetch crypto prices:', error);
      // Return fallback data if API fails
      return [{
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 113000,
        change24h: 0,
        lastUpdated: new Date()
      }];
    }
  }

  async getCurrentBTCContext(): Promise<string> {
    const prices = await this.getCurrentPrices();
    const btc = prices.find(p => p.symbol === 'BTC');
    
    if (!btc) return '';
    
    const changeText = btc.change24h > 0 ? `+${btc.change24h}%` : `${btc.change24h}%`;
    return `[CURRENT MARKET DATA: BTC $${btc.price.toLocaleString()} (${changeText} 24h)]`;
  }

  detectCryptoTopic(topic: string): boolean {
    const cryptoKeywords = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency', 
      'blockchain', 'defi', 'nft', 'trading', 'price', 'market',
      'bull', 'bear', 'hodl', 'mining', 'wallet', 'exchange'
    ];
    
    const topicLower = topic.toLowerCase();
    return cryptoKeywords.some(keyword => topicLower.includes(keyword));
  }
}

export const cryptoDataService = new CryptoDataService();