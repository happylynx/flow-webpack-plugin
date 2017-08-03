// @flow

// incomplete definition in flow library
declare var require: {
    (id: string): any,
    main: typeof module
}

const EOL = require('os').EOL
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

type CheckResult = {
    successful: boolean,
    stdout: string,
    stderr: string
}

function FlowWebpackPlugin(options: OptionalOptions) {
    options = options || {}
    this.options = applyOptionsDefaults(options)
    validateOptions(this.options)
    if (this.options.verbose) {
        pluginPrint('Options:')
        Object.keys(this.options).forEach(optionName => pluginPrint(`${optionName}=${this.options[optionName]}`))
    }
}

function prefixLines(prefix: string, lines: string): string {
    return lines.split(/\r?\n/)
        .map(line => prefix + ': ' + line)
        .join(EOL) + EOL
}

FlowWebpackPlugin.prototype.apply = function(compiler) {
    const plugin = this

    let flowResult: CheckResult
    let flowExecutionError: any = undefined;

    const runCallback = failOnError =>
        (compiler, callback) => {
            flowCheck()
                .then(result => {
                    if (!result.successful && failOnError) {
                        const details = plugin.options.printFlowOutput ? (EOL + formatFlowOutput(result)) : ''

                        /*
                         * argument passed to callback() causes webpack to immediately stop, even in watch mode,
                         * don't emit assets, and set return code to 1
                         */
                        callback('Flow validation failed.' + details)
                        return
                    }
                    flowResult = result
                    callback()
                })
                .catch(error => {
                    flowExecutionError = error
                    failOnError ? callback('Flow execution failed. ' + error) : callback()
                })
        }

    compiler.plugin('compilation', compilation => {
        if (flowExecutionError) {
            /*
             * Passed object will be printed at the end of the compilation in red
             * (unless specified otherwise), webpack still emits assets,
             * return code will still 0.
             */
            compilation.errors.push('Flow execution: ' + flowExecutionError)
            return
        }

        if (flowResult.successful) {
            return
        }

        const details = plugin.options.printFlowOutput ? (EOL + formatFlowOutput(flowResult)) : ''
        compilation.errors.push('Flow validation' + details)
    })

    /*
     * callbacks chosen because it is required
     * * to be done before or at time of 'compilation callback' - to avoid expensive compilation when type error present
     * * hook needs to be asynchronous
     */
    compiler.plugin('run', runCallback(plugin.options.failOnError))
    compiler.plugin('watch-run', runCallback(plugin.options.failOnErrorWatch))

    function formatFlowOutput(result: CheckResult): string {
        return prefixIfVerbose('flow stdout', result.stdout)
            + prefixIfVerbose('flow stderr', result.stderr)
    }

    function prefixIfVerbose(prefix: string, lines: string): string {
        return plugin.options.verbose ? prefixLines(prefix, lines) : lines
    }

    function flowCheck(): Promise<CheckResult> {
        return new Promise((resolve, reject) => {
            log(`spawning flow`)
            const flowProcess = spawn(plugin.options.flowPath, plugin.options.flowArgs, {
                stdio: getStdioOptions()
            })
            let stdout: string = ''
            let stderr: string = ''
            plugin.options.printFlowOutput && flowProcess.stdout.on('data', data => stdout += data.toString())
            plugin.options.printFlowOutput && flowProcess.stderr.on('data', data => stderr += data.toString())
            let resolved = false
            flowProcess.on('error', error => {
                pluginPrint('flow execution failed. Please make sure that the `flowPath` option is correctly set.'
                    , error)
                reject(error)
                resolved = true
            })
            flowProcess.on('exit', exitCode => {
                log('flow exited with return code ' + exitCode)
                if (resolved) {
                    return
                }
                resolve({
                    successful: exitCode === 0,
                    stdout,
                    stderr
                })
            })
        })
    }

    function getStdioOptions(): string {
        return plugin.options.printFlowOutput ? 'pipe' : 'ignore'
    }

    function log(...messages) {
        if (plugin.options.verbose) {
            pluginPrint(...messages)
        }
    }
}

function pluginPrint(...messages: Array<string>) {
    console.log('flow-webpack-plugin:', ...messages)
}

function getLocalFlowPath(): string {
    try {
        return require.main.require('flow-bin')
    } catch (e) {
        try {
            return require('flow-bin')
        } catch (e) {
            const error: (Error & {cause: mixed}) = (new FlowWebpackPluginError('`flow` can\'t be found. Please either install it (`npm install --save-dev flow-bin`) or set `flowPath` option.'): any)
            error.cause = e
            throw error
        }
    }
}

function validateOptions(options: Options) {
    validateOption(options, 'flowPath', isString, 'string')
    validateOption(options, 'flowArgs', isArrayOfStrings, 'Array<string>')
}

function validateOption(options: Options,
                        optionName: string,
                        validationFunction: (mixed) => boolean,
                        typeName: string) {
    const value = (options: any)[optionName]
    if (!validationFunction(value)) {
        throw new FlowWebpackPluginError(`Option '${optionName}' is not of required type '${typeName}'. Actual value is '${value}'`)
    }
}

function isString(object: mixed): boolean {
    return typeof object === 'string' || object instanceof String
}

function isArrayOfStrings(object: mixed) {
    return Array.isArray(object)
        && object.every(item => isString(item))
}

function applyOptionsDefaults(optionalOptions: OptionalOptions): Options {
    const defaultOptions: Options = {
        failOnError: false,
        failOnErrorWatch: false,
        printFlowOutput: true,
        flowPath: getLocalFlowPath(),
        flowArgs: ['--color=always'],
        verbose: false
    }
    return (Object.assign({}, defaultOptions, optionalOptions): any)
}

class FlowWebpackPluginError extends Error {}

module.exports = FlowWebpackPlugin
