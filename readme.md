JSONCircular
============
Serializes and deserializes otherwise valid JSON objects containing circular references into and from a specialized JSON format.

## Usage
### Stringify
```typescript
import { stringify } from 'json-circular-parser'

const obj_1: any = {
  abc: '123',
  circular: {
    ref: null
  }
}

obj_1.circular.ref = obj

stringify(obj_1)
//= {"abc":"123","circular":{"ref":"[Circular ~[]]"}}

const obj_2: any = {
  abc: '123',
  circular: {
    get ref() {
      return obj_2
    }
  }
}

stringify(obj_2)
//= {"abc":"123","circular":{"ref":"[Circular ~[]]"}}

const obj_3: any = {
  a,
  get b() {
    return obj_2
  }
}

stringify(obj_3)
//= {"a":{"abc":"123","circular":{"ref":"[Circular ~[\"a\"]]"}},"b":{"abc":"123","circular":{"ref":"[Circular ~[\"b\"]]"}}}
```

#### Replacer
```typescript
type Replacer = (this: any, key: string, value: any, root: boolean) => any
```
```typescript
const o = [1, 2, 3, 4]
stringify(o, (key: string, value: any) => typeof value === 'number' ? value.toString() : value)
//= ["1","2","3","4"]
```

##### With circular
```typescript
const o = {
  a: {
    aa: 123,
    ab: {
      aba: true,
      abb: {},
    },
  },
}
stringify(o, function (this: any, key: string, value: any, root: boolean) {
  if (key === '_parent') return value
  if (!root && value && typeof value === 'object') {
    return {
      _parent: this,
      ...value,
    }
  }

  return value
})
//= {"a":{"_parent":"[Circular ~[]]","aa":123,"ab":{"_parent":"[Circular ~[\"a\"]]","aba":true,"abb":{"_parent":"[Circular ~[\"a\",\"ab\"]]"}}}}
```
#### Whitelist
```typescript
type Whitelist = (number | string)[]
```
```typescript
const o: any = { 
  ref1: {
    '0': {},
    '1': {},
    '2': {},
  },
  ref2: {},
  get ref3() {
    return o
  },
  ref4: ['abc', 'def', 'ghi'],
}
stringify(o, ['ref1', 'ref4', 2])
//= {"_ref1":{"2":{}},"_ref4":["abc","def","ghi"]}
```

### Parse
```typescript
import { parse } from 'json-circular-parser'

const obj_1 = parse('{"abc":"123","circular":{"ref":"[Circular ~[]]"}}')

obj_1 === obj_1.circular.ref //= true

const obj_2 = parse('{"a":{"abc":"123","circular":{"ref":"[Circular ~[\\"a\\"]]"}},"b":{"abc":"123","circular":{"ref":"[Circular ~[\\"b\\"]]"}}}')

obj_2.a === obj_2.a.circular.ref //= true
obj_2.b === obj_2.b.circular.ref //= true
```

#### Reviver
```typescript
type Reviver = (this: any, key: string, value: any) => any
```
```typescript
const obj_1 = parse(
  '{"abc":"123","circular":{"ref":"[Circular ~[]]"}}',
  (key: string, value: any) => typeof value === 'string' && /^\d+$/.test(value)
    ? parseInt(value, 10)
    : value
)

obj_1 === obj_1.circular.ref //= true
123 === obj_1.abc //= true
```
