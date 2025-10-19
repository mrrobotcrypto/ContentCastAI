import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Header } from "@/components/header";
import { useWallet } from "@/hooks/use-wallet";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
// Wagmi hooks removed - using SDK provider for BaseApp sponsored gas
import { useCastLimits } from "@/hooks/use-cast-limits";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { base } from "wagmi/chains";
import { SBT_CONTRACT_ADDRESS, SBT_CONTRACT_ABI, SBT_MINT_PRICE } from "@/lib/sbt-contract";
import { 
  Target, 
  Coins, 
  Calendar, 
  Trophy, 
  CheckCircle,
  Clock,
  Flame,
  Award,
  MessageSquare,
  Users,
  Zap,
  Star,
  Check
} from "lucide-react";
import { SiX } from "react-icons/si";

export default function Quest() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <QuestContent />
    </div>
  );
}

function QuestContent() {
  const [completingDaily, setCompletingDaily] = useState(false);
  const [completingGm, setCompletingGm] = useState(false);
  const [completingCast, setCompletingCast] = useState(false);
  const [sharingApp, setSharingApp] = useState(false);
  const [addingMiniApp, setAddingMiniApp] = useState(false);
  const [mintingSbt, setMintingSbt] = useState(false);
  const [showMiniAppInstructions, setShowMiniAppInstructions] = useState(false);
  const { user, isConnected } = useWallet();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const { writeContract, data: sbtHash } = useWriteContract();
  const { isLoading: isSbtConfirming, isSuccess: isSbtSuccess } = useWaitForTransactionReceipt({
    hash: sbtHash,
  });
  
  const miniAppIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const miniAppTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const clearMiniAppTimers = () => {
    if (miniAppIntervalRef.current) {
      clearInterval(miniAppIntervalRef.current);
      miniAppIntervalRef.current = null;
    }
    if (miniAppTimeoutRef.current) {
      clearTimeout(miniAppTimeoutRef.current);
      miniAppTimeoutRef.current = null;
    }
  };
  
  useEffect(() => {
    return () => {
      clearMiniAppTimers();
    };
  }, []);

  const { data: castLimits } = useCastLimits();

  const { data: questData, isLoading } = useQuery({
    queryKey: ['/api/quests/user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/quests/user/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch quest data');
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
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

  const completeQuestMutation = useMutation({
    mutationFn: async ({ questType }: { questType: string }) => {
      const response = await fetch('/api/quests/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, questType }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete quest');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/quests/user', user?.id] });
      
      const plural = data.pointsEarned > 1 ? 's' : '';
      const earnedPointsText = t('quest.earnedPoints')
        .replace('{points}', data.pointsEarned.toString())
        .replace('{plural}', plural);
      
      toast({
        title: t('quest.questCompleted'),
        description: earnedPointsText,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('quest.questFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const mintSbtMutation = useMutation({
    mutationFn: async ({ transactionHash }: { transactionHash: string }) => {
      const response = await fetch('/api/sbt/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, transactionHash }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mint SBT');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sbt/user', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/quests/user', user?.id] });
      
      const mintCount = data.badge?.mintCount || 1;
      
      toast({
        title: language === 'tr' ? '🎉 SBT Mint Başarılı!' : '🎉 SBT Minted Successfully!',
        description: language === 'tr' 
          ? `50 puan kazandınız! Toplam: ${mintCount} SBT`
          : `You earned 50 points! Total: ${mintCount} SBT`,
      });
      setMintingSbt(false);
    },
    onError: (error: Error) => {
      toast({
        title: language === 'tr' ? 'Mint Başarısız' : 'Mint Failed',
        description: error.message,
        variant: "destructive",
      });
      setMintingSbt(false);
    },
  });

  // Auto-complete SBT quest when transaction succeeds
  // Farcaster için: Transaction gönderildiğinde hemen backend'e istek at
  useEffect(() => {
    if (sbtHash && user?.id && mintingSbt) {
      console.log('🟣 Farcaster: Transaction hash received, calling backend...');
      mintSbtMutation.mutate({ transactionHash: sbtHash });
    }
  }, [sbtHash, user?.id, mintingSbt]);

  const userStats = {
    totalPoints: questData?.totalPoints || 0,
    currentStreak: questData?.currentStreak || 0,
    weeklyPoints: 0,
    dailyCastCount: castLimits?.count || 0,
    dailyCheckInCompleted: questData?.quests?.daily_checkin?.canComplete === false,
    dailyGmCompleted: questData?.quests?.daily_gm?.canComplete === false,
    shareAppCompleted: questData?.quests?.share_app?.canComplete === false,
    dailyCheckInTimeLeft: questData?.quests?.daily_checkin?.timeUntilNext || 0,
    dailyGmTimeLeft: questData?.quests?.daily_gm?.timeUntilNext || 0,
    shareAppTimeLeft: questData?.quests?.share_app?.timeUntilNext || 0,
  };

  const formatTimeLeft = (milliseconds: number) => {
    if (milliseconds <= 0) return "Available now";
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleDailyCheckIn = async () => {
    if (!user) {
      toast({
        title: t("quest.walletRequired") || "Wallet Required",
        description: t("quest.connectWalletDesc") || "Please connect your wallet to complete quests",
        variant: "destructive",
      });
      return;
    }

    setCompletingDaily(true);
    try {
      await completeQuestMutation.mutateAsync({ questType: 'daily_checkin' });
    } finally {
      setCompletingDaily(false);
    }
  };

  const handleDailyGm = async () => {
    console.log('🔥 handleDailyGm started');
    
    if (!user) {
      console.log('❌ No user found');
      toast({
        title: t("quest.walletRequired") || "Wallet Required",
        description: t("quest.connectWalletDesc") || "Please connect your wallet to complete quests",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ User found:', user.walletAddress);
    setCompletingGm(true);
    
    try {
      // SDK kullan - hem Farcaster hem BaseApp için
      const { sdk } = await import('@farcaster/miniapp-sdk');
      await sdk.actions.ready();
      
      console.log('🔌 Getting SDK wallet provider...');
      const provider = await sdk.wallet.ethProvider;
      
      if (!provider) {
        throw new Error('Wallet provider not available');
      }
      
      // Platform detection
      const isBaseApp = window.location.hostname.includes('base') ||
                        navigator.userAgent.toLowerCase().includes('baseapp');
      
      console.log('🔍 Platform detection:', { isBaseApp, hostname: window.location.hostname });
      
      // Chain kontrolü
      const chainId = await provider.request({ method: 'eth_chainId' });
      const baseChainId = '0x2105';
      
      if (chainId !== baseChainId) {
        console.log('🔗 Switching to Base network...');
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: baseChainId }],
        });
        console.log('✅ Switched to Base network');
      }
      
      if (isBaseApp) {
        // ⚠️ BASE: Contract call
        console.log('💸 BaseApp - Sending GM to contract...');
        
        const gmContractAddress = '0x4c72E2C08e27fe30cdB5c877Ab41Af464C75E5D1';
        const gmFunctionData = '0xd88c3186';
        
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: user.walletAddress as `0x${string}`,
            to: gmContractAddress as `0x${string}`,
            value: '0x0',
            data: gmFunctionData,
          }],
        });
        
        console.log('📤 BaseApp transaction submitted:', txHash);
        
        // Hemen backend'e istek at - confirmation bekleme
        console.log('✅ Transaction sent! Completing quest...');
        await completeQuestMutation.mutateAsync({ questType: 'daily_gm' });
        toast({
          title: t("quest.questCompleted") || "Quest Completed!",
          description: t("quest.gmSent") || "GM sent successfully!",
        });
        
      } else {
        // Farcaster: Basit transfer
        console.log('💸 Farcaster - Sending GM transaction...');
        
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: user.walletAddress as `0x${string}`,
            to: '0x35e822bd28c99796af7d4be671a033c77028e7c9' as `0x${string}`,
            value: '0x0',
          }],
        });

        console.log('📤 Farcaster transaction submitted:', txHash);
        
        // Hemen backend'e istek at - confirmation bekleme
        console.log('✅ Transaction sent! Completing quest...');
        await completeQuestMutation.mutateAsync({ questType: 'daily_gm' });
        
        console.log('🎉 Quest completed successfully!');
        toast({
          title: t("quest.questCompleted") || "Quest Completed!",
          description: t("quest.gmSent") || "GM sent successfully!",
        });
      }
      
      setCompletingGm(false);
      
    } catch (error: any) {
      console.error('❌ GM Quest failed:', error);
      setCompletingGm(false);
      
      let errorMessage = "Quest failed. Please try again.";
      
      if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
        errorMessage = "Transaction was cancelled. Please approve the transaction to complete the quest.";
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = "Insufficient ETH balance. You need a small amount of ETH for gas fees.";
      } else if (error.message?.includes('network') || error.message?.includes('connection')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      toast({
        title: "Quest Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDailyCast = async () => {
    setLocation("/");
  };

  const handleMintSbt = async () => {
    if (!user) {
      toast({
        title: language === 'tr' ? "Cüzdan Gerekli" : "Wallet Required",
        description: language === 'tr' ? "Lütfen cüzdanınızı bağlayın" : "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    setMintingSbt(true);
    
    try {
      // Platform detection - same as GM quest
      const { sdk } = await import('@farcaster/miniapp-sdk');
      await sdk.actions.ready();
      
      const context = await sdk.context;
      const clientFid = context?.client?.clientFid;
      const isBaseApp = clientFid === 9152;
      
      console.log(`🎖️ SBT Mint - Platform: ${isBaseApp ? 'BaseApp' : 'Farcaster'}`);
      
      if (isBaseApp) {
        // BaseApp: Use SDK provider for sponsored gas
        const provider = await sdk.wallet.ethProvider;
        if (!provider) {
          throw new Error('Provider not available');
        }
        
        console.log('🔷 BaseApp: Sending mint transaction...');
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: account,
            to: SBT_CONTRACT_ADDRESS,
            value: ('0x' + parseEther(SBT_MINT_PRICE).toString(16)) as `0x${string}`, // Convert to hex
            data: '0x1249c58b', // mint() function selector
            gas: '0x30d40', // 200000 in hex
          }],
        });
        
        console.log('✅ Transaction sent! Hash:', txHash);
        
        // Hemen backend'e istek at - confirmation bekleme
        await mintSbtMutation.mutateAsync({ transactionHash: txHash as string });
        
      } else {
        // Farcaster: Use wagmi writeContract
        console.log('🟣 Farcaster: Using wagmi...');
        writeContract({
          address: SBT_CONTRACT_ADDRESS,
          abi: SBT_CONTRACT_ABI,
          functionName: "mint",
          value: parseEther(SBT_MINT_PRICE),
          chain: base,
        });
        // Don't set mintingSbt to false here - let useEffect handle it after confirmation
      }
      
    } catch (error: any) {
      console.error('❌ SBT mint failed:', error);
      setMintingSbt(false);
      
      let errorMessage = language === 'tr' ? "Mint başarısız oldu" : "Mint failed";
      
      if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
        errorMessage = language === 'tr' 
          ? "İşlem iptal edildi. Lütfen işlemi onaylayın." 
          : "Transaction cancelled. Please approve the transaction.";
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = language === 'tr' 
          ? `Yetersiz ETH bakiyesi. ${SBT_MINT_PRICE} ETH gerekiyor.` 
          : `Insufficient ETH balance. ${SBT_MINT_PRICE} ETH required.`;
      }
      
      toast({
        title: language === 'tr' ? "Mint Başarısız" : "Mint Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleShareApp = async () => {
    if (!user) {
      toast({
        title: t("quest.walletRequired") || "Wallet Required",
        description: t("quest.connectWalletDesc") || "Please connect your wallet to complete quests",
        variant: "destructive",
      });
      return;
    }

    setSharingApp(true);
    try {
      let shareText;
      if (language === 'tr') {
        shareText = `🚀 ContentCastAI ile kaliteli içerikler paylaşabilir ve günlük görevleri tamamlayarak ödüller kazanabilirsiniz!\n\n✨ AI destekli içerik üretimi\n🎯 Günlük görevler ve ödüller\n⚡ Kolay ve hızlı paylaşım`;
      } else {
        shareText = `🚀 Share quality content with ContentCastAI and earn rewards by completing daily quests!\n\n✨ AI-powered content generation\n🎯 Daily quests and rewards\n⚡ Easy and fast sharing`;
      }

      const { sdk } = await import('@farcaster/miniapp-sdk');
      await sdk.actions.ready();
      
      // Use composeCast for both BaseApp and Warpcast - it works everywhere!
      console.log('🚀 Opening native compose cast...');
      await sdk.actions.composeCast({ 
        text: shareText, 
        embeds: ['https://contentcastai.replit.app'] 
      });
      
      await completeQuestMutation.mutateAsync({ questType: 'share_app' });
      
    } catch (error: any) {
      console.error('Share app failed:', error);
      toast({
        title: t("quest.questFailed") || "Quest Failed",
        description: error.message || "Failed to share app",
        variant: "destructive",
      });
    } finally {
      setSharingApp(false);
    }
  };

  const dailyQuests = [
    {
      id: "daily-checkin",
      title: t("quest.dailyCheckIn") || "Daily Check-in",
      description: t("quest.dailyCheckInDesc") || "Check in daily to earn bonus points and maintain your streak!",
      points: 1,
      icon: Calendar,
      iconBg: "bg-purple-500",
      completed: userStats.dailyCheckInCompleted,
      timeLeft: userStats.dailyCheckInTimeLeft,
      progress: userStats.dailyCheckInCompleted ? 1 : 0,
      maxProgress: 1,
      action: handleDailyCheckIn,
      loading: completingDaily,
      buttonText: t("quest.claim") || "Complete Task",
    },
    {
      id: "daily-gm",
      title: t("quest.sendGmDaily") || "Send GM Daily",
      description: t("quest.sendGmDailyDesc") || "Open GMonchain miniapp and send your GM to the another chain!",
      points: 1,
      icon: MessageSquare,
      iconBg: "bg-gradient-to-br from-blue-400 to-green-400",
      completed: userStats.dailyGmCompleted,
      timeLeft: userStats.dailyGmTimeLeft,
      progress: userStats.dailyGmCompleted ? 1 : 0,
      maxProgress: 1,
      action: handleDailyGm,
      loading: completingGm,
      buttonText: t("quest.completeTask") || "Complete Task",
    },
    {
      id: "daily-cast",
      title: t("quest.dailyCast") || "Daily Cast",
      description: t("quest.dailyCastDesc") || "Publish content to Farcaster and earn points",
      points: 1,
      icon: MessageSquare,
      iconBg: "bg-blue-500",
      completed: false,
      timeLeft: 0,
      progress: userStats.dailyCastCount,
      maxProgress: 10,
      action: handleDailyCast,
      loading: completingCast,
      buttonText: t("quest.castNow") || "Cast Now 📡",
    },
    {
      id: "share-app",
      title: t("quest.shareApp") || "Share ContentCastAI",
      description: t("quest.shareAppDesc") || "Earn 1 point daily by sharing the app",
      points: 1,
      icon: Zap,
      iconBg: "bg-purple-500",
      completed: userStats.shareAppCompleted,
      timeLeft: userStats.shareAppTimeLeft,
      progress: userStats.shareAppCompleted ? 1 : 0,
      maxProgress: 1,
      action: handleShareApp,
      loading: sharingApp,
      buttonText: t("quest.shareNow") || "Share Now 🚀",
    },
  ];

  const bonusQuests = [
    {
      id: "follow-farcaster",
      title: t("quest.followFarcaster") || "Follow on Farcaster",
      description: t("quest.followFarcasterDesc") || "Follow @mrrobotcrypto.eth on Farcaster",
      points: 1,
      icon: Users,
      iconBg: "bg-purple-500",
      completed: questData?.bonusQuests?.follow_farcaster?.isCompleted || false,
      progress: questData?.bonusQuests?.follow_farcaster?.isCompleted ? 1 : 0,
      maxProgress: 1,
      action: async () => {
        if (user?.id) {
          completeQuestMutation.mutate({ questType: 'follow_farcaster' });
        }
        try {
          const { sdk } = await import('@farcaster/miniapp-sdk');
          await sdk.actions.openUrl('https://warpcast.com/mrrobotcrypto.eth');
        } catch (error) {
          window.open('https://warpcast.com/mrrobotcrypto.eth', '_self');
        }
      },
      buttonText: t("quest.completeTask") || "Complete Task",
    },
    {
      id: "follow-x",
      title: t("quest.followX") || "Follow on X",
      description: t("quest.followXDesc") || "Follow @MrRobotKripto on X (Twitter)",
      points: 1,
      icon: SiX,
      iconBg: "bg-black dark:bg-white",
      iconColor: "text-white dark:text-black",
      completed: questData?.bonusQuests?.follow_x?.isCompleted || false,
      progress: questData?.bonusQuests?.follow_x?.isCompleted ? 1 : 0,
      maxProgress: 1,
      action: () => {
        if (user?.id) {
          completeQuestMutation.mutate({ questType: 'follow_x' });
        }
        const xDeepLink = 'twitter://user?screen_name=MrRobotKripto';
        const xWebLink = 'https://x.com/MrRobotKripto';
        
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = xDeepLink;
          setTimeout(() => {
            window.open(xWebLink, '_self');
          }, 500);
        } else {
          window.open(xWebLink, '_self');
        }
      },
      buttonText: t("quest.completeTask") || "Complete Task",
    },
    {
      id: "add-miniapp",
      title: t("quest.addMiniApp") || "Add Mini-App",
      description: t("quest.addMiniAppDesc") || "Add ContentCastAI to your Farcaster mini-apps",
      points: 1,
      icon: Zap,
      iconBg: "bg-purple-500",
      completed: questData?.bonusQuests?.add_miniapp?.isCompleted || false,
      progress: questData?.bonusQuests?.add_miniapp?.isCompleted ? 1 : 0,
      maxProgress: 1,
      action: async () => {
        setAddingMiniApp(true);
        try {
          const { sdk } = await import('@farcaster/miniapp-sdk');
          await sdk.actions.ready();
          
          const initialContext = await sdk.context;
          const wasAlreadyAdded = initialContext?.client?.added;
          
          if (wasAlreadyAdded && user?.id) {
            completeQuestMutation.mutate({ questType: 'add_miniapp' });
            setAddingMiniApp(false);
            return;
          }
          
          await sdk.actions.addMiniApp();
          setShowMiniAppInstructions(true);
          
          miniAppIntervalRef.current = setInterval(async () => {
            const updatedContext = await sdk.context;
            if (updatedContext?.client?.added) {
              clearMiniAppTimers();
              setShowMiniAppInstructions(false);
              setAddingMiniApp(false);
              
              if (user?.id) {
                completeQuestMutation.mutate({ questType: 'add_miniapp' });
              }
            }
          }, 1000);
          
          miniAppTimeoutRef.current = setTimeout(() => {
            clearMiniAppTimers();
            setShowMiniAppInstructions(false);
            setAddingMiniApp(false);
          }, 60000);
        } catch (error) {
          console.error('Failed to add mini-app:', error);
          clearMiniAppTimers();
          window.open('https://warpcast.com/~/mini-apps', '_self');
          setAddingMiniApp(false);
          setShowMiniAppInstructions(false);
        }
      },
      loading: addingMiniApp,
      buttonText: t("quest.addNow") || "Add Now",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center">
            <Target className="w-8 h-8 mr-2 text-primary" />
            {t("quest.title") || "Quest Center"}
          </h1>
          <p className="text-muted-foreground">
            {t("quest.subtitle") || "Complete quests to earn points and climb the leaderboard"}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{userStats.weeklyPoints}</div>
              <div className="text-xs text-muted-foreground">{t("quest.weeklyPoints") || "Bu Hafta"}</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{userStats.currentStreak}</div>
              <div className="text-xs text-muted-foreground">{t("quest.currentStreak") || "Günlük Seri"}</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <MessageSquare className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{questData?.dailyCastCount || 0}</div>
              <div className="text-xs text-muted-foreground">{t("quest.totalCast") || "Total Cast"}</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {dailyQuests.filter(q => q.completed).length + bonusQuests.filter(q => q.completed).length}
              </div>
              <div className="text-xs text-muted-foreground">{t("quest.completed") || "Tamamlandı"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Special Quests - SBT Mint */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center justify-center">
            <Trophy className="w-5 h-5 mr-2 text-amber-500" />
            {language === 'tr' ? "Özel Görevler" : "Special Quests"}
          </h2>
          <Card className="overflow-hidden border-2 border-amber-500/30" data-testid="quest-mint-sbt">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-4 rounded-xl flex-shrink-0">
                  <Award className="w-8 h-8 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-foreground">
                      {language === 'tr' ? "🎖️ Profile SBT Mint" : "🎖️ Mint Profile SBT"}
                    </h3>
                    <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap ml-2">
                      +50 {t("quest.points") || "pts"}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {language === 'tr' 
                      ? `${SBT_MINT_PRICE} ETH ödeyerek onchain Profile SBT mint et ve 50 puan kazan! Günlük tekrarlanabilir.`
                      : `Mint an onchain Profile SBT for ${SBT_MINT_PRICE} ETH and earn 50 points! Can be repeated daily.`}
                  </p>

                  {sbtBadge?.mintCount > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                      {language === 'tr' 
                        ? `✅ Toplam ${sbtBadge.mintCount} SBT sahibisin`
                        : `✅ You own ${sbtBadge.mintCount} SBT${sbtBadge.mintCount > 1 ? 's' : ''}`}
                    </p>
                  )}
                  
                  <Button
                    onClick={handleMintSbt}
                    disabled={mintingSbt || isSbtConfirming || !user}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    data-testid="button-mint-sbt"
                  >
                    {mintingSbt || isSbtConfirming 
                      ? (language === 'tr' ? "Mint ediliyor..." : "Minting...") 
                      : language === 'tr' 
                        ? `Mint Et (${SBT_MINT_PRICE} ETH) 🎖️` 
                        : `Mint SBT (${SBT_MINT_PRICE} ETH) 🎖️`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center justify-center">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            {t("quest.dailyQuests") || "Daily Quests"}
          </h2>
          <div className="space-y-4">
            {dailyQuests.map((quest) => {
              const Icon = quest.icon;
              return (
                <Card key={quest.id} className="overflow-hidden" data-testid={`quest-${quest.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`${quest.iconBg} p-4 rounded-xl flex-shrink-0`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-lg text-foreground">{quest.title}</h3>
                          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap ml-2">
                            +{quest.points} {t("quest.points") || "pts"}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4">{quest.description}</p>
                        
                        {quest.completed ? (
                          <>
                            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mb-3">
                              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                {t("quest.completed") || "Completed"}
                              </span>
                            </div>
                            {quest.timeLeft > 0 && (
                              <p className="text-xs text-muted-foreground text-center">
                                {t("quest.nextCheckIn") || "Next check-in available in"} {formatTimeLeft(quest.timeLeft)}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            {quest.maxProgress > 1 && (
                              <div className="mb-3">
                                <Progress value={(quest.progress / quest.maxProgress) * 100} className="h-2 mb-2" />
                                <p className="text-xs text-muted-foreground">
                                  {t("quest.progress") || "Progress"}: {quest.progress} / {quest.maxProgress}
                                </p>
                              </div>
                            )}
                            <Button
                              onClick={quest.action}
                              disabled={quest.loading || !user || quest.completed}
                              className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                              data-testid={`button-complete-${quest.id}`}
                            >
                              {quest.loading ? "..." : quest.buttonText}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center justify-center">
            <Star className="w-5 h-5 mr-2 text-amber-500" />
            {t("quest.oneTimeQuests") || "One-Time Quests"}
          </h2>
          <div className="space-y-4">
            {bonusQuests.map((quest) => {
              const Icon = quest.icon;
              return (
                <Card key={quest.id} className="overflow-hidden" data-testid={`quest-${quest.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`${quest.iconBg} p-4 rounded-xl flex-shrink-0`}>
                        <Icon className={`w-8 h-8 ${quest.iconColor || "text-white"}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-lg text-foreground">{quest.title}</h3>
                          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap ml-2">
                            +{quest.points} {t("quest.points") || "pts"}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4">{quest.description}</p>
                        
                        {quest.completed ? (
                          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              {t("quest.completed") || "Completed"}
                            </span>
                          </div>
                        ) : (
                          <>
                            {quest.maxProgress > 1 && (
                              <div className="mb-3">
                                <Progress value={(quest.progress / quest.maxProgress) * 100} className="h-2 mb-2" />
                                <p className="text-xs text-muted-foreground">
                                  {t("quest.progress") || "Progress"}: {quest.progress} / {quest.maxProgress}
                                </p>
                              </div>
                            )}
                            <Button
                              onClick={quest.action}
                              disabled={quest.loading || !user || quest.completed}
                              className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                              data-testid={`button-${quest.id}`}
                            >
                              {quest.buttonText}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <AlertDialog open={showMiniAppInstructions} onOpenChange={setShowMiniAppInstructions}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'tr' ? '📲 Mini App Kaydetme' : '📲 Save Mini App'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-base">
                {language === 'tr' 
                  ? 'BaseApp\'te mini app\'i kaydetmek için lütfen şu adımları takip edin:' 
                  : 'To save the mini app in BaseApp, please follow these steps:'}
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>{language === 'tr' ? 'Sağ üstteki menü ikonuna (•••) tıklayın' : 'Tap the menu icon (•••) at the top right'}</li>
                <li>{language === 'tr' ? '"Saved" (Kaydedildi) butonuna basın' : 'Tap the "Saved" button'}</li>
                <li>{language === 'tr' ? 'Kayıt tamamlandığında görev otomatik olarak tamamlanacak' : 'The quest will complete automatically when saved'}</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-4">
                {language === 'tr' 
                  ? '💡 İpucu: Warpcast\'te bu işlem otomatiktir, BaseApp\'te manuel kaydetme gereklidir.' 
                  : '💡 Tip: This is automatic on Warpcast, but requires manual save on BaseApp.'}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
