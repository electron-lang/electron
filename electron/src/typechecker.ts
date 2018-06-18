import { IDiagnostic } from './diagnostic'
import { SymbolTable } from './symbolTable'
import { IAstDesign } from './ast'

export class TypeChecker {
    public errors: IDiagnostic[] = []
    private symbolTable: SymbolTable = new SymbolTable()

    typeCheck(design: IAstDesign): IDiagnostic[] {
        // get errors from symbol table
        return  this.symbolTable.getErrors().concat(this.errors)
    }
}
