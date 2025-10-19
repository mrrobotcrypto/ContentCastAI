import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { ContentGenerator } from "@/components/content-generator";
import { ImageSelector } from "@/components/image-selector";
import { ContentPreview } from "@/components/content-preview";
import { useWallet } from "@/hooks/use-wallet";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ExternalLink, Plus, Bell, Share2, Check } from "lucide-react";
import { SiX } from "react-icons/si";
import { Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ContentDraft } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";



interface PexelsPhoto {
  id: number;
  src: {
    medium: string;
    large: string;
  };
  alt: string;
  photographer: string;
}

interface UploadedImage {
  id: string;
  src: {
    medium: string;
    large: string;
  };
  alt: string;
  photographer: string;
  isUploaded: true;
  file: File;
}

type ImageType = PexelsPhoto | UploadedImage;

export default function Home() {
  const [generatedContent, setGeneratedContent] = useState("");
  const [contentSource, setContentSource] = useState<'ai' | 'manual' | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [currentTopic, setCurrentTopic] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAddingToFarcaster, setIsAddingToFarcaster] = useState(false);
  const [isSharingApp, setIsSharingApp] = useState(false);
  const { toast } = useToast();

  // Reset all form fields after successful cast
  const resetAllFields = () => {
    setGeneratedContent("");
    setContentSource(null);
    setSelectedImage(null);
    setCurrentTopic("");
  };
  const { user } = useWallet();
  const { theme, setTheme } = useTheme();
  const { t, language } = useLanguage();

  // Check if app is added to Farcaster and show prompt if not (only once per session)
  useEffect(() => {
    const checkFarcasterInstall = async () => {
      try {
        // Check if we've already shown the dialog in this session
        const hasShownDialog = sessionStorage.getItem('farcaster_add_dialog_shown');
        if (hasShownDialog) {
          return;
        }

        const { sdk } = await import('@farcaster/miniapp-sdk');
        await sdk.actions.ready();
        
        // Check if user has already added the app
        const context = await sdk.context;
        if (context?.client && !context.client.added) {
          // Show add to Farcaster dialog after a short delay
          setTimeout(() => {
            setShowAddDialog(true);
            sessionStorage.setItem('farcaster_add_dialog_shown', 'true');
          }, 2000);
        }
      } catch (error) {
        console.log('Not in Farcaster context');
      }
    };

    checkFarcasterInstall();
  }, []);

  const handleAddToFarcaster = async () => {
    setIsAddingToFarcaster(true);
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk');
      await sdk.actions.addMiniApp();
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to add to Farcaster:', error);
    } finally {
      setIsAddingToFarcaster(false);
    }
  };

  // Fetch user's recent drafts
  const { data: recentDrafts } = useQuery({
    queryKey: ["/api/drafts/user", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/drafts/user/${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch drafts");
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch quest data to check share_app status
  const { data: questData, isLoading: isQuestDataLoading } = useQuery({
    queryKey: ['/api/quests/user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/quests/user/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch quest data');
      return response.json();
    },
    enabled: !!user?.id,
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Share App mutation
  const shareAppMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/quests/complete', {
        userId: user?.id,
        questType: 'share_app'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/quests/user', user?.id], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          quests: {
            ...oldData.quests,
            share_app: {
              ...(oldData.quests?.share_app || {}),
              canComplete: false,
              isCompleted: true
            }
          }
        };
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quests/user', user?.id] });
      toast({
        title: t("quest.questCompleted") || "Quest Completed! 🎉",
        description: t("quest.earnedPoints").replace('{points}', '1'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("quest.questFailed") || "Failed",
        description: error.message || "Could not complete quest",
        variant: "destructive",
      });
    }
  });

  const handleShareApp = async () => {
    if (!user) {
      toast({
        title: t("quest.walletRequired") || "Wallet Required",
        description: t("quest.connectWalletDesc") || "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    const shareAppQuest = questData?.quests?.share_app;
    if (shareAppQuest && shareAppQuest.canComplete === false) {
      toast({
        title: t("quest.completed") || "Completed",
        description: language === 'tr' ? 'Bugün zaten paylaştınız' : 'You already shared today',
      });
      return;
    }

    setIsSharingApp(true);
    try {
      let shareText;
      if (language === 'tr') {
        shareText = `🚀 ContentCastAI ile kaliteli içerikler paylaşabilir ve günlük görevleri tamamlayarak ödüller kazanabilirsiniz!\n\n✨ AI destekli içerik üretimi\n🎯 Günlük görevler ve ödüller\n⚡ Kolay ve hızlı paylaşım`;
      } else {
        shareText = `🚀 Share quality content with ContentCastAI and earn rewards by completing daily quests!\n\n✨ AI-powered content generation\n🎯 Daily quests and rewards\n⚡ Easy and fast sharing`;
      }

      const { sdk } = await import('@farcaster/miniapp-sdk');
      await sdk.actions.ready();
      
      const context = await sdk.context;
      const clientFid = context?.client?.clientFid;
      
      const isBaseApp = clientFid === 9152;
      
      if (isBaseApp) {
        await sdk.actions.composeCast({ 
          text: shareText, 
          embeds: ['https://contentcastai.replit.app'] 
        });
      } else {
        await sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent('https://contentcastai.replit.app')}`);
      }
      
      await shareAppMutation.mutateAsync();
      
    } catch (error: any) {
      console.error('Share app failed:', error);
      toast({
        title: t("quest.questFailed") || "Failed",
        description: error.message || "Failed to share app",
        variant: "destructive",
      });
    } finally {
      setIsSharingApp(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Add to Farcaster Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="relative">
                <img 
                  src="/icon.png" 
                  alt="ContentCastAI" 
                  className="w-20 h-20 rounded-2xl"
                />
                <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1">
                  <Plus className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              Add ContentCastAI to Farcaster
            </DialogTitle>
            <DialogDescription className="text-center">
              Get quick access and enable notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Plus className="w-5 h-5 text-primary" />
              <span>Add to Farcaster</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Bell className="w-5 h-5 text-primary" />
              <span>Enable notifications</span>
            </div>
          </div>
          <DialogFooter className="flex-col space-y-2 sm:space-y-0">
            <Button
              onClick={handleAddToFarcaster}
              disabled={isAddingToFarcaster}
              className="w-full"
              data-testid="button-add-to-farcaster"
            >
              {isAddingToFarcaster ? "Adding..." : "Add"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowAddDialog(false)}
              className="w-full"
            >
              Not now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Main content with top padding to account for fixed header */}
      <main className="container mx-auto px-4 py-8 max-w-4xl pt-16">
        
        {/* Content Creation */}
        <div className="space-y-8">
          {/* Top Row - Creation Tools */}
          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            <div className="h-full">
              <ContentGenerator 
                onContentGenerated={(content, source) => {
                  setGeneratedContent(content);
                  setContentSource(source);
                }} 
                onTopicChange={setCurrentTopic}
              />
            </div>
            <div className="h-full">
              <ImageSelector 
                selectedImage={selectedImage} 
                onImageSelect={setSelectedImage}
                generatedContent={generatedContent}
                currentTopic={currentTopic}
              />
            </div>
          </div>

          {/* Bottom Row - Preview */}
          <div className="w-full">
            <ContentPreview
              content={generatedContent}
              selectedImage={selectedImage}
              contentSource={contentSource}
              onContentChange={setGeneratedContent}
              onResetFields={resetAllFields}
            />
          </div>
        </div>

        {/* Recent Activity */}
        {recentDrafts && recentDrafts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center justify-center">
              <Clock className="w-6 h-6 mr-2 text-accent" />
              {t('home.recentActivity')}
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(recentDrafts as ContentDraft[])
                .sort((a, b) => {
                  const dateA = new Date(a.createdAt || 0).getTime();
                  const dateB = new Date(b.createdAt || 0).getTime();
                  return dateB - dateA; // En yeni önce
                })
                .slice(0, 1)
                .map((draft: ContentDraft) => (
                <Card
                  key={draft.id}
                  className="content-card border border-border hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  data-testid={`draft-card-${draft.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">
                        {new Date(draft.createdAt || new Date()).toLocaleDateString()}
                      </span>
                      {draft.isPublished && (
                        <div className="flex items-center space-x-1 text-accent">
                          <ExternalLink className="w-3 h-3" />
                          <span className="text-xs">Published</span>
                        </div>
                      )}
                    </div>

                    {draft.selectedImage && typeof draft.selectedImage === 'object' && 'url' in draft.selectedImage && (
                      <img
                        src={(draft.selectedImage as any).url}
                        alt={(draft.selectedImage as any).alt || ''}
                        className="w-full max-h-32 object-contain rounded-lg mb-3"
                      />
                    )}

                    <div className="space-y-2">
                      <h3 className="font-medium text-foreground line-clamp-1">
                        {draft.topic}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {draft.generatedContent?.slice(0, 100) || "Draft saved"}
                        {draft.generatedContent && draft.generatedContent.length > 100 && "..."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground capitalize">
                        {draft.contentType} • {draft.tone}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-view-draft-${draft.id}`}
                      >
                        View →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-lg mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 wallet-gradient rounded"></div>
              <span className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} By MrRobotCrypto
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Support
              </a>
              <a 
                href="https://x.com/MrRobotKripto" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-foreground transition-colors ml-2" 
                data-testid="link-twitter"
                aria-label="Follow on X (Twitter)"
              >
                <SiX size={16} />
              </a>
              <a 
                href="https://farcaster.xyz/mrrobotcrypto.eth" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-foreground transition-colors ml-2" 
                data-testid="link-farcaster"
                aria-label="Follow on Farcaster"
              >
                <Users size={16} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
