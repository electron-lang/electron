import { injectable } from 'inversify';
import { BaseLanguageServerContribution,
         IConnection } from '@theia/languages/lib/node';
import { ELECTRON_LANGUAGE_ID, ELECTRON_LANGUAGE_NAME } from '../common';

@injectable()
export class ElectronContribution extends BaseLanguageServerContribution {

    readonly id = ELECTRON_LANGUAGE_ID;
    readonly name = ELECTRON_LANGUAGE_NAME;

    start(clientConnection: IConnection): void {
        const command = "node";
        const args: string[] = [
            __dirname + "/startserver.js",
            '--stdio'
        ];
        const serverConnection =
            this.createProcessStreamConnection(command, args);
        this.forward(clientConnection, serverConnection);
    }

    protected onDidFailSpawnProcess(error: Error): void {
        super.onDidFailSpawnProcess(error);
        const message = 'Error starting electron-language-server.'
        console.error(message);
    }
}
