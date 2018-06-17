import * as lsp from 'vscode-languageserver';
import URI from 'vscode-uri';
import { IDiagnostic, DiagnosticSeverity } from '@electron-lang/electron'

export function uriToPath(stringUri: string): string {
    const uri = URI.parse(stringUri);
    if (uri.scheme !== 'file') {
        throw new Error(`The Typescript Language Server only supports ` +
                        `file-scheme URIs. Received "${stringUri}"`)
    }
    return uri.fsPath;
}

export function convertSeverity(s: DiagnosticSeverity): lsp.DiagnosticSeverity {
    switch (s) {
        case DiagnosticSeverity.Error:
            return lsp.DiagnosticSeverity.Error
        case DiagnosticSeverity.Warning:
            return lsp.DiagnosticSeverity.Warning
        case DiagnosticSeverity.Info:
            return lsp.DiagnosticSeverity.Information
    }
}

export function convertDiagnostic(d: IDiagnostic): lsp.Diagnostic {
    return {
        range: {
            start: {
                line: d.startLine - 1,
                character: d.startColumn - 1,
            },
            end: {
                line: d.endLine - 1,
                character: d.endColumn - 1,
            },
        },
        message: d.message,
        severity: convertSeverity(d.severity)
    }
}
