const path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')

const FlowWebpackPlugin = require('../..')


module.exports = {
    entry: {
        main: './src/index.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js'
    },
    plugins: [
        new FlowWebpackPlugin(),
        new HtmlWebpackPlugin()
    ],
    module: {
        rules: [{
            test: /\.jsx?$/,
            use: [{
                loader: 'babel-loader'
            }]
        }]
    },
    bail: true
}
