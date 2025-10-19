import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/header";
import { useWallet } from "@/hooks/use-wallet";
import { useLanguage } from "@/components/language-provider";
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown,
  Star,
  TrendingUp,
  Users,
  Calendar,
  Share2
} from "lucide-react";

interface LeaderboardUser {
  id: string;
  walletAddress: string;
  username?: string;
  points: number;
  rank: number;
  streak: number;
  weeklyPoints: number;
  monthlyPoints: number;
  yearlyPoints: number;
  hasSbt?: boolean;
}

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <LeaderboardContent />
    </div>
  );
}

function LeaderboardContent() {
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "quarterly" | "yearly">("weekly");
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useWallet();
  const { t, language } = useLanguage();
  const [isSharing, setIsSharing] = useState(false);
  const ITEMS_PER_PAGE = 25;

  // Fetch leaderboard data from API
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['/api/leaderboard'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const mockLeaderboardData: LeaderboardUser[] = leaderboardData || [];
  
  // Pagination calculations
  const totalPages = Math.ceil(mockLeaderboardData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = mockLeaderboardData.slice(startIndex, endIndex);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</div>;
    }
  };

  const getPointsByTimeframe = (user: LeaderboardUser) => {
    switch (timeframe) {
      case "weekly":
        return user.weeklyPoints;
      case "monthly": 
        return user.monthlyPoints;
      case "quarterly":
        return Math.round(user.monthlyPoints * 3); // Mock quarterly
      case "yearly":
        return user.yearlyPoints;
      default:
        return user.points;
    }
  };

  const timeframeOptions = [
    { value: "weekly", label: t("leaderboard.weekly") || "7 Days", icon: Calendar },
    { value: "monthly", label: t("leaderboard.monthly") || "1 Month", icon: TrendingUp },
    { value: "quarterly", label: t("leaderboard.quarterly") || "3 Months", icon: Star },
    { value: "yearly", label: t("leaderboard.yearly") || "1 Year", icon: Trophy },
  ];

  // Kullanıcının pozisyonunu bul
  const userPosition = mockLeaderboardData.find(u => u.walletAddress === user?.walletAddress);
  const currentUserRank = userPosition?.rank || mockLeaderboardData.length + 1;

  // Share function
  const handleShare = async () => {
    if (!user || !userPosition) return;

    setIsSharing(true);
    try {
      const currentPoints = getPointsByTimeframe(userPosition);
      const timeframeName = timeframeOptions.find(t => t.value === timeframe)?.label || "Weekly";
      
      let shareText;
      if (language === 'tr') {
        shareText = `🏆 ContentCastAI Liderlik Tablosunda #${currentUserRank} sıradayım!\n\n📊 ${timeframeName}: ${currentPoints} puan\n🔥 Günlük seri: ${userPosition.streak} gün\n\n🚀 Sen de katıl ve AI destekli içerik üret!`;
      } else {
        shareText = `🏆 I'm ranked #${currentUserRank} on the ContentCastAI Leaderboard!\n\n📊 ${timeframeName}: ${currentPoints} points\n🔥 Daily streak: ${userPosition.streak} days\n\n🚀 Join and create AI-powered content!`;
      }

      const { sdk } = await import('@farcaster/miniapp-sdk');
      await sdk.actions.ready();
      
      // Use composeCast for both BaseApp and Warpcast - it works everywhere!
      console.log('🚀 Opening native compose cast for position sharing...');
      await sdk.actions.composeCast({ 
        text: shareText, 
        embeds: ['https://contentcastai.replit.app'] 
      });
      
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center">
            <Trophy className="w-8 h-8 mr-2 text-primary" />
            {t("leaderboard.title") || "Leaderboard"}
          </h1>
          <p className="text-muted-foreground">
            {t("leaderboard.subtitle") || "Compete with other users and climb to the top"}
          </p>
        </div>

        {/* Time Frame Selector */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {timeframeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={timeframe === option.value ? "default" : "outline"}
                    onClick={() => setTimeframe(option.value as any)}
                    className="flex items-center justify-center space-x-2 h-auto py-3"
                    data-testid={`timeframe-${option.value}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{option.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* User's Position (if connected) */}
        {user && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center">
                <Users className="w-5 h-5 mr-2" />
                {t("leaderboard.yourPosition") || "Your Position"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                {getRankIcon(currentUserRank)}
                <div>
                  <div className="text-2xl font-bold text-foreground">#{currentUserRank}</div>
                  <div className="text-sm text-muted-foreground">
                    {getPointsByTimeframe(userPosition || {} as LeaderboardUser)} {t("leaderboard.points") || "points"}
                  </div>
                </div>
              </div>
              {userPosition && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleShare}
                    disabled={isSharing}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                    data-testid="button-share-position"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{isSharing ? (t("leaderboard.sharing") || "Sharing...") : (t("leaderboard.share") || "Share Position")}</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Top 3 Podium */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">
              {t("leaderboard.topPlayers") || "Top Players"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-muted-foreground">Loading leaderboard...</div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-center">
                {mockLeaderboardData.slice(0, 3).map((user, index) => (
                <div key={user.id} className="space-y-2">
                  <div className="flex justify-center">
                    {getRankIcon(user.rank)}
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    index === 0 ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" :
                    index === 1 ? "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800" :
                    "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                  }`}>
                    <div className="font-medium text-foreground text-sm truncate">
                      {user.username || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`}
                    </div>
                    {user.hasSbt && (
                      <div className="text-[10px] mt-1 text-purple-600 dark:text-purple-400 font-semibold">
                        {language === 'tr' ? '🎖️ SBT' : '🎖️ SBT'}
                      </div>
                    )}
                    <div className="text-lg font-bold text-foreground">
                      {getPointsByTimeframe(user)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("leaderboard.points") || "points"}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Trophy className="w-5 h-5 mr-2" />
              {t("leaderboard.fullRankings") || "Full Rankings"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {paginatedData.map((userItem, index) => (
                <div
                  key={userItem.id}
                  className={`flex items-center justify-between p-4 border-b border-border last:border-b-0 transition-colors hover:bg-accent/50 ${
                    userItem.walletAddress === user?.walletAddress ? "bg-primary/10" : ""
                  }`}
                  data-testid={`leaderboard-user-${index}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(userItem.rank)}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {userItem.username || `${userItem.walletAddress.slice(0, 6)}...${userItem.walletAddress.slice(-4)}`}
                        {userItem.walletAddress === user?.walletAddress && (
                          <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            {t("leaderboard.you") || "You"}
                          </span>
                        )}
                        {userItem.hasSbt && (
                          <span className="ml-2 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded font-semibold">
                            {language === 'tr' ? '🎖️ SBT Sahibi' : '🎖️ SBT Owner'}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("leaderboard.streak") || "Streak"}: {userItem.streak} {t("leaderboard.days") || "days"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      {getPointsByTimeframe(userItem)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("leaderboard.points") || "points"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  ← {t("leaderboard.previous") || "Previous"}
                </Button>
                
                <div className="flex items-center gap-2">
                  {(() => {
                    const pages: (number | string)[] = [];
                    
                    // Format: 1 2 ... [current] ... n-1 n
                    if (totalPages <= 6) {
                      // Show all pages if 6 or less
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Always show first 2 pages
                      pages.push(1, 2);
                      
                      // Determine if we need dots after first 2 pages
                      const shouldShowStartDots = currentPage > 4;
                      
                      if (shouldShowStartDots) {
                        pages.push('dots-start');
                        // Show currentPage - 1, currentPage, currentPage + 1 (with bounds check)
                        if (currentPage - 1 >= 1) pages.push(currentPage - 1);
                        pages.push(currentPage);
                        if (currentPage + 1 <= totalPages) pages.push(currentPage + 1);
                      } else {
                        // currentPage is 1, 2, 3, or 4 - show 3 (if not already shown)
                        if (!pages.includes(3) && totalPages >= 3) pages.push(3);
                        // Show 4 if currentPage is 4 or near it
                        if (currentPage >= 3 && !pages.includes(4) && totalPages >= 4) pages.push(4);
                        if (currentPage === 4 && !pages.includes(5) && totalPages >= 5) pages.push(5);
                      }
                      
                      // Determine if we need dots before last 2 pages
                      const shouldShowEndDots = currentPage < totalPages - 3;
                      
                      if (shouldShowEndDots) {
                        pages.push('dots-end');
                      }
                      
                      // Always show last 2 pages (in order, check for duplicates)
                      if (!pages.includes(totalPages - 1)) pages.push(totalPages - 1);
                      if (!pages.includes(totalPages)) pages.push(totalPages);
                    }
                    
                    return pages.map((page, index) => {
                      if (typeof page === 'string') {
                        // Render dots
                        return (
                          <span key={page} className="px-2 text-muted-foreground">
                            ...
                          </span>
                        );
                      }
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-10 h-10"
                          data-testid={`button-page-${page}`}
                        >
                          {page}
                        </Button>
                      );
                    });
                  })()}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                >
                  {t("leaderboard.next") || "Next"} →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {!user && (
          <Card className="mt-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t("leaderboard.connectWallet") || "Connect Your Wallet"}
              </h3>
              <p className="text-muted-foreground">
                {t("leaderboard.connectWalletDesc") || "Connect your wallet to see your position on the leaderboard!"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}