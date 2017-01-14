const cp = require('child_process')

let spawnMock = () => undefined
cp.spawn = function() {
    return spawnMock.apply(this, arguments)
}

const originalLog = console.log
let logListener = (...a) => undefined
console.log = function (...a) {
    logListener(...a)
    originalLog.call(console, ...a)
}

const Plugin = require('../')

describe('plugin', () => {
    it('should register all callbacks', () => {
        const compilerMock = new CompilerMock();
        new Plugin().apply(compilerMock)
        expect(compilerMock.callbacks.run.length).toBe(1)
        expect(compilerMock.callbacks['watch-run'].length).toBe(1)
        expect(compilerMock.callbacks.compilation.length).toBe(1)
    })

    it('should call run callback', () => {
        const compilerMock = new CompilerMock();
        new Plugin().apply(compilerMock)
        return new Promise((resolve) => {
            compilerMock.callbacks.run[0](compilerMock, resolve)
        })
    })

    it('should spawn flow', () => {
        const spawnArguments = []
        spawnMock = function () {
            spawnArguments.push(arguments)
        }
        const compilerMock = new CompilerMock();
        new Plugin().apply(compilerMock)
        return new Promise((resolve) => {
            compilerMock.callbacks.run[0](compilerMock, () => {
                resolve(expect(spawnArguments.length).toBe(1))
            })
        })
    })

    it('shouldn\'t report error if flow exits successfully', () => {})
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

    simulateRun() {
        return new Promise((resolve, reject) => {

            this.callbacks.run[0](this, callbackFn)

            function callbackFn(error) {
                if (error) {
                    reject(error)
                }
            }
        })
    }
}
