import * as fs from 'fs'
import * as path from 'path'
import { expect } from 'chai'
import { Crate } from '../crate'
import { DiagnosticTrace } from '../diagnostic'
import { ir, printDesignIR } from '../backend'

const tr = new DiagnosticTrace()

describe('Compiler Testsuite', () => {
    const crate = Crate.create(tr, path.join(__dirname, 'pass'))
    for (let file of crate.files) {
        it('should compile to IR ' + file.path, () => {
            if (!file.ir) {
                throw new Error('IR is undefined')
            }
            let doc = ''
            for (let mod of file.ir) {
                let imported = false
                let modDoc = ''
                const newAttrs: ir.IAttr[] = []
                for (let attr of mod.attrs) {
                    if (attr.name === 'doc') {
                        modDoc = attr.value as string
                    } else {
                        newAttrs.push(attr)
                    }
                    if (attr.name === 'import' && attr.value) {
                        imported = true
                    }
                }
                if (!imported) {
                    doc += modDoc
                }
                mod.attrs = newAttrs
            }
            expect(printDesignIR(file.ir)).to.equal(doc)
        })
    }

    it('should compile to kicad netlist', () => {
        crate.link().emitKicad('TwoVoltageDividers', false)
        const genPath = path.join(crate.crateInfo.buildDir, 'TwoVoltageDividers.net')
        const gen = fs.readFileSync(genPath)
        const goldPath = path.join(crate.crateInfo.srcDir, 'TwoVoltageDividers.gold.net')
        const gold = fs.readFileSync(goldPath)
        expect(gen.toString()).to.equal(gold.toString())
    })

})
