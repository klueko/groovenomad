const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Configuration nécessaire pour Better Auth
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
