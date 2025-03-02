import { MessageDecoder } from '../MessageDecoder';
import { Label_4A } from './Label_4A';

test('matches Label 4A qualifiers', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-4a');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['4A'],
  });
});

test('decodes Label 4A, variant 1', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A(decoder);

  // https://app.airframes.io/messages/3451492279
  const text = '063200,1910,.N343FR,FFT2028,KSLC,KORD,1,0632,RT0,LT0,';
  const decodeResult = decoderPlugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-4a');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.remaining.text).toBe('RT0,LT0,');
  expect(decodeResult.formatted.items.length).toBe(5);
  expect(decodeResult.formatted.items[0].code).toBe('MSG_TOD');
  expect(decodeResult.formatted.items[0].value).toBe('06:32:00');
  expect(decodeResult.formatted.items[1].code).toBe('TAIL');
  expect(decodeResult.formatted.items[1].value).toBe('N343FR');
  expect(decodeResult.formatted.items[2].code).toBe('CALLSIGN');
  expect(decodeResult.formatted.items[2].value).toBe('FFT2028');
  expect(decodeResult.formatted.items[3].code).toBe('ORG');
  expect(decodeResult.formatted.items[3].value).toBe('KSLC');
  expect(decodeResult.formatted.items[4].code).toBe('DST');
  expect(decodeResult.formatted.items[4].value).toBe('KORD');
});

test('decodes Label 4A, variant 1, no callsign', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A(decoder);

  // https://app.airframes.io/messages/3452310240
  const text = '101606,1910,.N317FR,,KMDW,----,1,1016,RT0,LT1,';
  const decodeResult = decoderPlugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-4a');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.remaining.text).toBe('RT0,LT1,');
  expect(decodeResult.formatted.items.length).toBe(4);
  expect(decodeResult.formatted.items[0].code).toBe('MSG_TOD');
  expect(decodeResult.formatted.items[0].value).toBe('10:16:06');
  expect(decodeResult.formatted.items[1].code).toBe('TAIL');
  expect(decodeResult.formatted.items[1].value).toBe('N317FR');
  expect(decodeResult.formatted.items[2].code).toBe('ORG');
  expect(decodeResult.formatted.items[2].value).toBe('KMDW');
  expect(decodeResult.formatted.items[3].code).toBe('DST');
  expect(decodeResult.formatted.items[3].value).toBe('----');
});

test('decodes Label 4A, variant 2', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A(decoder);

  // https://app.airframes.io/messages/3461807403
  const text = 'N45129W093113MSP/07 ,204436123VECTORS,,P04,268044858,46904221';
  const decodeResult = decoderPlugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-4a');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.remaining.text).toBe('268044858,46904221');
  expect(decodeResult.formatted.items.length).toBe(4);
  expect(decodeResult.formatted.items[0].code).toBe('POS');
  expect(decodeResult.formatted.items[0].value).toBe('45.129 N, 93.113 W');
  expect(decodeResult.formatted.items[1].code).toBe('ALT');
  expect(decodeResult.formatted.items[1].value).toBe('12300 feet');
  expect(decodeResult.formatted.items[2].code).toBe('ROUTE');
  expect(decodeResult.formatted.items[2].value).toBe('MSP/07@20:44:36 > VECTORS');
  expect(decodeResult.formatted.items[3].code).toBe('OATEMP');
  expect(decodeResult.formatted.items[3].value).toBe('4 degrees');
});

test('decodes Label 4A, variant 2, C-Band', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A(decoder);

  // https://app.airframes.io/messages/3461407615
  const text = 'M60ALH0752N22456E077014OSE35 ,192027370VEX36 ,192316,M46,275043309,85220111';
  const decodeResult = decoderPlugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-4a');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.remaining.text).toBe('275043309,85220111');
  expect(decodeResult.formatted.items.length).toBe(5);
  expect(decodeResult.formatted.items[0].code).toBe('FLIGHT');
  expect(decodeResult.formatted.items[0].value).toBe('LH752');
  expect(decodeResult.formatted.items[1].code).toBe('POS');
  expect(decodeResult.formatted.items[1].value).toBe('22.456 N, 77.014 E');
  expect(decodeResult.formatted.items[2].code).toBe('ALT');
  expect(decodeResult.formatted.items[2].value).toBe('37000 feet');
  expect(decodeResult.formatted.items[3].code).toBe('ROUTE');
  expect(decodeResult.formatted.items[3].value).toBe('OSE35@19:20:27 > VEX36@19:23:16');
  expect(decodeResult.formatted.items[4].code).toBe('OATEMP');
  expect(decodeResult.formatted.items[4].value).toBe('-46 degrees');
});

test('decodes Label 4A, variant 3', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A(decoder);

  // https://globe.adsbexchange.com/?icao=A39AC6&showTrace=2024-09-22&timestamp=1727009085
  const text = '124442,1320, 138,33467,N 41.093,W 72.677';
  const decodeResult = decoderPlugin.decode({ text: text });

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-4a');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.remaining.text).toBe(' 138');
  expect(decodeResult.formatted.items.length).toBe(4);
  expect(decodeResult.formatted.items[0].code).toBe('MSG_TOD');
  expect(decodeResult.formatted.items[0].value).toBe('12:44:42');
  expect(decodeResult.formatted.items[1].code).toBe('ETA');
  expect(decodeResult.formatted.items[1].value).toBe('13:20:00');
  expect(decodeResult.formatted.items[2].code).toBe('ALT');
  expect(decodeResult.formatted.items[2].value).toBe('33467 feet');
  expect(decodeResult.formatted.items[3].code).toBe('POS');
  expect(decodeResult.formatted.items[3].value).toBe('41.093 N, 72.677 W');
});

test('decodes Label 4A_DIS <invalid>', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_4A(decoder);

  // https://app.airframes.io/messages/3449413366
  const text = 'DIS01,182103,WEN3100,WRONG CREW HAHAHA';
  const decodeResult = decoderPlugin.decode({ text: text });
  
  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-4a');
  expect(decodeResult.formatted.description).toBe('Latest New Format');
  expect(decodeResult.formatted.items.length).toBe(0);
});
