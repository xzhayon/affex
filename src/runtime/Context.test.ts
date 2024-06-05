import * as $Tag from '../Tag'
import { uri } from '../Type'
import * as $Proxy from '../effect/Proxy'
import { MissingLayerError } from '../error/MissingLayerError'
import * as $Context from './Context'
import * as $Layer from './Layer'

describe('Context', () => {
  interface Foo {
    readonly [uri]?: unique symbol
    (): 'foo'
  }

  interface Bar {
    readonly [uri]?: unique symbol
    (): 'bar'
  }

  const tagFoo = $Tag.tag<Foo>()
  const foo = $Proxy.operation(tagFoo)
  const layerFoo = $Layer.layer(tagFoo, () => 'foo')
  const tagBar = $Tag.tag<Bar>()
  const layerBar = $Layer.layer(tagBar, function* () {
    yield* foo()

    return 'bar' as const
  })

  describe('do', () => {
    test('forwarding context', () => {
      const context = $Context.context().with(layerFoo)

      expect(context.do()).toStrictEqual(context)
    })

    test('forcing empty requirements', () => {
      const context = $Context.context().with(layerBar)

      // @ts-expect-error
      expect(context.do()).toStrictEqual(context)
    })
  })

  describe('merge', () => {
    test('merging contexts', () => {
      const context = $Context
        .context()
        .with(layerFoo)
        .merge($Context.context().with(layerBar))

      expect(context.handler(tagFoo)).toStrictEqual(layerFoo.handler)
      expect(context.handler(tagBar)).toStrictEqual(layerBar.handler)
    })
  })

  describe('with', () => {
    test('adding layer', () => {
      expect($Context.context().with(layerFoo).handler(tagFoo)).toStrictEqual(
        layerFoo.handler,
      )
    })
  })

  describe('handler', () => {
    test('failing on missing layer', () => {
      // @ts-expect-error
      expect(() => $Context.context().handler(tagFoo)).toThrow(
        new MissingLayerError(tagFoo),
      )
    })
  })
})
