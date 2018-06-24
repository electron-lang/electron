import * as lsp from 'vscode-languageserver';
import URI from 'vscode-uri';
import { IDiagnostic } from '@electron-lang/electron'

export function uriToPath(stringUri: string): string {
    const uri = URI.parse(stringUri);
    if (uri.scheme !== 'file') {
        throw new Error(`The Typescript Language Server only supports ` +
                        `file-scheme URIs. Received "${stringUri}"`)
    }
    return uri.fsPath;
}

export function convertSeverity(s: string): lsp.DiagnosticSeverity {
    switch (s) {
        case 'error':
            return lsp.DiagnosticSeverity.Error
        case 'warn':
            return lsp.DiagnosticSeverity.Warning
        case 'info':
            return lsp.DiagnosticSeverity.Information
        default:
            return lsp.DiagnosticSeverity.Hint
    }
}

export function convertDiagnostic(d: IDiagnostic): lsp.Diagnostic {
    return {
        range: {
            start: {
                line: d.src.startLine - 1,
                character: d.src.startColumn - 1,
            },
            end: {
                line: d.src.endLine - 1,
                character: d.src.endColumn,
            },
        },
        message: d.message,
        severity: convertSeverity(d.severity)
    }
}
