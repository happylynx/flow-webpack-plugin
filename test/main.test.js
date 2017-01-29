
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
        spawnMock.mockReturnValueOnce(createDummyChildProcess())
        createPlugin().apply(compilerMock)
        compilerMock._run()
        expect(spawnMock).toBeCalled()

    })

    it('shouldn\'t report error if flow exits successfully', async () => {
        const spawnMock = require('child_process').spawn
        spawnMock.mockReturnValueOnce(createSuccessfulProcess())
        const compilerMock = new CompilerMock()
        createPlugin().apply(compilerMock)
        const runErrors = await compilerMock._run()
        const compilationErrors = await compilerMock._compilation()
        expect(runErrors).toEqual([])
        expect(compilationErrors).toEqual([])
    })

    it('shouldn\'t report error if flow exits successfully, two times', async () => {
        const spawnMock = require('child_process').spawn
        spawnMock.mockReturnValueOnce(createSuccessfulProcess())
        spawnMock.mockReturnValueOnce(createSuccessfulProcess())
        const compilerMock = new CompilerMock()
        createPlugin().apply(compilerMock)
        const runErrors1 = await compilerMock._run()
        const compilationErrors1 = await compilerMock._compilation()
        expect(runErrors1).toEqual([])
        expect(compilationErrors1).toEqual([])
        const runErrors2 = await compilerMock._run()
        const compilationErrors2 = await compilerMock._compilation()
        expect(runErrors2).toEqual([])
        expect(compilationErrors2).toEqual([])
    })


    it('should report error if flow exits with errors', async () => {
        const spawnMock = require('child_process').spawn
        spawnMock.mockReturnValueOnce(createFailingProcess())
        const compilerMock = new CompilerMock()
        createPlugin().apply(compilerMock)
        const runErrors = await compilerMock._run()
        const compilationErrors = await compilerMock._compilation()
        expect(runErrors).toEqual([])
        expect(compilationErrors).toEqual([new Error('Flow validation.')])
    })

    it('should report error if flow exits with errors, two times', async () => {
        const spawnMock = require('child_process').spawn
        spawnMock.mockReturnValueOnce(createFailingProcess())
        spawnMock.mockReturnValueOnce(createFailingProcess())
        const compilerMock = new CompilerMock()
        createPlugin().apply(compilerMock)
        const runErrors1 = await compilerMock._run()
        expect(runErrors1).toEqual([])
        const compilationErrors1 = await compilerMock._compilation()
        expect(compilationErrors1).toEqual([new Error("Flow validation.")])
        const runErrors2 = await compilerMock._run()
        expect(runErrors2).toEqual([])
        const compilationErrors2 = await compilerMock._compilation()
        expect(compilationErrors2).toEqual([new Error('Flow validation.')])
    })

    it('should throw exception if flow fails to start', async () => {
        const spawnMock = require('child_process').spawn
        spawnMock.mockReturnValueOnce(createProcessFailedToStart())
        const compilerMock = new CompilerMock()
        createPlugin().apply(compilerMock)
        const runErrors = await compilerMock._run()
        expect(runErrors).toEqual([])
        const compilationErrors = await compilerMock._compilation()
        expect(compilationErrors).toEqual(['some error'])
    })

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

function createDummyChildProcess() {
    return {
        on: jest.fn()
    }
}

function createSuccessfulProcess() {
    return createChildProcess(
        userCallback => setTimeout(userCallback.bind(undefined, 0), 0),
        userCallback => undefined)
}

function createFailingProcess() {
    return createChildProcess(
        userCallback => setTimeout(userCallback.bind(undefined, 1), 0),
        userCallback => undefined)
}

function createProcessFailedToStart() {
    return createChildProcess(
        userCallback => undefined,
        userCallback => setTimeout(userCallback.bind(undefined, 'some error'), 0))
}

function createChildProcess(exitHandler, errorHandler) {
    return {
        on: jest.fn((name, userCallback) => {
            if (name === 'exit') {
                exitHandler(userCallback)
                return
            }
            if (name === 'error') {
                errorHandler(userCallback)
                return
            }
        })
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
        return new Promise((resolve) => {

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
        return new Promise((resolve) => {
            const compilation = {
                errors: []
            }
            this.callbacks.compilation[0](compilation)
            resolve(compilation.errors)
        })
    }
}
