import * as $Layer from './Layer'
import * as $Tag from './Tag'
import { uri } from './Type'
import * as $Proxy from './effect/Proxy'

describe('Layer', () => {
  interface Foo {
    readonly [uri]?: unique symbol
    (): 'foo'
  }

  const tag = $Tag.tag<Foo>()
  const foo = $Proxy.function(tag)
  const handler = () => 'foo' as const

  describe('with', () => {
    test('adding handler to layer', () => {
      expect($Layer.layer().with(tag, handler).handler(tag)).toStrictEqual(
        handler,
      )
    })

    test('merging layers', () => {
      const layer = $Layer.layer().with(tag, handler)

      expect($Layer.layer().with(layer).handler(tag)).toStrictEqual(handler)
    })
  })

  describe('do', () => {
    test('forwarding layer', () => {
      const layer = $Layer.layer().with(tag, handler)

      expect(layer.do()).toStrictEqual(layer)
    })

    test('forcing empty requirements', () => {
      interface Bar {
        readonly [uri]?: unique symbol
        (): 'bar'
      }

      const tagBar = $Tag.tag<Bar>()
      const handlerBar = function* () {
        yield* foo()

        return 'bar' as const
      }

      const layer = $Layer.layer().with(tagBar, handlerBar)

      // @ts-expect-error
      expect(layer.do()).toStrictEqual(layer)
    })
  })
})
