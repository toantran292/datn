const path = require("path");
const config = require("@uts/design-system/tailwind-config/tailwind.config.js");

const rootDir = path.resolve(__dirname, "..", "..");

config.content.files = [
  ...new Set([
    ...(config.content?.files ?? []),
    "./src/**/*.{js,ts,jsx,tsx}",
    path.join(rootDir, "packages/design-system/ui/src/**/*.{js,ts,jsx,tsx}"),
    path.join(rootDir, "packages/design-system/ui/dist/**/*.{js,jsx,ts,tsx,mjs}"),
  ]),
];

// Add stunning AI animations
config.theme = config.theme || {};
config.theme.extend = config.theme.extend || {};
config.theme.extend.animation = {
  ...(config.theme.extend.animation || {}),
  shimmer: "shimmer 2s linear infinite",
  "shimmer-reverse": "shimmer-reverse 2s linear infinite",
  "shimmer-slow": "shimmer-slow 3s linear infinite",
  "pulse-glow": "pulse-glow 2s ease-in-out infinite",
  "spin-slow": "spin 3s linear infinite",
  blink: "blink 1s step-end infinite",
  "gradient-x": "gradient-x 3s ease infinite",
  float: "float 3s ease-in-out infinite",
  particle: "particle 2s ease-out infinite",
  "text-shimmer": "text-shimmer 3s linear infinite",
  "border-glow": "border-glow 2s ease-in-out infinite",
  "fire-wave": "fire-wave 3s ease-in-out infinite",
  "fire-wave-reverse": "fire-wave-reverse 3s ease-in-out infinite",
  "particle-explosion": "particle-explosion 2s ease-out infinite",
  "spark-fly": "spark-fly 1.8s ease-out infinite",
  "mega-pulse": "mega-pulse 2s ease-in-out infinite",
  "rotate-ring": "rotate-ring 3s linear infinite",
  "rotate-ring-reverse": "rotate-ring-reverse 3s linear infinite",
  "icon-bounce": "icon-bounce 1s ease-in-out infinite",
  "text-wave": "text-wave 4s linear infinite",
  "border-rainbow": "border-rainbow 3s linear infinite",
  "burst-glow": "burst-glow 2s ease-in-out infinite",
};
config.theme.extend.keyframes = {
  ...(config.theme.extend.keyframes || {}),
  shimmer: {
    "0%": { transform: "translateX(-100%)" },
    "100%": { transform: "translateX(100%)" },
  },
  "shimmer-reverse": {
    "0%": { transform: "translateX(100%)" },
    "100%": { transform: "translateX(-100%)" },
  },
  "shimmer-slow": {
    "0%": { transform: "translateX(-100%)" },
    "100%": { transform: "translateX(100%)" },
  },
  "pulse-glow": {
    "0%, 100%": {
      boxShadow: "0 0 20px rgba(251, 146, 60, 0.5)",
      transform: "scale(1)",
    },
    "50%": {
      boxShadow: "0 0 30px rgba(251, 146, 60, 0.8)",
      transform: "scale(1.02)",
    },
  },
  blink: {
    "0%, 100%": { opacity: "1" },
    "50%": { opacity: "0" },
  },
  "gradient-x": {
    "0%, 100%": { backgroundPosition: "0% 50%" },
    "50%": { backgroundPosition: "100% 50%" },
  },
  float: {
    "0%, 100%": { transform: "translateY(0px)" },
    "50%": { transform: "translateY(-5px)" },
  },
  particle: {
    "0%": {
      transform: "translateY(0) scale(0)",
      opacity: "0"
    },
    "50%": {
      opacity: "1"
    },
    "100%": {
      transform: "translateY(-30px) scale(1)",
      opacity: "0"
    },
  },
  "text-shimmer": {
    "0%": { backgroundPosition: "0% center" },
    "100%": { backgroundPosition: "200% center" },
  },
  "border-glow": {
    "0%, 100%": {
      opacity: "0.3",
      boxShadow: "0 0 10px rgba(251, 146, 60, 0.3)"
    },
    "50%": {
      opacity: "0.8",
      boxShadow: "0 0 20px rgba(251, 146, 60, 0.6)"
    },
  },
  "fire-wave": {
    "0%, 100%": {
      backgroundPosition: "0% 50%",
      opacity: "0.8"
    },
    "50%": {
      backgroundPosition: "100% 50%",
      opacity: "1"
    },
  },
  "fire-wave-reverse": {
    "0%, 100%": {
      backgroundPosition: "100% 50%",
      opacity: "0.7"
    },
    "50%": {
      backgroundPosition: "0% 50%",
      opacity: "1"
    },
  },
  "particle-explosion": {
    "0%": {
      transform: "translate(0, 0) scale(0)",
      opacity: "0"
    },
    "30%": {
      opacity: "1"
    },
    "100%": {
      transform: "translate(var(--tw-translate-x, 20px), -40px) scale(1.5)",
      opacity: "0"
    },
  },
  "spark-fly": {
    "0%": {
      transform: "translateY(0) scaleY(1)",
      opacity: "0"
    },
    "20%": {
      opacity: "1"
    },
    "100%": {
      transform: "translateY(-50px) scaleY(0.5)",
      opacity: "0"
    },
  },
  "mega-pulse": {
    "0%, 100%": {
      opacity: "0.3",
      transform: "scale(0.95)",
    },
    "50%": {
      opacity: "0.8",
      transform: "scale(1.1)",
    },
  },
  "rotate-ring": {
    "0%": {
      transform: "rotate(0deg) scale(1)",
      opacity: "0.3"
    },
    "50%": {
      opacity: "0.7"
    },
    "100%": {
      transform: "rotate(360deg) scale(1.05)",
      opacity: "0.3"
    },
  },
  "rotate-ring-reverse": {
    "0%": {
      transform: "rotate(360deg) scale(1.05)",
      opacity: "0.4"
    },
    "50%": {
      opacity: "0.8"
    },
    "100%": {
      transform: "rotate(0deg) scale(1)",
      opacity: "0.4"
    },
  },
  "icon-bounce": {
    "0%, 100%": {
      transform: "scale(1) rotate(0deg)",
    },
    "25%": {
      transform: "scale(1.2) rotate(10deg)",
    },
    "75%": {
      transform: "scale(0.9) rotate(-10deg)",
    },
  },
  "text-wave": {
    "0%": { backgroundPosition: "0% center" },
    "100%": { backgroundPosition: "300% center" },
  },
  "border-rainbow": {
    "0%, 100%": { backgroundPosition: "0% 50%" },
    "50%": { backgroundPosition: "100% 50%" },
  },
  "burst-glow": {
    "0%, 100%": {
      opacity: "0",
      transform: "scale(0.8)",
    },
    "50%": {
      opacity: "0.6",
      transform: "scale(1.3)",
    },
  },
};

module.exports = config;
