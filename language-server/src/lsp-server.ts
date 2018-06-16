import * as lsp from 'vscode-languageserver';
import { Logger, PrefixingLogger } from './logger';
import { LspClient } from './lsp-client';

export interface IServerOptions {
    logger: Logger;
    lspClient: LspClient;
}

export class LspServer {

    private initializeParams: lsp.InitializeParams;
    private initializeResult: lsp.InitializeResult;
    private logger: Logger;

    constructor(private options: IServerOptions) {
        this.logger = new PrefixingLogger(options.logger, '[lspserver]')
    }

    public async initialize(params: lsp.InitializeParams): Promise<lsp.InitializeResult> {
        this.logger.log('initialize', params);
        this.initializeParams = params;

        // start electron

        this.initializeResult = {
            capabilities: {}
        };

        this.logger.log('onInitialize result', this.initializeResult);
        return this.initializeResult;
    }
}
