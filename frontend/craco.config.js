// craco.config.js
const path = require("path");
require("dotenv").config();

// Check if we're in development/preview mode (not production build)
// Craco sets NODE_ENV=development for start, NODE_ENV=production for build
const isDevServer = process.env.NODE_ENV !== "production";

// Environment variable overrides
const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
};

// Conditionally load health check modules only if enabled
let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

let webpackConfig = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {

      // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
        ],
      };

      // Add health check plugin to webpack if enabled
      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }
      return webpackConfig;
    },
  },
};

webpackConfig.devServer = (devServerConfig) => {
  // Add health check endpoints if enabled
  if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
    const originalSetupMiddlewares = devServerConfig.setupMiddlewares;

    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      // Call original setup if exists
      if (originalSetupMiddlewares) {
        middlewares = originalSetupMiddlewares(middlewares, devServer);
      }

      // Setup health endpoints
      setupHealthEndpoints(devServer, healthPluginInstance);

      return middlewares;
    };
  }

  return devServerConfig;
};

// Wrap with visual edits (automatically adds babel plugin, dev server, and overlay in dev mode)
if (isDevServer) {
  try {
    const { withVisualEdits } = require("@emergentbase/visual-edits/craco");
    webpackConfig = withVisualEdits(webpackConfig);

    // Visual-edits injects `x-line-number` / `x-file-name` attrs on every JSX
    // element, which breaks react-three-fiber host elements (mesh, points,
    // bufferGeometry, ...). Wrap the plugin so it becomes a no-op on files
    // inside /src/game/ where the 3D scene is authored.
    // IMPORTANT: Do not remove this wrapping.
    // @emergentbase/visual-edits injects `x-line-number` / `x-file-name` JSX
    // attributes onto every element. These break react-three-fiber host
    // elements (mesh, points, bufferGeometry, ...), which then throw
    // "R3F: Cannot set x-line-number" at runtime. This wrapper turns the
    // visual-edits plugin into a no-op for files inside /src/game/ where
    // the 3D scene is authored.
    const EXCLUDE_REGEX = /\/src\/game\//;
    if (webpackConfig.babel && Array.isArray(webpackConfig.babel.plugins)) {
      webpackConfig.babel.plugins = webpackConfig.babel.plugins.map((plugin) => {
        if (typeof plugin !== "function") return plugin;
        // Rough heuristic: the visual-edits plugin is the last function plugin
        // added by withVisualEdits. Safe-wrap any plugin — the wrapper only
        // no-ops when filename matches the 3D folder.
        const wrapped = function wrappedVisualEditsPlugin(babel, options) {
          const result = plugin(babel, options);
          if (!result || !result.visitor) return result;
          const wrapVisit = (visit) => {
            if (!visit) return visit;
            if (typeof visit === "function") {
              return function (p, state) {
                const fn = state.filename || state.file?.opts?.filename || "";
                if (EXCLUDE_REGEX.test(fn)) return;
                return visit.call(this, p, state);
              };
            }
            const out = { ...visit };
            ["enter", "exit"].forEach((k) => {
              if (typeof visit[k] === "function") {
                out[k] = function (p, state) {
                  const fn = state.filename || state.file?.opts?.filename || "";
                  if (EXCLUDE_REGEX.test(fn)) return;
                  return visit[k].call(this, p, state);
                };
              }
            });
            return out;
          };
          const newVisitor = {};
          for (const key of Object.keys(result.visitor)) {
            newVisitor[key] = wrapVisit(result.visitor[key]);
          }
          return { ...result, visitor: newVisitor };
        };
        return wrapped;
      });
    }
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && err.message.includes('@emergentbase/visual-edits/craco')) {
      console.warn(
        "[visual-edits] @emergentbase/visual-edits not installed — visual editing disabled."
      );
    } else {
      throw err;
    }
  }
}

module.exports = webpackConfig;
