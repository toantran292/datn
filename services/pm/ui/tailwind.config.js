const path = require("path");
const config = require("@unified-teamspace/tailwind-config/tailwind.config.js");

const rootDir = path.join(__dirname, "..", "..", "..", "..");

config.content.files = [
  ...new Set([
    ...(config.content?.files ?? []),
    "./src/**/*.{js,ts,jsx,tsx}",
    path.join(rootDir, "packages/design-system/ui/src/**/*.{js,ts,jsx,tsx}"),
    path.join(rootDir, "packages/design-system/ui/dist/**/*.{js,jsx,ts,tsx,mjs}"),
  ]),
];

module.exports = config;
