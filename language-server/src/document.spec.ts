import { assert } from 'chai';
import * as path from 'path';
import { LspDocument } from './document';

describe('document', () => {
    it('getPosition', () => {
        const doc = new LspDocument({
            text:
`Mdfsdf
dfsdfsd
dfdsf`, uri: 'foo', version: 0, languageId: 'FOO'
        })
        assert.equal(doc.getPosition(0).line, 0);
        assert.equal(doc.getPosition(0).character, 0);

        assert.equal(doc.getPosition(doc.text.length).line, 2);
        assert.equal(doc.getPosition(doc.text.length).character, 5);
    })

    it('getOffset', () => {
        const doc = new LspDocument({
            text:
`Mdfsdf
dfsdfsd
dfdsf`, uri: 'foo', version: 0, languageId: 'FOO'
        })
        assert.equal(doc.offsetAt({ line: 0, character: 4 }), 4);
        assert.equal(doc.offsetAt({ line: 1, character: 4 }), 11);
        assert.equal(doc.offsetAt({ line: 2, character: 4 }), 19);
    })

    it('getPosition with empty doc', () => {
        const doc = new LspDocument({
            text: '', uri: 'foo', version: 0, languageId: 'FOO'
        })
        assert.equal(doc.getPosition(0).line, 0);
        assert.equal(doc.getPosition(0).character, 0);
    })
})
