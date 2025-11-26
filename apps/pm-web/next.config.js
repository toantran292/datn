/** @type {import('next').NextConfig} */
const path = require("path");

const EDITOR_NODE_MODULES = path.resolve(__dirname, "../../packages/design-system/editor/node_modules");

const nextConfig = {
  transpilePackages: [
    "@uts/design-system/ui",
    "@uts/design-system/editor",
    "@tiptap/core",
    "@tiptap/react",
    "@tiptap/pm",
    "tiptap-markdown",
    "@tiptap/extension-placeholder",
    "@tiptap/extension-character-count",
    "@tiptap/extension-task-item",
    "@tiptap/extension-task-list",
    "@tiptap/extension-text-style",
    "@tiptap/extension-underline",
    "@tiptap/extension-collaboration",
  ],
  webpack: (config, { isServer }) => {
    if (config.resolve && config.resolve.modules) {
      if (!config.resolve.modules.includes(EDITOR_NODE_MODULES)) {
        config.resolve.modules.push(EDITOR_NODE_MODULES);
      }
    } else {
      config.resolve = config.resolve || {};
      config.resolve.modules = [EDITOR_NODE_MODULES, "node_modules"];
    }

    if (isServer) {
      const externalModules = ["jsdom", "isomorphic-dompurify"];

      if (Array.isArray(config.externals)) {
        config.externals = [...config.externals, ...externalModules];
      } else if (typeof config.externals === "function") {
        const originalExternals = config.externals;

        config.externals = async (context, request, callback) => {
          if (externalModules.includes(request)) {
            return callback(null, `commonjs ${request}`);
          }

          return originalExternals(context, request, callback);
        };
      } else if (config.externals) {
        config.externals = [config.externals, ...externalModules];
      } else {
        config.externals = externalModules;
      }
    }

    return config;
  },
};

module.exports = nextConfig;
