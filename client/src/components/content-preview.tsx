import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { useCastLimits } from "@/hooks/use-cast-limits";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Eye, Send, Edit, User, Loader2, MessageCircle, Repeat, Heart, Share, ExternalLink, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { CountdownTimer } from "./countdown-timer";

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

interface ContentPreviewProps {
  content: string;
  selectedImage: ImageType | null;
  contentSource: 'ai' | 'manual' | null;
  onContentChange: (content: string) => void;
  onResetFields?: () => void;
}

export function ContentPreview({ content, selectedImage, contentSource, onContentChange, onResetFields }: ContentPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [showFidModal, setShowFidModal] = useState(false);
  const [farcasterFid, setFarcasterFid] = useState("");
  const [pendingPublishData, setPendingPublishData] = useState<{ content: string; imageUrl?: string } | null>(null);
  const [castPreparation, setCastPreparation] = useState<{ farcasterUrl: string; castContent: string } | null>(null);
  const { user, displayName, updateUser } = useWallet();
  const { toast } = useToast();
  const { t } = useLanguage();
  const castLimits = useCastLimits();

  // Native Farcaster compose function using Mini Apps SDK
  const openNativeFarcasterCompose = async (content: string, imageUrl?: string) => {
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk');
      const embeds: [] | [string] | [string, string] = imageUrl ? [imageUrl] : [];
      const result = await sdk.actions.composeCast({ text: content, embeds });
      console.log('Farcaster compose result:', result);

      toast({
        title: t('content.castOpened'),
        description: t('content.nativeFarcasterOpened'),
      });

      if (onResetFields) {
        setTimeout(() => onResetFields(), 1000);
      }
      return true;
    } catch (error) {
      console.warn('Native Farcaster compose not available, falling back to URL:', error);
      return false;
    }
  };

  // BaseApp compose function - same as Farcaster but with BaseApp specific handling
  const openBaseAppCompose = async (content: string, imageUrl?: string) => {
    try {
      // BaseApp uses the same Farcaster SDK for composeCast
      const { sdk } = await import('@farcaster/miniapp-sdk');
      const embeds: [] | [string] | [string, string] = imageUrl ? [imageUrl] : [];
      
      console.log('🔄 Attempting BaseApp compose cast...');
      const result = await sdk.actions.composeCast({ 
        text: content, 
        embeds,
        // BaseApp specific options could be added here
      });
      
      console.log('✅ BaseApp compose result:', result);

      toast({
        title: t('content.castOpened'),
        description: "BaseApp cast composer opened successfully!",
      });

      if (onResetFields) {
        setTimeout(() => onResetFields(), 1000);
      }
      return true;
    } catch (error) {
      console.warn('❌ BaseApp compose not available:', error);
      // If BaseApp-specific compose fails, try standard Farcaster compose
      return await openNativeFarcasterCompose(content, imageUrl);
    }
  };

  const publishMutation = useMutation({
    mutationFn: async (data: { content: string; imageUrl?: string }) => {
      const preparedContent = data.content.trim();

      // First, create a draft and call the cast API to increment count and award points
      if (user) {
        try {
          // Create draft
          const draftResponse = await apiRequest("POST", "/api/drafts", {
            userId: user.id,
            topic: contentSource === 'ai' ? "AI Generated content" : "Manual content",
            contentType: contentSource === 'ai' ? "ai" : "manual",
            tone: "casual",
            generatedContent: preparedContent,
            selectedImage: data.imageUrl,
            isPublished: false
          });
          const draft = await draftResponse.json();

          // Call cast API to increment count and award points
          await apiRequest("POST", "/api/farcaster/cast", {
            draftId: draft.id,
            imageUrl: data.imageUrl
          });
          
          console.log("Cast count incremented and points awarded");
        } catch (error) {
          console.warn("Failed to save draft or increment cast count:", error);
          // Continue with opening compose window even if backend call fails
        }
      }

      // Detect if we're running in BaseApp environment
      const isBaseApp = window.location.hostname.includes('base.dev') || 
                        window.location.hostname.includes('base.org') ||
                        window.parent !== window ||  // iframe detection
                        (window.navigator.userAgent && window.navigator.userAgent.includes('BaseApp'));

      console.log('🔍 Environment detection:', {
        hostname: window.location.hostname,
        inIframe: window.parent !== window,
        userAgent: window.navigator.userAgent,
        isBaseApp
      });

      let nativeSuccess = false;
      
      // Try BaseApp compose first if we're in BaseApp environment
      if (isBaseApp) {
        console.log('🎯 BaseApp environment detected, trying BaseApp compose...');
        nativeSuccess = await openBaseAppCompose(preparedContent, data.imageUrl);
      } else {
        console.log('📱 Standard Farcaster environment, trying Farcaster compose...');
        nativeSuccess = await openNativeFarcasterCompose(preparedContent, data.imageUrl);
      }

      // Fallback to web URL if native compose fails
      if (!nativeSuccess) {
        console.log('⏭️ Native compose failed, falling back to web URL...');
        let farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(preparedContent)}`;
        if (data.imageUrl) {
          farcasterUrl += `&embeds[]=${encodeURIComponent(data.imageUrl)}`;
        }
        return { castContent: preparedContent, farcasterUrl, success: true, useNative: false };
      }
      return { castContent: preparedContent, success: true, useNative: true };
    },
    onSuccess: (data) => {
      if (!data.useNative && (data as any).farcasterUrl) {
        window.open((data as any).farcasterUrl, '_blank');
        toast({
          title: t('content.castPrepared'),
          description: t('content.shareManually'),
        });
      }
      
      // Invalidate quest and cast limits queries to refresh the UI immediately
      if (user) {
        import('@/lib/queryClient').then(({ queryClient }) => {
          queryClient.invalidateQueries({ queryKey: ['/api/quests/user', user.id] });
          queryClient.invalidateQueries({ queryKey: ['/api/cast-limits', user.id] });
        });
      }
      
      if (onResetFields) {
        setTimeout(() => onResetFields(), 1000);
      }
    },
    onError: (error: any) => {
      if (error.message && error.message.includes("Farcaster FID not set")) {
        setShowFidModal(true);
        setPendingPublishData({
          content: content.trim(),
          imageUrl: (selectedImage as any)?.src?.large,
        });
      } else {
        toast({
          title: t('content.publishingFailed'),
          description: error.message || t('content.failedToPublish'),
          variant: "destructive",
        });
      }
    },
  });

  const handleSaveEdit = () => {
    onContentChange(editedContent);
    setIsEditing(false);
    toast({ title: t('content.contentUpdated'), description: t('content.changesSaved') });
  };

  const handleCancelEdit = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handlePublish = () => {
    if (!content.trim()) {
      toast({
        title: t('content.noContentToPrepare'),
        description: t('content.generateContentFirst'),
        variant: "destructive",
      });
      return;
    }

    // Check daily cast limit
    if (user && castLimits.data && !castLimits.data.canCast) {
      toast({
        title: t('content.dailyLimitReached'),
        description: t('content.dailyLimitDescription')
          .replace('{maxDailyCasts}', castLimits.data.maxDailyCasts.toString())
          .replace('{count}', castLimits.data.count.toString()),
        variant: "destructive",
      });
      return;
    }

    // ⚠️ Cüzdan bağlı değilse bile YAYINI ENGELLEME — sadece bilgi ver
    if (contentSource === 'ai' && !user) {
      toast({
        title: t('wallet.aiContentRequiresWallet') || "Cüzdan bağlı değil",
        description: t('wallet.connectWalletToCastAI') || "İçerik panoya kopyalanacak; Warpcast'te paylaşabilirsin.",
      });
      // NOT: return YOK — akış devam ediyor
    }

    publishMutation.mutate({
      content: content.trim(),
      imageUrl: (selectedImage as any)?.src?.large,
    });
  };

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  // Reset fields when language is changed
  useEffect(() => {
    const handleLanguageChange = () => {
      if (onResetFields) {
        onResetFields();
      }
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, [onResetFields]);

  return (
    <Card className="content-card border border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center justify-center flex-1">
            <Eye className="w-5 h-5 mr-2 text-accent" />
            {t('content.preview')}
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            data-testid="button-edit-content"
          >
            <Edit className="w-4 h-4 mr-1" />
            {isEditing ? t('content.cancel') : t('content.edit')}
          </Button>
        </div>

        {/* Cast Preview */}
        <div className="border border-border rounded-xl p-4 bg-muted/50 mb-6">
          <div className="flex items-start space-x-3 mb-3">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-foreground" data-testid="preview-username">
                  {displayName || t('preview.yourUsername')}
                </span>
                <span className="text-sm text-muted-foreground">{t('preview.now')}</span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-3 mb-4">
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[120px] resize-none"
                  placeholder={t('content.editPlaceholder') || 'Edit your content here...'}
                  data-testid="textarea-edit-content"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} data-testid="button-save-edit">
                    {t('content.saveChanges')}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleCancelEdit} data-testid="button-cancel-edit">
                    {t('content.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-foreground leading-relaxed whitespace-pre-wrap" data-testid="preview-content">
                  {content || (
                    <span className="text-muted-foreground italic">
                      {t('content.generatedContentPlaceholder') || 'Generated content will appear here...'}
                    </span>
                  )}
                </div>
                {content && (
                  <p className="text-muted-foreground text-sm flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    Generated by ContentCastAI
                  </p>
                )}
              </>
            )}
          </div>

          {/* Selected Image */}
          {selectedImage && (
            <div className="mb-4">
              <img
                src={(selectedImage as any).src.medium}
                alt={(selectedImage as any).alt}
                className="w-full max-h-64 object-contain rounded-lg"
                data-testid="preview-image"
              />
            </div>
          )}

          {/* Engagement Preview */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center space-x-6">
              <button className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">Reply</span>
              </button>
              <button className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                <Repeat className="w-4 h-4" />
                <span className="text-sm">Recast</span>
              </button>
              <button className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                <Heart className="w-4 h-4" />
                <span className="text-sm">Like</span>
              </button>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Share className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Daily Cast Limit Info */}
        {user && castLimits.data && (
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4" data-testid="cast-limit-info">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{t('content.dailyCastStatus')}</span>
              </div>
              <div className="text-sm">
                <span className={`font-medium ${castLimits.data.canCast ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {castLimits.data.count}/{castLimits.data.maxDailyCasts}
                </span>
                <span className="text-muted-foreground ml-1">
                  ({castLimits.data.remaining} {t('content.remaining')})
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  castLimits.data.canCast 
                    ? 'bg-green-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${(castLimits.data.count / castLimits.data.maxDailyCasts) * 100}%` }}
              ></div>
            </div>
            
            {!castLimits.data.canCast && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs">{t('content.dailyLimitReached')}</span>
                </div>
                {castLimits.data.resetIn && castLimits.data.resetIn > 0 && (
                  <CountdownTimer 
                    seconds={castLimits.data.resetIn} 
                    className="mt-1"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={handlePublish}
            disabled={publishMutation.isPending || !content.trim() || (user && castLimits.data && !castLimits.data.canCast) || false}
            className="w-full farcaster-purple text-white font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
            data-testid="button-publish-to-farcaster"
          >
            {publishMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('content.preparing')}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>{t('content.prepare')}</span>
              </>
            )}
          </Button>

          {/* Cast Preparation Result */}
          {castPreparation && (
            <div
              className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3"
              data-testid="cast-preparation-result"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Cast hazırlandı! Manuel olarak Farcaster'da paylaşın
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-2">Hazırlanan içerik:</p>
                <p className="text-sm text-foreground">{castPreparation.castContent}</p>
              </div>

              <Button
                onClick={() => window.open(castPreparation.farcasterUrl, '_blank')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                data-testid="button-open-farcaster"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Farcaster'da Aç ve Paylaş
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCastPreparation(null)}
                className="w-full text-muted-foreground"
                data-testid="button-close-preparation"
              >
                Kapat
              </Button>
            </div>
          )}

          {import.meta.env.VITE_DEMO_MODE === 'true' && (
            <div
              className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
              data-testid="status-demo-mode"
            >
              <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                ⚡ Demo Mode: Casts are simulated - Not sent to real Farcaster
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
