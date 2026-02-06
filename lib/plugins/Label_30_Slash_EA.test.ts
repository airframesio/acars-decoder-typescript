import { MessageDecoder } from '../MessageDecoder';
import { Label_30_Slash_EA } from './Label_30_Slash_EA';

describe('Label 30 preamble /EA', () => {
  let plugin: Label_30_Slash_EA;
  const message = {label: '30', text: ''};

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_30_Slash_EA(decoder);
  });

test('matches qualifiers', () => {
  expect(plugin.decode).toBeDefined();
  expect(plugin.name).toBe('label-30-slash-ea');
  expect(plugin.qualifiers).toBeDefined();
  expect(plugin.qualifiers()).toEqual({
    labels: ['30'],
    preambles: ['/EA'],
  });
});
test('decodes variant 1', () => {
  message.text = '/EA1719/DSKSFO/SK23';
  const decodeResult = plugin.decode(message);
  
  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('partial');
  expect(decodeResult.decoder.name).toBe('label-30-slash-ea');
  expect(decodeResult.formatted.description).toBe('ETA Report');
  expect(decodeResult.message).toBe(message);
  expect(decodeResult.raw.arrival_icao).toBe('KSFO');
  expect(decodeResult.formatted.items.length).toBe(2);
  expect(decodeResult.formatted.items[0].type).toBe('time_of_day');
  expect(decodeResult.formatted.items[0].code).toBe('ETA');
  expect(decodeResult.formatted.items[0].label).toBe('Estimated Time of Arrival');
  expect(decodeResult.formatted.items[0].value).toBe('17:19:00');
  expect(decodeResult.formatted.items[1].type).toBe('icao');
  expect(decodeResult.formatted.items[1].code).toBe('DST');
  expect(decodeResult.formatted.items[1].label).toBe('Destination');
  expect(decodeResult.formatted.items[1].value).toBe('KSFO');
});
});