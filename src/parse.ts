import { Reviver } from './type'

type Resolver = (this: any, root: any) => void

const read = (obj: object, keys: any[]): any => {
  if (!keys.length) return obj

  let current = keys.shift()
  for (; keys.length && typeof obj[current] === 'object' && obj[current]; current = keys.shift()) obj = obj[current]

  return obj[current]
}

const makeReviver = (resolvers: Resolver[], reviver?: Reviver): Reviver => {
  const CIRCULAR_REVIVER = /^\[Circular ~\[.*]]$/

  return function (key: string, value: any): any {
    if (typeof value === 'string' && CIRCULAR_REVIVER.test(value)) {
      resolvers.push((root: object) => {
        try {
          this[key] = read(root, JSON.parse(value.substring(11, value.length - 1)))
        } catch (_) {
          // ignore
        }
      })
      return value
    }
    return reviver ? reviver.call(this, key, value) : value
  }
}

export function parse(text: string, reviver?: Reviver): any {
  const resolvers: Resolver[] = []
  const data = JSON.parse(text, makeReviver(resolvers, reviver))

  for (const resolver of resolvers) resolver(data)

  return data
}
