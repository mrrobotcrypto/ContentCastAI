import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { config } from './lib/wagmi-config';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletProvider } from "@/hooks/use-wallet";
import { LanguageProvider } from "@/components/language-provider";
import Home from "@/pages/home";
import Quest from "@/pages/quest";
import Leaderboard from "@/pages/leaderboard";
import Rewards from "@/pages/rewards";
import Profile from "@/pages/profile";
import About from "@/pages/about";
import Feedback from "@/pages/feedback";
import NotFound from "@/pages/not-found";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useEffect } from "react";

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/quest" component={Quest} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/rewards" component={Rewards} />
        <Route path="/profile" component={Profile} />
        <Route path="/about" component={About} />
        <Route path="/feedback" component={Feedback} />
        <Route component={NotFound} />
      </Switch>
      <BottomNavigation />
    </>
  );
}

function App() {
  // Initialize Farcaster SDK
  useEffect(() => {
    const initializeFarcasterSDK = async () => {
      console.log('🚀 Starting Farcaster SDK initialization...');
      
      try {
        if (typeof window !== 'undefined') {
          console.log('🌐 Window object available, importing Farcaster SDK...');
          
          const { sdk } = await import('@farcaster/miniapp-sdk');
          console.log('📦 Farcaster SDK imported successfully');
          
          // Check if we're in a Farcaster context
          const isInFarcaster = window.parent !== window || window.location !== window.parent.location;
          console.log('🔍 Farcaster context check:', { isInFarcaster, isFramed: window.parent !== window });
          
          // Always call ready() - it's safe to call even outside Farcaster
          console.log('📞 Calling sdk.actions.ready()...');
          
          try {
            // Add timeout to prevent hanging
            const readyPromise = sdk.actions.ready();
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Ready timeout after 5 seconds')), 5000)
            );
            
            await Promise.race([readyPromise, timeoutPromise]);
            console.log('✅ Farcaster SDK ready() called successfully');
          } catch (readyError) {
            console.warn('⚠️ sdk.actions.ready() failed or timed out:', readyError);
            
            // Try alternative approach - manual ready signal
            try {
              console.log('🔄 Trying manual ready signaling...');
              
              // Post different ready message variations that Farcaster might listen for
              if (window.parent && window.parent !== window) {
                const readyMessages = [
                  { type: 'fc-ready' },
                  { type: 'farcaster-ready' },
                  { type: 'miniapp-ready' },
                  { type: 'ready' },
                  { action: 'ready' },
                  'ready'
                ];
                
                readyMessages.forEach((message, index) => {
                  try {
                    window.parent.postMessage(message, '*');
                    console.log(`📤 Sent ready message ${index + 1}:`, message);
                  } catch (msgError) {
                    console.warn(`❌ Failed to send message ${index + 1}:`, msgError);
                  }
                });
                
                // Also try direct DOM event
                try {
                  const readyEvent = new CustomEvent('farcaster-ready', { 
                    detail: { ready: true },
                    bubbles: true 
                  });
                  document.dispatchEvent(readyEvent);
                  console.log('🎯 Dispatched farcaster-ready DOM event');
                } catch (eventError) {
                  console.warn('❌ Failed to dispatch DOM event:', eventError);
                }
                
              } else {
                console.log('📋 Not in iframe, skipping manual ready signal');
              }
            } catch (altError) {
              console.warn('⚠️ Manual ready signaling failed:', altError);
            }
          }
          
          console.log('🎯 Farcaster SDK initialization process completed');
        } else {
          console.warn('❌ Window object not available, skipping SDK initialization');
        }
      } catch (error) {
        console.error('❌ Failed to initialize Farcaster SDK:', error);
        // Even if SDK fails, we should continue running the app
      }
    };
    
    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeFarcasterSDK();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider defaultTheme="dark" storageKey="farcastai-theme">
          <WagmiProvider config={config}>
            <WalletProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </WalletProvider>
          </WagmiProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
// test redeploy trigger
