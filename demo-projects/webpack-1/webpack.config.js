const FlowWebpackPlugin = require('flow-webpack-plugin')

module.exports = {
    entry: {
        main: './src/index.js'
    },
    output: {
        path: 'dist',
        filename: '[name].bundle.js'
    },
    plugins: [
        new FlowWebpackPlugin()
    ],
    module: {
        loaders: [{
            test: /.jsx?$/,
            loader: 'babel-loader'
        }]
    }
}
