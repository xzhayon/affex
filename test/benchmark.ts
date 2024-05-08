import { Effect } from 'effect'
import * as effection from 'effection'
import { Bench } from 'tinybench'
import { AsyncEffector } from '../src/Effector'
import * as $Layer from '../src/Layer'
import * as $Promise from '../src/Promise'
import * as $Runtime from '../src/Runtime'

async function benchmark() {
  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function vanillaSeq(n: number): Promise<number> {
    await sleep(0)
    switch (n) {
      case 0:
      case 1:
        return n
      default:
        return (await vanillaSeq(n - 2)) + (await vanillaSeq(n - 1))
    }
  }

  async function vanillaPar(n: number): Promise<number> {
    await sleep(0)
    switch (n) {
      case 0:
      case 1:
        return n
      default:
        const [a, b] = await Promise.all([vanillaPar(n - 2), vanillaPar(n - 1)])

        return a + b
    }
  }

  function effectSeq(n: number): Effect.Effect<number> {
    return Effect.gen(function* () {
      yield* Effect.sleep(0)
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
      yield* Effect.sleep(0)
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
    yield* effection.sleep(0)
    switch (n) {
      case 0:
      case 1:
        return n
      default:
        return (yield* effectionSeq(n - 2)) + (yield* effectionSeq(n - 1))
    }
  }

  function* effectionPar(n: number): effection.Operation<number> {
    yield* effection.sleep(0)
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

  async function* affexSeq(n: number): AsyncEffector<number, never, never> {
    await sleep(0)
    switch (n) {
      case 0:
      case 1:
        return n
      default:
        return (yield* affexSeq(n - 2)) + (yield* affexSeq(n - 1))
    }
  }

  async function* affexParPromise(
    n: number,
  ): AsyncEffector<number, never, never> {
    await sleep(0)
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

  const runtime = $Runtime.runtime($Layer.layer())

  const n = 10
  const bench = new Bench()
    .add('vanilla: sequential', async () => {
      await vanillaSeq(n)
    })
    .add('vanilla: parallel', async () => {
      await vanillaPar(n)
    })
    .add('effect: sequential', async () => {
      await Effect.runPromise(effectSeq(n))
    })
    .add('effect: parallel', async () => {
      await Effect.runPromise(effectPar(n))
    })
    .add('effection: sequential', async () => {
      await effection.run(() => effectionSeq(n))
    })
    .add('effection: parallel', async () => {
      await effection.run(() => effectionPar(n))
    })
    .add('affex: sequential', async () => {
      await runtime.run(affexSeq(n))
    })
    .add('affex: parallel', async () => {
      await runtime.run(affexParPromise(n))
    })

  await bench.warmup()
  await bench.run()

  console.table(bench.table())
}

benchmark()
