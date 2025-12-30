// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');
const { FileStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

// Use a stable on-disk store (shared across web/android)
const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, '.metro-cache');
config.cacheStores = [
  new FileStore({ root: path.join(root, 'cache') }),
];

// Force using CJS version for zustand to avoid import.meta issues
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force zustand to use CommonJS build
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    const cjsPath = moduleName.replace(/^zustand/, 'zustand');
    return context.resolveRequest(context, cjsPath, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

module.exports = config;
