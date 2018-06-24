import chalk from 'chalk'
import { IToken } from 'chevrotain'

export interface IDiagnostic {
    message: string,
    src: ISrcLoc,
    severity: 'error' | 'warn' | 'info',
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
    constructor(private consumer: IDiagnosticConsumer) {

    }

    error(message: string, src: ISrcLoc | undefined) {
        this.consumer.consume({
            message,
            severity: 'error',
            src: src || emptySrcLoc,
        })
    }

    warn(message: string, src: ISrcLoc | undefined) {
        this.consumer.consume({
            message,
            severity: 'warn',
            src: src || emptySrcLoc,
        })
    }

    info(message: string, src: ISrcLoc | undefined) {
        this.consumer.consume({
            message,
            severity: 'info',
            src: src || emptySrcLoc,
        })
    }
}

export class DiagnosticCollector implements IDiagnosticConsumer {
    private diagnostics: IDiagnostic[] = []

    toPublisher(): DiagnosticPublisher {
        return new DiagnosticPublisher(this)
    }

    consume(diag: IDiagnostic) {
        this.diagnostics.push(diag)
    }

    getDiagnostics(): IDiagnostic[] {
        return this.diagnostics
    }
}

export class DiagnosticLogger implements IDiagnosticConsumer {
    private path: string = ''
    private lines: string[] = []

    toPublisher(path: string, lines: string[]): DiagnosticPublisher {
        this.path = path
        this.lines = lines
        return new DiagnosticPublisher(this)
    }

    consume(diag: IDiagnostic) {
        const file = chalk.magenta(this.path)
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
        const lineMessage = `${line}\t${this.lines[diag.src.startLine - 1]}\n${indent}\n\n`
        console.error(lineMessage)
    }
}
