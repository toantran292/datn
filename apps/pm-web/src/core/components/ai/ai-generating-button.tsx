"use client";

import { useEffect, useState } from "react";
import { Sparkles, Zap } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import { cn } from "@uts/fe-utils";

interface AIGeneratingButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const thinkingStates = [
  { text: "Thinking", icon: Sparkles },
  { text: "Analyzing", icon: Zap },
  { text: "Processing", icon: Sparkles },
  { text: "Refining", icon: Zap },
  { text: "Optimizing", icon: Sparkles },
];

export const AIGeneratingButton: React.FC<AIGeneratingButtonProps> = ({
  onClick,
  disabled = false,
  className,
}) => {
  const [stateIndex, setStateIndex] = useState(0);
  const CurrentIcon = thinkingStates[stateIndex].icon;

  useEffect(() => {
    const interval = setInterval(() => {
      setStateIndex((prev) => (prev + 1) % thinkingStates.length);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <Button
      variant="neutral-primary"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn("relative overflow-hidden group shadow-lg", className)}
    >
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-custom-primary-100/30 to-blue-500/20 animate-gradient-x" />

      {/* Shimmer Effect - Dual Layer */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="absolute inset-0 translate-x-full animate-shimmer-reverse bg-gradient-to-r from-transparent via-custom-primary-100/40 to-transparent" />

      {/* Particles with better animation */}
      <div className="absolute inset-0 overflow-visible pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className={cn(
              "absolute rounded-full animate-particle",
              i % 2 === 0 ? "bg-custom-primary-100/70" : "bg-purple-400/60",
              i % 3 === 0 ? "w-1.5 h-1.5" : "w-1 h-1"
            )}
            style={{
              left: `${8 + (i * 12)}%`,
              animationDelay: `${i * 0.25}s`,
              animationDuration: `${2 + (i % 2) * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-custom-primary-100/10 via-custom-primary-100/20 to-custom-primary-100/10 animate-pulse-glow opacity-60" />

      {/* Border glow */}
      <div className="absolute inset-0 rounded-md border border-custom-primary-100/30 animate-border-glow" />

      {/* Content */}
      <div className="relative flex items-center gap-2 z-10">
        <CurrentIcon className="size-3.5 text-custom-primary-100 animate-spin-slow" />
        <span className="text-xs font-semibold bg-gradient-to-r from-custom-primary-100 to-purple-400 bg-clip-text text-transparent animate-text-shimmer bg-[length:200%_auto]">
          {thinkingStates[stateIndex].text}...
        </span>
      </div>
    </Button>
  );
};
