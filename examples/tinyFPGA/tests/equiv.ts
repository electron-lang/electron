import { expect } from 'chai'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { netlist, Design } from 'libkicad'

function removeNC(design: Design) {
    let i = 0
    while (i < design.nets.length) {
        const net = design.nets[i]
        if (net.nodes.length < 2) {
            design.removeNet(net.code)
        } else {
            i += 1
        }
    }
}

describe('Netlist', () => {
    it('should be equivalent to TinyFPGA-BX.net', () => {
        const p1 = resolve('./build/TinyFPGA-BX.net')
        const t1 = readFileSync(p1)
        const d1 = netlist.parse(t1.toString())
        removeNC(d1)

        d1.swapPins('R1', ['1', '2'])
        d1.swapPins('R2', ['1', '2'])
        d1.swapPins('R3', ['1', '2'])
        d1.swapPins('R4', ['1', '2'])
        d1.swapPins('C6', ['1', '2'])
        d1.swapPins('C7', ['1', '2'])

        const p2 = resolve('./tests/TinyFPGA-BX.clean.net')
        const t2 = readFileSync(p2)
        const d2 = netlist.parse(t2.toString())
        removeNC(d2)

        expect(netlist.equiv(d1, d2)).to.equal(true)
    })
})
