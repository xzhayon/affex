import * as $Tag from './Tag'

describe('Tag', () =>
  describe('tag', () => {
    test('creating tag', () => {
      expect(typeof $Tag.tag<never>().key).toStrictEqual('symbol')
    })

    test('creating tag providing key', () => {
      const symbol = Symbol()

      expect($Tag.tag<never>(symbol).key).toStrictEqual(symbol)
    })

    test('creating tag with description', () => {
      expect($Tag.tag<never>('foo').key.description).toStrictEqual('foo')
    })
  }))
