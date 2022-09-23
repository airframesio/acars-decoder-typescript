#!/usr/bin/env node

import { MessageDecoder } from '../MessageDecoder';

function debugMessage(message: any, decoding: any) {
  console.log("ORIGINAL MESSAGE");
  console.log("Label:", message.label);
  console.log("Text:", message.text);
  console.log();
  console.log("Decoded Message:");
  console.log(decoding.formatted.description);
  if (decoding.formatted.items && decoding.formatted.items.length > 0) {
    decoding.formatted.items.forEach((item: any) => {
      console.log(`${item.label} - ${item.value}`);
    });
  }
  console.log();
}

function decode(label: string, text: string) {
  const message = {
    label: label,
    text: text
  };
  const decoder = new MessageDecoder();
  const decoding = decoder.decode(message);
  debugMessage(message, decoding);
}

// Label 16 with N space
decode('16', 'N 44.203,W 86.546,31965,6, 290');
decode('16', 'N 42.777,W 85.477,35004,6, 132');
decode('16', 'N 28.177/W 96.055');
decode('16', 'N 44.640/W119.729');

// Label 30 with slash EA
decode('30', '/EA1830/DSKSFO/SK24');
decode('30', '/EA1611/DSMMSD/SK24');
decode('30', '/EA1719/DSKSFO/SK23');

// Label 5Z
decode('5Z', '/R3 SNAORD 2205-14 SNA');

// Label 80 + 3N01 POSRPT
decode(
  '80',
  "3N01 POSRPT 0570/13 MSLP/KJFK .N603AV/04F 00:59\n\
/NWYP ORF /HDG 074/MCH 779\n\
/POS N3630.7W07701.8/FL 350/TAS 453/SAT -054\n\
/SWND 079/DWND 216/FOB N006857/ETA 01:40.3"
);

// Label H1 + M1BPOS
decode(
  'H1',
  '#M1BPOSN32492W117178,N33492W118335,195835,350,N32463W117143,195907,N32359W117014,M51,25872,249/TS195835,1214195C27'
);

// Label H1 with POS
decode('H1', 'POSN43312W123174,EASON,215754,370,EBINY,220601,ELENN,M48,02216,185/TS215754,0921227A40');
decode('H1', 'POSN45209W122550,PEGTY,220309,134,MINNE,220424,HISKU,M6,060013,269,366,355K,292K,730A5B');
decode('H1', 'POSN43030W122406,IBALL,220516,380,AARON,220816,MOXEE,M47,0047,86/TS220516,092122BF64');
decode('H1', 'POSN33225W079428,SCOOB,232933,340,ENEME,235712,FETAL,M42,003051,15857F6');

// Label 8E 
decode("8E", "EGSS,1618");

// Label 1M with slash
decode("1M", `/BA0843/ETA01/230822/LDSP/EGLL/EGSS/2JK0
1940/EGLL27L/10 `);
decode("1M", `/AY1416/ETA02/230822/EDDF/EFHK/EETN/2JK0
1956/EFHK04L/50 
     /    /    /   /    /   /`);

// some Positions messages
decode( '15', '(2N38111W 82211266 76400-64(Z');
decode( '15', '(2N46315E    40252 40300-45(Z');
decode( '15', 'FST01KMCOEGKKN505552W00118021');
decode( '20', 'POSN38160W077075,,211733,360,OTT,212041,,N42,19689,40,544');
decode( '44', '00ETA02,N38338W121179,KMHR,KPDX,0806,2355,005.1');
decode( '44', 'IN02,N38338W121179,KMHR,KPDX,0806,2355,005.1');
decode( '44', 'OFF02,N38334W121176,KMHR,KPDX,0807,0014,0123,004.9');
decode( '44', 'ON02,N38333W121178,KRNO,KMHR,0806,2350,005.2');
decode( '44', 'POS02,N38338W121179,GRD,KMHR,KPDX,0807,0003,0112,005.1');
decode( '44', 'POS02,N51112 E000516,390,EGCC,LYBE,0608,1851,2053,00091');
decode( 'H1', 'POSN50378W002590,ELRIP,091226');
