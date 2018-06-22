export { IToken } from 'chevrotain'
export * from './parser'
export * from './ast'
export * from './elaborator'
export * from './printer'
export * from './typechecker'
export * from './diagnostic'

import { IResult } from './diagnostic'
import { elaborate } from './elaborator'
import { TypeChecker } from './typechecker'

export function compile(path: string, text: string): IResult {
    let {ast, errors} = elaborate(path, text)

    if (!ast) {
        return {errors}
    }

    // typecheck
    const typechecker = new TypeChecker()
    typechecker.typeCheck(path, ast)
    errors = errors.concat(typechecker.errors)

    if (errors.length > 0) {
        return {ast, errors}
    }

    // codegen
    // TODO
    return {ast, errors}
}
