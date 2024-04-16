import * as L from './Layer'
import * as T from './Tag'

describe('Layer', () => {
  describe('with', () => {
    test('adding handler to layer', () => {
      const tag = T.tag<() => number>()
      const handler = () => 42

      expect(L.layer().with(tag, handler).handler(tag)).toStrictEqual(handler)
    })

    test('merging layers', () => {
      const tag = T.tag<() => number>()
      const handler = () => 42

      expect(
        L.layer().with(L.layer().with(tag, handler)).handler(tag),
      ).toStrictEqual(handler)
    })
  })

  describe('do', () => {
    test('forwarding layer', () => {
      const layer = L.layer().with(T.tag<() => number>(), () => 42)

      expect(layer.do()).toStrictEqual(layer)
    })
  })
})
