import { IToken } from 'chevrotain'
import { IAstDesign } from './ast'
import { IR, IModule } from './backend/ir'

export enum DiagnosticSeverity {
    Error,
    Warning,
    Info,
}

export interface IDiagnostic {
    message: string,
    src: ISrcLoc,
    severity: DiagnosticSeverity,
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

export interface IAstResult {
    ast?: IAstDesign,
    errors: IDiagnostic[],
}

export interface IIRResult {
    ir: IModule[],
    errors: IDiagnostic[],
}
