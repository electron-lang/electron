import {Lexer, Parser, IToken, ILexingResult, CstNode, TokenType} from 'chevrotain'
import { Analog, Assign, Attribute, Cell, CloseCurly, CloseRound,
         CloseSquare, Colon, Comma, Comment, Const, BitVector, Declare,
         DesignComment, Dot, Export, False, From, Identifier, Import,
         Inout, Input, Integer, Minus, Module, ModuleComment, Net, OpenCurly,
         OpenRound, OpenSquare, Output, Plus, Real, Semicolon, ShiftLeft,
         ShiftRight, Star, String, True, Unit, With, Whitespace } from './tokens'

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
    Const,
    False,
    True,
    With,
    // Identifiers
    Identifier,
    Attribute,
    // Operators
    Assign,
    Plus,
    Minus,
    Star,
    ShiftLeft,
    ShiftRight,
    // Literals
    BitVector,
    Real,
    Integer,
    Unit,
    String,
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
    Semicolon,
    // Comments
    ModuleComment,
    DesignComment,
    Comment,
]

export let tokenScopes: {[idx: number]: string} = {}
function setScope(token: TokenType, scope: string) {
    tokenScopes[token.tokenTypeIdx || 0] = scope
}
setScope(Analog, 'keyword')
setScope(Assign, 'operator')
setScope(Attribute, 'string')
setScope(BitVector, 'number')
setScope(Cell, 'keyword')
setScope(CloseCurly, 'delimiter')
setScope(CloseRound, 'delimiter')
setScope(CloseSquare, 'delimiter')
setScope(Colon, 'delimiter')
setScope(Comma, 'delimiter')
setScope(Comment, 'comment')
setScope(Const, 'keyword')
setScope(Declare, 'keyword')
setScope(DesignComment, 'comment.doc')
setScope(Dot, 'delimiter')
setScope(Export, 'keyword')
setScope(False, 'keyword')
setScope(From, 'keyword')
setScope(Identifier, 'identifier')
setScope(Import, 'keyword')
setScope(Inout, 'keyword')
setScope(Input, 'keyword')
setScope(Integer, 'number')
setScope(Minus, 'operator')
setScope(Module, 'keyword')
setScope(ModuleComment, 'comment.doc')
setScope(Net, 'keyword')
setScope(OpenCurly, 'delimiter')
setScope(OpenRound, 'delimiter')
setScope(OpenSquare, 'delimiter')
setScope(Output, 'keyword')
setScope(Plus, 'operator')
setScope(Real, 'number')
setScope(Semicolon, 'delimiter')
setScope(ShiftLeft, 'operator')
setScope(ShiftRight, 'operator')
setScope(Star, 'operator')
setScope(String, 'string')
setScope(True, 'keyword')
setScope(Unit, 'number')
setScope(With, 'keyword')
setScope(Whitespace, 'whitespace')

export const lexerInstance = new Lexer(allTokens)

class ElectronParser extends Parser {
    constructor(input: IToken[]) {
        super(input, allTokens, { outputCst: true })
        this.performSelfAnalysis()
    }

    public design = this.RULE('design', () => {
        this.MANY({
            DEF: () => this.CONSUME(DesignComment)
        })
        this.MANY1({
            DEF: () => this.SUBRULE(this.moduleImport)
        })
        this.MANY2({
            DEF: () => this.SUBRULE(this.moduleDeclaration)
        })
    })

    public moduleImport = this.RULE('moduleImport', () => {
        this.CONSUME(Import)
        this.SUBRULE(this.identifiers)
        this.CONSUME(From)
        this.CONSUME(String)
    })

    public moduleDeclaration = this.RULE('moduleDeclaration', () => {
        this.MANY1(() => this.CONSUME(ModuleComment))
        this.MANY2(() => this.SUBRULE(this.attribute))
        this.OPTION(() => { this.CONSUME(Export) })
        this.OPTION1(() => { this.CONSUME(Declare) })
        this.CONSUME(Module)
        this.SUBRULE(this.identifier)
        this.OPTION2(() => this.SUBRULE(this.parameterDeclarationList))
        this.SUBRULE(this.statements)
    })

    // Identifiers
    public identifiers = this.RULE('identifiers', () => {
        this.AT_LEAST_ONE_SEP({
            SEP: Comma,
            DEF: () => { this.SUBRULE(this.identifier) }
        })
    })

    public identifier = this.RULE('identifier', () => {
        this.CONSUME(Identifier)
    })

    /*public fullyQualifiedName = this.RULE('fullyQualifiedName', () => {
        this.AT_LEAST_ONE_SEP({
            SEP: Dot,
            DEF: () => this.SUBRULE(this.identifier),
        })
    })

    public fullyQualifiedNames = this.RULE('fullyQualifiedNames', () => {
        this.AT_LEAST_ONE_SEP({
            SEP: Comma,
            DEF: () => this.SUBRULE(this.fullyQualifiedName)
        })
    })*/

    // Attributes
    public attribute = this.RULE('attribute', () => {
        this.CONSUME(Attribute)
        this.OPTION(() => {
            this.CONSUME(OpenRound)
            this.MANY_SEP({
                SEP: Comma,
                DEF: () => this.SUBRULE(this.attributeParameter)
            })
            this.CONSUME(CloseRound)
        })
    })

    public attributeParameter = this.RULE('attributeParameter', () => {
        this.OR([
            {
                ALT: () => {
                    this.SUBRULE(this.identifier)
                    this.OPTION(() => this.SUBRULE(this.moduleInstantiation))
                }
            },
            { ALT: () => this.SUBRULE(this.literal) },
        ])
    })

    public parameterDeclarationList = this.RULE('parameterDeclarationList', () => {
        this.CONSUME(OpenRound)
        this.MANY({
            DEF: () => this.SUBRULE(this.parameterDeclaration)
        })
        this.CONSUME(CloseRound)
    })

    public parameterDeclaration = this.RULE('parameterDeclaration', () => {
        this.SUBRULE(this.identifier)
        this.CONSUME(Colon)
        this.SUBRULE1(this.identifier)
        this.OPTION1(() => this.CONSUME(Comma))
    })

    public parameterList = this.RULE('parameterList', () => {
        this.OPTION(() => {
            this.CONSUME(OpenRound)
            this.MANY({
                DEF: () => this.SUBRULE(this.parameter),
            })
            this.CONSUME(CloseRound)
        })
    })

    public parameter = this.RULE('parameter', () => {
        this.SUBRULE(this.expression)
        this.OPTION(() => {
            this.CONSUME(Assign)
            this.SUBRULE1(this.expression)
        })
        this.OPTION1(() => this.CONSUME(Comma))
    })

    // Statements
    public statements = this.RULE('statements', () => {
        this.CONSUME(OpenCurly)
        this.MANY({
            DEF: () => this.SUBRULE(this.statement)
        })
        this.CONSUME(CloseCurly)
    })

    public statement = this.RULE('statement', () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.attributeStatement) },
            { ALT: () => this.SUBRULE(this.declaration) },
            //{ ALT: () => this.SUBRULE(this.withStatement) },
            { ALT: () => this.SUBRULE(this.assignStatement) },
        ])
        this.OPTION(() => this.CONSUME(Semicolon))
    })

    public attributeStatement = this.RULE('attributeStatement', () => {
        this.AT_LEAST_ONE({
            DEF: () => this.SUBRULE(this.attribute)
        })
        this.OR([
            { ALT: () => this.SUBRULE(this.statements) },
            { ALT: () => this.SUBRULE(this.declaration) },
           // { ALT: () => this.SUBRULE(this.fullyQualifiedNames) },
        ])
    })

    /*public withStatement = this.RULE('withStatement', () => {
        this.CONSUME(With)
        this.SUBRULE(this.fullyQualifiedName)
        this.SUBRULE(this.statements)
    })*/

    public assignStatement = this.RULE('assignStatement', () => {
        this.SUBRULE(this.expressions)
        this.CONSUME(Assign)
        this.SUBRULE1(this.expressions)
    })

    public declaration = this.RULE('declaration', () => {
        this.OR([
            { ALT: () => this.CONSUME(Net) },
            { ALT: () => this.CONSUME(Input) },
            { ALT: () => this.CONSUME(Output) },
            { ALT: () => this.CONSUME(Inout) },
            { ALT: () => this.CONSUME(Analog) },
            { ALT: () => this.CONSUME(Cell) },
            { ALT: () => this.CONSUME(Const) },
        ])
        this.SUBRULE(this.width)
        this.SUBRULE(this.identifiers)
        this.OPTION(() => {
            this.CONSUME(Assign)
            this.SUBRULE(this.expressions)
        })
    })

    public width = this.RULE('width', () => {
        this.OPTION(() => {
            this.CONSUME(OpenSquare)
            this.SUBRULE(this.expression)
            this.CONSUME(CloseSquare)
        })
    })

    // Expressions
    public expression = this.RULE('expression', () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.literal) },
            { ALT: () => this.SUBRULE(this.tupleExpression) },
            { ALT: () => this.SUBRULE(this.anonymousCell) },
            { ALT: () => {
                this.SUBRULE1(this.identifier)
                this.OPTION1(() => {
                    this.OR1([
                        { ALT: () => this.SUBRULE(this.referenceExpression) },
                        { ALT: () => this.SUBRULE(this.moduleInstantiation) },
                    ])
                })
            }},
        ])
        this.OPTION(() => this.SUBRULE(this.binaryOp))
    })

    public literal = this.RULE('literal', () => {
        this.OR([
            { ALT: () => this.CONSUME(Integer) },
            { ALT: () => this.CONSUME(BitVector) },
            { ALT: () => this.CONSUME(Unit) },
            { ALT: () => this.CONSUME(String) },
            { ALT: () => this.CONSUME(Real) },
            { ALT: () => this.CONSUME(True) },
            { ALT: () => this.CONSUME(False) },
        ])
    })

    public expressions = this.RULE('expressions', () => {
        this.AT_LEAST_ONE_SEP({
            SEP: Comma,
            DEF: () => this.SUBRULE(this.expression)
        })
    })

    public binaryOp = this.RULE('binaryOp', () => {
        // TODO proper precedence parsing
        this.OR([
            { ALT: () => this.CONSUME(Plus) },
            { ALT: () => this.CONSUME(Minus) },
            { ALT: () => this.CONSUME(Star) },
            { ALT: () => this.CONSUME(ShiftLeft) },
            { ALT: () => this.CONSUME(ShiftRight) },
        ])
        this.SUBRULE(this.expression)
    })

    public tupleExpression = this.RULE('tupleExpression', () => {
        this.CONSUME(OpenRound)
        this.SUBRULE(this.expressions)
        this.CONSUME(CloseRound)
    })

    public referenceExpression = this.RULE('referenceExpression', () => {
        this.CONSUME(OpenSquare)
        this.SUBRULE(this.expression)
        this.OPTION(() => {
            this.CONSUME(Colon)
            this.SUBRULE1(this.expression)
        })
        this.CONSUME(CloseSquare)
    })

    public anonymousCell = this.RULE('anonymousCell', () => {
        this.CONSUME(Cell)
        this.CONSUME(OpenCurly)
        this.MANY({
            DEF: () => this.SUBRULE(this.cellStatement)
        })
        this.CONSUME(CloseCurly)
    })

    public cellStatement = this.RULE('cellStatement', () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.cellAttributeStatement) },
            { ALT: () => this.SUBRULE(this.cellPortDeclaration) },
        ])
        this.OPTION1(() => this.CONSUME(Semicolon))
    })

    public cellAttributeStatement = this.RULE('cellAttributeStatement', () => {
        this.AT_LEAST_ONE({ DEF: () => this.SUBRULE(this.attribute) })
        this.OR([
            { ALT: () => {
                this.CONSUME(OpenCurly)
                this.MANY({
                    DEF: () => this.SUBRULE(this.cellStatement)
                })
                this.CONSUME(CloseCurly)
            }},
            { ALT: () => this.SUBRULE1(this.cellPortDeclaration) }
        ])
    })

    public cellPortDeclaration = this.RULE('cellPortDeclaration', () => {
        this.OR([
            { ALT: () => this.CONSUME(Input) },
            { ALT: () => this.CONSUME(Output) },
            { ALT: () => this.CONSUME(Inout) },
            { ALT: () => this.CONSUME(Analog) },
        ])
        this.SUBRULE(this.width)
        this.SUBRULE(this.identifiers)
        this.OPTION(() => {
            this.CONSUME(Assign)
            this.SUBRULE(this.expressions)
        })
    })

    public moduleInstantiation = this.RULE('moduleInstantiation', () => {
        this.SUBRULE(this.parameterList)
        this.SUBRULE(this.dictionary)
    })

    public dictionary = this.RULE('dictionary', () => {
        this.CONSUME(OpenCurly)
        this.MANY({
            DEF: () => { this.SUBRULE(this.dictionaryEntry) }
        })
        this.OPTION(() => this.CONSUME(Star))
        this.CONSUME(CloseCurly)
    })

    public dictionaryEntry = this.RULE('dictionaryEntry', () => {
        this.SUBRULE(this.identifier)
        this.OPTION(() => {
            this.CONSUME(Assign)
            this.SUBRULE(this.expression)
        })
        this.OPTION1(() => this.CONSUME(Comma))
    })

}

export const parserInstance = new ElectronParser([])
