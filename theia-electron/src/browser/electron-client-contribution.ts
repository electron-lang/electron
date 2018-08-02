import { injectable, inject } from 'inversify';
import { BaseLanguageClientContribution, Workspace, Languages,
         LanguageClientFactory } from '@theia/languages/lib/browser';
import { ELECTRON_LANGUAGE_ID, ELECTRON_LANGUAGE_NAME } from '../common';

@injectable()
export class ElectronClientContribution extends BaseLanguageClientContribution {

    readonly id = ELECTRON_LANGUAGE_ID;
    readonly name = ELECTRON_LANGUAGE_NAME;

    constructor(
        @inject(Workspace) protected readonly workspace: Workspace,
        @inject(Languages) protected readonly languages: Languages,
        @inject(LanguageClientFactory)
        protected readonly languageClientFactory: LanguageClientFactory
    ) {
        super(workspace, languages, languageClientFactory);
    }

    protected get globPatterns() {
        return ['**/*.lec'];
    }

}
