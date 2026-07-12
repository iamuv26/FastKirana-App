module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { 
        jsxImportSource: "nativewind", 
        worklets: false, 
        reanimated: false,
        native: { worklets: false, reanimated: false },
        web: { worklets: false, reanimated: false }
      }],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin",
    ],
  };
};
