import * as path from 'path'
import chalk from 'chalk'
import { IToken } from 'chevrotain'
import { Crate } from './crate'

export interface ISrcLoc {
    startLine: number,
    startColumn: number,
    endLine: number,
    endColumn: number,
    file: string,
}

export class SrcLoc implements ISrcLoc {
    readonly startLine: number
    readonly startColumn: number
    readonly endLine: number
    readonly endColumn: number

    constructor(readonly file: string, loc: [number, number, number, number]) {
        this.startLine = loc[0]
        this.startColumn = loc[1]
        this.endLine = loc[2]
        this.endColumn = loc[3]
    }

    static fromToken(file: string, token: IToken) {
        return new SrcLoc(file, [
            token.startLine || 0,
            token.startColumn || 0,
            token.endLine || 0,
            token.endColumn || 0,
        ])
    }

    static empty(file?: string) {
        return new SrcLoc(file || 'unknown', [0, 0, 0, 0])
    }
}

export interface IDiagnostic {
    message: string,
    src: ISrcLoc,
    severity: 'error' | 'warn' | 'info',
}

export interface IDiagnosticConsumer {
    setCrate: (crate: Crate) => void
    consume: (diag: IDiagnostic) => void
}

export class Logger {
    constructor(protected consumer: IDiagnosticConsumer) {}

    error(message: string, src: ISrcLoc) {
        this.consumer.consume({
            message,
            severity: 'error',
            src: src,
        })
    }

    warn(message: string, src: ISrcLoc) {
        this.consumer.consume({
            message,
            severity: 'warn',
            src: src,
        })
    }

    info(message: string, src: ISrcLoc) {
        this.consumer.consume({
            message,
            severity: 'info',
            src: src,
        })
    }

    bug(message: string) {
        const errorMessage =
            `BUG: ${message}\n` +
            'Please report the bug at https://github.com/electron-lang/electron'
        throw new Error(errorMessage)
    }
}

export class DiagnosticCollector implements IDiagnosticConsumer {
    private diagnostics: IDiagnostic[] = []

    setCrate(crate: Crate): void {}

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
    setCrate(crate: Crate): void {}

    consume(diag: IDiagnostic) {
        throw new Error(diag.message)
    }
}

export class DiagnosticLogger implements IDiagnosticConsumer {
    protected crate: Crate | undefined = undefined

    setCrate(crate: Crate): void {
        this.crate = crate
    }

    getContext(src: ISrcLoc): string[] {
        if (!this.crate) return []
        return this.crate.getFile(src.file).getLines(src)
    }

    getFile(src: ISrcLoc): string {
        if (!this.crate) return src.file
        return path.relative(this.crate.crateInfo.rootDir, src.file)
    }

    consume(diag: IDiagnostic) {
        const file = chalk.magenta(this.getFile(diag.src))
        const lineNumber = diag.src.startLine.toString()
        const context = this.getContext(diag.src)
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
        const lineMessage = `${line}\t${context}\n${indent}\n\n`
        console.error(lineMessage)
    }
}
