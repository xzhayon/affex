import * as $Cause from './Cause'
import * as $Exit from './Exit'

describe('Exit', () => {
  test.each([
    ['successful', $Exit.success(42), true, false],
    ['failed', $Exit.failure($Cause.die(42)), false, true],
  ])('identifying %s exit', (_, exit, successful, failed) => {
    expect($Exit.isSuccess(exit)).toStrictEqual(successful)
    expect($Exit.isFailure(exit)).toStrictEqual(failed)
  })
})
