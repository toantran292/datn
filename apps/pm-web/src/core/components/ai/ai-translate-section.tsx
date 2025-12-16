"use client";

import { useState } from "react";
import { Languages, ChevronDown, ChevronUp, Loader2, Globe } from "lucide-react";
import { Button } from "@uts/design-system/ui";
import { cn } from "@uts/fe-utils";
import type { TranslateData, TranslateLanguage } from "@/core/hooks/use-ai-translate-stream";
import { LANGUAGE_LABELS } from "@/core/hooks/use-ai-translate-stream";

export interface AITranslateSectionProps {
  original: string;
  translatedData: TranslateData | null;
  streamedHtml: string;
  isTranslating: boolean;
  onChangeLanguage: (language: TranslateLanguage) => void;
  onCancel: () => void;
}

type TabType = "original" | "translated";

export const AITranslateSection: React.FC<AITranslateSectionProps> = ({
  original,
  translatedData,
  streamedHtml,
  isTranslating,
  onChangeLanguage,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("translated");
  const [isExpanded, setIsExpanded] = useState(true);

  const displayHtml = streamedHtml || translatedData?.translatedHtml || "";
  const targetLanguage = translatedData?.targetLanguage;
  const languageLabel = targetLanguage ? LANGUAGE_LABELS[targetLanguage] : "";

  return (
    <div className="border border-custom-border-200 rounded-lg bg-custom-background-90 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-orange-500/10 border-b border-custom-border-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-orange-500/20 grid place-items-center">
              <Languages className="size-4 text-orange-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-custom-text-100">AI Translated Description</h3>
              {languageLabel ? (
                <p className="text-xs text-custom-text-300">Translated to: {languageLabel}</p>
              ) : (
                <p className="text-xs text-custom-text-300">Translation in progress...</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Change Language Dropdown */}
            {!isTranslating && (
              <div className="relative group">
                <Button
                  variant="neutral-primary"
                  size="sm"
                  className="gap-1.5"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Change Language</span>
                </Button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-custom-background-100 border border-custom-border-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  {(Object.keys(LANGUAGE_LABELS) as TranslateLanguage[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => onChangeLanguage(lang)}
                      disabled={lang === targetLanguage}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-custom-background-80 transition-colors first:rounded-t-md last:rounded-b-md",
                        lang === targetLanguage ? "bg-custom-primary-100/10 text-custom-primary-100 cursor-default" : "text-custom-text-200"
                      )}
                    >
                      {LANGUAGE_LABELS[lang]}
                      {lang === targetLanguage && <span className="ml-2 text-xs">(current)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="size-7 rounded grid place-items-center hover:bg-custom-background-80 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="size-4 text-custom-text-300" />
              ) : (
                <ChevronDown className="size-4 text-custom-text-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-custom-border-200 bg-custom-background-100">
            <button
              onClick={() => setActiveTab("translated")}
              className={`flex-1 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "translated"
                  ? "border-orange-500 text-orange-500 bg-orange-500/5"
                  : "border-transparent text-custom-text-300 hover:text-custom-text-200"
              }`}
            >
              Translated
            </button>
            <button
              onClick={() => setActiveTab("original")}
              className={`flex-1 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "original"
                  ? "border-orange-500 text-orange-500 bg-orange-500/5"
                  : "border-transparent text-custom-text-300 hover:text-custom-text-200"
              }`}
            >
              Original
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto px-4 py-3 bg-custom-background-100">
            {activeTab === "translated" ? (
              <div className="prose prose-sm max-w-none dark:prose-invert text-custom-text-200">
                {isTranslating ? (
                  // Show streaming HTML with cursor animation
                  displayHtml ? (
                    <div>
                      <div dangerouslySetInnerHTML={{ __html: displayHtml }} />
                      <span className="inline-block w-2 h-4 ml-1 bg-orange-500 animate-pulse" />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Loader2 className="size-6 animate-spin text-orange-500 mx-auto mb-2" />
                      <p className="text-sm text-custom-text-400">Đang khởi tạo dịch thuật...</p>
                    </div>
                  )
                ) : (
                  // Show final translated HTML
                  <div dangerouslySetInnerHTML={{ __html: displayHtml }} />
                )}
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="text-custom-text-200" dangerouslySetInnerHTML={{ __html: original }} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-custom-border-200 bg-custom-background-100">
            <div className="text-xs text-custom-text-400">
              {displayHtml.length} ký tự {languageLabel && `• ${languageLabel}`}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="neutral-primary" size="sm" onClick={onCancel}>
                Đóng
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
