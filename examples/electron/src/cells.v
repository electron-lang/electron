`timescale 1ns/1ps

`ifndef SYNTHESIS
module Clock(output reg clk);
   parameter PERIOD = 1;
   parameter TIME = 100;
   parameter VCD = "bench.vcd";

   initial begin
      clk = 0;
   end

   always begin
      #(PERIOD) clk = ~clk;
   end

   initial begin
      #(TIME);
      $finish;
   end

   initial begin
      $dumpfile(VCD);
      $dumpvars;
   end
endmodule
`endif
