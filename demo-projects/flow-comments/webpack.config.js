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
    ]
}
