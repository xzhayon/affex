import * as $Effect from './Effect'
import { Use } from './Effect'
import * as $Exit from './Exit'
import * as $Fiber from './Fiber'
import * as $Fork from './Fork'
import { Fork } from './Fork'
import * as $Generator from './Generator'
import * as $Layer from './Layer'
import { Layer } from './Layer'
import * as $Raise from './Raise'
import { Raise } from './Raise'

export type DefaultLayer = Layer<never, Fork | Raise<any>>

export async function run<G extends Generator | AsyncGenerator>(
  effector: G | (() => G),
  layer: Layer<
    never,
    Exclude<
      $Generator.YOf<G> extends infer U extends Use<any>
        ? $Effect.ROf<U>
        : never,
      $Layer.AOf<DefaultLayer>
    >
  >,
) {
  const exit = await $Fiber.run(
    effector,
    $Layer
      .layer()
      .with($Fork.ContextAwareFork())
      .with($Raise.ExceptionRaise())
      .with(layer),
  )
  if ($Exit.isFailure(exit)) {
    throw exit.cause.error
  }

  return exit.value
}
