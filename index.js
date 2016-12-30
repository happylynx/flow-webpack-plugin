const spawn = require('child_process').spawn

function FlowWebpackPlugin(options) {
    options = options || {}
    applyOptionsDefaults(options)
    this.options = options
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
                        errorToReport = new Error('Flow validation failed.')
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
    const flowPackageName = 'flow-bin'
    try {
        return require.main.require(flowPackageName)
    } catch (e) {
        try {
            require(flowPackageName)
        } catch (e) {
            const error = new Error('`flow` can\'t be found. Please either install it (`npm install --save-dev flow-bin`) or set `flowPath` option.')
            error.cause = e
            throw error
        }
    }
}

function applyOptionsDefaults(options) {
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
}

module.exports = FlowWebpackPlugin