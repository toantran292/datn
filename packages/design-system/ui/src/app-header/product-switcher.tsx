import React from "react";
import { LayoutGrid, MessageSquare, Video } from "lucide-react";
import { Tooltip } from "../tooltip";
import type { ProductSwitcherProps, TAppType } from "./types";

interface Product {
  id: TAppType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  urlKey: string;
}

const PRODUCTS: Product[] = [
  { id: "pm", name: "Project Management", icon: LayoutGrid, urlKey: "NEXT_PUBLIC_PM_WEB_URL" },
  { id: "chat", name: "Chat", icon: MessageSquare, urlKey: "NEXT_PUBLIC_CHAT_WEB_URL" },
  { id: "meeting", name: "Meeting", icon: Video, urlKey: "NEXT_PUBLIC_MEETING_WEB_URL" },
];

const DEFAULT_URLS: Record<TAppType, string> = {
  pm: "http://localhost:3002",
  chat: "http://localhost:3004",
  meeting: "http://localhost:3003",
};

export const ProductSwitcher: React.FC<ProductSwitcherProps> = ({ currentApp, workspaceSlug }) => {
  const handleProductSwitch = (product: Product) => {
    if (product.id === currentApp) return;

    const baseUrl =
      (typeof window !== "undefined" && (window as any).ENV?.[product.urlKey]) ||
      process.env[product.urlKey] ||
      DEFAULT_URLS[product.id];

    const targetUrl = workspaceSlug ? `${baseUrl}/${workspaceSlug}` : baseUrl;

    window.location.href = targetUrl;
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-custom-background-90 my-2">
      {PRODUCTS.map((product) => {
        const Icon = product.icon;
        const isCurrent = product.id === currentApp;

        return (
          <Tooltip key={product.id} tooltipContent={product.name}>
            <button
              onClick={() => handleProductSwitch(product)}
              className={`
                flex items-center justify-center
                size-6 rounded-md
                transition-all duration-200
                ${
                  isCurrent
                    ? "bg-custom-primary-100 text-white shadow-sm"
                    : "hover:bg-custom-background-80 text-custom-text-200 hover:text-custom-text-100"
                }
              `}
              disabled={isCurrent}
              aria-label={product.name}
              aria-current={isCurrent ? "page" : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};
