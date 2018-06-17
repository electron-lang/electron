import {Lexer, Parser, IToken, ILexingResult, CstNode, TokenType} from 'chevrotain'
import { Analog, Assign, Attribute, Cell, CellType, CloseCurly, CloseRound,
         CloseSquare, Colon, Comma, Comment, Constant, Declare, DocComment, Dot,
         Export, From, Identifier, Import, Inout, Input, Integer, Module, Net,
         OpenCurly, OpenRound, OpenSquare, Output, String, Symbol,
         Whitespace } from './tokens'

export const allTokens = [
    // Whitespace
    Whitespace,
    // Keywords
    Net,
    Input,
    Output,
    Inout,
    Analog,
    Cell,
    Module,
    Import,
    From,
    Export,
    Declare,
    // Identifiers
    Identifier, // starts with [a-zA-Z]
    CellType, // starts with $
    Attribute, // starts with @
    Symbol, // starts with '
    // Operators
    Assign,
    // Literals
    Constant, // starts with [1-9]+'
    Integer, // starts with [0-9]
    String, // starts with "
    // Brackets
    OpenRound,
    CloseRound,
    OpenCurly,
    CloseCurly,
    OpenSquare,
    CloseSquare,
    // Other
    Dot,
    Colon,
    Comma,
    // Comments
    Comment,
    DocComment
]

export let tokenScopes: {[idx: number]: string} = {}
function setScope(token: TokenType, scope: string) {
    tokenScopes[token.tokenTypeIdx || 0] = scope
}
setScope(Analog, 'keyword')
setScope(Assign, 'operator')
setScope(Attribute, 'string')
setScope(Cell, 'keyword')
setScope(CellType, 'identifier')
setScope(CloseCurly, 'delimiter')
setScope(CloseRound, 'delimiter')
setScope(CloseSquare, 'delimiter')
setScope(Colon, 'delimiter')
setScope(Comma, 'delimiter')
setScope(Comment, 'comment')
setScope(Constant, 'number')
setScope(Declare, 'keyword')
setScope(DocComment, 'comment.doc')
setScope(Dot, 'delimiter')
setScope(Export, 'keyword')
setScope(From, 'keyword')
setScope(Identifier, 'identifier')
setScope(Import, 'keyword')
setScope(Inout, 'keyword')
setScope(Input, 'keyword')
setScope(Integer, 'number')
setScope(Module, 'keyword')
setScope(Net, 'keyword')
setScope(OpenCurly, 'delimiter')
setScope(OpenRound, 'delimiter')
setScope(OpenSquare, 'delimiter')
setScope(Output, 'keyword')
setScope(String, 'string')
setScope(Symbol, 'symbol')
setScope(Whitespace, 'whitespace')

export const lexerInstance = new Lexer(allTokens)

export function tokenize(text: string): ILexingResult {
    const lexResult = lexerInstance.tokenize(text)

    if (lexResult.errors.length > 0) {
        throw new Error(lexResult.errors[0].message);
    }

    return lexResult
}

class ElectronParser extends Parser {
    constructor(input: IToken[]) {
        super(input, allTokens, { outputCst: true })
        this.performSelfAnalysis()
    }

    public design = this.RULE('design', () => {
        this.MANY({
            DEF: () => this.SUBRULE(this.importStatement)
        })
        this.MANY1({
            DEF: () => this.SUBRULE(this.moduleStatement)
        })
    })

    public importStatement = this.RULE('importStatement', () => {
        this.CONSUME(Import)
        this.AT_LEAST_ONE_SEP({
            SEP: Comma,
            DEF: () => {
                this.CONSUME(Identifier)
            }
        })
        this.CONSUME(From)
        this.CONSUME(String)
    })

    public moduleStatement = this.RULE('moduleStatement', () => {
        this.MANY(() => this.SUBRULE(this.attribute))
        this.OPTION(() => { this.CONSUME(Export) })
        this.OPTION1(() => { this.CONSUME(Declare) })
        this.CONSUME(Module)
        this.SUBRULE(this.identifier)
        this.CONSUME(OpenCurly)
        this.MANY1(() => { this.SUBRULE(this.statement) })
        this.CONSUME(CloseCurly)
    })

    public parameterLiteral = this.RULE('parameterLiteral', () => {
        this.OR([
            { ALT: () => this.CONSUME(Integer) },
            { ALT: () => this.CONSUME(Constant) },
            { ALT: () => this.CONSUME(Symbol) },
            { ALT: () => this.CONSUME(String) },
        ])
    })

    public signalLiteral = this.RULE('signalLiteral', () => {
        this.CONSUME(Constant)
    })

    public identifier = this.RULE('identifier', () => {
        this.OR([
            { ALT: () => this.CONSUME(Identifier) },
            { ALT: () => this.CONSUME(Symbol) },
            { ALT: () => this.CONSUME(CellType) },
        ])
    })

    public typeExpression = this.RULE('typeExpression', () => {
        this.OR([
            { ALT: () => this.CONSUME(Net) },
            { ALT: () => this.CONSUME(Input) },
            { ALT: () => this.CONSUME(Output) },
            { ALT: () => this.CONSUME(Inout) },
            { ALT: () => this.CONSUME(Analog) },
            { ALT: () => this.CONSUME(Cell) },
        ])
        this.SUBRULE(this.width)
    })

    public width = this.RULE('width', () => {
        this.OPTION(() => {
            this.CONSUME(OpenSquare)
            this.CONSUME(Integer)
            this.CONSUME(CloseSquare)
        })
    })

    public attribute = this.RULE('attribute', () => {
        this.CONSUME(Attribute)
        this.SUBRULE(this.parameterList)
    })

    public declaration = this.RULE('declaration', () => {
        this.SUBRULE(this.typeExpression)
        this.AT_LEAST_ONE_SEP({
            SEP: Comma,
            DEF: () => this.SUBRULE(this.identifier)
        })
        this.OPTION(() => {
            this.CONSUME(Assign)
            this.SUBRULE(this.rhs)
        })
    })

    public fullyQualifiedName = this.RULE('fullyQualifiedName', () => {
        this.AT_LEAST_ONE_SEP({
            SEP: Dot,
            DEF: () => this.SUBRULE(this.identifier),
        })
    })

    public statement = this.RULE('statement', () => {
        this.OR([
            { ALT: () => {
                this.AT_LEAST_ONE(() => this.SUBRULE(this.attribute))
                this.OR1([
                    { ALT: () => this.SUBRULE(this.fullyQualifiedName) },
                    { ALT: () => this.SUBRULE(this.declaration) },
                ])
            }},
            { ALT: () => {
                this.OR2([
                    { ALT: () => this.SUBRULE1(this.declaration) },
                    { ALT: () => this.SUBRULE(this.assignment) },
                ])
            }},
        ])
    })

    public assignment = this.RULE('assignment', () => {
        this.SUBRULE(this.lhs)
        this.CONSUME(Assign)
        this.SUBRULE(this.rhs)
    })

    public lhs = this.RULE('lhs', () => {
        this.AT_LEAST_ONE_SEP1({
            SEP: Comma,
            DEF: () => { this.SUBRULE1(this.expression) }
        })
    })

    public rhs = this.RULE('rhs', () => {
        this.AT_LEAST_ONE_SEP1({
            SEP: Comma,
            DEF: () => { this.SUBRULE1(this.expression) }
        })
    })

    public expression = this.RULE('expression', () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.signalLiteral) },
            { ALT: () => this.SUBRULE(this.concatExpression) },
            { ALT: () => {
                this.SUBRULE(this.identifier)
                this.OPTION(() => {
                    this.OR1([
                        { ALT: () => this.SUBRULE(this.referenceExpression) },
                        { ALT: () => this.SUBRULE(this.cellExpression) },
                    ])
                })
            }}
        ])
    })

    public concatExpression = this.RULE('concatExpression', () => {
        this.CONSUME(OpenRound)
        this.MANY_SEP({
            SEP: Comma,
            DEF: () => { this.SUBRULE(this.expression) }
        })
        this.CONSUME(CloseRound)
    })

    public referenceExpression = this.RULE('referenceExpression', () => {
        this.CONSUME(OpenSquare)
        this.CONSUME(Integer)
        this.OPTION1(() => {
            this.CONSUME(Colon)
            this.CONSUME1(Integer)
        })
        this.CONSUME(CloseSquare)
    })

    public cellExpression = this.RULE('cellExpression', () => {
        this.OR([
            { ALT: () => {
                this.SUBRULE(this.parameterList)
                this.SUBRULE(this.width)
                this.SUBRULE(this.cellBody)
            }},
            { ALT: () => this.SUBRULE1(this.cellBody) },
        ])
    })

    public cellBody = this.RULE('cellBody', () => {
        this.CONSUME(OpenCurly)
        this.MANY_SEP({
            SEP: Comma,
            DEF: () => this.SUBRULE(this.connection),
        })
        this.CONSUME(CloseCurly)
    })

    public parameterList = this.RULE('parameterList', () => {
        this.CONSUME(OpenRound)
        this.MANY_SEP({
            SEP: Comma,
            DEF: () => this.SUBRULE(this.parameter),
        })
        this.CONSUME(CloseRound)
    })

    public parameter = this.RULE('parameter', () => {
        this.OPTION1(() => {
            this.CONSUME(Identifier)
            this.CONSUME(Assign)
        })
        this.SUBRULE(this.parameterLiteral)
    })

    public connection = this.RULE('connection', () => {
        this.SUBRULE(this.identifier)
        this.OPTION1(() => {
            this.CONSUME(Assign)
            this.SUBRULE(this.expression)
        })
    })
}

export const parserInstance = new ElectronParser([])

export function parseRule(text: string, rule: () => any): any {
    const lexingResult = tokenize(text)
    parserInstance.input = lexingResult.tokens

    const cst = rule()

    if (parserInstance.errors.length > 0) {
        throw new Error(parserInstance.errors[0].message)
    }

    return cst
}

export function parse(text: string): any {
    return parseRule(text, () => { return parserInstance.design() })
}
