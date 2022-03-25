const replacer = () => {
  const map = new WeakMap()
  const stacks: object[] = []
  const current: string[] = []

  let root = true

  return (key: string, value: any) => {
    if (!root) {
      while (stacks.length && stacks[stacks.length - 1][key] !== value) {
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

    return value
  }
}

const reviver = () => {
  const CIRCULAR_REVIVER = /^\[Circular ~\[.*]]$/

  return (key: string, value: any) => {
    if (typeof value === 'string' && CIRCULAR_REVIVER.test(value)) {
      return (root: object) => {
        try {
          const keys = JSON.parse(value.substring(11, value.length - 1))

          if (!keys.length) return root

          let current = keys.shift()
          for (; keys.length && typeof root[current] === 'object'; current = keys.shift()) root = root[current]

          return root[current]
        } catch (_) {
          return value
        }
      }
    }
    return value
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

export const stringify = (value: any, space?: number | string): string => JSON.stringify(value, replacer(), space)

export const parse = (text: string): any => {
  const data = JSON.parse(text, reviver())

  return typeof data === 'object' && data !== null ? resolver(data) : data
}

export default { stringify, parse }
