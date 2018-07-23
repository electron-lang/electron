---
id: electron-reference
title: Electron Reference
---

## Comments
There are three types of comments. Single line comments begin with `//` and can
be placed anywhere. Design comments begin with `//!` and are required to be at
the beginning of a file. Module comments begin with `///` and are required to
precede a module definition.

## Design
A design is the top level element in electron. It can contain a design comment,
import statements and module definitions.

### Import statement
Exported modules can be imported from packages or relative paths.

```
import $R from "electron"
```

## Module
A module refers to a composable unit from which designs are built. An instance
of a module is referred to as a cell.

```
/// Test is an example module
module Test {
}
```

### Parameters
A module takes an optional list of parameters. Parameters can be used in
constant expressions or to configure built-in cells.

```
module Test(width: Integer) {
  output[width] a;
}
```

### export
Export a module.

```
export module A {}
```

### declare
A declared module is either a blackbox like an IC in a PCB design, an
externally defined module or a builtin module.

Externally defined modules are used for interfacing existing verilog or spice.

Electron builtin cells are directly translated to yosys builtin cells or spice
elements.

## Statements
A module contains a list of statements.

### Constant declaration
Net and port widths can be parameterized over a constant. A constant expression
can be assigned to a constant.

```
const a = 1;
```

### Cell declaration
Cells are module instantiations. Cell expressions can be assigned to cells.

```
cell r1 = $R(10k) {};
```

### Net declaration
Nets interconnect cells within a module.

```
net a[width];
```

### Port declaration
Ports specify the interface of a module. A port has a type which is
one of `analog`, `input`, `output`, `inout`. Inputs and outputs
have a value of `1`, `0` or `x`. Inouts can additionally have a value
of `z`. All other ports are `analog` ports.

```
analog a[width];
```

### Assignment
TODO: Not needed for pcb design.

## Expressions
### Constant expression
There are currently five operators that can be used in constant expressions.
`+`, `-`, `*`, `<<`, `>>`. Operators currently don't have a precedence and are
applied from left to right.

```
module A(width: Integer) {
  output out[width];
  cell register = $dff(WIDTH=width + 1) {};
}
```

### Signal expression

### Cell expression

## Attributes
Attributes provide structured meta data used for generating schematics and other
output formats. Attributes preceed a declaration. An attribute can be applied to
multiple declarations by grouping the declarations in brackets.

```
@left {
  input in;
  output out;
}
```

### @rotate(orient)
* @param orient: Integer - Amount to rotate symbol in schematic. Valid values
are 0, 90, 180, 270.

```
@rotate(90)
cell C1 = $C {}
```

### @left
Renders port with a left facing pin.

```
module MOD {
  @left
  analog A
}
```

### @right
Renders port with a right facing pin.

```
module MOD {
  @right
  analog A
}
```

### @top
Renders port with a top facing pin.

```
module MOD {
  @top
  analog A
}
```

### @bottom
Renders port with a bottom facing pin.

```
module MOD {
  @bottom
  analog A
}
```

### @group(name)
Groups ports in to a symbol for high port count modules.

* @param name: String - Group name.

```
module IC {
  @group("power") {
    @top analog vcc;
    @bottom analog gnd;
  }
  @group("io") {
    @left analog d1;
    @left analog d2;
  }
}
```

### @skin(svg)
Changes a module's symbol.

* @param svg: Xml - SVG fragment.

```
@skin(<rect width="40" height="10"></rect>)
module Resistor {
  @left @fixed(0, 5) analog A;
  @right @fixed(40, 5) analog B;
}
```

### @fixed(x, y)
Places the port at position (x, y) when using a skin.

```
@skin(<rect width="40" height="10"></rect>)
module Resistor {
  @left @fixed(0, 5) analog A;
  @right @fixed(40, 5) analog B;
}
```

### @footprint(name)
@param name: String - Name of the footprint.

```
@footprint("SOT-23")
module '7805 {
  @set_pad(1)
  @left analog vin
  @set_pad(2)
  @right analog vout
  @set_pad(3)
  @bottom analog gnd
}
```

### @set_pad(...pad)
@param pad: Integer | String - Takes a pad or comma separated list of pads. Used
for displaying pad information in the schematic and exporting to kicad.

```
@footprint("SOT-23")
module '7805 {
  @set_pad(1)
  @left analog vin
  @set_pad(2)
  @right analog vout
  @set_pad(3)
  @bottom analog gnd
}
```

### @bom(man, mpn)
@param man: String - Manufacturer
@param mpn: String - Manufacturer Part Number
Used for generating a BOM.

### @fpga(triple)
@param triple: String - FPGA target triple `ARCH-FAMILY-PACKAGE`.

## Railroad diagram
[Railroad](/railroad_diagram.html)
