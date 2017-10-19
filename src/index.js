// @flow

// incomplete definition in flow library
declare var require: {
    (id: string): any,
    main: typeof module
}

const EOL = require('os').EOL
const spawn = require('child_process').spawn
const process = require('process')

const PLUGIN_PREFIX = '[flow-webpack-plugin]'
const NOOP = (_) => {}

/** option value => webpack collection name */
const REPORTING_SEVERITY = {
    warning: 'warnings',
    error: 'errors'
}

type ReportingSeverity = $Keys<typeof REPORTING_SEVERITY>

interface OptionalOptions {
    failOnError: ?boolean,
    failOnErrorWatch: ?boolean,
    reportingSeverity: ?ReportingSeverity,
    printFlowOutput: ?boolean,
    flowPath: ?string,
    flowArgs: ?Array<string>,
    verbose: ?boolean,
    callback: ?CallbackType
}

interface Compiler {
    plugin: (string, (compilation: any, callback: (error: ?mixed) => void) => void) => void
}

type CallbackType = (FlowResult) => ?Promise<any>

interface Options {
    failOnError: boolean,
    failOnErrorWatch: boolean,
    reportingSeverity: ReportingSeverity,
    printFlowOutput: boolean,
    flowPath: string,
    flowArgs: Array<string>,
    verbose: boolean,
    callback: CallbackType
}

type CompleteFlowResult = {
    successful: boolean
} & FlowResult

type FlowResult = {
    exitCode: number,
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

FlowWebpackPlugin.prototype.apply = function(compiler: Compiler) {
    const plugin = this

    let flowResult: CompleteFlowResult
    let flowExecutionError: any = undefined;

    const runCallback = failOnError =>
        (compiler, webpackCallback) => {
            flowCheck()
                .then(result => {
                    flowResult = result
                    callUserCallback(webpackCallback)
                })
                .catch(error => {
                    flowExecutionError = error
                    failOnError ? webpackCallback('Flow execution failed. ' + error) : webpackCallback()
                })
        }

    compiler.plugin('after-emit', (compilation, callback) => {
        const reportingCollectionName = REPORTING_SEVERITY[plugin.options.reportingSeverity]
        if (flowExecutionError) {
            /*
             * Passed object will be printed at the end of the compilation in red
             * (unless specified otherwise), webpack still emits assets,
             * return code will still 0.
             */
            compilation[reportingCollectionName].push('Flow execution: ' + flowExecutionError)
            callback()
            return
        }

        if (flowResult.successful) {
            callback()
            return
        }

        const details = plugin.options.printFlowOutput ? (EOL + formatFlowOutput(flowResult)) : ''
        compilation[reportingCollectionName].push('Flow validation' + details)
        callback()
    })

    /*
     * callbacks chosen because it is required
     * * to be done before or at time of 'compilation callback' - to avoid expensive compilation when type error present
     * * hook needs to be asynchronous
     */
    compiler.plugin('run', runCallback(plugin.options.failOnError))
    compiler.plugin('watch-run', runCallback(plugin.options.failOnErrorWatch))

    function callUserCallback(webpackCallback: (?mixed) => void) {
        let userCallbackResult
        try {
            log('About to call user callback.')
            userCallbackResult = plugin.options.callback(flowResult)
        } catch (userCallbackException) {
            console.warn(PLUGIN_PREFIX, 'User callback failed throwing:', userCallbackException)
            afterUserCallback(webpackCallback)
            return
        }
        if (!(userCallbackResult instanceof Promise)) {
            log('User callback synchronously ended.')
            afterUserCallback(webpackCallback)
            return
        }
        log('User callback returned a promise. Waiting for it.')
        userCallbackResult.then(
            () => {
                log('User callback promise resolved.')
                afterUserCallback(webpackCallback)
            },
            (userCallbackException) => {
                console.warn(PLUGIN_PREFIX, 'Callback failed throwing:', userCallbackException)
                afterUserCallback(webpackCallback)
            }
        )
    }

    function afterUserCallback(webpackCallback: (?mixed) => void) {
        if (!flowResult.successful && plugin.options.failOnError) {
            const details = plugin.options.printFlowOutput ? (EOL + formatFlowOutput(flowResult)) : ''

            /*
             * argument passed to callback() causes webpack to immediately stop, even in watch mode,
             * don't emit assets, and set return code to 1
             */
            webpackCallback('Flow validation failed.' + details)
            return
        }
        webpackCallback()
    }

    function formatFlowOutput(result: CompleteFlowResult): string {
        return prefixIfVerbose('flow stdout', result.stdout)
            + prefixIfVerbose('flow stderr', result.stderr)
    }

    function prefixIfVerbose(prefix: string, lines: string): string {
        return plugin.options.verbose ? prefixLines(prefix, lines) : lines
    }

    function flowCheck(): Promise<CompleteFlowResult> {
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
                    get successful() {
                        return this.exitCode === 0
                    },
                    exitCode,
                    stdout,
                    stderr
                })
            })
        })
    }

    function getStdioOptions(): string {
        return (plugin.options.printFlowOutput || plugin.options.callback === NOOP)
            ? 'pipe'
            : 'ignore'
    }

    function log(...messages: Array<mixed>) {
        if (plugin.options.verbose) {
            pluginPrint(...messages)
        }
    }
}

function pluginPrint(...messages: Array<mixed>) {
    console.log(PLUGIN_PREFIX, ...messages)
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
    const reportingSeverityTypeName = Object.keys(REPORTING_SEVERITY).map(item => `'${item}'`).join(' | ');
    validateOption(options, 'reportingSeverity', isEnum(Object.keys(REPORTING_SEVERITY)), reportingSeverityTypeName)
    validateOption(options, 'flowPath', isString, 'string')
    validateOption(options, 'flowArgs', isArrayOfStrings, 'Array<string>')
    validateOption(options, 'callback', isFunction, '({successful: boolean, stdout: string, stderr: string}) => void')
}

function isEnum(items: Array<string>) {
    return object => (items: Array<any>).includes(object)
}

function isFunction(object: mixed) {
    return typeof object === 'function'
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

function getDefaultFlowArgs(): Array<string> {
    return process.stdout.isTTY
        ? ['--color=always']
        : []
}

function applyOptionsDefaults(optionalOptions: OptionalOptions): Options {
    const defaultOptions: Options = {
        failOnError: false,
        failOnErrorWatch: false,
        reportingSeverity: 'error',
        printFlowOutput: true,
        flowPath: getLocalFlowPath(),
        flowArgs: getDefaultFlowArgs(),
        verbose: false,
        callback: NOOP
    }
    return (Object.assign({}, defaultOptions, optionalOptions): any)
}

class FlowWebpackPluginError extends Error {}

module.exports = FlowWebpackPlugin
