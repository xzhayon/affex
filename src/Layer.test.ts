import * as $Layer from './Layer'
import * as $Tag from './Tag'

describe('Layer', () => {
  describe('with', () => {
    test('adding handler to layer', () => {
      const tag = $Tag.tag<() => number>()
      const handler = () => 42

      expect($Layer.layer().with(tag, handler).handler(tag)).toStrictEqual(
        handler,
      )
    })

    test('merging layers', () => {
      const tag = $Tag.tag<() => number>()
      const handler = () => 42

      expect(
        $Layer.layer().with($Layer.layer().with(tag, handler)).handler(tag),
      ).toStrictEqual(handler)
    })
  })

  describe('do', () => {
    test('forwarding layer', () => {
      const layer = $Layer.layer().with($Tag.tag<() => number>(), () => 42)

      expect(layer.do()).toStrictEqual(layer)
    })
  })
})
