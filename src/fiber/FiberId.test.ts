import * as $FiberId from './FiberId'

describe('FiberId', () => {
  test('converting to string', () => {
    expect(`${$FiberId.id()}`).toStrictEqual('0')
  })

  test('comparing equal identifiers', () => {
    const id = $FiberId.id()

    expect(id).toStrictEqual(id)
  })

  test('comparing different identifiers', () => {
    expect($FiberId.id()).not.toStrictEqual($FiberId.id())
  })
})
