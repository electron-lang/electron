export const configuration: monaco.languages.LanguageConfiguration = {
    wordPattern: /(?:(?:;(?:.)*|[\s\+\*\(\)\[\]]|"(?:(?:\\"|[^"]))*"))+/g,
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
};
