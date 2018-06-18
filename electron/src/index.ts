export { IToken } from 'chevrotain'
export * from './parser'
export * from './ast'
export * from './elaborator'
export * from './printer'
export * from './typechecker'
export * from './diagnostic'

import { IAstDesign } from './ast'
import { lexerInstance, parserInstance } from './parser'
import { elaboratorInstance } from './elaborator'
import { TypeChecker } from './typechecker'
import { IDiagnostic, DiagnosticSeverity, DiagnosticType } from './diagnostic'

export interface IResult {
    ast?: IAstDesign,
    errors: IDiagnostic[],
}

export function compile(text: string): IResult {
    let errors: IDiagnostic[] = []

    // lex
    const lexingResult = lexerInstance.tokenize(text)
    for (let err of lexingResult.errors) {
        errors.push({
            message: err.message,
            src: {
                startLine: err.line,
                startColumn: err.column,
                endLine: err.line,
                endColumn: err.column + err.length,
            },
            severity: DiagnosticSeverity.Error,
            errorType: DiagnosticType.LexingError,
        })
    }

    if (errors.length > 0) {
        return {errors}
    }

    // parse
    parserInstance.input = lexingResult.tokens
    const cst = parserInstance.design()
    for (let err of parserInstance.errors) {
        let lastToken = err.token
        if (err.resyncedTokens.length > 0) {
            lastToken = err.resyncedTokens[err.resyncedTokens.length - 1]
        }
        errors.push({
            message: err.message,
            src: {
                startLine: err.token.startLine || 0,
                startColumn: err.token.startColumn || 0,
                endLine: lastToken.endLine || 0,
                endColumn: lastToken.endColumn || 0,
            },
            severity: DiagnosticSeverity.Error,
            errorType: DiagnosticType.ParsingError,
        })
    }

    if (errors.length > 0) {
        return {errors}
    }

    // elaborate
    const ast = elaboratorInstance.visit(cst)
    errors = elaboratorInstance.errors

    // typecheck
    const typechecker = new TypeChecker()
    typechecker.typeCheck(ast)
    errors = errors.concat(typechecker.errors)

    if (errors.length > 0) {
        return {errors}
    }

    return {ast, errors}
}
