#!/usr/bin/env node
import { Command } from 'commander';
import { Crate, DiagnosticLogger } from '.';

function getCrate(): Crate {
    return Crate.create(new DiagnosticLogger())
}

const program = new Command('electron')
    .version(require('../package.json').version, '-v, --version')
    .description('Electron compiler')

program.command('build')
    .action(() => {
        getCrate().build()
    })

program.command('link')
    .action(() => {
        getCrate().link()
    })


program.command('docs')
    .action(() => {
        getCrate().link().emitDocs()
    })

program.command('kicad <module>')
    .action((mod: string) => {
        getCrate().link().emitKicad(mod)
    })

program.command('bom <module>')
    .action((mod: string) => {
        getCrate().link().emitBom(mod)
    })

program.command('verilog <module>')
    .action((mod: string) => {
        getCrate().link().emitVerilog(mod)
    })

program.command('synth <module>')
    .action((mod: string) => {
        getCrate().link().synth(mod)
    })

program.command('sim <module>')
    .action((mod: string) => {
        getCrate().link().sim(mod)
    })

program.command('prog <module>')
    .action((mod: string) => {
        getCrate().link().prog(mod)
    })

program.version(require('../package.json').version)

program.parse(process.argv)

if (!process.argv.slice(2).length) {
    program.outputHelp()
}
