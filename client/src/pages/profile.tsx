import { useWallet } from "@/hooks/use-wallet";
import { useLanguage } from "@/components/language-provider";
import { Header } from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { User, Twitter, MessageCircle, Construction, Award, ExternalLink } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import { SBT_CONTRACT_ADDRESS } from "@/lib/sbt-contract";

export default function Profile() {
  const { address } = useWallet();
  const { t, language } = useLanguage();

  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ['/api/users', address],
    queryFn: async () => {
      const response = await fetch(`/api/users/${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    enabled: !!address,
  });

  const { data: sbtBadge } = useQuery({
    queryKey: ['/api/sbt/user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/sbt/user/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch SBT badge');
      return response.json();
    },
    enabled: !!user?.id,
  });

  if (!address) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20 pb-24 px-4">
          <div className="max-w-2xl mx-auto text-center py-12">
            <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2" data-testid="text-connect-wallet">
              {t('profile.connectWallet')}
            </h2>
            <p className="text-muted-foreground" data-testid="text-connect-description">
              {t('profile.connectWalletDesc')}
            </p>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20 pb-24 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-muted rounded-lg"></div>
              <div className="h-20 bg-muted rounded-lg"></div>
              <div className="h-40 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-16 pb-24">
        {/* Gradient Header Background */}
        <div className="relative bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 h-48"></div>
        
        {/* Profile Content */}
        <div className="max-w-2xl mx-auto px-4 -mt-32">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-800 shadow-xl">
              <AvatarImage 
                src={user?.farcasterAvatar || undefined} 
                alt={user?.farcasterDisplayName || user?.baseUsername || 'User'} 
              />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                {user?.farcasterDisplayName?.[0]?.toUpperCase() || 
                 user?.farcasterUsername?.[0]?.toUpperCase() || 
                 user?.baseUsername?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Base Username - Bold and Large */}
          <div className="text-center mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words px-4" data-testid="text-base-username">
              {user?.baseUsername || user?.farcasterDisplayName || user?.farcasterUsername || 'User'}
            </h1>
          </div>

          {/* ENS Username - Gray and Smaller */}
          <div className="text-center mb-6">
            <p className="text-base text-muted-foreground" data-testid="text-ens-username">
              {user?.ensUsername ? `@${user.ensUsername}` : user?.farcasterUsername ? `@${user.farcasterUsername}` : ''}
            </p>
          </div>

          {/* Stats - Followers, Following, Neynar Score */}
          <div className="flex justify-center gap-6 sm:gap-12 mb-8 py-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-followers-count">
                {user?.followerCount || 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground" data-testid="text-followers-label">
                {t('profile.followers')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-following-count">
                {user?.followingCount || 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground" data-testid="text-following-label">
                {t('profile.following')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-500" data-testid="text-neynar-score">
                {user?.neynarScore ? (user.neynarScore / 100).toFixed(2) : '0.00'}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground" data-testid="text-neynar-label">
                Neynar Score
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-6 mb-8">
            {user?.farcasterUsername && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-12 w-12 hover:bg-purple-500/10 hover:text-purple-500 text-purple-500"
                onClick={() => window.open(`https://warpcast.com/${user.farcasterUsername}`, '_blank')}
                data-testid="button-farcaster-link"
              >
                <MessageCircle className="w-7 h-7" />
              </Button>
            )}
            {user?.xUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-12 w-12 hover:bg-blue-500/10 hover:text-blue-400 text-blue-400"
                onClick={() => window.open(user.xUrl!, '_blank')}
                data-testid="button-x-link"
              >
                <Twitter className="w-7 h-7" />
              </Button>
            )}
          </div>

          {/* About Section */}
          <div className="bg-card/50 backdrop-blur border border-border/40 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-3 text-foreground" data-testid="text-about-label">
              {t('profile.about')}
            </h3>
            <p className="text-muted-foreground leading-relaxed break-words overflow-wrap-anywhere" data-testid="text-bio">
              {user?.farcasterBio || 'No bio available'}
            </p>
          </div>

          {/* SBT Badge Gallery */}
          {sbtBadge?.mintCount > 0 && (
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur border-2 border-amber-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-amber-500" />
                  <h3 className="text-lg font-semibold text-foreground" data-testid="text-sbt-badge-label">
                    {language === 'tr' ? '🏆 Profile SBT Koleksiyonu' : '🏆 Profile SBT Collection'}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                  onClick={() => window.open(`https://basescan.org/token/${SBT_CONTRACT_ADDRESS}?a=${address}`, '_blank')}
                  data-testid="button-view-on-basescan"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  BaseScan
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* SBT Badge Card */}
                <Card className="bg-gradient-to-br from-amber-500 to-orange-500 border-0">
                  <CardContent className="p-4 text-center">
                    <Award className="w-12 h-12 mx-auto mb-2 text-white" />
                    <p className="text-sm font-medium text-white mb-1">
                      {language === 'tr' ? 'ContentCastAI SBT' : 'ContentCastAI SBT'}
                    </p>
                    <p className="text-xs text-white/80">
                      #{sbtBadge.mintCount} {language === 'tr' ? 'Adet' : 'Owned'}
                    </p>
                  </CardContent>
                </Card>

                {/* Stats Cards */}
                <Card className="bg-card border-amber-500/30">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {sbtBadge.mintCount}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === 'tr' ? 'Toplam Mint' : 'Total Mints'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-amber-500/30">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {parseFloat(sbtBadge.totalPaid || '0').toFixed(4)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === 'tr' ? 'Toplam ETH' : 'Total ETH'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <p className="text-xs text-center text-amber-600 dark:text-amber-400 mt-4">
                {language === 'tr' 
                  ? '🎖️ Onchain SBT token sahibisin! BaseScan\'da görüntüle.' 
                  : '🎖️ You own onchain SBT tokens! View on BaseScan.'}
              </p>
            </div>
          )}

          {/* User Analytics Section - Work in Progress */}
          <div className="bg-card/50 backdrop-blur border border-border/40 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Construction className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-foreground" data-testid="text-analytics-label">
                {t('profile.userAnalytics') || 'Kullanıcı Analizi'}
              </h3>
            </div>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-analytics-wip">
              {t('profile.analyticsWip') || 'Çalışmalar devam ediyor... Bu hafta yeni eklemeler yapılacak.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
