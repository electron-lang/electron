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
        electron.parse(text)
        const ast = electron.elaborate(text)
        const res = electron.print(ast)
        console.log(res)
    })

program.parse(process.argv)

if (!process.argv.slice(2).length) {
    program.outputHelp()
}
