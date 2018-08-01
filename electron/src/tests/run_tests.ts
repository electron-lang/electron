import { readdirSync } from 'fs'
import { expect } from 'chai'
import { DiagnosticTrace } from '../diagnostic'
import { File } from '../file'
import { IModule } from '../frontend/ast'
import { _resetSigCounter } from '../backend/ir'
import { printDesignIR } from '../backend/printer'

const tr = new DiagnosticTrace()

const files = readdirSync(__dirname + '/pass').filter((f) => {
    return !f.endsWith('.d.lec') && f.endsWith('.lec')
})

function getDocComments(mods: IModule[]): string {
    let doc = ''
    for (let mod of mods) {
        doc += mod.doc
    }
    return doc
}

describe('Compiler: PASS tests', () => {
    for (let f of files) {
        it('should compile ' + f, () => {
            _resetSigCounter()
            const file = new File(tr, __dirname + '/pass/' + f)
            let ir = file.compile().getIR()
            if (!ir) {
                throw new Error('IR is undefined')
            }
            const md = getDocComments(file.getAst() || [])
            try {
                expect(printDesignIR(ir)).to.equal(md)
            } catch(e) {
                console.log(ir)
                throw e
            }
        })
    }
})

describe('Compiler: FAIL tests', () => {

})
