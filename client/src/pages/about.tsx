import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/hooks/use-toast";
import { 
  ExternalLink, 
  Sparkles, 
  Users, 
  Zap,
  Twitter,
  MessageSquare,
  Heart,
  Code,
  Copy
} from "lucide-react";

export default function About() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t("about.copied") || "Copied to clipboard!",
        description: `${label} ${t("about.copiedDesc") || "copied successfully"}`,
        variant: "default",
      });
    } catch (err) {
      toast({
        title: t("about.copyFailed") || "Copy failed",
        description: t("about.copyFailedDesc") || "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: t("about.feature1.title") || "AI-Powered Content",
      description: t("about.feature1.desc") || "Generate engaging social media content with advanced AI technology"
    },
    {
      icon: Users,
      title: t("about.feature2.title") || "Farcaster Integration", 
      description: t("about.feature2.desc") || "Seamlessly publish your content to the decentralized social network"
    },
    {
      icon: Zap,
      title: t("about.feature3.title") || "Quest System",
      description: t("about.feature3.desc") || "Earn points, maintain streaks, and climb the leaderboard"
    }
  ];

  const socialLinks = [
    {
      platform: "Twitter/X",
      username: "@MrRobotKripto",
      url: "https://x.com/MrRobotKripto",
      icon: Twitter
    },
    {
      platform: "Farcaster",
      username: "@mrrobotcrypto.eth",
      url: "https://farcaster.xyz/mrrobotcrypto.eth",
      icon: MessageSquare
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="mb-6">
            <img 
              src="/logo.png" 
              alt="ContentCastAI Logo" 
              className="w-10 h-10 mx-auto rounded-lg shadow-md"
            />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center">
            <Heart className="w-6 h-6 mr-2 text-primary" />
            {t("about.title") || "About ContentCastAI"}
          </h1>
          <p className="text-muted-foreground">
            {t("about.subtitle") || "AI-powered content creation for the decentralized social web"}
          </p>
        </div>

        {/* App Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              {t("about.what.title") || "What is ContentCastAI?"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {t("about.what.desc1") || "ContentCastAI is an innovative platform that combines the power of artificial intelligence with the decentralized social network Farcaster. Our mission is to help creators, marketers, and everyday users generate engaging, high-quality content effortlessly."}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t("about.what.desc2") || "With features like AI-powered content generation, curated stock photography integration, gamification through quests and leaderboards, and multi-language support, ContentCastAI makes content creation accessible and fun for everyone."}
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("about.features.title") || "Key Features"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="text-center space-y-3">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Developer Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="w-5 h-5 mr-2" />
              {t("about.developer.title") || "Developer"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t("about.developer.desc") || "ContentCastAI was developed with passion for Web3, decentralized social networks, and AI technology. Built to empower creators in the new era of social media."}
            </p>
            
            {/* Social Links */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">{t("about.connect") || "Connect with the Developer:"}</h4>
              <div className="flex flex-col sm:flex-row gap-3">
                {socialLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Button
                      key={link.platform}
                      variant="outline"
                      asChild
                      className="justify-start"
                      data-testid={`social-link-${link.platform.toLowerCase()}`}
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {link.username}
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("about.tech.title") || "Technology Stack"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <div className="font-medium text-foreground">Frontend</div>
                <div className="text-sm text-muted-foreground">React + TypeScript</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-foreground">Backend</div>
                <div className="text-sm text-muted-foreground">Node.js + Express</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-foreground">AI</div>
                <div className="text-sm text-muted-foreground">Gemini Flash</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-foreground">Database</div>
                <div className="text-sm text-muted-foreground">PostgreSQL</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donate Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              {t("about.donate.title") || "Support the Project"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t("about.donate.desc") || "Help us continue developing ContentCastAI by sending donations to:"}
            </p>
            <div className="bg-muted/50 p-4 rounded-lg border-2 border-dashed border-primary/20">
              <div className="flex items-center justify-center space-x-2">
                <Heart className="w-4 h-4 text-red-500" />
                <code className="font-mono text-sm font-medium bg-primary/10 px-2 py-1 rounded">
                  {t("about.donate.address") || "mrrobotcrypto.eth"}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(
                    t("about.donate.address") || "mrrobotcrypto.eth", 
                    "ENS Address"
                  )}
                  className="h-6 w-6 p-0"
                  data-testid="copy-ens-address"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Heart className="w-4 h-4 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Version Info */}
        <Card>
          <CardContent className="py-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>{t("about.version") || "Version"} 1.0.0</p>
              <p className="mt-1">
                {t("about.builtWith") || "Built with"} ❤️ {t("about.forWeb3") || "for the Web3 community"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  );
}