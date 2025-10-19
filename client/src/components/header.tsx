import { useState, useEffect } from "react";
import { CornerWalletWidget } from "@/components/corner-wallet-widget";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { useLanguage } from "@/components/language-provider";
import { Link, useLocation } from "wouter";
import { Home, Trophy, Target, Gift } from "lucide-react";

export function Header() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when at top of page
      if (currentScrollY < 10) {
        setIsVisible(true);
      }
      // Hide header when scrolling down, show when scrolling up
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    {
      key: "home",
      path: "/",
      icon: Home,
      label: t("navigation.home") || "Home",
    },
    {
      key: "quest",
      path: "/quest",
      icon: Target,
      label: t("navigation.quest") || "Quest",
    },
    {
      key: "leaderboard",
      path: "/leaderboard",
      icon: Trophy,
      label: t("navigation.leaderboard") || "Leaderboard",
    },
    {
      key: "rewards",
      path: "/rewards",
      icon: Gift,
      label: t("navigation.rewards") || "Rewards",
    },
  ];

  return (
    <>
      {/* Corner Wallet Widget + Hamburger Menu - Desktop only */}
      <div className="hidden md:block">
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
          <CornerWalletWidget />
          <HamburgerMenu />
        </div>
      </div>
      
      {/* Header */}
      <header className={`border-b border-border bg-card/50 backdrop-blur-lg fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <img 
                  src="/logo.png" 
                  alt="ContentCastAI Logo" 
                  className="w-10 h-10 rounded-lg shadow-md"
                />
                <div>
                  <h1 className="text-sm md:text-lg font-bold text-foreground">{t('app.title')}</h1>
                  <p className="text-xs md:text-xs text-muted-foreground hidden sm:block">{t('app.subtitle')}</p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => {
                  const isActive = location === item.path;
                  const Icon = item.icon;
                  
                  return (
                    <Link key={item.key} href={item.path}>
                      <div
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        }`}
                        data-testid={`nav-${item.key}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Mobile: Wallet + Hamburger menu */}
            <div className="flex md:hidden items-center space-x-2">
              <div className="scale-90">
                <CornerWalletWidget />
              </div>
              <HamburgerMenu />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}