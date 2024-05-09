import { Effect } from 'effect'
import * as effection from 'effection'
import { Bench } from 'tinybench'
import * as $Layer from '../src/Layer'
import * as $Promise from '../src/Promise'
import * as $Runtime from '../src/Runtime'
import * as $Tag from '../src/Tag'
import { uri } from '../src/Type'
import * as $Proxy from '../src/effect/Proxy'

async function benchmark() {
  interface Sleep {
    readonly [uri]?: unique symbol
    (ms: number): Promise<void>
  }

  function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
  }

  const tag = $Tag.tag<Sleep>()
  const affexSleep = $Proxy.function(tag)
  const layer = $Layer.layer().with(tag, sleep)
  const runtime = $Runtime.runtime(layer)

  async function vanillaSeq(n: number, ms: number) {
    for (let i = 0; i < n; i++) {
      await sleep(ms)
    }
  }

  async function vanillaPar(n: number, ms: number) {
    await Promise.all(
      Array(n)
        .fill(undefined)
        .map(() => sleep(ms)),
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

  const n = 10
  const ms = 10
  const bench = new Bench()
    .add('vanilla: sequential', async () => {
      await vanillaSeq(n, ms)
    })
    .add('vanilla: parallel', async () => {
      await vanillaPar(n, ms)
    })
    .add('effect: sequential', async () => {
      await Effect.runPromise(effectSeq(n, ms))
    })
    .add('effect: parallel', async () => {
      await Effect.runPromise(effectPar(n, ms))
    })
    .add('effection: sequential', async () => {
      await effection.run(() => effectionSeq(n, ms))
    })
    .add('effection: parallel', async () => {
      await effection.run(() => effectionPar(n, ms))
    })
    .add('affex: sequential', async () => {
      await runtime.run(affexSeq(n, ms))
    })
    .add('affex: parallel', async () => {
      await runtime.run(affexParPromise(n, ms))
    })

  await bench.warmup()
  await bench.run()

  console.table(bench.table())
}

benchmark()
