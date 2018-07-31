#!/usr/bin/env node
import { Command } from 'commander';
import { File } from './index';
import { DiagnosticLogger } from './diagnostic'

const program = new Command('electron')
    .version(require('../package.json').version, '-v, --version')
    .description('Electron compiler')

program.command('compile <file>')
    .option('-a, --dump-ast', 'Dumps AST to stdout for debugging purposes.')
    .option('-i, --dump-ir', 'Dumps IR to stdout for debugging purposes.')
    .action((path, options) => {
        const file = new File(new DiagnosticLogger(), path)
        file.compile().emitJSON()
        if (options.dumpAst) {
            file.dumpAst()
        }
        if (options.dumpIr) {
            file.dumpIR()
        }
    })

program.command('docs <file> [dir]')
    .action((path, dir, options) => {
        const file = new File(new DiagnosticLogger(), path)
        file.compile().emitDocs(dir)
    })

program.command('verilog <file> [dir]')
  .action((path, dir, options) => {
    const file = new File(new DiagnosticLogger(), path)
    file.compile().emitVerilog();
  })

program.command('blif <file> [dir]')
  .action((path, dir, options) => {
    const file = new File(new DiagnosticLogger(), path)
    file.compile().emitBlif();
  })

program.command('kicad <file> [dir]')
  .action((path, dir, options) => {
    const file = new File(new DiagnosticLogger(), path)
    file.compile().emitKicad();
  })

program.command('bom <file> [dir]')
  .action((path, dir, options) => {
    const file = new File(new DiagnosticLogger(), path)
    file.compile().emitBom();
  })

program.version(require('../package.json').version)

program.parse(process.argv)

if (!process.argv.slice(2).length) {
    program.outputHelp()
}
