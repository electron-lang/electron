import { tokenMatcher } from 'chevrotain'
import { Identifier, Attribute, Keyword } from '../frontend/tokens'
import { parserInstance, lexerInstance } from '../frontend/parser'
import { allAttributes } from '../frontend/attributes'

export interface Suggestions {
    startsWith: string,
    suggestions: string[],
}

const NoSuggestions = { startsWith: '', suggestions: [] }

export function getContentAssistSuggestions(line: string, symbolTable: string[]): Suggestions {
    const lexResult = lexerInstance.tokenize(line)
    if (lexResult.errors.length > 0) {
        return NoSuggestions
    }

    const lastInputToken = lexResult.tokens[lexResult.tokens.length - 1]
    let partialSuggestionMode = false
    let assistanceTokenVector = lexResult.tokens

    if (lastInputToken !== undefined &&
        (tokenMatcher(lastInputToken, Identifier)) ||
        (tokenMatcher(lastInputToken, Attribute)) ||
        (tokenMatcher(lastInputToken, Keyword)) &&
        /\w/.test(line[line.length - 1])) {
        assistanceTokenVector = assistanceTokenVector.slice(0, -1)
        partialSuggestionMode = true
    }

    const rule = (() => {
        switch(line[0]) {
            case ' ':
                return 'statement'
            case 'i':
                return 'moduleImport'
            default:
                return 'moduleDeclaration'
        }
    })()

    const syntacticSuggestions = parserInstance.computeContentAssist(
        rule,
        assistanceTokenVector
    )

    let finalSuggestions = []

    for (let i = 0; i < syntacticSuggestions.length; i++) {
        const currSyntaxSuggestion = syntacticSuggestions[i]
        const currTokenType = currSyntaxSuggestion.nextTokenType
        //const currRuleStack = currSyntaxSuggestion.ruleStack
        //const lastRuleName = currRuleStack[currRuleStack.length - 1]

        if (currTokenType.tokenTypeIdx &&
            currTokenType.PATTERN &&
            Keyword.categoryMatchesMap &&
            Keyword.categoryMatchesMap[currTokenType.tokenTypeIdx]) {
            if (typeof currTokenType.PATTERN === 'string') {
                finalSuggestions.push(currTokenType.PATTERN)
            } else {
                finalSuggestions.push(currTokenType.PATTERN.source)
            }
        } else if (currTokenType === Attribute) {
            for (let attr in allAttributes) {
                if (allAttributes.hasOwnProperty(attr)) {
                    finalSuggestions.push('@' + attr)
                }
            }
        } else if (currTokenType === Identifier) {
        } else {
            //console.log(currTokenType)
            //throw Error('non exhaustive match')
        }
    }

    if (partialSuggestionMode) {
        finalSuggestions = finalSuggestions.filter((sugg) => {
            return sugg.startsWith(lastInputToken.image)
        })
    }

    return {
        startsWith: partialSuggestionMode ? lastInputToken.image : '',
        suggestions: finalSuggestions.filter((value, index, self) => {
            return self.indexOf(value) === index
        })
    }
}
