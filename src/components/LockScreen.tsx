// src/components/LockScreen.tsx

'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Volume2, VolumeX, Lock } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const MASTER_PASSWORD = "2025";
const PASSWORD_COOKIE_NAME = "mba_auth"; 

interface LockScreenProps {
  children: React.ReactNode;
}

export function LockScreen({ children }: LockScreenProps) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [theme, setTheme] = React.useState<'morning' | 'evening' | 'rain'>('morning');
  const [audioEnabled, setAudioEnabled] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Auto-hide sound control state
  const [showSound, setShowSound] = React.useState(true);
  const hideTimer = React.useRef<NodeJS.Timeout | null>(null);

  // Removed cookie check for per-refresh login

  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 16) setTheme('morning');
    else if (hour >= 16 && hour < 21) setTheme('evening');
    else setTheme('rain');
  }, []);

  React.useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioEnabled;
    if (audioEnabled) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [audioEnabled]);

  const processAuthentication = React.useCallback((pass: string) => {
    setError(null);
    if (pass === MASTER_PASSWORD) {
      setIsAuthenticated(true);
      toast({
        title: 'Access Granted',
        description: 'Welcome Aravind',
        action: <CheckCircle className='h-4 w-4 text-green-500' />,
      });
    } else {
      setError('Incorrect password.');
      setPassword('');
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'The password entered is incorrect.',
        action: <XCircle className='h-4 w-4 text-destructive-foreground' />,
      });
    }
  }, [toast]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    processAuthentication(password);
  };

  // Video and poster paths (omitted for brevity)
  const getVideoSrc = () => {
    if (theme === 'morning') return '/videos/forest-morning.mp4';
    if (theme === 'evening') return '/videos/forest-evening.mp4';
    return '/videos/forest-rain.mp4';
  };
  const getPoster = () => {
    if (theme === 'morning') return '/images/poster-morning.jpg';
    if (theme === 'evening') return '/images/poster-evening.jpg';
    return '/images/poster-rain.jpg';
  };

  // Auto-hide sound control logic (omitted for brevity)
  React.useEffect(() => {
    const show = () => {
      setShowSound(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowSound(false), 3000);
    };
    window.addEventListener('mousemove', show);
    window.addEventListener('touchstart', show);
    show();
    return () => {
      window.removeEventListener('mousemove', show);
      window.removeEventListener('touchstart', show);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden">
      {/* Background video (omitted for brevity) */}
      <video
        key={theme}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
        autoPlay
        muted={!audioEnabled}
        loop
        playsInline
        poster={getPoster()}
      >
        <source src={getVideoSrc()} type="video/mp4" />
      </video>

      {/* Subtle overlay (omitted for brevity) */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

      {/* Ambient audio (omitted for brevity) */}
      <audio ref={audioRef} src="/audio/forest-ambience.mp3" loop preload="auto" />


<motion.form
  onSubmit={handleLogin}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 1 }}
  className="absolute inset-0 flex items-center justify-center z-10"
>
  <Input
    id="password"
    type="password"
    placeholder="••••"
    maxLength={4}
    value={password}
    autoFocus
    onChange={(e) => {
      const value = e.target.value.replace(/\D/g, '');
      if (value.length <= 4) setPassword(value);
      if (value.length === 4) processAuthentication(value);
    }}
    inputMode="numeric"
    required
    className="w-36 rounded-xl bg-white/10 text-center text-3xl tracking-[0.5em] text-white 
           placeholder:text-white/40  focus:outline-none border border-white/20 px-6 py-3"

  />
</motion.form>



<AnimatePresence>
  {showSound && (
    <motion.button
      key="sound"
      onClick={() => setAudioEnabled((s) => !s)}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ duration: 0.4 }}
      className="absolute bottom-6 right-6 z-20 rounded-full bg-white/10 p-3 text-white shadow-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
    >
      {audioEnabled ? (
        <Volume2 className="h-5 w-5 drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
      ) : (
        <VolumeX className="h-5 w-5 drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
      )}
    </motion.button>
  )}
</AnimatePresence>


   {/* Subtle vignette (omitted for brevity) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40 mix-blend-multiply" />
    </div>
  );
}