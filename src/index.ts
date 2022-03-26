type Replacer = (this: any, key: string, value: any) => any
type Reviver = (this: any, key: string, value: any) => any

const makeReplacer = (replacer?: Replacer): Replacer => {
  const map = new WeakMap()
  const stacks: object[] = []
  const current: string[] = []

  let root = true

  return function (key: string, value: any): any {
    if (root) stacks.push(this)
    else if (stacks[stacks.length - 1] !== this && stacks.includes(this)) {
      while (stacks.length && stacks[stacks.length - 1] !== this) {
        stacks.pop()
        current.pop()
      }
    }

    if (typeof value === 'object' && value !== null) {
      if (map.has(value)) {
        return `[Circular ~${map.get(value)}]`
      }
      !root && current.push(key)
      map.set(value, JSON.stringify(current))
      stacks.push(value)
    }

    root = false

    return replacer ? replacer.call(this, key, value) : value
  }
}

const makeReviver = (results: { hasCircular: boolean }, reviver?: Reviver): Reviver => {
  const CIRCULAR_REVIVER = /^\[Circular ~\[.*]]$/

  return function (key: string, value: any): any {
    if (typeof value === 'string' && CIRCULAR_REVIVER.test(value)) {
      results.hasCircular = true
      return (root: object) => {
        try {
          const keys = JSON.parse(value.substring(11, value.length - 1))

          if (!keys.length) return root

          let current = keys.shift()
          for (; keys.length && typeof root[current] === 'object'; current = keys.shift()) root = root[current]

          return root[current]
        } catch (_) {}
      }
    }
    return reviver ? reviver.call(this, key, value) : value
  }
}

const resolver = (root: object, obj: object = root): any => {
  for (const key in obj) {
    const value = obj[key]
    if (typeof value === 'object' && value !== null) {
      obj[key] = resolver(root, value)
    } else if (typeof value === 'function') {
      obj[key] = value(root)
    }
  }
  return obj
}

export const stringify = (value: any, replacer?: Replacer, space?: number | string): string =>
  JSON.stringify(value, makeReplacer(replacer), space)

export const parse = (text: string, reviver?: Reviver): any => {
  const results = { hasCircular: false }
  const data = JSON.parse(text, makeReviver(results, reviver))

  return results.hasCircular && typeof data === 'object' && data !== null ? resolver(data) : data
}

export default { stringify, parse }
