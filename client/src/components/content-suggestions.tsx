import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";
import { 
  Quote,
  Coins,
  Users,
  TrendingUp,
  Newspaper,
  Zap,
  Image,
  Gamepad2,
  Sun,
  Moon,
  Trophy,
  Sparkles
} from "lucide-react";

interface ContentSuggestionsProps {
  onSuggestionClick: (topic: string) => void;
}

export function ContentSuggestions({ onSuggestionClick }: ContentSuggestionsProps) {
  const { t, language } = useLanguage();

  // Function to get random topic from multiple options
  const getRandomTopic = (topics: { en: string[], tr: string[] }) => {
    const currentLanguage = language as keyof typeof topics;
    const topicList = topics[currentLanguage];
    const randomIndex = Math.floor(Math.random() * topicList.length);
    return topicList[randomIndex];
  };

  const suggestions = [
    {
      key: 'dailyQuote',
      icon: Quote,
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      topics: {
        en: [
          "Share an inspiring daily quote about innovation, perseverance, or success",
          "Post a motivational quote about embracing challenges and growth",
          "Share wisdom about the importance of consistency and daily habits",
          "Discuss a powerful quote about leadership and making impact",
          "Share an inspiring thought about creativity and thinking differently",
          "Post a quote about resilience and bouncing back from failures",
          "Share wisdom about the value of continuous learning and adaptation",
          "Discuss a meaningful quote about building strong relationships",
          "Share an uplifting message about finding purpose and passion",
          "Post a quote about courage and taking calculated risks"
        ],
        tr: [
          "İnovasyon, azim veya başarı hakkında ilham verici bir günlük söz paylaş",
          "Zorlukları kucaklamak ve büyümek hakkında motive edici bir alıntı paylaş",
          "Tutarlılık ve günlük alışkanlıkların önemi hakkında bilgelik paylaş",
          "Liderlik ve etki yaratmak hakkında güçlü bir alıntı tartış",
          "Yaratıcılık ve farklı düşünmek hakkında ilham verici bir düşünce paylaş",
          "Dayanıklılık ve başarısızlıklardan geri dönmek hakkında alıntı paylaş",
          "Sürekli öğrenme ve uyum sağlamanın değeri hakkında bilgelik paylaş",
          "Güçlü ilişkiler kurma hakkında anlamlı bir alıntı tartış",
          "Amaç ve tutku bulma hakkında cesaret verici bir mesaj paylaş",
          "Cesaret ve hesaplanmış riskler alma hakkında alıntı paylaş"
        ]
      }
    },
    {
      key: 'baseToken',
      icon: Coins,
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      topics: {
        en: [
          "Discuss the latest developments and innovations in Base blockchain ecosystem",
          "Explore how Base is revolutionizing Layer 2 scaling solutions",
          "Analyze the growing DeFi ecosystem built on Base network",
          "Share insights about Base's integration with Coinbase and its advantages",
          "Discuss the most promising Base-native tokens and their use cases",
          "Explore Base's role in bringing traditional users to web3",
          "Analyze Base's low transaction fees and developer-friendly features",
          "Discuss the future roadmap and upcoming upgrades for Base",
          "Share thoughts on Base's impact on Ethereum scalability",
          "Explore gaming and NFT projects thriving on Base blockchain"
        ],
        tr: [
          "Base blockchain ekosistemindeki son gelişmeler ve yenilikler hakkında konuş",
          "Base'in Layer 2 ölçeklendirme çözümlerini nasıl devrimleştirdiğini keşfet",
          "Base ağı üzerine kurulu büyüyen DeFi ekosistemini analiz et",
          "Base'in Coinbase entegrasyonu ve avantajları hakkında görüşler paylaş",
          "En umut verici Base-native tokenlar ve kullanım alanları hakkında konuş",
          "Base'in geleneksel kullanıcıları web3'e getirmedeki rolünü keşfet",
          "Base'in düşük işlem ücretleri ve geliştirici dostu özelliklerini analiz et",
          "Base'in gelecek yol haritası ve yaklaşan güncellemeleri hakkında konuş",
          "Base'in Ethereum ölçeklenebilirliğine etkisi hakkında düşünceler paylaş",
          "Base blockchain üzerinde gelişen oyun ve NFT projelerini keşfet"
        ]
      }
    },
    {
      key: 'farcasterInfo',
      icon: Users,
      color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      topics: {
        en: [
          "Explain what Farcaster is and why it's the future of decentralized social networks",
          "Discuss how Farcaster differs from traditional social media platforms",
          "Explore the benefits of owning your social graph on Farcaster",
          "Share insights about Farcaster's innovative frames and mini-apps",
          "Discuss the role of Warpcast and other Farcaster clients",
          "Explain how Farcaster enables censorship-resistant communication",
          "Explore Farcaster's integration with crypto wallets and web3 tools",
          "Discuss the growing developer ecosystem building on Farcaster",
          "Share thoughts on Farcaster's approach to user verification and identity",
          "Analyze how Farcaster is changing social media monetization"
        ],
        tr: [
          "Farcaster'ın ne olduğunu ve neden merkezi olmayan sosyal ağların geleceği olduğunu açıkla",
          "Farcaster'ın geleneksel sosyal medya platformlarından nasıl farklı olduğunu tartış",
          "Farcaster'da sosyal grafiğinize sahip olmanın faydalarını keşfet",
          "Farcaster'ın yenilikçi çerçeveleri ve mini uygulamaları hakkında görüşler paylaş",
          "Warpcast ve diğer Farcaster istemcilerinin rolünü tartış",
          "Farcaster'ın sansüre dirençli iletişimi nasıl sağladığını açıkla",
          "Farcaster'ın kripto cüzdanları ve web3 araçlarıyla entegrasyonunu keşfet",
          "Farcaster üzerine inşa eden büyüyen geliştirici ekosistemine konuş",
          "Farcaster'ın kullanıcı doğrulama ve kimlik yaklaşımı hakkında düşünceler paylaş",
          "Farcaster'ın sosyal medya para kazanma yöntemlerini nasıl değiştirdiğini analiz et"
        ]
      }
    },
    {
      key: 'defiTrends',
      icon: TrendingUp,
      color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
      topics: {
        en: [
          "Analyze current DeFi trends and their impact on traditional finance",
          "Discuss the rise of liquid staking and its implications for Ethereum",
          "Explore Real World Asset (RWA) tokenization in DeFi protocols",
          "Share insights about the latest yield farming strategies and risks",
          "Analyze the growth of decentralized derivatives and perpetual trading",
          "Discuss cross-chain DeFi bridges and their security considerations",
          "Explore the emergence of DeFi insurance protocols and risk management",
          "Share thoughts on regulatory challenges facing DeFi innovation",
          "Analyze the evolution of automated market makers and DEX efficiency",
          "Discuss the integration of AI and machine learning in DeFi protocols"
        ],
        tr: [
          "Mevcut DeFi trendlerini ve bunların geleneksel finans üzerindeki etkisini analiz et",
          "Likit staking'in yükselişini ve Ethereum üzerindeki etkilerini tartış",
          "DeFi protokollerinde Gerçek Dünya Varlığı (RWA) tokenleştirmesini keşfet",
          "En son verim çiftçiliği stratejileri ve riskleri hakkında görüşler paylaş",
          "Merkezi olmayan türevler ve sürekli ticaretin büyümesini analiz et",
          "Zincirler arası DeFi köprüleri ve güvenlik değerlendirmelerini tartış",
          "DeFi sigorta protokollerinin ortaya çıkışı ve risk yönetimini keşfet",
          "DeFi inovasyonunun karşılaştığı düzenleyici zorluklarla ilgili düşünceler paylaş",
          "Otomatik piyasa yapıcılarının evrimi ve DEX verimliliğini analiz et",
          "DeFi protokollerinde AI ve makine öğrenmesi entegrasyonunu tartış"
        ]
      }
    },
    {
      key: 'cryptoNews',
      icon: Newspaper,
      color: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      topics: {
        en: [
          "Share breaking news and insights from the cryptocurrency world",
          "Discuss the latest Bitcoin ETF developments and institutional adoption",
          "Analyze recent crypto regulatory updates and their market impact",
          "Share insights about major cryptocurrency exchange developments",
          "Discuss the latest altcoin trends and emerging blockchain projects",
          "Explore recent partnerships between crypto companies and traditional finance",
          "Share analysis of cryptocurrency market movements and technical indicators",
          "Discuss the latest developments in central bank digital currencies (CBDCs)",
          "Analyze recent crypto security incidents and their lessons learned",
          "Share thoughts on the latest crypto adoption news from major corporations"
        ],
        tr: [
          "Kripto para dünyasından son dakika haberleri ve içgörüleri paylaş",
          "En son Bitcoin ETF gelişmeleri ve kurumsal benimsenmeyi tartış",
          "Son kripto düzenleme güncellemeleri ve piyasa etkilerini analiz et",
          "Büyük kripto para borsası gelişmeleri hakkında görüşler paylaş",
          "En son altcoin trendleri ve yeni blockchain projelerini tartış",
          "Kripto şirketleri ve geleneksel finans arasındaki son ortaklıkları keşfet",
          "Kripto para piyasası hareketleri ve teknik göstergelerin analizini paylaş",
          "Merkez bankası dijital para birimleri (CBDC) son gelişmelerini tartış",
          "Son kripto güvenlik olayları ve çıkarılan dersleri analiz et",
          "Büyük şirketlerin kripto benimseme haberlerle ilgili düşünceler paylaş"
        ]
      }
    },
    {
      key: 'aiTech',
      icon: Zap,
      color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      topics: {
        en: [
          "Discuss the latest AI technology breakthroughs and their real-world applications",
          "Explore how AI is revolutionizing content creation and digital art",
          "Share insights about AI integration in blockchain and cryptocurrency",
          "Analyze the impact of large language models on various industries",
          "Discuss the ethical considerations and challenges of AI development",
          "Explore AI-powered automation tools and their productivity benefits",
          "Share thoughts on the future of AI agents and autonomous systems",
          "Discuss AI's role in enhancing cybersecurity and fraud detection",
          "Analyze the intersection of AI, IoT, and smart city technologies",
          "Explore how AI is transforming healthcare diagnosis and treatment"
        ],
        tr: [
          "En son AI teknoloji atılımlarını ve gerçek dünya uygulamalarını tartış",
          "AI'nin içerik üretimi ve dijital sanatı nasıl devrimleştirdiğini keşfet",
          "Blockchain ve kripto para biriminde AI entegrasyonu hakkında görüşler paylaş",
          "Büyük dil modellerinin çeşitli endüstriler üzerindeki etkisini analiz et",
          "AI geliştirmenin etik değerlendirmeleri ve zorluklarını tartış",
          "AI destekli otomasyon araçları ve verimlilik faydalarını keşfet",
          "AI ajanlarının ve otonom sistemlerin geleceği hakkında düşünceler paylaş",
          "AI'nin siber güvenlik ve dolandırıcılık tespitini geliştirmedeki rolünü tartış",
          "AI, IoT ve akıllı şehir teknolojilerinin kesişimini analiz et",
          "AI'nin sağlık teşhisi ve tedavisini nasıl dönüştürdüğünü keşfet"
        ]
      }
    },
    {
      key: 'nftTrends',
      icon: Image,
      color: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
      topics: {
        en: [
          "Discuss latest NFT marketplace trends, digital art collections, and creator opportunities",
          "Explore the evolution of utility NFTs and their real-world use cases",
          "Share insights about NFT gaming integrations and play-to-earn mechanics",
          "Analyze the rise of AI-generated NFTs and their artistic value",
          "Discuss NFT royalties, creator rights, and sustainable monetization",
          "Explore the integration of NFTs with social media and profile pictures",
          "Share thoughts on NFT ticketing and event access applications",
          "Discuss the role of NFTs in virtual worlds and metaverse experiences",
          "Analyze the environmental impact and sustainable NFT solutions",
          "Explore NFT fractionalization and democratizing expensive digital assets"
        ],
        tr: [
          "Son NFT pazar trendleri, dijital sanat koleksiyonları ve yaratıcı fırsatları tartış",
          "Utility NFT'lerin evrimi ve gerçek dünya kullanım alanlarını keşfet",
          "NFT oyun entegrasyonları ve play-to-earn mekanikleri hakkında görüşler paylaş",
          "AI üretimi NFT'lerin yükselişi ve sanatsal değerlerini analiz et",
          "NFT telif hakları, yaratıcı hakları ve sürdürülebilir para kazanmayı tartış",
          "NFT'lerin sosyal medya ve profil resimleriyle entegrasyonunu keşfet",
          "NFT biletleme ve etkinlik erişim uygulamaları hakkında düşünceler paylaş",
          "Sanal dünyalar ve metaverse deneyimlerinde NFT'lerin rolünü tartış",
          "Çevresel etki ve sürdürülebilir NFT çözümlerini analiz et",
          "NFT fraksiyonlaştırma ve pahalı dijital varlıkları demokratikleştirmeyi keşfet"
        ]
      }
    },
    {
      key: 'web3Gaming',
      icon: Gamepad2,
      color: 'bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
      topics: {
        en: [
          "Explore play-to-earn gaming, blockchain gaming innovations, and gaming token economics",
          "Discuss the integration of NFTs in gaming and true digital asset ownership",
          "Share insights about the latest Web3 gaming guilds and scholarship programs",
          "Analyze the evolution of GameFi and decentralized autonomous gaming organizations",
          "Explore virtual land ownership and real estate in blockchain-based games",
          "Discuss the role of gaming tokens in creating sustainable in-game economies",
          "Share thoughts on cross-game asset interoperability and shared universes",
          "Analyze the challenges and opportunities in Web3 game development",
          "Explore the emergence of competitive esports in blockchain gaming",
          "Discuss the integration of VR/AR technologies with Web3 gaming experiences"
        ],
        tr: [
          "Play-to-earn oyunları, blockchain oyun yeniliklerini ve oyun token ekonomilerini keşfet",
          "Oyunlarda NFT entegrasyonu ve gerçek dijital varlık sahipliğini tartış",
          "En son Web3 oyun loncaları ve burs programları hakkında görüşler paylaş",
          "GameFi'nin evrimi ve merkezi olmayan otonom oyun organizasyonlarını analiz et",
          "Blockchain tabanlı oyunlarda sanal arazi sahipliği ve gayrimenkul keşfet",
          "Oyun tokenlarının sürdürülebilir oyun içi ekonomiler yaratmadaki rolünü tartış",
          "Oyunlar arası varlık birlikte çalışabilirliği ve paylaşılan evrenler hakkında düşünceler paylaş",
          "Web3 oyun geliştirmedeki zorluklar ve fırsatları analiz et",
          "Blockchain oyunlarında rekabetçi esporun ortaya çıkışını keşfet",
          "VR/AR teknolojilerinin Web3 oyun deneyimleriyle entegrasyonunu tartış"
        ]
      }
    },
    {
      key: 'goodMorning',
      icon: Sun,
      color: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
      topics: {
        en: [
          "Good morning everyone! What are you excited about today?",
          "GM! Share your favorite morning routine for staying productive",
          "Good morning! What's your main goal for today?",
          "GM fam! How do you plan to make today amazing?",
          "Good morning! What positive vibes are you bringing to today?",
          "GM! What's the first thing you do every morning to start your day right?",
          "Good morning everyone! What's your morning motivation?",
          "GM! Share your morning inspiration - what makes you smile today?",
          "Good morning! What are you working on today that excites you?",
          "GM friends! What's one thing you're grateful for this morning?"
        ],
        tr: [
          "Günaydın herkese! Bugün nelere heyecanlısınız?",
          "Günaydın! Verimli kalmak için favori sabah rutininiz nedir?",
          "Günaydın! Bugünkü ana hedefiniz nedir?",
          "Günaydın ailesi! Bugünü nasıl harika yapacaksınız?",
          "Günaydın! Bugüne hangi pozitif enerjileri getiriyorsunuz?",
          "Günaydın! Her sabah güne başlamak için ilk yaptığınız şey nedir?",
          "Günaydın herkese! Sabah motivasyonunuz nedir?",
          "Günaydın! Sabah ilhamınızı paylaşın - bugün sizi ne mutlu ediyor?",
          "Günaydın! Bugün üzerinde çalıştığınız ve sizi heyecanlandıran şey nedir?",
          "Günaydın dostlar! Bu sabah minnettar olduğunuz bir şey nedir?"
        ]
      }
    },
    {
      key: 'goodNight',
      icon: Moon,
      color: 'bg-slate-100 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400',
      topics: {
        en: [
          "Good night everyone! What was your biggest win today?",
          "GN! Share your thoughts on what made today special",
          "Good night! What accomplishment are you most proud of today?",
          "GN! Reflecting on today - what are you grateful for?",
          "Good night friends! What's your plan for a great tomorrow?",
          "GN! Before bed thoughts: What lesson did today teach you?",
          "Good night everyone! What moment made your day today?",
          "GN fam! Share your evening reflection on today's experiences",
          "Good night! What's one thing you learned today?",
          "GN! What goal are you most excited to achieve tomorrow?"
        ],
        tr: [
          "İyi geceler herkese! Bugünkü en büyük kazanımınız neydi?",
          "İyi geceler! Bugünü özel yapan şey hakkında düşüncelerinizi paylaşın",
          "İyi geceler! Bugün en çok gurur duyduğunuz başarı nedir?",
          "İyi geceler! Bugünü düşünürken - minnettar olduğunuz şey nedir?",
          "İyi geceler dostlar! Harika bir yarın için planınız nedir?",
          "İyi geceler! Yatmadan önce düşünceler: Bugün size ne öğretti?",
          "İyi geceler herkese! Gününüzü güzelleştiren an neydi?",
          "İyi geceler ailesi! Bugünkü deneyimleriniz hakkında akşam düşüncelerinizi paylaşın",
          "İyi geceler! Bugün öğrendiğiniz bir şey nedir?",
          "İyi geceler! Yarın başarmak için en çok heyecanlandığınız hedef nedir?"
        ]
      }
    },
    {
      key: 'football',
      icon: Trophy,
      color: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
      topics: {
        en: [
          "Discuss the latest football transfer news and upcoming matches",
          "Share your thoughts on today's biggest football match and key moments",
          "Analyze the performance of top players in recent games",
          "Discuss Champions League or Europa League latest developments",
          "Share predictions for upcoming derby matches and rivalries",
          "Talk about rising young talents in world football",
          "Analyze tactical changes and coaching strategies in modern football",
          "Discuss national team performances and international tournaments",
          "Share your favorite football moments and legendary plays",
          "Talk about the impact of VAR and technology in football"
        ],
        tr: [
          "En son futbol transfer haberleri ve yaklaşan maçlar hakkında konuş",
          "Bugünün en büyük futbol maçı ve önemli anları hakkında düşüncelerini paylaş",
          "Son maçlarda en iyi oyuncuların performansını analiz et",
          "Şampiyonlar Ligi veya Avrupa Ligi son gelişmelerini tartış",
          "Yaklaşan derbi maçları ve rekabetler için tahminlerini paylaş",
          "Dünya futbolunda yükselen genç yetenekler hakkında konuş",
          "Modern futbolda taktik değişiklikler ve teknik direktör stratejilerini analiz et",
          "Milli takım performansları ve uluslararası turnuvaları tartış",
          "Favori futbol anlarını ve efsanevi oyunları paylaş",
          "VAR ve teknolojinin futboldaki etkisi hakkında konuş"
        ]
      }
    },
    {
      key: 'trendingTopics',
      icon: Sparkles,
      color: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
      topics: {
        en: [
          "What's trending in tech today? Share the latest viral news",
          "Discuss today's hottest topic in crypto and blockchain space",
          "What's everyone talking about in social media today?",
          "Share insights on the trending tech breakthrough of the week",
          "What's the most exciting trending news in AI right now?",
          "Discuss the viral moment everyone's sharing today",
          "What's trending in startup and innovation world?",
          "Share thoughts on today's most discussed tech announcement",
          "What's the trending debate in the crypto community today?",
          "Discuss the viral trend that's capturing attention this week"
        ],
        tr: [
          "Bugün teknolojide ne trend? En son viral haberleri paylaş",
          "Bugün kripto ve blockchain alanındaki en sıcak konuyu tartış",
          "Bugün sosyal medyada herkesin konuştuğu şey nedir?",
          "Haftanın trend teknoloji atılımı hakkında içgörü paylaş",
          "Şu anda AI alanındaki en heyecan verici trend haber nedir?",
          "Bugün herkesin paylaştığı viral anı tartış",
          "Startup ve inovasyon dünyasında ne trend?",
          "Bugünün en çok tartışılan teknoloji duyurusu hakkında düşüncelerini paylaş",
          "Bugün kripto topluluğundaki trend tartışma nedir?",
          "Bu hafta dikkatleri çeken viral trendi tartış"
        ]
      }
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-center">
          <Zap className="w-5 h-5 mr-2 text-primary" />
          {t('content.suggestions.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion.key}
              variant="outline"
              onClick={() => onSuggestionClick(getRandomTopic(suggestion.topics))}
              className="h-auto p-2 flex items-center justify-start space-x-2 hover:bg-accent/50 border-2 hover:border-primary/20 transition-all duration-200 whitespace-normal text-left"
              data-testid={`suggestion-${suggestion.key}`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${suggestion.color}`}>
                <suggestion.icon className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-medium leading-tight text-left flex-1 break-words">
                {t(`content.suggestions.${suggestion.key}`)}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}