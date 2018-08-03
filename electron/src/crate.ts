import * as path from 'path'
import * as fs from 'fs'
import { File } from './file'
import { Logger, IDiagnosticConsumer } from './diagnostic'
import { Linker } from './linker'
import { Design } from './design'

// List all files in a directory in Node.js recursively in a synchronous fashion
export function walkSync(dir: string, filelist: string[] = []) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const subdir = path.join(dir, file)
        if (fs.statSync(subdir).isDirectory()) {
            filelist = walkSync(subdir, filelist);
        }
        else {
            filelist.push(subdir);
        }
    });
    return filelist;
}

export function mkdirp(dir: string) {
    if (!fs.existsSync(dir)) {
        mkdirp(path.dirname(dir))
        fs.mkdirSync(dir)
    }
}

export interface ElectronOptions {
    // Where the electron source is
    srcDir?: string
    // Where the electron generated artefacts should go
    buildDir?: string
    // Where the documentation should go
    docsDir?: string
    // Additional files to include (verilog, spice)
    include?: string[]
}

export const DefaultElectronOptions: ElectronOptions = {
    srcDir: 'src',
    buildDir: 'build',
    docsDir: 'docs',
    include: [],
}

export interface CrateInfo {
    // Name of dir that contains package.json
    rootDir: string
    // Name from package.json
    name: string
    // Version from package.json
    version: string
    // source folder (by default ${rootDir}/src)
    srcDir: string
    // build folder (by default ${rootDir}/build)
    buildDir: string
    // doc folder (by default ${rootDir/docs})
    docsDir: string
    // external files to include (verilog, spice sources)
    include: string[]
}

export class Crate {
    readonly files: File[] = []
    protected fileIndex: {[file: string]: File} = {}
    protected linker: Linker

    constructor(readonly crateInfo: CrateInfo, readonly logger: Logger) {
        this.linker = new Linker(this)
    }

    addFile(file: string): File {
        const crateInfo = Crate.getCrateInfo(file)
        const relPath = path.relative(crateInfo.rootDir, file)
        const manglingPrefix = `${crateInfo.name}$${relPath}$`

        const f = new File({
            crate: crateInfo.name,
            file: file,
            manglingPrefix: manglingPrefix,
            logger: this.logger,
        }, this)
        this.fileIndex[file] = f
        this.files.push(f)
        return f
    }

    getFile(file: string): File {
        if (!(file in this.fileIndex)) {
            this.addFile(file)
        }
        return this.fileIndex[file]
    }

    build(): void {
        for (let file of this.files) {
            if (file.info.crate === this.crateInfo.name) {
                file.compile()
            }
        }
    }

    link(): Design {
        return this.linker.link()
    }

    resolveImport(file: string, pkg: string): File | null {
        if (!pkg.startsWith('.')) {
            pkg = '/node_modules/' + pkg + '.lec'
            let dir = file
            while (dir !== '/') {
                dir = path.dirname(dir)
                const fullPath = path.resolve(path.join(dir, pkg))
                if (fs.existsSync(fullPath)) {
                    return this.getFile(fullPath)
                }
            }
        } else {
            const fullPath = path.resolve(
                path.dirname(file),
                pkg + '.lec')
            if (fs.existsSync(fullPath)) {
                return this.getFile(fullPath)
            }
        }
        return null
    }

    static findPackageJson(dir?: string): string | null {
        dir = dir || process.cwd()
        while (dir !== '/') {
            const fullPath = path.join(dir, 'package.json')
            if (fs.existsSync(fullPath)) {
                return fullPath
            }
            dir = path.dirname(dir)
        }
        return null
    }

    static getCrateInfo(dir?: string): CrateInfo {
        let rootDir = dir || process.cwd()
        let json: any = { name: 'no-name', version: 'no-version' }
        let pkgJson = Crate.findPackageJson(dir)
        if (pkgJson) {
            rootDir = path.dirname(pkgJson)
            json = require(pkgJson)
        }
        json.electronOptions = json.electronOptions || DefaultElectronOptions

        const getPath = (key: string) => {
            return path.join(rootDir, json.electronOptions[key]
                             || (DefaultElectronOptions as any)[key])
        }

        return {
            rootDir,
            name: json.name || 'no-name',
            version: json.version || 'no-version',
            srcDir: getPath('srcDir'),
            buildDir: getPath('buildDir'),
            docsDir: getPath('docsDir'),
            include: json.electronOptions.include || DefaultElectronOptions.include,
        }
    }

    static create(dc: IDiagnosticConsumer, dir?: string): Crate {
        const crateInfo = Crate.getCrateInfo(dir)

        mkdirp(crateInfo.buildDir)
        mkdirp(crateInfo.docsDir)

        const logger = new Logger(dc)
        const crate = new Crate(crateInfo, logger)
        const files = walkSync(crateInfo.srcDir)
        for (let file of files) {
            if (file.endsWith('.lec')) {
                crate.addFile(file)
            }
        }
        dc.setCrate(crate)
        return crate
    }
}
