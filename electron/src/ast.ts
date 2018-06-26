import { ISrcLoc, emptySrcLoc } from './diagnostic'

export type Ast = IDesign | IImport | IModule | IIdent
    | IFQN | IAttr | IParamDecl | IParam | Stmt | Expr

export interface ASTLiteralPattern<T> {
    Integer: (int: IInteger) => T
    String: (str: IString) => T
    BitVector: (bv: IBitVector) => T
    Unit: (u: IUnit) => T
    Real: (r: IReal) => T
    Bool: (b: IBool) => T
}

export function matchASTLiteral<T>(p: ASTLiteralPattern<T>): (lit: Literal) => T {
    return (lit: Literal): T => {
        switch(lit.tag) {
            case 'integer':
                return p.Integer(lit)
            case 'string':
                return p.String(lit)
            case 'bv':
                return p.BitVector(lit)
            case 'unit':
                return p.Unit(lit)
            case 'real':
                return p.Real(lit)
            case 'bool':
                return p.Bool(lit)
        }
    }
}

export interface ASTExprPattern<T> extends ASTLiteralPattern<T> {
    Tuple: (t: ITuple) => T
    AnonMod: (mod: IAnonMod) => T
    Ident: (ident: IIdent) => T
    Ref: (ref: IRef) => T
    ModInst: (mi: IModInst) => T
    BinOp: (bo: IBinOp) => T
}

export function matchASTExpr<T>(p: ASTExprPattern<T>): (ast: Expr) => T {
    return (expr: Expr): T => {
        switch(expr.tag) {
            case 'tuple':
                return p.Tuple(expr)
            case 'anon-mod':
                return p.AnonMod(expr)
            case 'ident':
                return p.Ident(expr)
            case 'ref':
                return p.Ref(expr)
            case 'mod-inst':
                return p.ModInst(expr)
            case 'binop':
                return p.BinOp(expr)
            default:
                return matchASTLiteral(p)(expr)
        }
    }
}

export interface ASTPattern<T> extends ASTExprPattern<T> {
    Design: (design: IDesign) => T
    Import: (imp: IImport) => T
    Module: (mod: IModule) => T
    FQN: (fqn: IFQN) => T
    Attr: (attr: IAttr) => T
    ParamDecl: (pd: IParamDecl) => T
    Param: (p: IParam) => T
    SetAttr: (sa: ISetAttr) => T
    Const: (c: IConst) => T
    Net: (n: INet) => T
    Port: (p: IPort) => T
    Cell: (c: ICell) => T
    With: (w: IWith) => T
    Assign: (a: IAssign) => T
}

export function matchAST<T>(p: ASTPattern<T>): (ast: Ast) => T {
    return (ast: Ast): T => {
        switch(ast.tag) {
            case 'design':
                return p.Design(ast)
            case 'import':
                return p.Import(ast)
            case 'module':
                return p.Module(ast)
            case 'ident':
                return p.Ident(ast)
            case 'fqn':
                return p.FQN(ast)
            case 'attr':
                return p.Attr(ast)
            case 'param-decl':
                return p.ParamDecl(ast)
            case 'param':
                return p.Param(ast)
            case 'set-attr':
                return p.SetAttr(ast)
            case 'const':
                return p.Const(ast)
            case 'net':
                return p.Net(ast)
            case 'port':
                return p.Port(ast)
            case 'cell':
                return p.Cell(ast)
            case 'with':
                return p.With(ast)
            case 'assign':
                return p.Assign(ast)
            default:
                return matchASTExpr(p)(ast)
        }
    }
}

export interface IDesign {
    tag: 'design'
    imports: IImport[]
    modules: IModule[]
}

export function Design(): IDesign {
    return {
        tag: 'design',
        imports: [],
        modules: [],
    }
}

export interface IImport {
    tag: 'import'
    ids: IIdent[]
    package: string
    src: ISrcLoc
}

export function Import(ids: IIdent[], pkg: string, src?: ISrcLoc): IImport {
    return {
        tag: 'import',
        ids,
        package: pkg,
        src: src || emptySrcLoc,
    }
}

export interface IModule {
    tag: 'module'
    attrs: IAttr[]
    exported: boolean
    declaration: boolean
    name: string
    params: IParamDecl[]
    consts: IConst[]
    nets: INet[]
    ports: IPort[]
    cells: ICell[]
    withs: IWith[]
    assigns: IAssign[]
    setAttrs: ISetAttr[]
    src: ISrcLoc
}

export function AddStmts(mod: IModule, stmts: Stmt[]) {
    for (let stmt of stmts) {
        switch(stmt.tag) {
            case 'const':
                mod.consts.push(stmt)
                break
            case 'net':
                mod.nets.push(stmt)
                break
            case 'port':
                mod.ports.push(stmt)
                break
            case 'cell':
                mod.cells.push(stmt)
                break
            case 'with':
                mod.withs.push(stmt)
                break
            case 'assign':
                mod.assigns.push(stmt)
                break
            case 'set-attr':
                mod.setAttrs.push(stmt)
                break
            default:
                throw new Error('bug')
        }
    }
}

export function Module(name: string, stmts?: Stmt[], src?: ISrcLoc): IModule {
    let mod: IModule = {
        tag: 'module',
        attrs: [],
        exported: false,
        declaration: false,
        name,
        params: [],
        src: src || emptySrcLoc,
        consts: [],
        nets: [],
        ports: [],
        cells: [],
        withs: [],
        assigns: [],
        setAttrs: [],
    }

    AddStmts(mod, stmts || [])

    return mod
}

export interface IIdent {
    tag: 'ident'
    id: string
    src: ISrcLoc
}

export function Ident(id: string, src?: ISrcLoc): IIdent {
    return {
        tag: 'ident',
        id,
        src: src || emptySrcLoc,
    }
}

export interface IFQN {
    tag: 'fqn'
    ids: IIdent[]
}

export function FQN(ids: IIdent[]): IFQN {
    return {
        tag: 'fqn',
        ids,
    }
}

export interface IAttr {
    tag: 'attr'
    name: IIdent
    params: IParam[]
}

export function Attr(name: IIdent, params: IParam[]): IAttr {
    return {
        tag: 'attr',
        name,
        params,
    }
}

export interface IParamDecl {
    tag: 'param-decl'
    name: IIdent | number
    ty: IIdent
}

export function ParamDecl(name: IIdent | number, ty: IIdent): IParamDecl {
    return {
        tag: 'param-decl',
        name,
        ty,
    }
}

export interface IParam {
    tag: 'param'
    name: IIdent | number
    value: Expr
}

export function Param(name: IIdent | number, value: Expr): IParam {
    return {
        tag: 'param',
        name,
        value
    }
}

// Statements
export type Stmt = ISetAttr | IWith | IAssign
    | IConst | INet | IPort | ICell

export interface ISetAttr {
    tag: 'set-attr'
    attrs: IAttr[]
    stmts: Stmt[]
    fqns: IFQN[]
}

export function SetAttr(attrs: IAttr[]): ISetAttr {
    return {
        tag: 'set-attr',
        attrs,
        stmts: [],
        fqns: [],
    }
}

export interface IWith {
    tag: 'with'
    scope: IFQN
    setattrs: ISetAttr[]
}

export function With(scope: IFQN, setattrs: ISetAttr[]): IWith {
    return {
        tag: 'with',
        scope,
        setattrs,
    }
}

export interface IAssign {
    tag: 'assign'
    lhs: Expr
    rhs: Expr
}

export function Assign(lhs: Expr, rhs: Expr): IAssign {
    return {
        tag: 'assign',
        lhs,
        rhs,
    }
}

export interface IConst {
    tag: 'const'
    ident: IIdent
}

export function Const(ident: IIdent): IConst {
    return {
        tag: 'const',
        ident,
    }
}

export type PortType = 'input' | 'output' | 'inout' | 'analog'

export interface IPort {
    tag: 'port'
    attrs: IAttr[]
    ident: IIdent
    ty: PortType
    width: Expr
}

export function Port(ident: IIdent, ty: PortType, width?: Expr): IPort {
    return {
        tag: 'port',
        attrs: [],
        ident,
        ty,
        width: width || Integer(1),
    }
}

export interface INet {
    tag: 'net'
    attrs: IAttr[]
    ident: IIdent
    width: Expr
}

export function Net(ident: IIdent, width?: Expr): INet {
    return {
        tag: 'net',
        attrs: [],
        ident,
        width: width || Integer(1),
    }
}

export interface ICell {
    tag: 'cell'
    attrs: IAttr[]
    ident: IIdent
    width: Expr
}

export function Cell(ident: IIdent, width?: Expr): ICell {
    return {
        tag: 'cell',
        attrs: [],
        ident,
        width: width || Integer(1),
    }
}

// Expressions
export type Expr = Literal | ITuple | IAnonMod
    | IIdent | IRef | IModInst | IBinOp

export type Literal = IInteger | IString | IBitVector | IUnit
    | IString | IReal | IBool

export interface IInteger {
    tag: 'integer'
    value: number
    src: ISrcLoc
}

export function Integer(value: number, src?: ISrcLoc): IInteger {
    return {
        tag: 'integer',
        value,
        src: src || emptySrcLoc,
    }
}

export interface IString {
    tag: 'string'
    value: string
    src: ISrcLoc
}

export function String(value: string, src?: ISrcLoc): IString {
    return {
        tag: 'string',
        value,
        src: src || emptySrcLoc,
    }
}

export type Bit = '0' | '1' | 'x' | 'z'

export interface IBitVector {
    tag: 'bv'
    value: Bit[]
    src: ISrcLoc
}

export function BitVector(value: Bit[], src?: ISrcLoc): IBitVector {
    return {
        tag: 'bv',
        value,
        src: src || emptySrcLoc,
    }
}

export interface IUnit {
    tag: 'unit'
    value: number
    exp: number
    unit: string
    src: ISrcLoc
}

export function Unit(value: number, exp: number, unit: string, src?: ISrcLoc): IUnit {
    return {
        tag: 'unit',
        value,
        exp,
        unit,
        src: src || emptySrcLoc,
    }
}

export interface IReal {
    tag: 'real'
    value: number
    src: ISrcLoc
}

export function Real(value: number, src?: ISrcLoc): IReal {
    return {
        tag: 'real',
        value,
        src: src || emptySrcLoc,
    }
}

export interface IBool {
    tag: 'bool'
    value: boolean
    src: ISrcLoc
}

export function Bool(value: boolean, src?: ISrcLoc): IBool {
    return {
        tag: 'bool',
        value,
        src: src || emptySrcLoc,
    }
}

export type BinOp = '+' | '-' | '*' | '<<' | '>>'
export interface IBinOp {
    tag: 'binop'
    op: BinOp
    lhs: Expr
    rhs: Expr
    src: ISrcLoc
}

export function BinOp(op: BinOp, lhs: Expr, rhs: Expr, src?: ISrcLoc): IBinOp {
    return {
        tag: 'binop',
        op,
        lhs,
        rhs,
        src: src || emptySrcLoc,
    }
}

export interface ITuple {
    tag: 'tuple'
    exprs: Expr[]
    src: ISrcLoc
}

export function Tuple(exprs: Expr[], src?: ISrcLoc): ITuple {
    return {
        tag: 'tuple',
        exprs,
        src: src || emptySrcLoc,
    }
}

export interface IDict {
    tag: 'dict'
    entries: IDictEntry[]
    star: boolean
    src: ISrcLoc
}

export function Dict(star?: boolean, src?: ISrcLoc): IDict {
    return {
        tag: 'dict',
        entries: [],
        star: star || false,
        src: src || emptySrcLoc,
    }
}

export interface IDictEntry {
    tag: 'entry'
    ident: IIdent
    expr: Expr
    src: ISrcLoc
}

export function DictEntry(ident: IIdent, expr: Expr, src?: ISrcLoc): IDictEntry {
    return {
        tag: 'entry',
        ident,
        expr,
        src: src || emptySrcLoc,
    }
}

export interface IRef {
    tag: 'ref'
    ident: IIdent
    from: Expr
    to: Expr
    src: ISrcLoc
}

export function Ref(ident: IIdent, from: Expr, to?: Expr, src?: ISrcLoc): IRef {
    return {
        tag: 'ref',
        ident,
        from,
        to: to || from,
        src: src || emptySrcLoc,
    }
}

export interface IAnonMod {
    tag: 'anon-mod'
    ports: IPort[]
    assigns: IAssign[]
    setattrs: ISetAttr[]
    src: ISrcLoc
}

export function AnonMod(stmts: Stmt[], src?: ISrcLoc): IAnonMod {
    let anon: IAnonMod = {
        tag: 'anon-mod',
        ports: [],
        assigns: [],
        setattrs: [],
        src: src || emptySrcLoc,
    }
    for (let stmt of stmts) {
        // TODO Update parser to be more restrictive
        switch(stmt.tag) {
            case 'port':
                anon.ports.push(stmt)
                break
            case 'assign':
                anon.assigns.push(stmt)
                break
            case 'set-attr':
                anon.setattrs.push(stmt)
                break
            default:
                throw new Error('bug')
        }
    }
    return anon
}

export interface IModInst {
    tag: 'mod-inst'
    module: string
    params: IParam[]
    dict: IDict
    src: ISrcLoc
}

export function ModInst(module: string, params: IParam[],
                        dict: IDict, src?: ISrcLoc): IModInst {
    return {
        tag: 'mod-inst',
        module,
        params,
        dict,
        src: src || emptySrcLoc,
    }
}
