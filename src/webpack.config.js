const path = require('path');

module.exports = {
  entry: './static/js/main.js',  // Your main JS file in Django static folder
  output: {
    path: path.resolve(__dirname, 'static/dist'),
    filename: 'bundle.js'
  },
  mode: 'development'
};
