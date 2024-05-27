import { Effect } from 'effect'
import * as effection from 'effection'
import { Bench } from 'tinybench'
import { Effector } from '../src/Effector'
import * as $Tag from '../src/Tag'
import { uri } from '../src/Type'
import * as $Fiber from '../src/concurrency/Fiber'
import * as $Promise from '../src/concurrency/Promise'
import * as $Proxy from '../src/effect/Proxy'
import * as $Context from '../src/runtime/Context'
import * as $Layer from '../src/runtime/Layer'
import * as $Runtime from '../src/runtime/Runtime'

async function sleep() {
  function _sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
  }

  interface Sleep {
    readonly [uri]?: unique symbol
    (ms: number): Promise<void>
  }

  const tag = $Tag.tag<Sleep>()
  const affexSleep = $Proxy.function(tag)
  const context = $Context.context().with($Layer.layer(tag, _sleep))
  const runtime = $Runtime.runtime(context)

  async function vanillaSeq(n: number, ms: number) {
    for (let i = 0; i < n; i++) {
      await _sleep(ms)
    }
  }

  async function vanillaPar(n: number, ms: number) {
    await Promise.all(
      Array(n)
        .fill(undefined)
        .map(() => _sleep(ms)),
    )
  }

  function effectSeq(n: number, ms: number) {
    return Effect.gen(function* () {
      yield* Effect.forEach(Array(n), () => Effect.sleep(ms), {
        concurrency: 0,
      })
    })
  }

  function effectPar(n: number, ms: number) {
    return Effect.gen(function* () {
      yield* Effect.forEach(Array(n), () => Effect.sleep(ms), {
        concurrency: 'unbounded',
      })
    })
  }

  function* effectionSeq(n: number, ms: number) {
    for (let i = 0; i < n; i++) {
      yield* effection.sleep(ms)
    }
  }

  function* effectionPar(n: number, ms: number) {
    yield* effection.all(
      Array(n)
        .fill(undefined)
        .map(() => effection.sleep(ms)),
    )
  }

  function* affexSeq(n: number, ms: number) {
    for (let i = 0; i < n; i++) {
      yield* affexSleep(ms)
    }
  }

  function* affexParPromise(n: number, ms: number) {
    yield* $Promise.all(
      Array(n)
        .fill(undefined)
        .map(() => affexSleep(ms)),
    )
  }

  function* affexParFiber(n: number, ms: number) {
    return yield* $Fiber.all(
      Array(n)
        .fill(undefined)
        .map(() => affexSleep(ms)),
    )
  }

  const n = 10
  const ms = 10
  const bench = new Bench()
    .add('sleep: vanilla (sequential)', async () => {
      await vanillaSeq(n, ms)
    })
    .add('sleep: vanilla (parallel)', async () => {
      await vanillaPar(n, ms)
    })
    .add('sleep: Effect (sequential)', async () => {
      await Effect.runPromise(effectSeq(n, ms))
    })
    .add('sleep: Effect (parallel)', async () => {
      await Effect.runPromise(effectPar(n, ms))
    })
    .add('sleep: Effection (sequential)', async () => {
      await effection.run(() => effectionSeq(n, ms))
    })
    .add('sleep: Effection (parallel)', async () => {
      await effection.run(() => effectionPar(n, ms))
    })
    .add('sleep: affex (sequential)', async () => {
      await runtime.run(affexSeq(n, ms))
    })
    .add('sleep: affex (parallel, promise)', async () => {
      await runtime.run(affexParPromise(n, ms))
    })
    .add('sleep: affex (parallel, fiber)', async () => {
      await runtime.run(affexParFiber(n, ms))
    })

  await bench.warmup()
  await bench.run()

  console.table(bench.table())
}

async function fibonacci() {
  const runtime = $Runtime.runtime($Context.context())

  function vanillaSeq(n: number): number {
    switch (n) {
      case 0:
      case 1:
        return n
      default:
        return vanillaSeq(n - 2) + vanillaSeq(n - 1)
    }
  }

  function effectSeq(n: number): Effect.Effect<number> {
    return Effect.gen(function* () {
      switch (n) {
        case 0:
        case 1:
          return n
        default:
          return (yield* effectSeq(n - 2)) + (yield* effectSeq(n - 1))
      }
    })
  }

  function effectPar(n: number): Effect.Effect<number> {
    return Effect.gen(function* () {
      switch (n) {
        case 0:
        case 1:
          return n
        default:
          const [a, b] = yield* Effect.all(
            [effectPar(n - 2), effectPar(n - 1)],
            { concurrency: 'unbounded' },
          )

          return a + b
      }
    })
  }

  function* effectionSeq(n: number): effection.Operation<number> {
    switch (n) {
      case 0:
      case 1:
        return n
      default:
        return (yield* effectionSeq(n - 2)) + (yield* effectionSeq(n - 1))
    }
  }

  function* effectionPar(n: number): effection.Operation<number> {
    switch (n) {
      case 0:
      case 1:
        return n
      default:
        const [a, b] = yield* effection.all([
          effectionPar(n - 2),
          effectionPar(n - 1),
        ])

        return a + b
    }
  }

  function* affexSeq(n: number): Effector<number, never, never> {
    switch (n) {
      case 0:
      case 1:
        return n
      default:
        return (yield* affexSeq(n - 2)) + (yield* affexSeq(n - 1))
    }
  }

  function* affexParPromise(n: number): Effector<number, never, never> {
    switch (n) {
      case 0:
      case 1:
        return n
      default:
        const [a, b] = yield* $Promise.all([
          affexParPromise(n - 2),
          affexParPromise(n - 1),
        ])

        return a + b
    }
  }

  function* affexParFiber(n: number): Effector<number, never, never> {
    switch (n) {
      case 0:
      case 1:
        return n
      default:
        const [a, b] = yield* $Fiber.all([
          affexParFiber(n - 2),
          affexParFiber(n - 1),
        ])

        return a + b
    }
  }

  const n = 10
  const bench = new Bench()
    .add('Fibonacci: vanilla (sequential)', async () => {
      await vanillaSeq(n)
    })
    .add('Fibonacci: Effect (sequential)', async () => {
      await Effect.runPromise(effectSeq(n))
    })
    .add('Fibonacci: Effect (parallel)', async () => {
      await Effect.runPromise(effectPar(n))
    })
    .add('Fibonacci: Effection (sequential)', async () => {
      await effection.run(() => effectionSeq(n))
    })
    .add('Fibonacci: Effection (parallel)', async () => {
      await effection.run(() => effectionPar(n))
    })
    .add('Fibonacci: affex (sequential)', async () => {
      await runtime.run(affexSeq(n))
    })
    .add('Fibonacci: affex (parallel, promise)', async () => {
      await runtime.run(affexParPromise(n))
    })
    .add('Fibonacci: affex (parallel, fiber)', async () => {
      await runtime.run(affexParFiber(n))
    })

  await bench.warmup()
  await bench.run()

  console.table(bench.table())
}

sleep()
fibonacci()
