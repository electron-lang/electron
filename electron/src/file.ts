import * as fs from 'fs'
import * as path from 'path'
import { Crate } from './crate'
import { Logger, ISrcLoc } from './diagnostic'
import { IToken, ast, lexerInstance, parserInstance, Elaborator,
         ASTCompiler } from './frontend'
import { HierarchyPass } from './passes'
import { ir, JsonBackend, YosysBackend, KicadBackend,
         BomBackend, MarkdownBackend } from './backend'

export interface FileInfo {
    readonly file: string
    readonly logger: Logger
}

export class File {
    readonly path: string
    readonly logger: Logger

    protected _outputPath: string | undefined
    protected _docsPath: string | undefined
    protected _text: string | undefined
    protected _lines: string[] | undefined
    protected _tokens: IToken[] | undefined
    protected _cst: any | undefined
    protected _ast: ast.IModule[] | undefined
    protected _ir: ir.IModule[] | undefined
    protected _declarations: ast.IModule[] | undefined

    constructor(readonly info: FileInfo, readonly crate: Crate) {
        this.path = info.file
        this.logger = info.logger
    }

    setText(text: string): void {
        this.invalidate()
        this._text = text
    }

    invalidate(): void {
        this._text = undefined
        this._lines = undefined
        this._tokens = undefined
        this._cst = undefined
        this._ast = undefined
        this._ir = undefined
        this._declarations = undefined
    }

    get text(): string {
        if (!this._text) {
            this._text = fs.readFileSync(this.path).toString()
        }
        return this._text
    }

    getLines(src: ISrcLoc) {
        if (!this._lines) {
            this._lines = this.text.split('\n')
        }
        return this._lines.slice(src.startLine - 1, src.endLine)
    }

    get tokens(): IToken[] {
        if (!this._tokens) {
            const lexingResult = lexerInstance.tokenize(this.text)
            this._tokens = lexingResult.tokens
            for (let err of lexingResult.errors) {
                this.logger.error(err.message, {
                    startLine: err.line,
                    startColumn: err.column,
                    endLine: err.line,
                    endColumn: err.column + err.length,
                    file: this.path,
                })
            }
        }
        return this._tokens
    }

    get cst(): any {
        if (!this._cst) {
            parserInstance.input = this.tokens
            this._cst = parserInstance.design()
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
                    file: this.path
                })
            }
        }
        return this._cst
    }

    get ast(): ast.IModule[] {
        if (!this._ast) {
            let el = new Elaborator(this.info, this.crate)
            this._ast = el.visit(this.cst)
        }
        return this._ast || []
    }

    get declarations(): ast.IModule[] {
        if (!this._declarations) {
            this._declarations = extractDeclarations(this.ast)
        }
        return this._declarations || []
    }

    get ir(): ir.IModule[] {
        if (!this._ir) {
            try {
                // WARNING: This swallows errors
                const cmp = new ASTCompiler(this.info)
                this._ir = cmp.compile(this.ast)
            } catch(e) {
                return []
            }
        }
        return this._ir || []
    }

    static resolvePath(srcDir: string, targetDir: string, file: string) {
        const relpath = path.relative(srcDir, file)
        const abspath = path.resolve(targetDir, relpath)
        return abspath
    }

    get outputPath(): string {
        if (!this._outputPath) {
            this._outputPath = File.resolvePath(
                this.crate.crateInfo.srcDir,
                this.crate.crateInfo.buildDir,
                this.path
            )
        }
        return this._outputPath
    }

    get docsPath(): string {
        if (!this._docsPath) {
            this._docsPath = File.resolvePath(
                this.crate.crateInfo.srcDir,
                this.crate.crateInfo.docsDir,
                this.path
            )
        }
        return this._docsPath
    }

    compile(): File {
        return this.emitJSON()
    }

    emitDocs(): File {
        if (!this.ir) return this
        const markdownBackend = new MarkdownBackend()
        const file = this.docsPath + '.md'
        markdownBackend.emit(this.ir, file)
        return this
    }

    emitJSON(): File {
        if (!this.ir) return this
        const jsonBackend = new JsonBackend(true, true, true)
        const file = this.outputPath + '.json'
        jsonBackend.emit(this.ir, file)
        return this
    }

    emitVerilog(): File {
        if (!this.ir) return this
        const yosys = this.outputPath + '.yosys.json'
        const verilog = this.outputPath + '.v'
        const yosysBackend = new YosysBackend(yosys, 'verilog')
        yosysBackend.emit(this.ir, verilog)
        return this
    }

    emitKicad(): File {
        if (!this.ir) return this
        const hierarchy = new HierarchyPass()
        const file = this.outputPath + '.net'
        const kicadBackend = new KicadBackend(
            this.crate.crateInfo.version,
            this.path
        )
        kicadBackend.emit(hierarchy.transform(this.ir), file)
        return this
    }

    emitBom(): File {
        if (!this.ir) return this
        const file = this.outputPath + '.tsv'
        const bomBackend = new BomBackend()
        bomBackend.emit(this.ir, file)
        return this
    }

}

function extractDeclarations(mods: ast.IModule[]): ast.IModule[] {
    let dmods: ast.IModule[] = []
    for (let mod of mods) {
        if (!mod.exported) {
            continue
        }
        let dmod = ast.Module(mod.name, [], mod.src)
        dmod.attrs = mod.attrs
        dmod.params = mod.params
        dmod.ports = mod.ports
        dmod.declaration = true
        dmods.push(dmod)
    }
    return dmods
}
