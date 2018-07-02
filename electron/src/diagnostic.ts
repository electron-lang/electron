import chalk from 'chalk'
import { IToken } from 'chevrotain'

export interface IDiagnostic {
    message: string,
    src: ISrcLoc,
    severity: 'error' | 'warn' | 'info',
    path: string
    context: string[]
}

export interface IPos {
    line: number,
    column: number,
}

export function Pos(line: number, column: number): IPos {
    return {
        line,
        column,
    }
}

export interface ISrcLoc {
    startLine: number,
    startColumn: number,
    endLine: number,
    endColumn: number,
}

export function SrcLoc(start: IPos, end: IPos): ISrcLoc {
    return {
        startLine: start.line,
        startColumn: start.column,
        endLine: end.line,
        endColumn: end.column,
    }
}

export const emptySrcLoc: ISrcLoc = SrcLoc(Pos(0, 0), Pos(0, 0))

export function tokenToSrcLoc(token: IToken): ISrcLoc {
    return SrcLoc(Pos(token.startLine || 0, token.startColumn || 0),
                  Pos(token.endLine || 0, token.endColumn || 0))
}

export interface IDiagnosticConsumer {
    consume: (diag: IDiagnostic) => void
    toPublisher: (path: string, lines: string[]) => DiagnosticPublisher
}

export class DiagnosticPublisher {
    constructor(private consumer: IDiagnosticConsumer,
                private path: string,
                private lines: string[]) {

    }

    getPath(): string {
        return this.path
    }

    error(message: string, src: ISrcLoc | undefined) {
        this.consumer.consume({
            message,
            severity: 'error',
            src: src || emptySrcLoc,
            path: this.path,
            context: [ this.lines[(src || emptySrcLoc).startLine - 1] ],
        })
    }

    warn(message: string, src: ISrcLoc | undefined) {
        this.consumer.consume({
            message,
            severity: 'warn',
            src: src || emptySrcLoc,
            path: this.path,
            context: [ this.lines[(src || emptySrcLoc).startLine - 1] ],
        })
    }

    info(message: string, src: ISrcLoc | undefined) {
        this.consumer.consume({
            message,
            severity: 'info',
            src: src || emptySrcLoc,
            path: this.path,
            context: [ this.lines[(src || emptySrcLoc).startLine - 1] ],
        })
    }
}

export class DiagnosticCollector implements IDiagnosticConsumer {
    private diagnostics: IDiagnostic[] = []

    toPublisher(path: string, lines: string[]): DiagnosticPublisher {
        return new DiagnosticPublisher(this, path, lines)
    }

    consume(diag: IDiagnostic) {
        this.diagnostics.push(diag)
    }

    getDiagnostics(): IDiagnostic[] {
        return this.diagnostics
    }

    reset() {
        this.diagnostics = []
    }
}

export class DiagnosticTrace implements IDiagnosticConsumer {
    toPublisher(path: string, lines: string[]): DiagnosticPublisher {
        return new DiagnosticPublisher(this, path, lines)
    }

    consume(diag: IDiagnostic) {
        throw new Error(diag.message)
    }

    getDiagnostics(): IDiagnostic[] {
        return []
    }

    reset() {}
}

export class DiagnosticLogger implements IDiagnosticConsumer {
    toPublisher(path: string, lines: string[]): DiagnosticPublisher {
        return new DiagnosticPublisher(this, path, lines)
    }

    consume(diag: IDiagnostic) {
        const file = chalk.magenta(diag.path)
        const lineNumber = diag.src.startLine.toString()
        {
            const line = chalk.cyan(lineNumber)
            const column = chalk.cyan(diag.src.startColumn.toString())
            let ty = (() => {
                switch (diag.severity) {
                    case 'error':
                        return chalk.red('error')
                    case 'warn':
                        return chalk.yellow('warn')
                    case 'info':
                        return chalk.blue('info')
                }
            })()
            const message = `${file}:${line}:${column} - ${ty}: ${diag.message}\n`
            console.error(message)
        }

        const line = chalk.black(chalk.bgWhite(lineNumber))
        const indent = chalk.bgWhite(' '.repeat(lineNumber.length))
        const lineMessage = `${line}\t${diag.context[0]}\n${indent}\n\n`
        console.error(lineMessage)
    }
}

export function throwBug(rule: string): void {
    throw new Error('Programming Error: Parser/Elaborator missmatch ' +
                    `at rule '${rule}'.\n` +
                    'Please report the bug at https://github.com/electron-lang/electron')
}
