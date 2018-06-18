#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import * as electron from './index';

const program = new Command('electron')
    .version(require('../package.json').version, '-v, --version')
    .description('Electron compiler')

program.command('compile <file>')
    .action((file) => {
        const text = fs.readFileSync(path.resolve(file)).toString()
        const result = electron.compile(text)
        if (result.errors.length > 0) {
            for (let error of result.errors) {
                reportDiagnostic(error)
            }
        }
        if (result.ast) {
            const res = electron.print(result.ast)
            console.log(res)
        }
    })

program.parse(process.argv)

if (!process.argv.slice(2).length) {
    program.outputHelp()
}

function reportDiagnostic(diagnostic: electron.IDiagnostic) {
    const line = diagnostic.src.startLine.toString()
    const column = diagnostic.src.startColumn.toString()
    const ty = diagnostic.errorType
    let message = `[${ty}] ${diagnostic.message} (${line}, ${column})`
    let print = console.info

    if (diagnostic.severity === electron.DiagnosticSeverity.Error) {
        print = console.error
    } else if (diagnostic.severity === electron.DiagnosticSeverity.Warning) {
        print = console.warn
    }

    print(message)
}
