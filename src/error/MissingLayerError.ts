import { Tag } from '../Tag'

export const MissingLayerErrorUri = Symbol('MissingLayerError')
export class MissingLayerError extends Error {
  readonly [MissingLayerErrorUri]!: typeof MissingLayerErrorUri
  readonly name: string = 'MissingLayerError'

  constructor(readonly tag: Tag<any>) {
    super(
      `Cannot find layer for effect${
        tag.key.description ? ` "${tag.key.description}"` : ''
      }`,
    )
  }
}
