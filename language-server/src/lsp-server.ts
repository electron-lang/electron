import * as lsp from 'vscode-languageserver';
import { File, DiagnosticCollector } from '@electron-lang/electron';
import { getContentAssistSuggestions } from '@electron-lang/electron';
import { Logger, PrefixingLogger } from './logger';
import { LspClient } from './lsp-client';
import { uriToPath, convertDiagnostic } from './protocol-translation';
import { LspDocument } from './document';

export interface IServerOptions {
    logger: Logger;
    lspClient: LspClient;
}

export class LspServer {

    private openedDocumentUris: Map<string, LspDocument> = new Map<string, LspDocument>();
    private logger: Logger;

    constructor(private options: IServerOptions) {
        this.logger = new PrefixingLogger(options.logger, '[lspserver]')
    }

    public async initialize(params: lsp.InitializeParams): Promise<lsp.InitializeResult> {
        this.logger.info('initialize', params);

        const initializeResult: lsp.InitializeResult = {
            capabilities: {
                textDocumentSync: lsp.TextDocumentSyncKind.Incremental,
                completionProvider: {
                    resolveProvider: false,
                    triggerCharacters: [],
                }
            }
        };

        this.logger.info('onInitialize result', initializeResult);
        return initializeResult;
    }

    public didOpenTextDocument(params: lsp.DidOpenTextDocumentParams): void {
        this.logger.log('onDidOpenTextDocument', params);
        if (this.openedDocumentUris.get(params.textDocument.uri) !== undefined) {
            this.logger.log(`Cannot open already opened doc '${params.textDocument.uri}'.`);
            this.didChangeTextDocument({
                textDocument: params.textDocument,
                contentChanges: [
                    {
                        text: params.textDocument.text
                    }
                ]
            })
        } else {
            this.openedDocumentUris.set(params.textDocument.uri,
                                        new LspDocument(params.textDocument));
            this.requestDiagnostics(params.textDocument.uri);
        }
    }

    public didCloseTextDocument(params: lsp.DidOpenTextDocumentParams): void {
        this.logger.log('onDidCloseTextDocument', params);
        this.openedDocumentUris.delete(params.textDocument.uri)

        // We won't be updating diagnostics anymore for that file, so clear them
        // so we don't leave stale ones.
        this.options.lspClient.publishDiagnostics({
            uri: params.textDocument.uri,
            diagnostics: [],
        });
    }

    public didChangeTextDocument(params: lsp.DidChangeTextDocumentParams): void {
        const path = uriToPath(params.textDocument.uri)

        this.logger.log('onDidChangeTextDocument', params, path);
        const document = this.openedDocumentUris.get(params.textDocument.uri);
        if (!document) {
            this.logger.error('Received change on non-opened document ' +
                              params.textDocument.uri);
            throw new Error('Received change on non-opened document ' +
                            params.textDocument.uri);
        }
        document.markAccessed();
        document.apply(params.contentChanges, params.textDocument.version || document.version)
        this.requestDiagnostics(params.textDocument.uri);
    }

    public didSaveTextDocument(params: lsp.DidChangeTextDocumentParams): void {
        // do nothing
    }

    public requestDiagnostics(uri: string): void {
        // compile with electron
        const doc = this.openedDocumentUris.get(uri)
        if (doc !== undefined) {
            const path = uriToPath(uri)
            const dc = new DiagnosticCollector()
            const f = new File(dc, path, doc.text)
            f.compile()
            const diagnostics: lsp.Diagnostic[] = dc.getDiagnostics()
                .filter((d) => d.path === path)
                .map(convertDiagnostic)
            this.options.lspClient.publishDiagnostics({
                uri,
                diagnostics,
            })
        }
    }

    public async completion(params: lsp.TextDocumentPositionParams)
    : Promise<lsp.CompletionList> {
        this.logger.info('completion', params)

        const doc = this.openedDocumentUris.get(params.textDocument.uri)
        if (doc !== undefined) {
            const line = doc.lineAt(params.position.line).text
            const suggestions = getContentAssistSuggestions(line, [])
            const completionItems = suggestions.map((str) => {
                return {
                    label: str,
                }
            })
            return {
                isIncomplete: false,
                items: completionItems,
            }
        }

        return {isIncomplete: true, items: []}
    }
}
