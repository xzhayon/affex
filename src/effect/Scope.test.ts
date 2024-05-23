import * as $Context from '../runtime/Context'
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
          $Context.context(),
        ),
      ).resolves.toStrictEqual(42)
    })
  })
})
