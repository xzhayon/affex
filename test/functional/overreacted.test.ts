import { Effector, fx } from 'fx'

describe('Algebraic Effects for the Rest of Us <https://overreacted.io/algebraic-effects-for-the-rest-of-us/>', () => {
  type UserName = string
  interface User {
    readonly name: UserName | null
    readonly friendNames: UserName[]
  }

  interface AskName {
    readonly [fx.URI]?: unique symbol
    (): UserName
  }
  const tagAskName = fx.tag<AskName>()
  const askName = fx.function(tagAskName)

  type DirName = string
  type FileName = string
  interface DirContents {
    readonly dirs: ReadonlyArray<DirName>
    readonly files: ReadonlyArray<FileName>
  }

  interface OpenDirectory {
    readonly [fx.URI]?: unique symbol
    (dirName: DirName): DirContents
  }
  const tagOpenDirectory = fx.tag<OpenDirectory>()
  const openDirectory = fx.function(tagOpenDirectory)

  interface Log {
    readonly [fx.URI]?: unique symbol
    (message: string): void
  }
  const tagLog = fx.tag<Log>()
  const log = fx.function(tagLog)

  interface HandleFile {
    readonly [fx.URI]?: unique symbol
    (fileName: FileName): void
  }
  const tagHandleFile = fx.tag<HandleFile>()
  const handleFile = fx.function(tagHandleFile)

  describe('What Does This Have to Do With Algebraic Effects?', () => {
    test('performing effect', async () => {
      function* getName(user: User) {
        return user.name !== null ? user.name : yield* askName()
      }

      function* makeFriends(user1: User, user2: User) {
        user1.friendNames.push(yield* getName(user2))
        user2.friendNames.push(yield* getName(user1))

        return [user1, user2] as const
      }

      await expect(
        fx.run(
          makeFriends(
            { name: null, friendNames: [] },
            { name: 'Gendry', friendNames: [] },
          ),
          fx.layer().with(tagAskName, () => 'Arya Stark'),
        ),
      ).resolves.toStrictEqual([
        { name: null, friendNames: ['Gendry'] },
        { name: 'Gendry', friendNames: ['Arya Stark'] },
      ])
    })
  })

  describe('A Function Has No Color', () => {
    test('performing asynchronous effect', async () => {
      function* getName(user: User) {
        return user.name !== null ? user.name : yield* askName()
      }

      function* makeFriends(user1: User, user2: User) {
        user1.friendNames.push(yield* getName(user2))
        user2.friendNames.push(yield* getName(user1))

        return [user1, user2] as const
      }

      await expect(
        fx.run(
          makeFriends(
            { name: null, friendNames: [] },
            { name: 'Gendry', friendNames: [] },
          ),
          fx
            .layer()
            .with(
              tagAskName,
              () =>
                new Promise((resolve) =>
                  setTimeout(() => resolve('Arya Stark')),
                ),
            ),
        ),
      ).resolves.toStrictEqual([
        { name: null, friendNames: ['Gendry'] },
        { name: 'Gendry', friendNames: ['Arya Stark'] },
      ])
    })
  })

  describe('A Note on Purity', () => {
    test('performing side effects', async () => {
      function* enumerateFiles(
        dir: DirName,
      ): Effector<OpenDirectory | Log | HandleFile, void> {
        const contents = yield* openDirectory(dir)
        yield* log(`Enumerating files in ${dir}`)
        for (const file of contents.files) {
          yield* handleFile(file)
        }
        yield* log(`Enumerating subdirectories in ${dir}`)
        for (const directory of contents.dirs) {
          yield* enumerateFiles(directory)
        }
        yield* log('Done')
      }

      const _log: string[] = []
      const dirs: string[] = []
      const files: string[] = []
      await fx.run(
        enumerateFiles('/dev'),
        fx
          .layer()
          .with(tagOpenDirectory, (dirName) => {
            dirs.push(dirName)

            return {
              dirs: dirName === '/dev' ? ['/dev/fd'] : [],
              files:
                dirName === '/dev'
                  ? ['/dev/stderr', '/dev/stdin', '/dev/stdout']
                  : ['/dev/fd/0', '/dev/fd/1', '/dev/fd/2'],
            }
          })
          .with(tagLog, (message) => {
            _log.push(message)
          })
          .with(tagHandleFile, (fileName) => {
            files.push(fileName)
          }),
      )

      expect(_log).toStrictEqual([
        'Enumerating files in /dev',
        'Enumerating subdirectories in /dev',
        'Enumerating files in /dev/fd',
        'Enumerating subdirectories in /dev/fd',
        'Done',
        'Done',
      ])
      expect(dirs).toStrictEqual(['/dev', '/dev/fd'])
      expect(files).toStrictEqual([
        '/dev/stderr',
        '/dev/stdin',
        '/dev/stdout',
        '/dev/fd/0',
        '/dev/fd/1',
        '/dev/fd/2',
      ])
    })

    test('performing nested side effects', async () => {
      function* enumerateFiles(
        dir: DirName,
      ): Effector<OpenDirectory | Log | HandleFile, void> {
        const contents = yield* openDirectory(dir)
        yield* log(`Enumerating files in ${dir}`)
        for (const file of contents.files) {
          yield* handleFile(file)
        }
        yield* log(`Enumerating subdirectories in ${dir}`)
        for (const directory of contents.dirs) {
          yield* enumerateFiles(directory)
        }
        yield* log('Done')
      }

      const _log: string[] = []
      const dirs: string[] = []
      const files: string[] = []
      await fx.run(
        enumerateFiles('/dev'),
        fx
          .layer()
          .with(tagOpenDirectory, (dirName) => {
            dirs.push(dirName)

            return {
              dirs: dirName === '/dev' ? ['/dev/fd'] : [],
              files:
                dirName === '/dev'
                  ? ['/dev/stderr', '/dev/stdin', '/dev/stdout']
                  : ['/dev/fd/0', '/dev/fd/1', '/dev/fd/2'],
            }
          })
          .with(tagLog, (message) => {
            _log.push(message)
          })
          .with(tagHandleFile, function* (fileName) {
            yield* log(`Handling ${fileName}`)
            files.push(fileName)
          }),
      )

      expect(_log).toStrictEqual([
        'Enumerating files in /dev',
        'Handling /dev/stderr',
        'Handling /dev/stdin',
        'Handling /dev/stdout',
        'Enumerating subdirectories in /dev',
        'Enumerating files in /dev/fd',
        'Handling /dev/fd/0',
        'Handling /dev/fd/1',
        'Handling /dev/fd/2',
        'Enumerating subdirectories in /dev/fd',
        'Done',
        'Done',
      ])
      expect(dirs).toStrictEqual(['/dev', '/dev/fd'])
      expect(files).toStrictEqual([
        '/dev/stderr',
        '/dev/stdin',
        '/dev/stdout',
        '/dev/fd/0',
        '/dev/fd/1',
        '/dev/fd/2',
      ])
    })
  })
})
