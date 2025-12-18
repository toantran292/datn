"use client";

import { CheckCircle2, AlertCircle, Info } from "lucide-react";

interface AIImprovementsListProps {
  improvements: string[];
  variant?: "default" | "compact" | "detailed";
  showIcon?: boolean;
  className?: string;
}

export const AIImprovementsList: React.FC<AIImprovementsListProps> = ({
  improvements,
  variant = "default",
  showIcon = true,
  className = "",
}) => {
  if (!improvements || improvements.length === 0) {
    return null;
  }

  const getIconComponent = (index: number) => {
    // Alternate icons for visual interest
    if (index % 3 === 0) return CheckCircle2;
    if (index % 3 === 1) return AlertCircle;
    return Info;
  };

  if (variant === "compact") {
    return (
      <div className={`space-y-1 ${className}`}>
        {improvements.map((improvement, index) => (
          <div key={index} className="flex items-start gap-2 text-xs text-custom-text-300">
            {showIcon && <CheckCircle2 className="size-3 text-green-500 mt-0.5 flex-shrink-0" />}
            <span>{improvement}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="size-8 rounded-full bg-green-500/10 grid place-items-center">
            <CheckCircle2 className="size-4 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-custom-text-100">
              AI đã cải thiện mô tả của bạn
            </p>
            <p className="text-xs text-custom-text-300">
              {improvements.length} cải tiến được áp dụng
            </p>
          </div>
        </div>
        <ul className="space-y-2 pl-2">
          {improvements.map((improvement, index) => {
            const IconComponent = getIconComponent(index);
            return (
              <li
                key={index}
                className="flex items-start gap-3 p-2.5 rounded-md bg-custom-background-90 border border-custom-border-200"
              >
                {showIcon && (
                  <div className="size-6 rounded grid place-items-center bg-custom-background-100 flex-shrink-0 mt-0.5">
                    <IconComponent className="size-3.5 text-green-500" />
                  </div>
                )}
                <span className="text-sm text-custom-text-200 flex-1">{improvement}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // default variant
  return (
    <div className={`space-y-1.5 ${className}`}>
      {improvements.map((improvement, index) => (
        <li key={index} className="flex items-start gap-2 text-sm text-custom-text-300">
          {showIcon && <CheckCircle2 className="size-4 text-green-500 mt-0.5 flex-shrink-0" />}
          <span>{improvement}</span>
        </li>
      ))}
    </div>
  );
};
