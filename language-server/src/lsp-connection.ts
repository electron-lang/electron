import * as lsp from 'vscode-languageserver';

import { LspServer } from './lsp-server';
import { LspClient, LspClientImpl } from './lsp-client';
import { LspClientLogger } from './logger'

export interface IServerOptions {
    showMessageLevel: lsp.MessageType
}

export function createLspConnection(options: IServerOptions): lsp.IConnection {
    const connection = lsp.createConnection();
    const lspClient = new LspClientImpl(connection);
    const logger = new LspClientLogger(lspClient, options.showMessageLevel);
    const server: LspServer = new LspServer({
        logger,
        lspClient,
    })

    connection.onInitialize(server.initialize.bind(server));

    return connection;
}
