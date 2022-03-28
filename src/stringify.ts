import { Replacer, Whitelist } from './type'

type RawReplacer = (this: any, key: string, value: any) => any

const makeReplacer = (replacer?: Replacer | null): RawReplacer => {
  const map: WeakMap<object, string> = new WeakMap()
  const stacks: object[] = []
  const path: string[] = []

  let root = true

  return function (key: string, value: any): any {
    if (!root && stacks[stacks.length - 1] !== this && stacks.includes(this)) {
      while (stacks.length && stacks[stacks.length - 1] !== this) {
        stacks.pop()
        path.pop()
      }
    }

    value = replacer ? replacer.call(this, key, value, root) : value

    if (typeof value === 'object' && value !== null) {
      if (map.has(value)) return '[Circular ~' + map.get(value) + ']'
      if (!root) path.push(JSON.stringify(key))
      map.set(value, '[' + path.join(',') + ']')
      stacks.push(value)
    }

    root = false

    return value
  }
}

export function stringify(value: any, replacer?: Replacer | Whitelist | null, space?: number | string): string {
  if (replacer && Array.isArray(replacer)) {
    const whilelist = replacer.map((key) => key.toString())
    replacer = function (key: string, item: any, root: boolean) {
      if (!(root || Array.isArray(this) || whilelist.includes(key))) {
        return undefined
      }
      return item
    }
  }
  return JSON.stringify(value, makeReplacer(replacer), space)
}
