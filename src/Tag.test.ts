import * as T from './Tag'

describe('Tag', () =>
  describe('tag', () => {
    test('creating tag', () => {
      expect(typeof T.tag<never>().key).toStrictEqual('symbol')
    })
    test('creating tag providing key', () => {
      const symbol = Symbol()

      expect(T.tag<never>(symbol).key).toStrictEqual(symbol)
    })
    test('creating tag with description', () => {
      expect(T.tag<never>('foo').key.description).toStrictEqual('foo')
    })
  }))
