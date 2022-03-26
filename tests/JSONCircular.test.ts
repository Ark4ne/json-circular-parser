import { parse, stringify } from '../src'

test('Work as JSON.stringify - object', () => {
  const object = {
    a: 'a',
    b: 'b',
    c: () => ({}),
    d: { e: 123 },
    f: undefined,
    g: true,
    h: null,
    i: false,
  }

  expect(stringify(object)).toStrictEqual(JSON.stringify(object))
})
test('Work as JSON.stringify - string', () => {
  const str = 'Azerty-QSDFGHJKL-wxcvbn'

  expect(stringify(str)).toStrictEqual(JSON.stringify(str))
})
test('Work as JSON.stringify - number', () => {
  const value = 123

  expect(stringify(value)).toStrictEqual(JSON.stringify(value))
})
test('Work as JSON.stringify - boolean', () => {
  expect(stringify(true)).toStrictEqual(JSON.stringify(true))
  expect(stringify(false)).toStrictEqual(JSON.stringify(false))
})
test('Work as JSON.stringify - null', () => {
  expect(stringify(null)).toStrictEqual(JSON.stringify(null))
})
test('Work as JSON.stringify - undefined', () => {
  expect(stringify(undefined)).toStrictEqual(JSON.stringify(undefined))
})

test('Work as JSON.parse', () => {
  const str = JSON.stringify({
    a: 'a',
    b: 'b',
    c: () => ({}),
    d: { e: 123 },
    f: undefined,
    g: true,
    h: null,
    i: false,
  })

  expect(parse(str)).toStrictEqual(JSON.parse(str))
})
test('Work as JSON.parse - string', () => {
  const str = JSON.stringify('Azerty-QSDFGHJKL-wxcvbn')
  expect(parse(str)).toStrictEqual(JSON.parse(str))
})
test('Work as JSON.parse - number', () => {
  const value = JSON.stringify(123)
  expect(parse(value)).toStrictEqual(JSON.parse(value))
})
test('Work as JSON.parse - boolean', () => {
  const stringifyTrue = JSON.stringify(true)
  expect(parse(stringifyTrue)).toStrictEqual(JSON.parse(stringifyTrue))
  const stringifyFalse = JSON.stringify(false)
  expect(parse(stringifyFalse)).toStrictEqual(JSON.parse(stringifyFalse))
})
test('Work as JSON.parse - null', () => {
  const stringifyNull = JSON.stringify(null)
  expect(parse(stringifyNull)).toStrictEqual(JSON.parse(stringifyNull))
})
test('Work as JSON.parse - empty', () => {
  const stringifyEmpty = JSON.stringify('')
  expect(parse(stringifyEmpty)).toStrictEqual(JSON.parse(stringifyEmpty))
})

test('Recreate original structure', () => {
  const o: any = {}
  o.a = o
  o.c = {}
  o.d = {
    a: 123,
    b: o,
  }
  o.c.e = o
  o.c.f = o.d
  o.b = o.c

  const re = parse(stringify(o))

  expect(re.b).toStrictEqual(re.c)
  expect(re.c.e).toStrictEqual(re)
  expect(re.d.a).toStrictEqual(123)
  expect(re.d.b).toStrictEqual(re)
  expect(re.c.f).toStrictEqual(re.d)
  expect(re.b).toStrictEqual(re.c)
})
test('Recreate original structure with array', () => {
  const o: any = { a: [1, 2, 3] }
  o.o = o
  o.a.push(o)
  const re = parse(stringify(o))
  expect(re.o).toStrictEqual(re)
  expect(re.a[3]).toStrictEqual(re)
})
test('Make sure only own properties are parsed', () => {
  // make sure only own properties are parsed
  // tslint:disable-next-line:no-string-literal
  Object.prototype['shenanigans'] = true

  const item: any = {
    name: 'TEST',
  }
  const original = {
    outer: [
      {
        a: 'b',
        c: 'd',
        one: item,
        many: [item],
        e: 'f',
      },
    ],
  }
  item.value = item
  const str = stringify(original)
  expect(str).toStrictEqual(
    JSON.stringify({
      outer: [
        {
          a: 'b',
          c: 'd',
          one: {
            name: 'TEST',
            value: '[Circular ~["outer","0","one"]]',
          },
          many: ['[Circular ~["outer","0","one"]]'],
          e: 'f',
        },
      ],
    }),
  )

  const output = parse(str)
  expect(output.outer[0].one.name).toStrictEqual(original.outer[0].one.name)
  expect(output.outer[0].many[0].name).toStrictEqual(original.outer[0].many[0].name)
  expect(output.outer[0].many[0]).toStrictEqual(output.outer[0].one)

  // tslint:disable-next-line:no-string-literal
  delete Object.prototype['shenanigans']
})
test('Multiple reference', () => {
  const unique = { a: 'sup' }
  const nested = {
    prop: {
      value: 123,
    },
    a: [
      {},
      {
        b: [
          {
            a: 1,
            d: 2,
            c: unique,
            z: {
              g: 2,
              b: {
                r: 4,
                u: unique,
                c: 5,
              },
              f: 6,
              a: unique,
            },
          },
        ],
      },
    ],
    b: {
      e: 'f',
      t: unique,
      p: 4,
    },
  }
  const str = stringify(nested)
  expect(str).toStrictEqual(
    JSON.stringify({
      prop: { value: 123 },
      a: [
        {},
        {
          b: [
            {
              a: 1,
              d: 2,
              c: { a: 'sup' },
              z: {
                g: 2,
                b: {
                  r: 4,
                  u: '[Circular ~["a","1","b","0","c"]]',
                  c: 5,
                },
                f: 6,
                a: '[Circular ~["a","1","b","0","c"]]',
              },
            },
          ],
        },
      ],
      b: {
        e: 'f',
        t: '[Circular ~["a","1","b","0","c"]]',
        p: 4,
      },
    }),
  )

  const output = parse(str)
  expect(output.b.t.a).toStrictEqual('sup')
  expect(output.a[1].b[0].c).toStrictEqual(output.b.t)
})
test('String with [Circular ~]', () => {
  const o = { bar: '[Circular ~]' }
  const s = stringify(o)
  expect(s).toStrictEqual('{"bar":"[Circular ~]"}')
  const re = parse(s)
  expect(re.bar).toStrictEqual(o.bar)
})
test('String wrong [Circular ~[]]', () => {
  const o = { bar: '[Circular ~["hello world"]]' }
  const s = stringify(o)
  expect(s).toStrictEqual(JSON.stringify({ bar: '[Circular ~["hello world"]]' }))
  const re = parse(s)
  expect(re.bar).toStrictEqual(undefined)
})
test('Multiple circular & reference', () => {
  const o: any = {}
  o.a = {
    aa: {
      aaa: 'value1',
    },
  }
  o.b = o
  o.c = {
    ca: {},
    cb: {},
    cc: {},
    cd: {},
    ce: 'value2',
    cf: 'value3',
  }
  o.c.ca.caa = o.c.ca
  o.c.cb.cba = o.c.cb
  o.c.cc.cca = o.c
  o.c.cd.cda = o.c.ca.caa

  const s = stringify(o)
  expect(s).toStrictEqual(
    JSON.stringify({
      a: {
        aa: {
          aaa: 'value1',
        },
      },
      b: '[Circular ~[]]',
      c: {
        ca: {
          caa: '[Circular ~["c","ca"]]',
        },
        cb: {
          cba: '[Circular ~["c","cb"]]',
        },
        cc: {
          cca: '[Circular ~["c"]]',
        },
        cd: {
          cda: '[Circular ~["c","ca"]]',
        },
        ce: 'value2',
        cf: 'value3',
      },
    }),
  )
  const oo = parse(s)
  expect(oo.a.aa.aaa).toStrictEqual('value1')
  expect(oo).toStrictEqual(oo.b)
  expect(o.c.ca.caa).toStrictEqual(o.c.ca)
  expect(o.c.cb.cba).toStrictEqual(o.c.cb)
  expect(o.c.cc.cca).toStrictEqual(o.c)
  expect(o.c.cd.cda).toStrictEqual(o.c.ca.caa)
  expect(o.c.ce).toStrictEqual('value2')
  expect(o.c.cf).toStrictEqual('value3')
})
test('Multiple circular & reference with array', () => {
  const original: any = {
    a1: {
      a2: [],
      a3: [{ name: 'whatever' }],
    },
    a4: [],
  }

  original.a1.a2[0] = original.a1
  original.a4[0] = original.a1.a3[0]

  const json = stringify(original)
  const restored = parse(json)

  expect(restored.a1.a2[0]).toStrictEqual(restored.a1)
  expect(restored.a4[0]).toStrictEqual(restored.a1.a3[0])
})
test('Complex circular', () => {
  const ac = { ac: '123' }
  const aa = {
    get ab() {
      return { aa }
    },
    aa: ac,
    ac: '123',
  }
  const ab = {
    get ac() {
      return ac
    },
  }
  const object = {
    aa,
    ac: '123',
    ab,
  }

  const parsed = parse(stringify(object))
  expect(object.aa.aa).toStrictEqual(object.ab.ac)
  expect(parsed.aa.ab.aa).toStrictEqual(parsed.aa)
  expect(parsed.aa.aa).toStrictEqual(parsed.ab.ac)
})
test('Symbol', () => {
  const o = { a: 1 }
  const a = [1, Symbol('test'), 2]
  o[Symbol('test')] = 123

  expect(stringify(o)).toStrictEqual(JSON.stringify(o))
  expect(stringify(a)).toStrictEqual(JSON.stringify(a))
})
test('Empty keys', () => {
  const a: any = { b: { '': { c: { d: 1 } } } }
  a._circular = a.b['']
  const json = stringify(a)
  const o = parse(json)
  expect(o._circular).toStrictEqual(o.b[''])
  expect(JSON.stringify(o._circular)).toStrictEqual(JSON.stringify(a._circular))
  delete a._circular
  delete o._circular
  expect(JSON.stringify(o)).toStrictEqual(JSON.stringify(a))
})
