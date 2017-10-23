// @flow

const OMIT = {
    toJSON: () => 'OMIT'
}

/**
 * It returns all combinations of values of properties of options parameter
 * @param options map: option name -> array of option values
 * @returns iterable of all combinations of option values
 */
module.exports = function(options: {[string]: Array<any>}): Iterable<{[string]: any}> {
    validate(options)
    return {
        [Symbol.iterator]: () => createIterator(options)
    }
}

Object.defineProperty(module.exports, 'OMIT', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: OMIT
})

function validate(options: {[string]: Array<any>}): void {
    Object.keys(options).forEach(optionName => {
        if (typeof optionName !== 'string') {
            throw `Option '${optionName}' in ${JSON.stringify(options)} is not of type 'string'.`
        }
        const value = options[optionName]
        if (!Array.isArray(value)) {
            throw `Value of option '${optionName}' in ${JSON.stringify(options)} is not an array.`
        }
        if (value.length === 0) {
            throw `Option '${optionName}' in ${JSON.stringify(options)} is an empty array.`
        }
    })
}

function* createIterator(options: {[string]: Array<any>}): Generator<{[string]: any}> {

    const sortedKeys = getSortedKeys(options)
    const optionsArrays = optionsTo2dArray(options)

    function selectOptions(optionIndices: Array<number>): {[string]: any} {
        return optionIndices.reduce((obj, index, indexOfIndex) => {
            const value = optionsArrays[indexOfIndex][index]
            if (value !== OMIT) {
                obj[sortedKeys[indexOfIndex]] = optionsArrays[indexOfIndex][index]
            }
            return obj
        }, {})
    }

    for (let indices of allIndices(optionsArrays.map(x => x.length))) {
        yield selectOptions(indices)
    }
}

function optionsTo2dArray(options: {[string]: Array<any>}): Array<Array<any>> {
    return getSortedKeys(options).map(key => options[key])
}

function getSortedKeys(object: Object): Array<string> {
    return Object.keys(object).sort()
}

function* allIndices(optionNumbers: Array<number>): Generator<Array<number>> {

    function toIndices(complexIndex: number): Array<number> {
        let complexNumber = complexIndex
        return optionNumbers.reduce((resultArray, optionNumber) => {
            const remainder = complexNumber % optionNumber
            complexNumber = Math.floor(complexNumber / optionNumber)
            return [...resultArray, remainder]
        }, [])
    }

    const numberOfCombinations = optionNumbers.reduce((product, number) => product * number, 1)
    const combinationKeys = Array.from(Array(numberOfCombinations).keys())
    for (let combinationKey in combinationKeys) {
        yield toIndices(combinationKey)
    }
}
