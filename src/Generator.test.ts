import * as $Generator from './Generator'

describe('Generator', () => {
  describe('sequence', () => {
    test('unwrapping array of generators', () => {
      const generator = $Generator.sequence(
        [42, 1337].map(function* (n) {
          yield n * 2
        }),
      )
      const as: number[] = []
      for (const a of generator) {
        as.push(a)
      }

      expect(as).toStrictEqual([42 * 2, 1337 * 2])
    })
  })

  describe('traverse', () => {
    test('applying generator function to array elements', () => {
      const generator = $Generator.traverse([42, 1337], function* (n) {
        yield n * 2
      })
      const bs: number[] = []
      for (const b of generator) {
        bs.push(b)
      }

      expect(bs).toStrictEqual([42 * 2, 1337 * 2])
    })
  })
})
