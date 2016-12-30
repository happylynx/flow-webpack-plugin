# flow-webpack-plugin

A webpack plugin allowing to call `flow` type checker.

## Key features

* It doesn't require `flow` to be in `$PATH`.
* It can make `webpack` to exit with non-zore return code, if flow validation fails.
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
        // ...
    ],
    // ...
}
```

## Configuration

Constructor of `FlowWebpackPlugin` accepts optional configuration object of following properties:

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `failOnError` | `boolean` | `false` | Webpack exits with non-zero error code if flow typechecking fails. |
| `failOnErrorWatch` | `boolean` | `false` | Webpack in watch mode exits with non-zero error code if flow typechecking fails. |
| `printFlowOutput` | `boolean` | `true` | `true` ~ Output of `flow` is redirected to stdout/stderr of webpack, `false` output of `flow` is discarted. |
| `flowPath` | `string` | value of `require('flow-bin')` | Path to flow executable. |
| `flowArgs` | `Array<string>` | `[]` | Flow command line arguments. |
