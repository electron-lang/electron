import { IToken } from 'chevrotain'
import { IAstDesign } from './ast'

export enum DiagnosticSeverity {
    Error,
    Warning,
    Info,
}

export enum DiagnosticType {
    LexingError = 'lexer',
    ParsingError = 'parser',
    ElaborationError = 'elaboration',
    SymbolTableError = 'symbol-table',
    TypeCheckingError = 'typechecker',
}

export interface IDiagnostic {
    message: string,
    src: ISrcLoc,
    severity: DiagnosticSeverity,
    errorType: DiagnosticType,
}

export interface ISrcLoc {
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
}

export function tokenToSrcLoc(token: IToken): ISrcLoc {
    return {
        startLine: token.startLine || 0,
        startColumn: token.startColumn || 0,
        endLine: token.endLine || 0,
        endColumn: token.endColumn || 0,
    }
}

export const emptySrcLoc: ISrcLoc = {
    startLine: 0,
    startColumn: 0,
    endLine: 0,
    endColumn: 0,
}

export interface IResult {
    ast?: IAstDesign,
    errors: IDiagnostic[],
}
