#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import * as electron from './index';

const program = new Command('electron')
    .version(require('../package.json').version, '-v, --version')
    .description('Electron compiler')

program.command('compile <file>')
    .action((file) => {
        const text = fs.readFileSync(path.resolve(file)).toString()
        const result = electron.compile(text)
        const lines = text.split('\n')
        if (result.errors.length > 0) {
            for (let error of result.errors) {
                reportDiagnostic(file, lines[error.src.startLine - 1], error)
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

function reportDiagnostic(path: string, lineContents: string,
                          diagnostic: electron.IDiagnostic) {
    const file = chalk.magenta(path)
    const lineNumber = diagnostic.src.startLine.toString()
    {
        const line = chalk.cyan(lineNumber)
        const column = chalk.cyan(diagnostic.src.startColumn.toString())
        let ty = ''
        if (diagnostic.severity === electron.DiagnosticSeverity.Error) {
            ty = chalk.red('error')
        } else if (diagnostic.severity === electron.DiagnosticSeverity.Warning) {
            ty = chalk.yellow('warn')
        } else if (diagnostic.severity === electron.DiagnosticSeverity.Info) {
            ty = chalk.blue('info')
        }
        const message = `${file}:${line}:${column} - ${ty}: ${diagnostic.message}\n`
        console.error(message)
    }
    const line = chalk.black(chalk.bgWhite(lineNumber))
    const indent = chalk.bgWhite(' '.repeat(lineNumber.length))
    const lineMessage = `${line}\t${lineContents}\n${indent}\n\n`
    console.error(lineMessage)
}
