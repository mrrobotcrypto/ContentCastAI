import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { useWallet } from "@/hooks/use-wallet";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/hooks/use-toast";
import { 
  Coins, 
  Gift, 
  TrendingUp,
  Trophy,
  CheckCircle
} from "lucide-react";

export default function Rewards() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <RewardsContent />
    </div>
  );
}

function RewardsContent() {
  const [claiming, setClaiming] = useState(false);
  const { user } = useWallet();
  const { t } = useLanguage();
  const { toast } = useToast();

  // Fetch user quest data for total points
  const { data: questData, isLoading } = useQuery({
    queryKey: ['/api/quests/user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/quests/user/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch quest data');
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refresh every minute
  });

  const totalPoints = questData?.totalPoints || 0;
  const minimumClaimablePoints = 250;
  const degenPerPoint = 0.1;
  const claimableDegen = Math.floor(totalPoints * degenPerPoint);
  const canClaim = totalPoints >= minimumClaimablePoints;

  // DEGEN claim mutation
  const claimDegenMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/rewards/claim-degen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, points: totalPoints }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to claim DEGEN');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/quests/user', user?.id] });
      toast({
        title: "DEGEN Claimed! 🎉",
        description: `Successfully claimed ${data.degenAmount} DEGEN tokens!`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Claim Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClaimDegen = async () => {
    if (!user) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to claim rewards",
        variant: "destructive",
      });
      return;
    }

    if (!canClaim) {
      toast({
        title: "Insufficient Points",
        description: `You need at least ${minimumClaimablePoints} points to claim DEGEN`,
        variant: "destructive",
      });
      return;
    }

    setClaiming(true);
    try {
      await claimDegenMutation.mutateAsync();
    } catch (error) {
      console.error('DEGEN claim failed:', error);
    } finally {
      setClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center">
            <Gift className="w-8 h-8 mr-2 text-primary" />
            {t("rewards.title") || "My Rewards"}
          </h1>
          <p className="text-muted-foreground">
            {t("rewards.subtitle") || "Claim your earned DEGEN tokens based on your quest points"}
          </p>
        </div>

        {!user ? (
          /* Wallet Connection Required */
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-4">
                <Coins className="w-16 h-16 text-yellow-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t("rewards.connectWallet") || "Connect Your Wallet"}</h3>
              <p className="text-muted-foreground mb-4">
                {t("rewards.connectWalletDesc") || "Connect your wallet to view and claim your DEGEN rewards!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">{totalPoints}</div>
                  <div className="text-sm text-muted-foreground">{t("rewards.totalPoints") || "Total Points"}</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <Coins className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">{claimableDegen}</div>
                  <div className="text-sm text-muted-foreground">{t("rewards.claimableDegen") || "Claimable DEGEN"}</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">{degenPerPoint}</div>
                  <div className="text-sm text-muted-foreground">{t("rewards.degenPerPoint") || "DEGEN per Point"}</div>
                </CardContent>
              </Card>
            </div>

            {/* DEGEN Claim Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Coins className="w-6 h-6 mr-2 text-yellow-500" />
                  {t("rewards.degenClaim") || "DEGEN Token Claim"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">{t("rewards.howItWorks") || "How it works:"}</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• {t("rewards.rule1") || "1 Quest Point = 0.1 DEGEN Token"}</li>
                      <li>• {t("rewards.rule2") || "Minimum 250 points required to claim"}</li>
                      <li>• {t("rewards.rule3") || "Claim all your accumulated DEGEN at once"}</li>
                      <li>• {t("rewards.rule4") || "Points are reset after claiming"}</li>
                    </ul>
                  </div>

                  {canClaim ? (
                    <div className="text-center">
                      <p className="text-lg mb-4">
                        {t("rewards.readyToClaim") || `You can claim ${claimableDegen} DEGEN tokens!`}
                      </p>
                      <Button
                        onClick={handleClaimDegen}
                        disabled={claiming || claimDegenMutation.isPending}
                        size="lg"
                        className="bg-green-500 hover:bg-green-600 text-white"
                        data-testid="button-claim-degen"
                      >
                        {claiming || claimDegenMutation.isPending ? "Claiming..." : `Claim ${claimableDegen} DEGEN 🎉`}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-4">
                        <CheckCircle className="w-12 h-12 text-orange-500" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t("rewards.completeQuests") || "Complete daily quests to earn more points!"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progress Bar */}
            <Card>
              <CardHeader>
                <CardTitle>{t("rewards.progress") || "Progress to Next Claim"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-muted rounded-full h-4 mb-2">
                  <div 
                    className="bg-primary h-4 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (totalPoints / minimumClaimablePoints) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{totalPoints} points</span>
                  <span>{minimumClaimablePoints} points needed</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}