const path = require('path');
const config = {
  entry: path.resolve('35/source/index.js'),
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  output: {
    path: path.resolve('35/dist'),
    filename: '35.min.js',
  },
  module: {
    rules: [
      {
        test: /.js?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  performance: {
    maxEntrypointSize: 10000000,
    maxAssetSize: 10000000,
  },
};

module.exports = (env, argv) => {
  'use strict';
  if (argv.mode === 'development') {
    config.devtool = 'source-map';
    false;
  }

  if (argv.mode === 'production') {
    //...
  }
  return [config];
};
