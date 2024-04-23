import * as $Layer from './Layer'
import * as $Tag from './Tag'
import { uri } from './Type'

describe('Layer', () => {
  interface Random {
    readonly [uri]?: unique symbol
    (): number
  }

  const tag = $Tag.tag<Random>()
  const handler = () => 42

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
  })
})
