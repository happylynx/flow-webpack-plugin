const allOptions = require('./lib/allOptions')
const FlowWebpackPlugin = require('../dist')

function configToString(options) {
    return JSON.stringify(
        options,
        (key, value) => {
            if (typeof value === 'function') {
                return value.toString()
            }
            return value
        })
}

describe('all callbacks are registered', () => {

    const optionsConfiguration = {
        failOnError: [allOptions.OMIT, true, false],
        failOnErrorWatch: [allOptions.OMIT, true, false],
        reportingSeverity: [allOptions.OMIT, 'warning', 'error'],
        printFlowOutput: [allOptions.OMIT, true, false],
        flowPath: [allOptions.OMIT],
        flowArgs: [allOptions.OMIT, ['--color=always']],
        verbose: [allOptions.OMIT, true, false],
        callback: [allOptions.OMIT, () => {}, () => Promise.resolve(undefined)]
    }

    for (let options of allOptions(optionsConfiguration)) {
        const configurationString = configToString(options)
        it('options: ' + configurationString, () => {

            const plugin = new FlowWebpackPlugin(options)

            const webpackMock = {
                plugin: jest.fn()
            }

            plugin.apply(webpackMock)

            expect(webpackMock.plugin).toHaveBeenCalledTimes(3)
            const firstParams = webpackMock.plugin.mock.calls.map(params => params[0])
            const secondParams = webpackMock.plugin.mock.calls.map(params => params[1])
            expect(firstParams).toContain('run')
            expect(firstParams).toContain('watch-run')
            expect(firstParams).toContain('after-emit')
            secondParams.forEach(secondParam => expect(secondParam).toEqual(expect.any(Function)))
        })
    }

})
