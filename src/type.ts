export type Replacer = (this: any, key: string, value: any, root: boolean) => any
export type Whitelist = (number | string)[]
export type Reviver = (this: any, key: string, value: any) => any
