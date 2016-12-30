# flow-webpack-plugin

A webpack plugin allowing to call `flow` type checker.

## Key features

* It doesn't require `flow` to be in `$PATH`.
* No dependencies. Plugin can reuse project's `flow-bin` installation.
* It can make `webpack` to exit with non-zero return code, if flow validation fails.
* It works per project, not per file.

## Installation

```
npm install --save-dev flow-webpack-plugin
```

Webpack configuration file:

```js
const FlowWebpackPlugin = require('flow-webpack-plugin')

module.exports = {
    plugins: [
        new FlowWebpackPlugin(),
        // new FlowWebpackPlugin({
        //     failOnError: false,
        //     failOnErrorWatch: false,
        //     printFlowOutput: true,
        //     flowPath: require.main.require('flow-bin'),
        //     flowArgs: []
        // }),
        // ...
    ],
    // ...
}
```

## Configuration

Constructor of `FlowWebpackPlugin` accepts optional configuration object of following properties:

* `failOnError: boolean`, default: `false`  
  Webpack exits with non-zero error code if flow typechecking fails.
* `failOnErrorWatch: boolean`, default: `false`  
  Webpack in watch mode exits with non-zero error code if flow typechecking fails.
* `printFlowOutput: boolean`, default: `true`  
  `true` ~ Output of `flow` is redirected to stdout/stderr of webpack, `false` output of `flow` is discarded.
* `flowPath: string`, default: `require.main.require('flow-bin')`  
  Path to flow executable.
* `flowArgs: Array<string>`, default: `[]`  
  Flow command line arguments.
