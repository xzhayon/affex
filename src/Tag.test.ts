import * as $Tag from './Tag'

describe('Tag', () =>
  describe('tag', () => {
    test('creating tag', () => {
      expect(typeof $Tag.tag().key).toStrictEqual('symbol')
    })

    test('creating tag providing key', () => {
      const symbol = Symbol()

      expect($Tag.tag(symbol).key).toStrictEqual(symbol)
    })

    test('creating tag with description', () => {
      expect($Tag.tag('foo').key.description).toStrictEqual('foo')
    })
  }))
