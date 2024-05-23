import * as $EffectId from './EffectId'

describe('EffectId', () => {
  test('converting to string', () => {
    expect(`${$EffectId.id()}`).toStrictEqual('0')
  })

  test('comparing equal identifiers', () => {
    const id = $EffectId.id()

    expect(id).toStrictEqual(id)
  })

  test('comparing different identifiers', () => {
    expect($EffectId.id()).not.toStrictEqual($EffectId.id())
  })

  describe('reset', () => {
    test('resetting counter', () => {
      $EffectId.reset()
      const a = $EffectId.id()
      $EffectId.reset()
      const b = $EffectId.id()

      expect(a).not.toStrictEqual(b)
      expect(a.toString()).toStrictEqual(b.toString())
    })
  })
})
