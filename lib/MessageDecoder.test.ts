import { MessageDecoder } from "./MessageDecoder"

test('MIAM core seamless decode', () => {
  const message = {
    label: 'MA',
    text: 'T02!<<,:/k.E`;FOV@!\'s.16q6R+p(RK,|D2ujNJhRah?_qrNftWiI-V,@*RQs,tn,FYN$/V1!gNIc6CO;$D,1:.4?dF952;>XP$"B"Ok-Fr\'0^k?rP]3&UGoPX;\\<F`1mQ_(5_Z\\J01]+t9T9eu6ecjOlC7.H):6MAR4XuqGajJRp&=T3T7j1ipU;\'tGF-f0nNn,XY\\/!!G&F*18E3l:kWakhBW"b31<%oM6)jcY9:;p2\\5E\'k3Yr1,d'
  };

  const decoder = new MessageDecoder();
  const decodeResult = decoder.decode(message);

  expect(decodeResult.message.label).toBe('H1');
  expect(decodeResult.message.sublabel).toBe('DF');
  expect(decodeResult.message.text).toContain('A350,000354');
})
