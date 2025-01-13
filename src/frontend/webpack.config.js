// src/frontend/webpack.config.js
const path = require('path');

module.exports = {
  entry: './threejs/main.js',  // Your Three.js entry point
  output: {
    path: path.resolve(__dirname),
    filename: 'bundle.js'
  },
  mode: 'development',
  resolve: {
    extensions: ['.js']
  }
};
