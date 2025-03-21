const path = require('path');

const isProduction = (process.env.NODE_ENV === 'production');

module.exports = {
  entry: '../frontend/main.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'main.bundle.js',
    // This ensures webpack understands where assets will be served from
    publicPath: '/staticfiles/'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  optimization: {
    minimize: isProduction,
  },
  devtool: isProduction ? false : 'source-map',
  mode: isProduction ? 'production' : 'development',
};