import { MessageDecoder } from '../MessageDecoder';
import { Label_MA } from './Label_MA';

describe('Label_MA', () => {

  let plugin: Label_MA;
  const message = { label: 'MA', text: '' };

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
    message.text = 'T02!<<,:/k.E`;FOV@!\'s.16q6R+p(RK,|D2ujNJhRah?_qrNftWiI-V,@*RQs,tn,FYN$/V1!gNIc6CO;$D,1:.4?dF952;>XP$"B"Ok-Fr\'0^k?rP]3&UGoPX;\\<F`1mQ_(5_Z\\J01]+t9T9eu6ecjOlC7.H):6MAR4XuqGajJRp&=T3T7j1ipU;\'tGF-f0nNn,XY\\/!!G&F*18E3l:kWakhBW"b31<%oM6)jcY9:;p2\\5E\'k3Yr1,d';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.raw.label).toBe('H1');
    expect(decodeResult.raw.sublabel).toBe('DF');
    expect(decodeResult.raw.tail).toBe('F-HREV');
    expect(decodeResult.raw.text).toBe('A350,000354,1,1,TB000000/REP035,01,02;H01,035,01,02,4000,00066,.F-HREV,3,0,08,12,19,06,58,42,071/H02,KSFO LFPO,FBU711  ,S0285,S0385,S0142S0185/H03,  /A10,06,58,40,+26535,+01198,045,+0493,321723,XXXXXX,--------,0423,+0573/A11,06,58,32,+26356,+01221,041,+0502,324326,XXXXXX,--------,0424,+0614/:');
    expect(decodeResult.formatted.items.length).toBe(4);
  });

  test('decodes partial message', () => {
    message.text = 'T22!<<2>\/k&_k6:\"c1!\'s.16q0U2odKk@|D,eVtdm+WF(#Ll8Dja==EY8V4KISInKk%((%5&@p?Z\\NSZ9tj[Xr0rXqe`+A(J,f[fotFmHmS';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.raw.label).toBe('H1');
    expect(decodeResult.raw.sublabel).toBe('DF');
    expect(decodeResult.raw.tail).toBe('ET-BAY');
    expect(decodeResult.remaining.text).toBe('A350,000243,1,1,');
    expect(decodeResult.formatted.items.length).toBe(3);
  });

  test('decodes twice', () => {
    message.text = "T20!<<,B/k&,Z:/=Hs!'iLt0/1h8|*KJNa__;Kes\"hV'&4]J&&&;\"X/O6%0d7TMg5=d7'gcZ:j\"2EiA7k`-`$]f/<L\\63L-&,<Pi[2<O9p^t+Khl*&\\e^,*%4:H<-9Lm>r>q-b^jGP>WX4Dk3IrQ:U4%?]H$4HCd0Z(^Yq+lXXR!=niT!#;:5UAQ`JU@Bfn/*)TSu?G=LuOlLaFSmkGi]eE[!o&j@iX^g0r)T9!Ye)k6aOmSf`8G)8,hS5Fq_trW*!!";
    // decodes to label 80
    // 3D01 RMPSRV 2501/02 LEMD/MMUN .EC-NOI\n/LAV Y/CAB Y/MEDA N/SEC N/WAS N/WAT N/FUEL N/WCHRR 01/WCHRS --/WCHRC --/UMNR --/MAAS N\nBUENAS NOCHES, ETA 0055Z Y NOS HAN PEDIDO UNA WCHR QUE AL PARECER NO TENIAMOS CONSTANCIA DE ELLA, POR SI PODEIS PEDIRLO A OPS CUN. MUCHAS GRACIAS
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.raw.label).toBe('80');
    expect(decodeResult.raw.sublabel).toBeUndefined();
    expect(decodeResult.raw.tail).toBe('EC-NOI');
    expect(decodeResult.raw.text).toBeUndefined();
    expect(decodeResult.raw.flight_number).toBe('2501');
    expect(decodeResult.raw.departure_icao).toBe('LEMD');
    expect(decodeResult.raw.arrival_icao).toBe('MMUN');
    expect(decodeResult.raw.day).toBe(2);
    expect(decodeResult.formatted.items.length).toBe(7); // Tail twice
  });
});