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

stringify(obj_1) //= {"abc":"123","circular":{"ref":"[Circular ~[]]"}}

const obj_2: any = {
  abc: '123',
  circular: {
    get ref() {
      return obj_2
    }
  }
}

stringify(obj_2) //= {"abc":"123","circular":{"ref":"[Circular ~[]]"}}

const obj_3: any = {
  a,
  get b() {
    return obj_2
  }
}

stringify(obj_3) //= {"a":{"abc":"123","circular":{"ref":"[Circular ~[\"a\"]]"}},"b":{"abc":"123","circular":{"ref":"[Circular ~[\"b\"]]"}}}
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
