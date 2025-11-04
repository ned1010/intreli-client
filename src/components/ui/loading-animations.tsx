import React from 'react';
import { cn } from '@/lib/utils';

// Bouncing dots loader
export function BouncingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1 justify-center items-center", className)}>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
    </div>
  );
}

// Spinning circles loader
export function SpinningCircles({ className }: { className?: string }) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <div className="absolute top-1 left-1 w-6 h-6 border-4 border-primary/40 border-t-primary rounded-full animate-spin [animation-direction:reverse] [animation-duration:0.8s]"></div>
    </div>
  );
}

// Pulsing orb loader
export function PulsingOrb({ className }: { className?: string }) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <div className="w-6 h-6 bg-primary rounded-full animate-pulse"></div>
      <div className="absolute inset-0 w-6 h-6 bg-primary rounded-full animate-ping"></div>
    </div>
  );
}

// Morphing squares
export function MorphingSquares({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="w-3 h-3 bg-primary rounded animate-morphing-square [animation-delay:0s]"></div>
      <div className="w-3 h-3 bg-primary rounded animate-morphing-square [animation-delay:0.2s]"></div>
      <div className="w-3 h-3 bg-primary rounded animate-morphing-square [animation-delay:0.4s]"></div>
      <div className="w-3 h-3 bg-primary rounded animate-morphing-square [animation-delay:0.6s]"></div>
    </div>
  );
}

// Typing indicator (chat specific)
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1 items-center px-4 py-2 bg-muted rounded-2xl w-fit", className)}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-typing-dot [animation-delay:0s]"></div>
        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-typing-dot [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-typing-dot [animation-delay:0.4s]"></div>
      </div>
    </div>
  );
}

// Progress wave
export function ProgressWave({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1 items-end h-8", className)}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-1 bg-primary rounded-full animate-wave"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

// DNA helix loader
export function DNAHelix({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-12 h-12", className)}>
      <div className="absolute inset-0 animate-dna-spin">
        <div className="w-3 h-3 bg-primary rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
        <div className="w-3 h-3 bg-primary/60 rounded-full absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
      </div>
      <div className="absolute inset-0 animate-dna-spin [animation-delay:0.5s] [animation-direction:reverse]">
        <div className="w-3 h-3 bg-primary/80 rounded-full absolute top-1/2 left-0 transform -translate-y-1/2"></div>
        <div className="w-3 h-3 bg-primary/40 rounded-full absolute top-1/2 right-0 transform -translate-y-1/2"></div>
      </div>
    </div>
  );
}

// Floating particles
export function FloatingParticles({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-16 h-16 overflow-hidden", className)}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
}

// Cybersecurity themed loader
export function CyberLoader({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm font-mono text-primary animate-pulse">
          SCANNING...
        </div>
      </div>
      <div className="mt-2 w-full bg-muted/30 rounded-full h-1 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary/50 to-primary animate-scan-progress"></div>
      </div>
    </div>
  );
}

// Full page loading overlay
export function LoadingOverlay({
  isVisible,
  message = "Loading...",
  type = "spinning"
}: {
  isVisible: boolean;
  message?: string;
  type?: "spinning" | "bouncing" | "morphing" | "cyber"
}) {
  if (!isVisible) return null;

  const getLoader = () => {
    switch (type) {
      case "bouncing":
        return <BouncingDots className="mb-4" />;
      case "morphing":
        return <MorphingSquares className="mb-4" />;
      case "cyber":
        return <CyberLoader className="mb-4" />;
      default:
        return <SpinningCircles className="mb-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-8 rounded-2xl shadow-2xl border border-border flex flex-col items-center">
        {getLoader()}
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  );
}

// Skeleton loaders for different content types
export function DocumentSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-8 h-8 bg-muted rounded"></div>
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full"></div>
        <div className="h-3 bg-muted rounded w-4/5"></div>
        <div className="h-3 bg-muted rounded w-3/5"></div>
      </div>
    </div>
  );
}

export function ChatMessageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="flex space-x-3">
        <div className="w-8 h-8 bg-muted rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="space-y-1">
            <div className="h-3 bg-muted rounded w-full"></div>
            <div className="h-3 bg-muted rounded w-5/6"></div>
            <div className="h-3 bg-muted rounded w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConversationSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse p-3 rounded-xl", className)}>
      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-muted rounded w-1/2"></div>
    </div>
  );
}