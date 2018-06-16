import { lexerInstance, IToken, tokenScopes } from '@electron-lang/electron';

function convertToken(token: IToken): monaco.languages.IToken {
    let scope = 'whitespace'
    if (token.tokenType) {
        const tokenType = token.tokenType
        scope = tokenScopes[tokenType.tokenTypeIdx || 0]
    }
    return {
        startIndex: token.startOffset,
        scopes: scope,
    }
}

export const ElectronTokensProvider: monaco.languages.TokensProvider = {
		getInitialState: () => new State(),
		tokenize: (line: string, state: State) => {
        const lexingResult = lexerInstance.tokenize(line)
        let tokens: monaco.languages.IToken[] = []
        if (lexingResult.tokens) {
            const etokens = lexingResult.tokens
            tokens = etokens.map(convertToken)
        }
        if (lexingResult.groups['Comments']) {
            const etokens = lexingResult.groups['Comments']
            tokens = tokens.concat(etokens.map(convertToken))
        }
        if (lexingResult.groups['DocComments']) {
            const etokens = lexingResult.groups['DocComments']
            tokens = tokens.concat(etokens.map(convertToken))
        }
        const lineTokens = {
            endState: state,
            tokens,
        };
        return lineTokens;
    }
}

class State implements monaco.languages.IState {
    public clone(): State {
        return new State();
    }

    public equals(other: monaco.languages.IState): boolean {
        return true;
    }
}
