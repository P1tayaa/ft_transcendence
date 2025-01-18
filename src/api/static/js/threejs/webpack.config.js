/*
const path = require('path');

module.exports = {
  mode: 'production', // Use 'development' for easier debugging
  entry: './src/main.js', // Your entry file for Three.js
  output: {
    path: path.resolve(__dirname, 'dist'), // Directory for bundled files
    filename: 'bundle.js', // Output file name
    publicPath: '/static/js/threejs/dist/', // Path Django will use to serve the static files
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Match all .js files
        exclude: /node_modules/, // Exclude node_modules
        use: {
          loader: 'babel-loader', // Transpile modern JS for compatibility
          options: {
            presets: ['@babel/preset-env'], // Use preset-env for modern JS
            sourceType: 'unambiguous', // Handle both ESM and CommonJS modules
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js'], // Resolve these extensions automatically
  },
  devtool: 'source-map', // Generate source maps for easier debugging
};
*/

const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "../../../static/js/threejs"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  optimization: {
    minimize: true,
  },
};
