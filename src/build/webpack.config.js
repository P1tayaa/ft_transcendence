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
  resolve: {
    modules: [
      path.resolve(__dirname, '../node_modules'),
      'node_modules'
    ],
    extensions: ['.js', '.json'],
    alias: {
      'three': path.resolve(__dirname, 'node_modules/three')
    }
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
      },
      {
        test: /\.(glb|gltf)$/,
        use: {
          loader: 'file-loader',
          options: {
            outputPath: 'models/',
            name: '[name].[ext]',
          },
        },
      },
    ]
  },
  optimization: {
    minimize: isProduction,
  },
  devtool: isProduction ? false : 'source-map',
  mode: isProduction ? 'production' : 'development',
};