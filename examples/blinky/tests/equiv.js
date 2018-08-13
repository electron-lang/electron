const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yosys = require('libyosys');

// files: string[]
// gold: string
// dut: string
// type: 'induct' | 'bmc' | 'comb'
// maxSteps: number
function testSatEquivScript(options) {
  let script = '';

  for (let file of options.files) {
    script += `read_verilog ${file}\n`;
  }
  script += 'prep\n';

  if (options.type === 'bmc' || options.type === 'comb') {
    script += 'memory_map\n';
  }

  script += 'miter -equiv -ignore_gold_x -flatten -make_outputs ';
  script += `${options.gold} ${options.dut} miter\n`;

  let satArgs = '';
  if (options.type === 'induct') {
    satArgs = `-tempinduct -set-init-undef -set-def-inputs -maxsteps ${options.maxSteps}`;
  }
  if (options.type === 'bmc') {
    satArgs = `-set-init-undef -set-def-inputs -seq ${options.maxSteps}`;
  }
  if (options.type === 'comb') {
    satArgs = '-set-def-inputs';
  }
  script += `sat -verify -prove trigger 0 -show-ports ${satArgs} miter\n`;

  return script;
}

function runYosys(script) {
  const scriptPath = path.resolve(__dirname, 'script.ys');
  fs.writeFileSync(scriptPath, script);
  //execSync(`yosys -s ${scriptPath}`);
  yosys.setup();
  yosys.run(script);
}

const script = testSatEquivScript({
  files: [
    path.resolve(__dirname, 'blinky.gold.v'),
    path.resolve(__dirname, '..', 'build', 'Blinky.v'),
  ],
  gold: 'Blinky',
  dut: 'blinky_lec$src/blinky.lec$Blinky',
  type: 'bmc',
  maxSteps: 20
});

runYosys(script);
