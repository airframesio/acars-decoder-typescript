import { MessageDecoder } from '../MessageDecoder';
import { Label_MA } from './Label_MA';

describe('Label_MA', () => {

  let plugin: Label_MA;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_MA(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-ma');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['MA'],
    });
  });

  test('decodes MIAM message', () => {
    const text = 'T02!<<,:/k.E`;FOV@!\'s.16q6R+p(RK,|D2ujNJhRah?_qrNftWiI-V,@*RQs,tn,FYN$/V1!gNIc6CO;$D,1:.4?dF952;>XP$"B"Ok-Fr\'0^k?rP]3&UGoPX;\\<F`1mQ_(5_Z\\J01]+t9T9eu6ecjOlC7.H):6MAR4XuqGajJRp&=T3T7j1ipU;\'tGF-f0nNn,XY\\/!!G&F*18E3l:kWakhBW"b31<%oM6)jcY9:;p2\\5E\'k3Yr1,d';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.raw.label).toBe('H1');
    expect(decodeResult.raw.sublabel).toBe('DF');
    expect(decodeResult.raw.tail).toBe('.F-HREV');
    expect(decodeResult.raw.text).toBe('A350,000354,1,1,TB000000/REP035,01,02;H01,035,01,02,4000,00066,.F-HREV,3,0,08,12,19,06,58,42,071/H02,KSFO LFPO,FBU711  ,S0285,S0385,S0142S0185/H03,  /A10,06,58,40,+26535,+01198,045,+0493,321723,XXXXXX,--------,0423,+0573/A11,06,58,32,+26356,+01221,041,+0502,324326,XXXXXX,--------,0424,+0614/:');
    expect(decodeResult.formatted.items.length).toBe(4);
  });
});