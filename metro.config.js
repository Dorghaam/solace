const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Customize the resolver to handle the 'ws' module issue with Supabase
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'ws') {
    // This directs Metro to resolve 'ws' to an empty module.
    // Supabase's realtime client will fall back to using React Native's built-in WebSocket
    return { type: 'empty' };
  }
  // Otherwise, use the default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config; 