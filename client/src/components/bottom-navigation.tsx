import { Link, useLocation } from "wouter";
import { useLanguage } from "@/components/language-provider";
import { Home, Trophy, Target, Gift, User } from "lucide-react";

export function BottomNavigation() {
  const [location] = useLocation();
  const { t } = useLanguage();

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
    {
      key: "profile",
      path: "/profile",
      icon: User,
      label: t("navigation.profile") || "Profile",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-14 px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <Link key={item.key} href={item.path}>
              <div
                className={`flex flex-col items-center justify-center space-y-0.5 px-1.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
                data-testid={`nav-${item.key}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}