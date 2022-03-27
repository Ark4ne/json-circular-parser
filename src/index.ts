export type Replacer = (this: any, key: string, value: any, root: boolean) => any
export type Whitelist = (number | string)[]
export type Reviver = (this: any, key: string, value: any) => any

type RawReplacer = (this: any, key: string, value: any) => any
type Resolver = (this: any, root: any) => void

const makeReplacer = (replacer?: Replacer | null): RawReplacer => {
  const map = new WeakMap()
  const stacks: object[] = []
  const current: string[] = []

  let root = true

  return function (key: string, value: any): any {
    if (!root && stacks[stacks.length - 1] !== this && stacks.includes(this)) {
      while (stacks.length && stacks[stacks.length - 1] !== this) {
        stacks.pop()
        current.pop()
      }
    }

    value = replacer ? replacer.call(this, key, value, root) : value

    if (typeof value === 'object' && value !== null) {
      if (map.has(value)) return `[Circular ~${map.get(value)}]`
      if (!root) current.push(key)
      map.set(value, JSON.stringify(current))
      stacks.push(value)
    }

    root = false

    return value
  }
}

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

export function stringify(value: any, replacer?: Replacer | Whitelist | null, space?: number | string): string {
  if (replacer && Array.isArray(replacer)) {
    const whilelist = replacer.map((key) => key.toString())
    let root = true
    replacer = function (key: string, item: any) {
      if (!root && !Array.isArray(this) && !whilelist.includes(key)) {
        return undefined
      }
      root = false
      return item
    }
  }
  return JSON.stringify(value, makeReplacer(replacer), space)
}

export function parse(text: string, reviver?: Reviver): any {
  const resolvers: Resolver[] = []
  const data = JSON.parse(text, makeReviver(resolvers, reviver))

  for (const resolver of resolvers) resolver(data)

  return data
}

export default { stringify, parse }
