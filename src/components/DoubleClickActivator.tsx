'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Lock, Unlock } from 'lucide-react';

const ACTIVATION_COOKIE_NAME = "mba_active";

interface DoubleClickActivatorProps {
  children: React.ReactNode;
}

export function DoubleClickActivator({ children }: DoubleClickActivatorProps) {
  const { toast } = useToast();
  // State to track if the double-click activation has occurred this session
  const [isActive, setIsActive] = React.useState(true); // Default to active for first render
  const [isReady, setIsReady] = React.useState(false); // Flag for when initial check is done
  const pathname = usePathname();

  // 1. Check for cookie on mount
  React.useEffect(() => {
    // We check if the separate activation cookie is set. If not, we block access.
    const isActivated = document.cookie.includes(`${ACTIVATION_COOKIE_NAME}=true`);
    setIsActive(isActivated);
    setIsReady(true);
    
    // If not activated, immediately show a toast hint (after a delay)
    if (!isActivated) {
        setTimeout(() => {
            toast({
                title: 'Portal Locked',
                description: 'Double-click to activate the command center.', // Updated text
                variant: 'destructive',
            });
        }, 100);
    }
  }, [toast]);
  
  // 2. Clear toast when user navigates away from root path (optional)
  React.useEffect(() => {
     if (isActive && pathname !== '/') {
        // We might want to remove the toast once the user is successfully using the app
     }
  }, [pathname, isActive]);


  // 3. Double-Click Handler
  const handleDoubleClick = React.useCallback(() => {
    if (!isActive) {
      setIsActive(true);
      // Set a persistent cookie for the current session (browser close will still log out)
      document.cookie = `${ACTIVATION_COOKIE_NAME}=true; path=/`; 
      toast({
        title: 'Portal Activated!',
        description: 'The MBA Command Center is now fully operational.',
      });
    }
  }, [isActive, toast]);

  // Pass the handler down via context or render prop. 
  // For simplicity, we will manually drill it to the logo in AppSidebar.
  // The actual logic will be in AppSidebar to target the logo.

  // 4. Render Overlay/Blocker
  if (isReady && !isActive) {
    return (
        <div className="relative h-full w-full">
          {/* Content is blurred/disabled */}
          <div className="pointer-events-none filter blur-sm opacity-50 select-none">
            {children}
          </div>
          {/* Overlay and Message -- FIX APPLIED HERE */}
          <div 
            className="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
            onDoubleClick={handleDoubleClick} // <-- Added handler
          >
            <Lock className="h-10 w-10 text-destructive mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold">Portal Locked</h2>
            <p className="text-muted-foreground text-center mt-2 px-6">
                {/* Updated text */}
                Double-click anywhere to activate the Command Center for this session.
            </p>
          </div>
        </div>
    );
  }

  // Render children normally once ready and active
  return <>{children}</>;
}

// Helper to provide the double-click handler globally (Used in AppSidebar)
const ActivationContext = React.createContext<{ handleDoubleClick: () => void } | null>(null);

export function useActivation() {
  const context = React.useContext(ActivationContext);
  if (!context) {
    throw new Error("useActivation must be used within DoubleClickActivator.");
  }
  return context;
}

export function DoubleClickActivatorProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [isActive, setIsActive] = React.useState(false); 
    
    // Check cookie on mount
    React.useEffect(() => {
        const isActivated = document.cookie.includes(`${ACTIVATION_COOKIE_NAME}=true`);
        setIsActive(isActivated);
        if (!isActivated) {
            // Initial toast is handled in the LockScreen logic to fire once
        }
    }, []);

    const handleDoubleClick = React.useCallback(() => {
        if (!isActive) {
            setIsActive(true);
            // Set session cookie
            document.cookie = `${ACTIVATION_COOKIE_NAME}=true; path=/`; 
            toast({
                title: 'Portal Activated!',
                description: 'The MBA Command Center is now fully operational.',
                action: <Unlock className='h-4 w-4 text-primary' />
            });
        }
    }, [isActive, toast]);
    
    const contextValue = React.useMemo(() => ({ handleDoubleClick }), [handleDoubleClick]);
    
    if (!isActive) {
        // Apply the visual block/blur overlay when locked
        return (
            <ActivationContext.Provider value={contextValue}>
                <div className="relative h-full w-full">
                    <div className="pointer-events-none filter blur-sm opacity-50 select-none">
                        {children}
                    </div>
                    {/* MODIFICATION HERE: Added onDoubleClick, cursor-pointer, and updated text */}
                    <div 
                        className="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
                        onDoubleClick={handleDoubleClick} // <-- Added handler
                    >
                        <Lock className="h-10 w-10 text-destructive mb-4 animate-pulse" />
                        <h2 className="text-2xl font-bold">Portal Locked</h2>
                        <p className="text-muted-foreground text-center mt-2 px-6">
                            {/* Updated text */}
                            Double-click anywhere to activate the Command Center for this session.
                        </p>
                    </div>
                </div>
            </ActivationContext.Provider>
        );
    }

    // Render active content with the context provider
    return (
        <ActivationContext.Provider value={contextValue}>
            {children}
        </ActivationContext.Provider>
    );
}