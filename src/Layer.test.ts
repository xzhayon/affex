import { Layer } from './Layer'
import * as T from './Tag'

describe('Layer', () => {
  describe('with', () => {
    test('adding handler to layer', () => {
      const tag = T.tag<() => number>()
      const handler = () => 42

      expect(Layer.empty().with(tag, handler).handler(tag)).toStrictEqual(
        handler,
      )
    })
    test('merging layers', () => {
      const tag = T.tag<() => number>()
      const handler = () => 42

      expect(
        Layer.empty().with(Layer.empty().with(tag, handler)).handler(tag),
      ).toStrictEqual(handler)
    })
  })
})
