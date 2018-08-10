---
id: getting-started
title: Getting Started
sidebar_label: Getting Started
---

## Installing electron
- Download the [Electron IDE](https://github.com/electron-lang/ide/releases/latest).
- Install [yarn](https://yarnpkg.com/en/docs/install) and git

## Create a new electron package
We'll start by creating the following directory structure:
```tree
example
├── .gitignore
├── package.json
└── src
    └── example.lec
```
```sh
mkdir -p example/src
cd example
touch src/example.lec
yarn init --yes
# add the electron-lang compiler
yarn add @electron-lang/electron --dev
# add the electron components library
yarn add @lec/electron
git init
echo "node_modules/\nbuild/\n" > .gitignore
```

Now we configure yarn to run electron when building. For that we'll add these
lines to `package.json`.
```json
  "scripts": {
    "prepare": "yarn build && yarn kicad && yarn bom",
    "build": "lecc build",
    "kicad": "lecc kicad",
    "bom": "lecc bom"
  }
```

Let's implement a voltage divider in `example.lec`:

```electron
import $R from "@lec/electron/src/cells"

export module VoltageDivider {
  @left analog vin
  @right analog vout
  @bottom analog gnd

  @rotate(90)
  @value("10K")
  @footprint("Resistors_SMD:R_0402_NoSilk")
  @bom("Yageo", "RC0402FR-0710KL")
  cell r1 = $R(10k) {A=vin, B=vout}

  @rotate(90)
  @value("22K")
  @footprint("Resistors_SMD:R_0603_NoSilk")
  @bom("Yageo", "RC0603FR-0722KL")
  cell r2 = $R(22k) {A=vout, B=gnd}
}
```

Now we're ready for building. (The yarn command on its own is the same as `yarn install && yarn prepare`.)

```sh
yarn
```
