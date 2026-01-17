module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@/src': './src',
            '@/assets': './assets',
            '@/components': './src/components',
            '@/hooks': './src/hooks',
            '@/constants': './src/constants',
            '@/types': './src/types',
            '@/utils': './src/utils',
            '@/services': './src/services',
            '@/config': './src/config',
            '@/features': './src/features',
          },
          extensions: [
            '.js',
            '.jsx',
            '.ts',
            '.tsx',
            '.android.js',
            '.android.tsx',
            '.ios.js',
            '.ios.tsx',
          ],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
