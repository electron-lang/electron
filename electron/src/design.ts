import * as fs from 'fs'
import * as path from 'path'
import { Crate } from './crate'
import { HierarchyPass, RenameCellPass } from './passes'
import { ir, YosysBackend, KicadBackend, BomBackend,
         MarkdownBackend } from './backend'
import { Triple, Flow, Pcf, Sim } from 'electron-fpga'

export class Design {
    constructor(readonly crate: Crate, readonly ir: ir.Module[]) {}

    protected getModule(modName: string): ir.Module {
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

    protected emit(modName: string, fn: (mod: ir.Module, file: string) => void): void {
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
            //include: this.crate.getIncludes(),
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

    protected getTriple(mod: ir.Module, optional = false): Triple | undefined {
        const fpgaAttr = mod.getAttr('fpga')
        if (fpgaAttr) {
            return new Triple(fpgaAttr.value as string)
        }
        if (!optional) {
            this.crate.logger.error(
                `Missing @fpga attribute on module '${mod.name}'.`, mod.src)
        }
        return
    }

    protected getBoardDir(mod: ir.Module, optional = false): string | undefined {
        const boardAttr = mod.getAttr('board')
        if (boardAttr) {
            const builddir = this.crate.crateInfo.buildDir
            const boarddir = path.join(builddir, boardAttr.value as string)
            if (!fs.existsSync(boarddir)) {
                fs.mkdirSync(boarddir)
            }
            return boarddir
        }
        if (!optional) {
            this.crate.logger.error(
                `Missing @board attribute on module '${mod.name}'.`, mod.src)
        }
        return
    }

    protected getPcf(mod: ir.Module): Pcf {
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
        return pcf
    }

    synth(modName: string) {
        this.emit(modName, (mod, file) => {
            const triple = this.getTriple(mod)
            const boarddir = this.getBoardDir(mod)
            const pcf = this.getPcf(mod)
            if (!triple || !boarddir) {
                return
            }

            // Emit verilog for lec files
            const basepath = path.join(boarddir, modName)
            this._emitVerilog(mod, basepath)

            // Find all verilog sources
            const include = this.crate.getIncludes()
            include.push(basepath + '.v')

            // Run flow
            const flow = new Flow(triple)
            flow.flow(include, basepath + '.bin', mod.name, pcf)
        })
    }

    sim(modName: string) {
        this.emit(modName, (mod, file) => {
            // Emit verilog for lec files
            this._emitVerilog(mod, file)

            // Find all verilog sources
            const includes = this.crate.getIncludes()
            includes.push(file + '.v')

            // Run sim
            const sim = new Sim({ triple: this.getTriple(mod, true) })
            sim.sim(includes, file + '.vvp', mod.name)
        })
    }

    prog(modName: string) {
        this.emit(modName, (mod, file) => {
            const triple = this.getTriple(mod)
            const boarddir = this.getBoardDir(mod)
            if (!triple || !boarddir) {
                return
            }
            const basepath = path.join(boarddir, modName)
            const flow = new Flow(triple)
            flow.prog(basepath + '.bin')
        })
    }
}
