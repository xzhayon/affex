import * as G from './Generator'

describe('Generator', () => {
  describe('traverse', () => {
    test('applying generator function to array elements', () => {
      const generator = G.traverse([42, 1337], function* (n) {
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
