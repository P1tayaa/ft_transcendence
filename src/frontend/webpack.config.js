// src/frontend/webpack.config.js
const path = require('path');

module.exports = {
  entry: './js/main.js',  // Your Three.js entry point
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  mode: 'development',
  resolve: {
    extensions: ['.js']
  }
};
