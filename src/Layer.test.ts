import * as $Layer from './Layer'
import * as $Tag from './Tag'
import { uri } from './Type'

describe('Layer', () => {
  interface Foo {
    readonly [uri]?: unique symbol
    (): 'foo'
  }

  const tag = $Tag.tag<Foo>()
  const handler = () => 'foo' as const

  describe('layer', () => {
    test('creating layer', () => {
      expect($Layer.layer(tag, handler).handler).toStrictEqual(handler)
    })
  })
})
