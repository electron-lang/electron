const fs = require('fs');
const path = require('path');
const chevrotain = require('chevrotain');
const parser = require('../electron/lib/frontend/parser');

const serializedGrammar = parser.parserInstance.getSerializedGastProductions();
const htmlText = chevrotain.createSyntaxDiagramsCode(serializedGrammar);
const outPath = path.resolve(__dirname, './static');
fs.writeFileSync(outPath + '/railroad_diagram.html', htmlText);
