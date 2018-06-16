import { ELECTRON_LANGUAGE_ID, ELECTRON_LANGUAGE_NAME } from '../../common';
import { configuration } from './electron-monaco-language';
import { ElectronTokensProvider } from './electron-tokens-provider';

monaco.languages.register({
    id: ELECTRON_LANGUAGE_ID,
    extensions: ['.lec'],
    aliases: [ELECTRON_LANGUAGE_NAME, 'electron'],
    mimetypes: ['text/x-electron-source', 'text/x-electron'],
});

monaco.languages.onLanguage(ELECTRON_LANGUAGE_ID, () => {
    monaco.languages.setLanguageConfiguration(ELECTRON_LANGUAGE_ID, configuration);
    monaco.languages.setTokensProvider(ELECTRON_LANGUAGE_ID, ElectronTokensProvider);
});
