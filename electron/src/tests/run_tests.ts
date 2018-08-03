import * as path from 'path'
import { expect } from 'chai'
import { Crate } from '../crate'
import { DiagnosticTrace } from '../diagnostic'
import { ir, printDesignIR } from '../backend'

const tr = new DiagnosticTrace()

describe('Compiler: PASS tests', () => {
    const crate = Crate.create(tr, path.join(__dirname, 'pass'))
    for (let file of crate.files) {
        it('should compile ' + file.path, () => {
            if (!file.ir) {
                throw new Error('IR is undefined')
            }
            let doc = ''
            for (let mod of file.ir) {
                const newAttrs: ir.IAttr[] = []
                for (let attr of mod.attrs) {
                    if (attr.name === 'doc') {
                        doc += attr.value
                    } else {
                        newAttrs.push(attr)
                    }
                }
                mod.attrs = newAttrs
            }
            try {
                expect(printDesignIR(file.ir)).to.equal(doc)
            } catch(e) {
                console.log(file.ir)
                throw e
            }
        })
    }
})
