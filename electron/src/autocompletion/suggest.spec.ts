import { expect } from 'chai'
import { getContentAssistSuggestions } from './suggest'

function expectSuggestion(text: string, startsWith: string, contained: string) {
    const suggestions = getContentAssistSuggestions(text, [])
    expect(suggestions.startsWith).to.equal(startsWith)
    expect(suggestions.suggestions).to.contain(contained)
}

describe('test suggest keywords', () => {
    it('should suggest import', () => {
        expectSuggestion('imp', 'imp', 'import')
    })

    it('should suggest from', () => {
        expectSuggestion('import a fr', 'fr', 'from')
    })

    it('should suggest export', () => {
        expectSuggestion('exp', 'exp', 'export')
    })

    it('should suggest input', () => {
        expectSuggestion(' in', 'in', 'input')
    })

    it('should suggest attributes', () => {
        expectSuggestion('@b', '@b', '@bom')
    })
})
