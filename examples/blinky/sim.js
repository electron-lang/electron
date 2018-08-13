const { Sim } = require('electron-fpga');

const sim = new Sim(['/opt/nextpnr/lib/ivl']);
const files = [
  'build/BlinkyTB.v',
  'build/Blinky.v',
  '../electron/src/cells.v'
]
sim.sim(files.join(' '), 'build/BlinkyTB.vvp');
