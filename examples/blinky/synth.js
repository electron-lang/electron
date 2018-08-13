const fs = require('fs');
const path = require('path');
const { Triple, Flow } = require('electron-fpga');

const triple = 'ice40-hx8k-ct256';
const top = 'Blinky';
const topMangled = 'blinky_lec$src/blinky.lec$Blinky';
const input = path.join(__dirname, 'build', top + '.v');
const targetdir = path.join(__dirname, 'build', triple);
const bin = path.join(targetdir, top + '.bin');
const pcf = path.join(__dirname, 'tests', 'pinmap.pcf');


if (!fs.existsSync(targetdir)) {
  fs.mkdirSync(targetdir);
}
const flow = new Flow(new Triple(triple));
flow.flow(input, bin, topMangled, pcf);
