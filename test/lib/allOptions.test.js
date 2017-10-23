const allOptions = require('./allOptions')

describe('allOptions', () => {

    it('no variable', () => {
        const options = {}
        expect(Array.from(allOptions(options))).toEqual([{}])
    })

    it('variable with zero options', () => {
        const options = { a: [] }
        expect(() => allOptions(options)).toThrow()
    })

    it('only option', () => {
        const options = { a: [1] }
        expect(Array.from(allOptions(options))).toEqual([{ a: 1 }])
    })

    it('two options', () => {
        const options = { a: [1, 2] }
        expect(Array.from(allOptions(options))).toEqual([{ a: 1 }, { a: 2 }])
    })

    it('two variables', () => {
        const options = { a: [1], b: [3] }
        expect(Array.from(allOptions(options))).toEqual([{ a: 1, b: 3 }])
    })

    it('two variables, two options', () => {
        const options = { a: [1, 2], b: [3, 4] }
        expect(Array.from(allOptions(options))).toEqual(expect.arrayContaining([
            { a: 1, b: 3 },
            { a: 1, b: 4 },
            { a: 2, b: 3 },
            { a: 2, b: 4 }
        ]))
    })
})
