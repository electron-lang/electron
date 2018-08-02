import * as lsp from 'vscode-languageserver';

import { LspServer } from './lsp-server';
import { LspClientImpl } from './lsp-client';
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

    connection.onDidOpenTextDocument(server.didOpenTextDocument.bind(server));
    connection.onDidSaveTextDocument(server.didSaveTextDocument.bind(server));
    connection.onDidCloseTextDocument(server.didCloseTextDocument.bind(server));
    connection.onDidChangeTextDocument(server.didChangeTextDocument.bind(server));

    connection.onCompletion(server.completion.bind(server))

    connection.onRequest('schematic/path', server.schematicPath.bind(server));

    return connection;
}
