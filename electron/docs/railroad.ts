import { writeFileSync } from 'fs';
import { resolve } from 'path'
import { createSyntaxDiagramsCode } from 'chevrotain';
import { parserInstance } from '../src/frontend/parser'

const serializedGrammar = parserInstance.getSerializedGastProductions()
const htmlText = createSyntaxDiagramsCode(serializedGrammar)
const outPath = resolve(__dirname, './')
writeFileSync(outPath + '/generated_diagrams.html', htmlText)
