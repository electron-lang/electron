#!/usr/bin/env node
import { Command } from 'commander';
import { CrateFactory, Crate, DiagnosticLogger } from '.';

function getCrate(): Crate {
    return CrateFactory.create(new DiagnosticLogger())
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

program.command('kicad')
    .action(() => {
        getCrate().link().emitKicad()
    })

program.command('bom')
    .action(() => {
        getCrate().link().emitBom()
    })

program.command('verilog')
    .action(() => {
        getCrate().link().emitVerilog()
    })

program.version(require('../package.json').version)

program.parse(process.argv)

if (!process.argv.slice(2).length) {
    program.outputHelp()
}
