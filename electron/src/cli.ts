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

program.parse(process.argv)

if (!process.argv.slice(2).length) {
    program.outputHelp()
}
