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
    flowArgs: ?Array<string>,
    verbose: ?boolean
}

interface Options {
    failOnError: boolean,
    failOnErrorWatch: boolean,
    printFlowOutput: boolean,
    flowPath: string,
    flowArgs: Array<string>,
    verbose: boolean
}

function FlowWebpackPlugin(options: OptionalOptions) {
    options = options || {}
    this.options = applyOptionsDefaults(options)
    if (this.options.verbose) {
        pluginPrint('Options:')
        Object.keys(this.options).forEach(optionName => pluginPrint(`${optionName}=${this.options[optionName]}`))
    }
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
            log(`spawning flow`)
            const flowProcess = spawn(plugin.options.flowPath, plugin.options.flowArgs, {
                stdio: plugin.options.printFlowOutput ? 'inherit' : 'ignore'
            })
            let resolved = false
            flowProcess.on('error', error => {
                log('flow execution failed', error)
                reject(error)
                resolved = true
            })
            flowProcess.on('exit', exitCode => {
                log('flow exited with return code ' + exitCode)
                if (resolved) {
                    return
                }
                resolve(exitCode == 0)
            })
        })
    }

    function log(messages) {
        if (plugin.options.verbose) {
            pluginPrint(messages)
        }
    }
}

function pluginPrint(message: string) {
    console.log('flow-webpack-plugin: ' + message)
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
    if (!('verbose' in options)) {
        options.verbose = false
    }
    return (options: any)
}

module.exports = FlowWebpackPlugin
