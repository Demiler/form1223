const { resolve } = require('path');
const common = require("./webpack.common.js");
const { merge } = require("webpack-merge");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
let HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: resolve(__dirname, 'app/public'),
    filename: 'bundle.[contentHash].js',
  },
  optimization: {
    minimizer: [
      new OptimizeCssPlugin(),
      new TerserPlugin(),
      new HtmlWebpackPlugin({
        template: './src/index.html',
        minify: {
          removeAttributeQuotes: true,
          collapseWhitespace: true,
          removeComments: true,
        },
      }),
    ]
  },
  module: {
    rules: [
      { 
        test: /\.css$/,
        use: [ MiniCssExtractPlugin.loader, 'css-loader' ] 
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[contentHash].css',
    }),
  ],
});
