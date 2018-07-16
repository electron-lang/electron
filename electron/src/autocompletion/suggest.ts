import { tokenMatcher } from 'chevrotain'
import { Identifier, Attribute, Keyword } from '../frontend/tokens'
import { parserInstance, lexerInstance } from '../frontend/parser'

export function getContentAssistSuggestions(text: string, symbolTable: string[]): string[] {
    const lexResult = lexerInstance.tokenize(text)
    if (lexResult.errors.length > 0) {
        return []
    }

    const lastInputToken = lexResult.tokens[lexResult.tokens.length - 1]
    let partialSuggestionMode = false
    let assistanceTokenVector = lexResult.tokens

    if (lastInputToken !== undefined &&
        (tokenMatcher(lastInputToken, Identifier)) ||
        (tokenMatcher(lastInputToken, Attribute)) ||
        (tokenMatcher(lastInputToken, Keyword)) &&
        /\w/.test(text[text.length - 1])) {
        assistanceTokenVector = assistanceTokenVector.slice(0, -1)
        partialSuggestionMode = true
    }

    const syntacticSuggestions = parserInstance.computeContentAssist(
        'statement',
        assistanceTokenVector
    )

    let finalSuggestions = []

    for (let i = 0; i < syntacticSuggestions.length; i++) {
        const currSyntaxSuggestion = syntacticSuggestions[i]
        const currTokenType = currSyntaxSuggestion.nextTokenType
        const currRuleStack = currSyntaxSuggestion.ruleStack
        const lastRuleName = currRuleStack[currRuleStack.length - 1]

        if (currTokenType.tokenTypeIdx &&
            currTokenType.PATTERN &&
            Keyword.categoryMatchesMap &&
            Keyword.categoryMatchesMap[currTokenType.tokenTypeIdx]) {
            if (typeof currTokenType.PATTERN === 'string') {
                finalSuggestions.push(currTokenType.PATTERN)
            } else {
                finalSuggestions.push(currTokenType.PATTERN.source)
            }
        } else if (currTokenType === Identifier) {
            if (lastRuleName === 'declaration') {

            } else {
                // throw Error('non exhaustive match')
            }
        } else {
            //throw Error('non exhaustive match')
        }
    }

    if (partialSuggestionMode) {
        finalSuggestions = finalSuggestions.filter((sugg) => {
            return sugg.startsWith(lastInputToken.image)
        })
    }

    return finalSuggestions.filter((value, index, self) => {
        return self.indexOf(value) === index
    })
}
