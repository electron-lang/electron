import { expect } from 'chai'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { netlist, Design } from 'libkicad'

describe('Netlist', () => {
    it('should be equivalent to TinyFPGA-BX.net', () => {
        const p1 = resolve('./build/TinyFPGA-BX.net')
        const t1 = readFileSync(p1)
        const d1 = netlist.parse(t1.toString())

        d1.swapPins('R3', ['1', '2'])

        const p2 = resolve('./tests/TinyFPGA-BX.clean.net')
        const t2 = readFileSync(p2)
        const d2 = netlist.parse(t2.toString())

        expect(netlist.equiv(d1, d2)).to.equal(true)
    })
})
