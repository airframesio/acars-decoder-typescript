import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_EZF } from './Label_H1_EZF';

describe('Label H1 Preamble EZF Load Sheet', () => {
  let plugin: Label_H1_EZF;
  const message = { label: 'H1', text: '' };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1_EZF(decoder);
  });

  test('matches qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('label-h1-ezf');
    expect(plugin.qualifiers()).toEqual({
      labels: ['H1', '1M'],
      preambles: ['EZF'],
    });
  });

  test('decodes full load sheet', () => {
    message.text =
      'EZF\nNO0246/10/EI-NEO\n/C28Y331/3/9\n-SCT/MXP-ZNZ\n-STD/2200\n-FLT STATUS/CLOSED\n-UOM/KG\n-ZFW/162075\n-PAX/305\n-PXT/122/160/19/02\n-PXW/22601\n-CGO/3573\n-BAG/4783\n-OTH/4336\n-TTL/35293\n-FWT/51063\n-TOW/213138\n-DOW/126782';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.decoder.name).toBe('label-h1-ezf');
    expect(decodeResult.formatted.description).toBe('Load Sheet');
    expect(decodeResult.message).toBe(message);
    expect(decodeResult.raw.flight_number).toBe('NO0246');
    expect(decodeResult.raw.tail).toBe('EI-NEO');
    expect(decodeResult.raw.departure_iata).toBe('MXP');
    expect(decodeResult.raw.arrival_iata).toBe('ZNZ');
    expect(decodeResult.raw.loadsheet['ZFW']).toBe('162075');
    expect(decodeResult.raw.loadsheet['PAX']).toBe('305');
    expect(decodeResult.raw.loadsheet['TOW']).toBe('213138');
    expect(decodeResult.raw.loadsheet['FLT STATUS']).toBe('CLOSED');
    expect(decodeResult.raw.loadsheet['UOM']).toBe('KG');
  });

  test('decodes minimal load sheet', () => {
    message.text = 'EZF\nAB1234/05/D-ABCD\n-SCT/JFK-LAX\n-PAX/180\n-ZFW/55000';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.flight_number).toBe('AB1234');
    expect(decodeResult.raw.tail).toBe('D-ABCD');
    expect(decodeResult.raw.departure_iata).toBe('JFK');
    expect(decodeResult.raw.arrival_iata).toBe('LAX');
    expect(decodeResult.raw.loadsheet['PAX']).toBe('180');
    expect(decodeResult.raw.loadsheet['ZFW']).toBe('55000');
  });

  test('decodes with label 1M', () => {
    const msg1M = {
      label: '1M',
      text: 'EZF\nXY5678/12/G-TEST\n-SCT/LHR-CDG\n-PAX/90',
    };
    const decodeResult = plugin.decode(msg1M);

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.raw.flight_number).toBe('XY5678');
    expect(decodeResult.raw.departure_iata).toBe('LHR');
    expect(decodeResult.raw.arrival_iata).toBe('CDG');
  });

  test('rejects invalid message', () => {
    message.text = 'NOT_EZF data here';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.decoder.name).toBe('label-h1-ezf');
    expect(decodeResult.remaining.text).toBe(message.text);
  });

  test('rejects message with only EZF header', () => {
    message.text = 'EZF';
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
  });
});
