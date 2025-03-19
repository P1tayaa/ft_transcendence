const resolve = require("path").resolve;

module.exports = {
  entry: "./src/main.js",
  output: {
    path: resolve(__dirname, "../../../static/js/threejs"),
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
    minimize: false,
  },
  mode: "production",
};