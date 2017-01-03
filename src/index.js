// @flow

// incomplete definition in flow library
declare var require: {
    (id: string): any,
    main: typeof module
}

const spawn = require('child_process').spawn

interface OptionalOptions {
    failOnError: ?boolean,
    failOnErrorWatch: ?boolean,
    printFlowOutput: ?boolean,
    flowPath: ?string,
    flowArgs: ?Array<string>
}

interface Options {
    failOnError: boolean,
    failOnErrorWatch: boolean,
    printFlowOutput: boolean,
    flowPath: string,
    flowArgs: Array<string>,
}

function FlowWebpackPlugin(options: OptionalOptions) {
    options = options || {}
    this.options = applyOptionsDefaults(options)
}

FlowWebpackPlugin.prototype.apply = function(compiler) {
    const plugin = this

    let errorToReport = undefined

    const runCallback = failOnError =>
        (compiler, callback) => {
            errorToReport = null
            flowCheck()
                .then(successful => {
                    if (!successful) {
                        errorToReport = new Error('Flow validation.')
                    }
                    (!successful && failOnError) ? callback(errorToReport) : callback()
                })
                .catch(error => {
                    errorToReport = error
                    failOnError ? callback(error) : callback()
                })
        }

    compiler.plugin('compilation', compilation => {
        if (!!errorToReport) {
            compilation.errors.push(errorToReport)
        }
    })

    compiler.plugin('run', runCallback(plugin.options.failOnError))
    compiler.plugin('watch-run', runCallback(plugin.options.failOnErrorWatch))

    function flowCheck() {
        return new Promise((resolve, reject) => {
            const flowProcess = spawn(plugin.options.flowPath, plugin.options.flowArgs, {
                stdio: plugin.options.printFlowOutput ? 'inherit' : 'ignore'
            })
            let resolved = false
            flowProcess.on('error', error => {
                reject(error)
                resolved = true
            })
            flowProcess.on('exit', exitCode => {
                if (resolved) {
                    return
                }
                resolve(exitCode == 0)
            })
        })
    }
}

function getLocalFlowPath() {
    try {
        return require.main.require('flow-bin')
    } catch (e) {
        try {
            require('flow-bin')
        } catch (e) {
            const error: (Error & {cause: mixed}) = (new Error('`flow` can\'t be found. Please either install it (`npm install --save-dev flow-bin`) or set `flowPath` option.'): any)
            error.cause = e
            throw error
        }
    }
}

function applyOptionsDefaults(options: OptionalOptions): Options {
    if (!('failOnError' in options)) {
        options.failOnError = false
    }
    if (!('failOnErrorWatch' in options)) {
        options.failOnErrorWatch = false
    }
    if (!('printFlowOutput' in options)) {
        options.printFlowOutput = true
    }
    if (!('flowPath' in options)) {
        options.flowPath = getLocalFlowPath()
    }
    if (!('flowArgs' in options)) {
        options.flowArgs = []
    }
    return (options: any)
}

module.exports = FlowWebpackPlugin
