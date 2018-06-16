import * as lsp from 'vscode-languageserver';

export interface LspClient {
    publishDiagnostics(args: lsp.PublishDiagnosticsParams): void;
    showMessage(args: lsp.ShowMessageParams): void;
    logMessage(args: lsp.LogMessageParams): void;
}

export class LspClientImpl implements LspClient {
    constructor(protected connection: lsp.IConnection) {

    }

    publishDiagnostics(args: lsp.PublishDiagnosticsParams): void {
        this.connection.sendNotification(lsp.PublishDiagnosticsNotification.type, args);
    }

    showMessage(args: lsp.ShowMessageParams): void {
        this.connection.sendNotification(lsp.ShowMessageNotification.type, args);
    }

    logMessage(args: lsp.LogMessageParams): void {
        this.connection.sendNotification(lsp.LogMessageNotification.type, args);
    }
}
