// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require("@unified-teamspace/tailwind-config/tailwind.config.js");

config.content.files = ["./src/**/*.{js,ts,jsx,tsx}"];

module.exports = config;
