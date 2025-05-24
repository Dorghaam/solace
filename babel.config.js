module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Ensure this is the last plugin in the array.
      'react-native-reanimated/plugin',
    ],
  };
}; 