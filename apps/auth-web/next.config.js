/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
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
