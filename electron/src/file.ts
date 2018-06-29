import { existsSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { IToken } from 'chevrotain'
import { IDiagnosticConsumer, DiagnosticPublisher } from './diagnostic'
import * as ast from './frontend/ast'
import { lexerInstance, parserInstance } from './frontend/parser'
import { Elaborator } from './frontend/elaborator'
import { ASTCompiler } from './frontend/compiler'
import { printAST } from './frontend/printer'
import * as ir from './backend/ir'
import { printIR } from './backend/printer'

export class File {
    private logger: DiagnosticPublisher
    private imports: File[] = []
    private declarations: ast.IModule[] = []
    private path: string
    private text: string
    private lines: string[]
    private tokens: IToken[] | undefined
    private cst: any
    private ast: ast.IModule[] | undefined
    private ir: ir.IModule[] | undefined

    constructor(private dc: IDiagnosticConsumer, path: string, text?: string) {
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
        let el = new Elaborator(this.logger, this)
        this.ast = el.visit(this.cst)
        return this
    }

    emitModules(): File {
        if (!this.ast) return this
        const cmp = new ASTCompiler(this.logger)
        //this.ir = cmp.compile(this.ast)
        return this
    }

    getAst() {
        return this.ast
    }

    dumpAst(): void {
        if (this.ast) {
            for (let mod of this.ast) {
                console.log(printAST(mod))
            }
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
        return this.lex().parse().elaborate().emitDeclarations()
    }

    emitDeclarations(): File {
        this.lex().parse().elaborate()
        if (!this.ast) return this
        this.declarations = extractDeclarations(this.ast)

        const pl = this.path.split('.')
        pl.pop()
        pl.push('d.lec')
        const dpath = pl.join('.')
        writeFileSync(dpath, this.declarations.map(printAST).join('\n'))
        return this
    }

    importFile(path: string): ast.IModule[] | null {
        const fullPath = resolve(dirname(this.path) + '/' + path + '.lec')
        if (!existsSync(fullPath)) {
            return null
        }
        const f = new File(this.dc, fullPath)
        f.emitDeclarations()
        this.imports.push(f)
        return f.declarations
    }
}

function extractDeclarations(mods: ast.IModule[]): ast.IModule[] {
    let dmods: ast.IModule[] = []
    for (let mod of mods) {
        if (!mod.exported) {
            continue
        }
        let dmod = ast.Module(mod.name, mod.stmts.filter((stmt) => {
            return stmt.tag === 'param' || stmt.tag === 'port'
        }))
        dmod.attrs = mod.attrs
        dmod.exported = true
        dmod.declaration = true
        dmods.push(dmod)
    }
    return dmods
}
