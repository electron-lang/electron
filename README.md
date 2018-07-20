# Electron

Electron is a mixed signal netlist language that exports to kicad, spice and
verilog. It builds on Theia IDE and sprotty to provide modern tool support.

![Screenshot of Electron IDE](https://user-images.githubusercontent.com/741807/42879918-9b64c1d2-8a92-11e8-8e4d-a99b43b570b7.png)

## Repository structure
* `electron/` contains the Electron Compiler
* `language-server/` Language Server Protocol implementation for Electron
* `netlist-graph/` Schematic rendering using sprotty
* `theia-electron/` Theia extension for electron
* `browser-app/` && `electron-app/` Development build of the full IDE for the
  browser and desktop.


## License
ISC License

Copyright (c) 2017, David Craven and others

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
