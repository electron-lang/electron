import {createToken, Lexer} from 'chevrotain';

// Identifiers
export const Identifier = createToken({ name: 'Identifier', pattern: /[a-zA-Z$]\w*|'[^\(\)\[\]{},:\s]+/ })
export const Attribute = createToken({ name: 'Attribute', pattern: /@\w*/ })

// Keywords
export const Import = createToken({
    name: 'Import',
    pattern: /import/,
    longer_alt: Identifier
})

export const Export = createToken({
    name: 'Export',
    pattern: /export/,
    longer_alt: Identifier
})

export const From = createToken({
    name: 'From',
    pattern: /from/,
    longer_alt: Identifier
})

export const Declare = createToken({
    name: 'Declare',
    pattern: /declare/,
    longer_alt: Identifier
})

export const Module = createToken({
    name: 'Module',
    pattern: /module/,
    longer_alt: Identifier
})

export const Input = createToken({
    name: 'Input',
    pattern: /input/,
    longer_alt: Identifier
})

export const Output = createToken({
    name: 'Output',
    pattern: /output/,
    longer_alt: Identifier
})

export const Inout = createToken({
    name: 'Inout',
    pattern: /inout/,
    longer_alt: Identifier
})

export const Analog = createToken({
    name: 'Analog',
    pattern: /analog/,
    longer_alt: Identifier
})

export const Net = createToken({
    name: 'Net',
    pattern: /net/,
    longer_alt: Identifier
})

export const Cell = createToken({
    name: 'Cell',
    pattern: /cell/,
    longer_alt: Identifier
})

// Operators
export const Assign = createToken({
    name: 'Assign',
    pattern: /=/
})

// Separators
export const Dot = createToken({ name: 'Dot', pattern: /\./ })
export const Comma = createToken({ name: 'Comma', pattern: /,/ })
export const Colon = createToken({ name: 'Colon', pattern: /:/ })
export const OpenRound = createToken({ name: 'OpenRound', pattern: /\(/ })
export const CloseRound = createToken({ name: 'CloseRound', pattern: /\)/ })
export const OpenSquare = createToken({ name: 'OpenSquare', pattern: /\[/ })
export const CloseSquare = createToken({ name: 'CloseSquare', pattern: /]/ })
export const OpenCurly = createToken({ name: 'OpenCurly', pattern: /{/ })
export const CloseCurly = createToken({ name: 'CloseCurly', pattern: /}/ })

// Literals
export const Constant = createToken({
    name: 'Constant',
    pattern: /[1-9]\d*'[01xz]+/,
})

export const Unit = createToken({
    name: 'Unit',
    pattern: /(0|[1-9]\d*)[a-zA-Z]*/,
})

export const Integer = createToken({
    name: 'Integer',
    pattern: /0|[1-9]\d*/,
    longer_alt: Unit,
})

export const String = createToken({
    name: 'String',
    pattern: /"[^"]*"/,
})

// Comments
export const Comment = createToken({
    name: 'Comment',
    pattern: /\/\/.+/,
    group: 'Comments'
})

export const DocComment = createToken({
    name: 'DocComment',
    pattern: /\/\/\.+/,
    group: 'DocComments'
})

// Whitespace
export const Whitespace = createToken({
    name: 'Whitespace',
    pattern: /\s+/,
    group: Lexer.SKIPPED,
    line_breaks: true
})
