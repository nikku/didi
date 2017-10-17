var path = require('path');

var webpack = require('webpack');

module.exports = {
  entry: './lib/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'didi.js',
    library: 'didi',
    libraryTarget: 'umd'
  },
  target: 'node',
  module: {
    rules: [{
      use: 'babel-loader',
      test: /\.js$/,
      exclude: /node_modules/
    }]
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin()
  ],
  devtool: 'source-map'
};