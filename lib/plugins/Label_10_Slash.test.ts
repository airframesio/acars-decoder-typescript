import { MessageDecoder } from '../MessageDecoder';
import { Label_10_Slash } from './Label_10_Slash';

describe('Label_10_Slash', () => {
    let plugin: Label_10_Slash;
    const message = {label: '10', text: ''};

    beforeEach(() => {
        const decoder = new MessageDecoder();
        plugin = new Label_10_Slash(decoder);
    });

    test('matches Label 10 Preamble slash qualifiers', () => {
        expect(plugin.decode).toBeDefined();
        expect(plugin.name).toBe('label-10-slash');
        expect(plugin.qualifiers).toBeDefined();
        expect(plugin.qualifiers()).toEqual({
          labels: ['10'],
          preambles: ['/'],
        });
      });

      test('decodes Label 10 Preamble / variant 1', () => {
        message.text = '/N39.182/W077.217/10/0.42/180/055/KIAD/0004/0028/00015/MOWAT/HUSEL/2349/YACKK/2352/'
        const decodeResult = plugin.decode(message);

        expect(decodeResult.decoded).toBe(true);
        expect(decodeResult.decoder.decodeLevel).toBe('partial');
        expect(decodeResult.formatted.items.length).toBe(6);
        expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
        expect(decodeResult.formatted.items[0].value).toBe('39.182 N, 77.217 W');
        expect(decodeResult.formatted.items[1].label).toBe('Heading');
        expect(decodeResult.formatted.items[1].value).toBe('180');
        expect(decodeResult.formatted.items[2].label).toBe('Altitude');
        expect(decodeResult.formatted.items[2].value).toBe('5500 feet');
        expect(decodeResult.formatted.items[3].label).toBe('Destination');
        expect(decodeResult.formatted.items[3].value).toBe('KIAD');
        expect(decodeResult.formatted.items[4].label).toBe('Estimated Time of Arrival');
        expect(decodeResult.formatted.items[4].value).toBe('00:04:00');
        expect(decodeResult.formatted.items[5].label).toBe('Aircraft Route');
        expect(decodeResult.formatted.items[5].value).toBe('MOWAT > HUSEL@23:49:00 > YACKK@23:52:00');
        expect(decodeResult.remaining.text).toBe('10/0.42/0028/00015');
    });

    test('decodes Label 10 Preamble / variant 2', () => {
      message.text = '/N39.019/W078.468/10/0.83/246/400/KCVG/0155/0073/00018/COLNS/STEVY/0120/FAIIR/0126/KTEB/'
      const decodeResult = plugin.decode(message);

      expect(decodeResult.decoded).toBe(true);
      expect(decodeResult.decoder.decodeLevel).toBe('partial');
      expect(decodeResult.formatted.items.length).toBe(7);
      expect(decodeResult.formatted.items[0].label).toBe('Aircraft Position');
      expect(decodeResult.formatted.items[0].value).toBe('39.019 N, 78.468 W');
      expect(decodeResult.formatted.items[1].label).toBe('Heading');
      expect(decodeResult.formatted.items[1].value).toBe('246');
      expect(decodeResult.formatted.items[2].label).toBe('Altitude');
      expect(decodeResult.formatted.items[2].value).toBe('40000 feet');
      expect(decodeResult.formatted.items[3].label).toBe('Destination');
      expect(decodeResult.formatted.items[3].value).toBe('KCVG');
      expect(decodeResult.formatted.items[4].label).toBe('Estimated Time of Arrival');
      expect(decodeResult.formatted.items[4].value).toBe('01:55:00');
      expect(decodeResult.formatted.items[5].label).toBe('Aircraft Route');
      expect(decodeResult.formatted.items[5].value).toBe('COLNS > STEVY@01:20:00 > FAIIR@01:26:00');
      expect(decodeResult.formatted.items[6].label).toBe('Origin');
      expect(decodeResult.formatted.items[6].value).toBe('KTEB');
      expect(decodeResult.remaining.text).toBe('10/0.83/0073/00018/');
  });


    test('decodes Label 10 Preamble / <invalid>', () => {
      
        message.text = '/Bogus Message/';
        const decodeResult = plugin.decode(message);
      
        expect(decodeResult.decoded).toBe(false);
        expect(decodeResult.decoder.decodeLevel).toBe('none');
        expect(decodeResult.decoder.name).toBe('label-10-slash');
        expect(decodeResult.formatted.description).toBe('Position Report');
        expect(decodeResult.message).toBe(message);
      });
});