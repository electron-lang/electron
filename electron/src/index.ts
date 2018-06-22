export { IToken } from 'chevrotain'
export * from './parser'
export * from './ast'
export * from './elaborator'
export * from './validator'
export * from './printer'
export * from './diagnostic'

import { IAstResult, IDiagnostic } from './diagnostic'
import { elaborate } from './elaborator'
import { Validator } from './validator'

export function compile(path: string, text: string): IAstResult {
    let errors: IDiagnostic[] = []

    const elab = elaborate(path, text)
    errors = elab.errors

    if (!elab.ast) {
        return {errors}
    }

    const validator = new Validator()
    const val = validator.validate(path, elab.ast)
    errors = errors.concat(errors)

    if (errors.length > 0) {
        return {ast: elab.ast, errors}
    }

    // TODO typecheck

    // TODO codegen

    return {ast: elab.ast, errors}
}
