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
})
