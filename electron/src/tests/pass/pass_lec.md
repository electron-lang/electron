# R  
@name("R")
module pass_lec$0_R.lec$R {
  analog a = (0)
  analog b = (1)
  cell r1 = $R(VALUE=10000) {A=(0), B=(1)}
}

Name | Type
---- | ----
a | analog
b | analog
# AND  
@name("AND")
module pass_lec$1_AND.lec$AND {
  input[2] a = (0, 1)
  input[3] b = (2, 3, 4)
  output y = (5)
  cell and1 = $and(A_WIDTH=2, B_WIDTH=3, Y_WIDTH=1, A_SIGNED=false, B_SIGNED=false) {A=(0, 1), B=(2, 3, 4), Y=(5)}
}

Name | Type
---- | ----
a | input
b | input
y | output
# CellVector  
@name("CellVector")
module pass_lec$2_CellVector.lec$CellVector {
  analog[2] a = (0, 1)
  analog[2] b = (2, 3)
  cell rx$0 = $R(VALUE=10000) {A=(0), B=(2)}
  cell rx$1 = $R(VALUE=10000) {A=(1), B=(3)}
}

Name | Type
---- | ----
a | analog
b | analog
# Test  
@name("Test")
module pass_lec$3_ConstExpression.lec$Test {
  net[2] A = (0, 1)
  net[2] B = (2, 3)
  net Y = (4)
  cell and = pass_lec$3_ConstExpression.lec$AND(WIDTH=1) {A=(0, 1), B=(2, 3), Y=(4)}
}

# Test  
@name("Test")
module pass_lec$4_BitVectors.lec$Test {
  cell bvp = pass_lec$4_BitVectors.lec$BitVecParam(BV=("0", "1", "x", "z")) {}
}

# Pcb  
@name("Pcb")
module pass_lec$5_AnonymousCell.lec$Pcb {
  net in = (0)
  net out = (1)
  net gnd = (2)
  @man("NXP")
  @mpn("7805")
  cell u1 = pass_lec$5_AnonymousCell.lec$u1() {in=(0), out=(1), gnd=(2), in2=(0), in3=(0), out2=(1), vcc=(2)}
}
@name("u1")
@anonymous(true)
module pass_lec$5_AnonymousCell.lec$u1 {
  @group("A")
  @pads(("1"))
  @side("left")
  analog in = (3)
  @group("A")
  @pads(("2"))
  @side("right")
  analog out = (4)
  @group("A")
  @pads(("4"))
  @side("bottom")
  analog gnd = (5)
  @group("B")
  @pads(("3"))
  @side("left")
  analog in2 = (6)
  @group("B")
  @side("left")
  analog in3 = (7)
  @group("B")
  @pads(("6"))
  @side("right")
  analog out2 = (8)
  @group("B")
  @pads(("7"))
  @side("top")
  analog vcc = (9)
}

# VoltageDivider <span class="tag export">export</span> 
@name("VoltageDivider")
@export(true)
module pass_lec$6_VoltageDivider.lec$VoltageDivider {
  @side("left")
  analog vin = (0)
  @side("right")
  analog vout = (1)
  @side("bottom")
  analog gnd = (2)
  @rotate(90)
  @value("10K")
  @footprint("Resistors_SMD:R_0402_NoSilk")
  @man("Yageo")
  @mpn("RC0402FR-0710KL")
  cell r1 = $R(RESISTANCE=10000) {A=(0), B=(1)}
  @rotate(90)
  @value("22K")
  @footprint("Resistors_SMD:R_0603_NoSilk")
  @man("Yageo")
  @mpn("RC0603FR-0722KL")
  cell r2 = $R(RESISTANCE=22000) {A=(1), B=(2)}
}
@skin("<g><rect width="40" height="10"></rect></g>")
@name("$R")
@declare(true)
@import(true)
module $R {
  @pads(("1"))
  @side("left")
  @port_x(0)
  @port_y(5)
  analog A = (3)
  @pads(("2"))
  @side("right")
  @port_x(40)
  @port_y(5)
  analog B = (4)
}

Name | Type
---- | ----
vin | analog
vout | analog
gnd | analog
# TwoVoltageDividers  
@name("TwoVoltageDividers")
module pass_lec$7_TwoVoltageDividers.lec$TwoVoltageDividers {
  net vin = (0)
  net vout = (1)
  net gnd = (2)
  cell vd1 = pass_lec$6_VoltageDivider.lec$VoltageDivider() {vin=(0), vout=(1), gnd=(2)}
  cell vd2 = pass_lec$6_VoltageDivider.lec$VoltageDivider() {vin=(0), vout=(1), gnd=(2)}
}
@name("VoltageDivider")
@import(true)
module pass_lec$6_VoltageDivider.lec$VoltageDivider {
  @side("left")
  analog vin = (3)
  @side("right")
  analog vout = (4)
  @side("bottom")
  analog gnd = (5)
  @rotate(90)
  @value("10K")
  @footprint("Resistors_SMD:R_0402_NoSilk")
  @man("Yageo")
  @mpn("RC0402FR-0710KL")
  cell r1 = $R(RESISTANCE=10000) {A=(3), B=(4)}
  @rotate(90)
  @value("22K")
  @footprint("Resistors_SMD:R_0603_NoSilk")
  @man("Yageo")
  @mpn("RC0603FR-0722KL")
  cell r2 = $R(RESISTANCE=22000) {A=(4), B=(5)}
}
@skin("<g><rect width="40" height="10"></rect></g>")
@name("$R")
@declare(true)
@import(true)
module $R {
  @pads(("1"))
  @side("left")
  @port_x(0)
  @port_y(5)
  analog A = (6)
  @pads(("2"))
  @side("right")
  @port_x(40)
  @port_y(5)
  analog B = (7)
}
@name("VoltageDivider")
@import(true)
module pass_lec$6_VoltageDivider.lec$VoltageDivider {
  @side("left")
  analog vin = (8)
  @side("right")
  analog vout = (9)
  @side("bottom")
  analog gnd = (10)
  @rotate(90)
  @value("10K")
  @footprint("Resistors_SMD:R_0402_NoSilk")
  @man("Yageo")
  @mpn("RC0402FR-0710KL")
  cell r1 = $R(RESISTANCE=10000) {A=(8), B=(9)}
  @rotate(90)
  @value("22K")
  @footprint("Resistors_SMD:R_0603_NoSilk")
  @man("Yageo")
  @mpn("RC0603FR-0722KL")
  cell r2 = $R(RESISTANCE=22000) {A=(9), B=(10)}
}

# VoltageDivider <span class="tag export">export</span> 
@name("VoltageDivider")
@export(true)
module pass_lec$8_ElectroGrammar.lec$VoltageDivider {
  @side("left")
  analog vin = (0)
  @side("right")
  analog vout = (1)
  @side("bottom")
  analog gnd = (2)
  @rotate(90)
  @man("CPL")
  @mpn("CPL-RES-0402-10K-0.063W")
  @value("10K")
  @footprint("Resistor_SMD:R_0402_1005Metric")
  cell r1 = $R(RESISTANCE=10000) {A=(0), B=(1)}
  @rotate(90)
  @man("CPL")
  @mpn("CPL-RES-0603-22K-0.1W")
  @value("22K")
  @footprint("Resistor_SMD:R_0603_1608Metric")
  cell r2 = $R(RESISTANCE=22000) {A=(1), B=(2)}
}
@skin("<g><rect width="40" height="10"></rect></g>")
@name("$R")
@declare(true)
@import(true)
module $R {
  @pads(("1"))
  @side("left")
  @port_x(0)
  @port_y(5)
  analog A = (3)
  @pads(("2"))
  @side("right")
  @port_x(40)
  @port_y(5)
  analog B = (4)
}

Name | Type
---- | ----
vin | analog
vout | analog
gnd | analog
# $R  <span class="tag declare">declare</span>
@name("$R")
@declare(true)
module $R {
  analog A = (2)
  analog B = (3)
}

Name | Type
---- | ----
A | analog
B | analog
# $and  <span class="tag declare">declare</span>
@name("$and")
@declare(true)
module $and {
  input[2] A = (6, 7)
  input[3] B = (8, 9, 10)
  output Y = (11)
}

Name | Type
---- | ----
A | input
B | input
Y | output
# BitVecParam  
@name("BitVecParam")
module pass_lec$4_BitVectors.lec$BitVecParam {
  net[4] n = ("0", "1", "x", "z")
}

