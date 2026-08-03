module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 54) automatically configures the
    // react-native-worklets/Reanimated plugin, so no extra plugin is needed.
    presets: ['babel-preset-expo'],
  };
};
