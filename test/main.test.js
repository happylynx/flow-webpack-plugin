
mockSpawn()

function mockSpawn() {
    jest.mock('child_process', () => ({
        spawn: jest.fn()
    }))
}

describe('plugin', () => {

    beforeEach(() => {
        jest.resetModules()
    })

    it('should register all callbacks', () => {
        const compilerMock = new CompilerMock();
        createPlugin().apply(compilerMock)
        expect(compilerMock.callbacks.run.length).toBe(1)
        expect(compilerMock.callbacks['watch-run'].length).toBe(1)
        expect(compilerMock.callbacks.compilation.length).toBe(1)
    })

    it('should call run callback', () => {
        const compilerMock = new CompilerMock();
        createPlugin().apply(compilerMock)
        return new Promise((resolve) => {
            compilerMock.callbacks.run[0](compilerMock, resolve)
        })
    })

    it('should spawn flow', () => {
        const compilerMock = new CompilerMock()
        const spawnMock = require('child_process').spawn
        spawnMock.mockReturnValueOnce(createChildProcess())
        createPlugin().apply(compilerMock)
        compilerMock._run()
        expect(spawnMock).toBeCalled()

    })

    it('shouldn\'t report error if flow exits successfully', async () => {
        const spawnMock = require('child_process').spawn
        const childProcess = {
            on: jest.fn((name, handler) => {
                if (name === 'exit') {
                    setTimeout(handler.bind(undefined, 0), 0)
                }
            })
        }
        spawnMock.mockReturnValueOnce(childProcess)
        const compilerMock = new CompilerMock()
        createPlugin().apply(compilerMock)
        const runErrors = await compilerMock._run()
        const compilationErrors = await compilerMock._compilation()
        expect(runErrors).toEqual([])
        expect(compilationErrors).toEqual([])
    })

    it('shouldn\'t report error if flow exits successfully, two times', () => {})
    it('should report error if flow exits with errors', () => {})
    it('should report error if flow exits with errors, two times', () => {})
    it('should throw exception if flow fails to start', () => {})
    it('should throw exception if flow fails to start, two times', () => {})
    it('should stop webpack if flow exits with errors and failOnError is set', () => {})
    it('should print arguments if verbose option is set', () => {})
    it('should pass flowPath option if set', () => {})
    it('should pass flowArgs option if set', () => {})
    it('should pass printFlowOutput option if set', () => {})
    it('should fail if flowPath option is of bad type', () => {})
    it('should fail if flowArgs option is of bad type', () => {})
    it('should use expected default for option failOnError', () => {})
    it('should use expected default for option failOnErrorWatch', () => {})
    it('should use expected default for option printFlowOutput', () => {})
    it('should use expected default for option flowPath', () => {})
    it('should use expected default for option flowArgs', () => {})
    it('should use expected default for option verbose', () => {})
})

function createChildProcess() {
    return {
        on: jest.fn()
    }
}

function createPlugin(...options) {
    return new (require('..'))(...options)
}

class CompilerMock {

    constructor() {
        this.callbacks = {
            run: [],
            'watch-run': [],
            compilation: []
        }
    }

    plugin(callbackName, callbackFunction) {
        this.callbacks[callbackName].push(callbackFunction)
    }

    /**
     * @return {Promise<Array<any>>} run errors
     */
    _run() {
        return new Promise((resolve, reject) => {

            this.callbacks.run[0](this, callbackFn)

            function callbackFn(...errors) {
                resolve(errors)
            }
        })
    }

    /**
     * @return {Promise<Array<any>} compilation errors
     */
    _compilation() {
        return new Promise((resolve, reject) => {
            const compilation = {
                errors: []
            }
            this.callbacks.compilation[0](compilation)
            resolve(compilation.errors)
        })
    }
}
