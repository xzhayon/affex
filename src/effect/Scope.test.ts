import * as $Runtime from '../runtime/Runtime'
import * as $Scope from './Scope'

describe('Scope', () => {
  describe('scope', () => {
    test('scoping non-lazy effector', async () => {
      await expect(
        $Runtime.runPromise(
          $Scope.scope(
            (function* () {
              return 42
            })(),
          ),
        ),
      ).resolves.toStrictEqual(42)
    })
  })
})
