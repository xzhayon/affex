import * as $Cause from './Cause'

describe('Cause', () => {
  test.each([
    ['expected', $Cause.fail(42, {} as any), true, false],
    ['unexpected', $Cause.die(42, {} as any), false, true],
  ])('identifying %s cause', (_, cause, isFail, isDie) => {
    expect($Cause.is(cause)).toStrictEqual(true)
    expect($Cause.isFail(cause)).toStrictEqual(isFail)
    expect($Cause.isDie(cause)).toStrictEqual(isDie)
  })
})
