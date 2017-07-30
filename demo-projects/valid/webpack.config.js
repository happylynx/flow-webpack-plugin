const path = require('path')

const FlowWebpackPlugin = require('../..')

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
            include: [
                path.resolve('src')
            ],
            loader: "babel-loader"
        }]
    }
}
