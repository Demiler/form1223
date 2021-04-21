const { resolve } = require('path');
const common = require("./webpack.common.js");
const { merge } = require("webpack-merge");
let HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: resolve(__dirname, 'build'),
    filename: 'bundle.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
  ],
  module: {
    rules: [
      { 
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ] 
      },
    ],
  }
});
