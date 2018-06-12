import * as fs from 'fs';
import * as path from 'path';
import * as program from 'commander';
import * as readline from 'readline-sync';
import {INetlist} from '@electron-lang/celllib';
import {readJson, writeJson} from './json';
import {writeILang} from './ilang';

let STATE: INetlist | undefined;

export function main() {
    program
        .version('1.0.0', '-v, --version')
        .description('Extended yosys netlist format utility')
        .option('-f, --file <file>', 'File to load commands from')
        .option('-c, --cmds <commands>', 'Commands to run');

    program.on('command:*', () => {
        console.error('Invalid command: %s', program.args.join(' '));
        console.error('See --help for a list of available commands.');
        process.exit(1);
    });

    program.parse(process.argv);

    let commands;
    if (program.file) {
        try {
            commands = fs.readFileSync(path.resolve(program.file)).toString();
        } catch(err) {
            if (err.code === 'ENOENT') {
                console.error('File not found');
                process.exit(1);
            } else {
                throw err;
            }
        }
    }
    if (program.cmds) {
        commands = program.cmds;
    }
    if (commands) {
        runCommands(commands);
    } else {
        startRepl();
    }
}

function runCommands(commands: string) {
    commands.split('\n').join(';').split(';')
        .map((str) => str.trim()).forEach(runCommand);
}

export function runCommand(command: string) {
    if (command === 'exit') {
        process.exit(0);
    }
    if (command === '') {
        return;
    }
    const args = command.split(' ');
    switch (args[0]) {
        case 'read_json':
            STATE = readJson(args[1]);
            break;
        case 'write_json':
            if (STATE) {
                writeJson(args[1], STATE);
            }
            break;
        case 'write_ilang':
            if (STATE) {
                writeILang(args[1], STATE);
            }
        case 'show_state':
            console.log(JSON.stringify(STATE));
            break;
        default:
            console.log(command);
    }
}

function startRepl() {
    console.log('Need more input!');

    while (true) {
        const command = readline.prompt();
        runCommands(command);
    }
}
