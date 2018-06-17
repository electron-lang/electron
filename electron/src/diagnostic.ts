export enum DiagnosticSeverity {
    Error,
    Warning,
    Info,
}

export enum DiagnosticType {
    TokenError,
    ParserError,
    SyntaxError,
    TypeError,
}

export interface IDiagnostic {
    message: string,
    startLine: number,
    startColumn: number,
    endLine: number,
    endColumn: number,
    severity: DiagnosticSeverity,
    errorType: DiagnosticType,
}
