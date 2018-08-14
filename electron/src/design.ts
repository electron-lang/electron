import * as fs from 'fs'
import * as path from 'path'
import { Crate } from './crate'
import { HierarchyPass, RenameCellPass } from './passes'
import { ir, YosysBackend, KicadBackend, BomBackend,
         MarkdownBackend } from './backend'
import { Triple, Flow, Pcf, Sim } from 'electron-fpga'

export class Design {
    constructor(readonly crate: Crate, readonly ir: ir.Module[]) {}

    getModule(modName: string): ir.Module {
        for (let mod of this.ir) {
            const nameAttr = mod.getAttr('name')
            if (nameAttr && nameAttr.value === modName) {
                return mod
            }
        }
        throw new Error(`Module ${modName} not found.`)
    }

    emitDocs() {
        const file = path.join(this.crate.crateInfo.docsDir,
                               this.crate.crateInfo.name)
        const hierarchy = new HierarchyPass(this.crate.logger)
        const markdownBackend = new MarkdownBackend(this.crate.logger)
        markdownBackend.emit(hierarchy.transform(this.ir), file + '.md')
    }

    emit(modName: string, fn: (mod: ir.Module, file: string) => void): void {
        const mod = this.getModule(modName)
        if (mod) {
            const file = path.join(this.crate.crateInfo.buildDir, modName)
            fn(mod, file)
        }
    }

    protected _emitVerilog(mod: ir.Module, file: string): void {
        const yosysBackend = new YosysBackend({
            logger: this.crate.logger,
            jsonPath: file + '.yosys.json',
            include: this.crate.getIncludes()
        })
        yosysBackend.emit(mod, file + '.v')
    }

    emitVerilog(modName: string) {
        this.emit(modName, (mod, file) => this._emitVerilog(mod, file))
    }

    emitKicad(modName: string, emitDate=true) {
        this.emit(modName, (mod, file) => {
            const pass1 = new HierarchyPass(this.crate.logger)
            pass1.hierarchy(mod)
            const pass2 = new RenameCellPass(this.crate.logger)
            pass2.transform([mod])

            const kicadBackend = new KicadBackend(
                this.crate.logger,
                this.crate.crateInfo.version,
                mod.src.file,
                emitDate,
            )
            kicadBackend.emit(mod, file + '.net')
        })
    }

    emitBom(modName: string) {
        this.emit(modName, (mod, file) => {
            const bomBackend = new BomBackend(this.crate.logger)
            bomBackend.emit(mod, file + '.tsv')
        })
    }

    synth(modName: string) {
        this.emit(modName, (mod, file) => {
            const fpgaAttr = mod.getAttr('fpga')
            if (!fpgaAttr) {
                this.crate.logger.error(
                    `Missing @fpga attribute on module '${mod.name}'.`, mod.src)
                return
            }
            const boardAttr = mod.getAttr('board')
            if (!boardAttr) {
                this.crate.logger.error(
                    `Missing @board attribute on module '${mod.name}'.`, mod.src)
                return
            }

            const pcf = new Pcf()
            for (let port of mod.ports) {
                const padsAttr = port.getAttr('pads')
                if (!padsAttr) {
                    this.crate.logger.error(
                        `Missing @set_pad attribute on port '${port.name}.'`,
                        port.src)
                } else {
                    const pads = padsAttr.value as string[]
                    if (pads.length !== port.value.length) {
                        this.crate.logger.error(
                            `Number of pads doesn't match width of port '${port.name}'.`,
                            padsAttr.src)
                    } else {
                        if (pads.length === 1) {
                            pcf.setIo(port.name, pads[0])
                        } else {
                            for (let i = 0; i < pads.length; i++) {
                                pcf.setIo(`${port.name}[${i}]`, pads[i])
                            }
                        }
                    }
                }
            }

            const board = boardAttr.value as string
            const builddir = this.crate.crateInfo.buildDir
            const boarddir = path.join(builddir, board)
            if (!fs.existsSync(boarddir)) {
                fs.mkdirSync(boarddir)
            }

            const basepath = path.join(boarddir, modName)
            const triple = fpgaAttr.value as string
            const flow = new Flow(new Triple(triple))
            this._emitVerilog(mod, basepath)
            flow.flow(basepath + '.v', basepath + '.bin', mod.name, pcf)
        })
    }

    sim(modName: string) {
        this.emitVerilog(modName)
        this.emit(modName, (mod, file) => {
            this._emitVerilog(mod, file)
            const includes = this.crate.getIncludes()
            includes.push(file + '.v')
            // FIXME
            const sim = new Sim(['/opt/nextpnr/lib/ivl'])
            sim.sim(includes.join(' '), file + '.vvp')
        })
    }

    prog(modName: string) {
        this.emit(modName, (mod, file) => {
            const fpgaAttr = mod.getAttr('fpga')
            if (!fpgaAttr) {
                this.crate.logger.error(
                    `Missing @fpga attribute on module '${mod.name}'.`, mod.src)
                return
            }
            const boardAttr = mod.getAttr('board')
            if (!boardAttr) {
                this.crate.logger.error(
                    `Missing @board attribute on module '${mod.name}'.`, mod.src)
                return
            }
            const board = boardAttr.value as string
            const triple = fpgaAttr.value as string
            const builddir = this.crate.crateInfo.buildDir
            const boarddir = path.join(builddir, board)
            const basepath = path.join(boarddir, modName)
            const flow = new Flow(new Triple(triple))
            flow.prog(basepath + '.bin')
        })
    }
}
