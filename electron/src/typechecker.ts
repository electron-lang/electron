import { readFileSync } from 'fs';
import { lexerInstance, parserInstance } from './parser';
import { elaboratorInstance } from './elaborator';
import { IDiagnostic, DiagnosticSeverity, DiagnosticType } from './diagnostic'

export function typeCheck(text: string): IDiagnostic[] {
    const errors: IDiagnostic[] = []

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
            errorType: DiagnosticType.TokenError,
        })
    }

    if (errors.length > 0) {
        return errors
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
            errorType: DiagnosticType.ParserError,
        })
    }

    if (errors.length > 0) {
        return errors
    }

    // elaborate
    elaboratorInstance.visit(cst)
    for (let err of elaboratorInstance.errors) {
        errors.push(err)
    }

    return errors
}
