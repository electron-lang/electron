import { injectable } from 'inversify'
import { LanguageGrammarDefinitionContribution, TextmateRegistry
       } from '@theia/monaco/lib/browser/textmate'
import { ELECTRON_LANGUAGE_ID, ELECTRON_LANGUAGE_NAME } from '../common';

@injectable()
export class ElectronGrammarContribution implements LanguageGrammarDefinitionContribution {

    readonly config: monaco.languages.LanguageConfiguration = {
        brackets: [['(', ')'], ['{', '}'], ['[', ']']],
        autoClosingPairs: [
            { open: '(', close: ')' },
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '"', close: '"', notIn: ['string'] }
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' }
        ],
        indentationRules: {
            increaseIndentPattern: /{$/,
            decreaseIndentPattern: /}$/,
        },
        onEnterRules: [
            {
                beforeText: /\/\/\//,
                action: {
                    indentAction: monaco.languages.IndentAction.None,
                    appendText: '/// '
                },
            }
        ]
    }

    registerTextmateLanguage(registry: TextmateRegistry) {
        monaco.languages.register({
            id: ELECTRON_LANGUAGE_ID,
            extensions: ['.lec'],
            aliases: [ELECTRON_LANGUAGE_NAME, 'electron'],
            mimetypes: ['text/x-electron-source', 'text/x-electron'],
        });

        monaco.languages.setLanguageConfiguration(ELECTRON_LANGUAGE_ID, this.config)

        const electronGrammar = require('../../data/electron.tmLanguage.json')
        registry.registerTextMateGrammarScope('source.electron', {
            async getGrammarDefinition() {
                return {
                    format: 'json',
                    content: electronGrammar
                }
            }
        });

        registry.mapLanguageIdToTextmateGrammar(ELECTRON_LANGUAGE_ID, 'source.electron');
    }
}
