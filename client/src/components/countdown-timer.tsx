import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useLanguage } from "./language-provider";

interface CountdownTimerProps {
  seconds: number; // Total seconds until reset
  className?: string;
}

export function CountdownTimer({ seconds: initialSeconds, className }: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const { t } = useLanguage();

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) return;

    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          // When countdown reaches 0, we should refetch the cast limits
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]);

  const formatTime = (totalSeconds: number): string => {
    if (totalSeconds <= 0) return "00:00:00";
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (seconds <= 0) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 dark:text-green-400 ${className}`}>
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">{t('countdown.resetAvailable') || 'Reset available!'}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 text-orange-600 dark:text-orange-400 ${className}`}>
      <Clock className="w-4 h-4" />
      <span className="text-sm font-medium">
        {t('countdown.resetIn') || 'Reset in'}: {formatTime(seconds)}
      </span>
    </div>
  );
}