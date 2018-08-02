import * as path from 'path'
import { expect } from 'chai'
import { Crate } from '../crate'
import { DiagnosticTrace } from '../diagnostic'
import { IModule } from '../frontend/ast'
import { printDesignIR } from '../backend/printer'

const tr = new DiagnosticTrace()

function getDocComments(mods: IModule[]): string {
    let doc = ''
    for (let mod of mods) {
        doc += mod.doc
    }
    return doc
}

describe('Compiler: PASS tests', () => {
    const crate = Crate.create(tr, path.join(__dirname, 'pass'))
    for (let file of crate.files) {
        it('should compile ' + file.path, () => {
            if (!file.ir) {
                throw new Error('IR is undefined')
            }
            const md = getDocComments(file.ast || [])
            try {
                expect(printDesignIR(file.ir)).to.equal(md)
            } catch(e) {
                console.log(file.ir)
                throw e
            }
        })
    }
})
