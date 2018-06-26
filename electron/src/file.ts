import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { IToken } from 'chevrotain'
import * as ast from './ast'
import { IDiagnosticConsumer, DiagnosticPublisher } from './diagnostic'
import { lexerInstance, parserInstance } from './parser'
import { Elaborator } from './elaborator'
import { Validator } from './validator'
import { IModule } from './backend/ir'
import { printIR } from './backend/printer'
import { extractDeclarations } from './declaration'
import { printAST } from './printer'

export class File {
    private logger: DiagnosticPublisher
    private declarations: ast.IModule[] = []
    private path: string
    private text: string
    private lines: string[]
    private tokens: IToken[] | undefined
    private cst: any
    private ast: ast.IDesign | undefined
    private ir: IModule[] | undefined

    constructor(dc: IDiagnosticConsumer, path: string, text: string | null) {
        this.path = resolve(path)
        if (text) {
            this.text = text
        } else {
            this.text = readFileSync(path).toString()
        }
        this.lines = this.text.split('\n')
        this.logger = dc.toPublisher(this.path, this.lines)
    }

    lex(): File {
        const lexingResult = lexerInstance.tokenize(this.text)
        this.tokens = lexingResult.tokens
        for (let err of lexingResult.errors) {
            this.logger.error(err.message, {
                startLine: err.line,
                startColumn: err.column,
                endLine: err.line,
                endColumn: err.column + err.length,
            })
        }
        return this
    }

    parse(): File {
        if (!this.tokens) return this
        parserInstance.input = this.tokens
        this.cst = parserInstance.design()
        for (let err of parserInstance.errors) {
            let lastToken = err.token
            if (err.resyncedTokens.length > 0) {
                lastToken = err.resyncedTokens[err.resyncedTokens.length - 1]
            }
            this.logger.error(err.message, {
                startLine: err.token.startLine || 0,
                startColumn: err.token.startColumn || 0,
                endLine: lastToken.endLine || 0,
                endColumn: lastToken.endColumn || 0,
            })
        }
        return this
    }

    elaborate(): File {
        if (!this.cst) return this
        let el = new Elaborator(this.logger)
        this.ast = el.visit(this.cst)
        return this
    }

    extractDeclarations(): ast.IModule[] {
        this.lex().parse().elaborate()
        if (!this.ast) return this.declarations
        this.declarations = extractDeclarations(this.ast)
        return this.declarations
    }

    validate(): File {
        if (!this.ast) return this
        const validator = new Validator(this.logger)
        this.ir = validator.validate(this.path, this.ast)
        return this
    }

    dumpAst(): void {
        if (this.ast) {
            console.log(printAST(this.ast))
        }
    }

    dumpIR(): void {
        if (this.ir) {
            for (let mod of this.ir) {
                console.log(printIR(mod))
            }
        }
    }

    compile(): File {
        return this.lex().parse().elaborate().validate().emitDeclarations()
    }

    emitDeclarations(): File {
        const pl = this.path.split('.')
        pl.pop()
        pl.push('d.lec')
        const dpath = pl.join('.')
        writeFileSync(dpath, this.declarations.map(printAST).join('\n'))
        return this
    }
}
