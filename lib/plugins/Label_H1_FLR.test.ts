import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_FLR } from './Label_H1_FLR';

test('matches Label H1 Preamble FLR qualifiers', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_FLR(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-flr');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1'],
    preambles: ['FLR', '#CFBFLR'],
  });
});

test('decodes Label H1 Preamble FLR FWC2', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_FLR(decoder);

  // https://app.airframes.io/messages/2436863787
  const text = 'FLR/FR24030411230034583106FWC2 :NO DATA FROM GPS1 /IDECAM 2 ,ECAM 1 ';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-flr');
  expect(decodeResult.formatted.description).toBe('Fault Log Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.message_timestamp).toBe(1712143380);
  expect(decodeResult.formatted.items.length).toBe(1);
  expect(decodeResult.formatted.items[0].type).toBe('fault');
  expect(decodeResult.formatted.items[0].code).toBe('FR');
  expect(decodeResult.formatted.items[0].label).toBe('Fault Report');
  expect(decodeResult.formatted.items[0].value).toBe('FWC2 :NO DATA FROM GPS1 /IDECAM 2 ,ECAM 1 ');
  expect(decodeResult.remaining.text).toBe('34583106');
});

test('decodes Label H1 Preamble FLR CDSU', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_FLR(decoder);

  // https://app.airframes.io/messages/2436949441
  const text = 'FLR/PNRC12860AA07/FR24030411040023723406CDSU(9RA)/DU SD(4WT2) /IDEIS 1 ';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-flr');
  expect(decodeResult.formatted.description).toBe('Fault Log Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.message_timestamp).toBe(1712142240);
  expect(decodeResult.formatted.items.length).toBe(1);
  expect(decodeResult.formatted.items[0].type).toBe('fault');
  expect(decodeResult.formatted.items[0].code).toBe('FR');
  expect(decodeResult.formatted.items[0].label).toBe('Fault Report');
  expect(decodeResult.formatted.items[0].value).toBe('CDSU(9RA)/DU SD(4WT2) /IDEIS 1 ');
  expect(decodeResult.remaining.text).toBe('PNRC12860AA07/23723406');
});

test('decodes Label H1 Preamble FLR RA1', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_FLR(decoder);

  // https://app.airframes.io/messages/2436701901
  const text = 'FLR/FR24030409560034423306RA1/IDEFCS 1 ,EFCS 2 ';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-flr');
  expect(decodeResult.formatted.description).toBe('Fault Log Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.message_timestamp).toBe(1712138160);
  expect(decodeResult.formatted.items.length).toBe(1);
  expect(decodeResult.formatted.items[0].type).toBe('fault');
  expect(decodeResult.formatted.items[0].code).toBe('FR');
  expect(decodeResult.formatted.items[0].label).toBe('Fault Report');
  expect(decodeResult.formatted.items[0].value).toBe('RA1/IDEFCS 1 ,EFCS 2 ');
  expect(decodeResult.remaining.text).toBe('34423306');
});

test('decodes Label H1 Preamble FLR LQD', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_FLR(decoder);

  // https://app.airframes.io/messages/2436740709
  const text = 'FLR/FR24030410030038316206LIQD LVL XMTR (40MG)/IDTOILET ';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-flr');
  expect(decodeResult.formatted.description).toBe('Fault Log Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.message_timestamp).toBe(1712138580);
  expect(decodeResult.formatted.items.length).toBe(1);
  expect(decodeResult.formatted.items[0].type).toBe('fault');
  expect(decodeResult.formatted.items[0].code).toBe('FR');
  expect(decodeResult.formatted.items[0].label).toBe('Fault Report');
  expect(decodeResult.formatted.items[0].value).toBe('LIQD LVL XMTR (40MG)/IDTOILET ');
  expect(decodeResult.remaining.text).toBe('38316206');
});

test('decodes Label H1 Preamble FLR LQD', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_FLR(decoder);

  // https://app.airframes.io/messages/2437260976
  const text = '#CFBFLR/FR24030412400034723406ATC1(1SH1)/TCAS(1000SG) /IDTCAS ';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-h1-flr');
  expect(decodeResult.formatted.description).toBe('Fault Log Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.message_timestamp).toBe(1712148000);
  expect(decodeResult.formatted.items.length).toBe(1);
  expect(decodeResult.formatted.items[0].type).toBe('fault');
  expect(decodeResult.formatted.items[0].code).toBe('FR');
  expect(decodeResult.formatted.items[0].label).toBe('Fault Report');
  expect(decodeResult.formatted.items[0].value).toBe('ATC1(1SH1)/TCAS(1000SG) /IDTCAS ');
  expect(decodeResult.remaining.text).toBe('34723406');
});

test('decodes Label H1 Preamble FLR invalid', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_FLR(decoder);

  const text = 'FLR <Invalid text>';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-h1-flr');
  expect(decodeResult.formatted.description).toBe('Fault Log Report');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.remaining.text).toBe(text);
});
