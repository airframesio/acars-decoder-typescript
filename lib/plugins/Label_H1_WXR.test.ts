import { describe, expect, test } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';

// Military (AMC-format) weather responses seen on Airframes, 2026-11-19 to 2026-11-21
describe('Label_H1 WXR', () => {
  const decoder = new MessageDecoder();

  test('METAR', () => {
    const result = decoder.decode({
      label: 'H1',
      text: '- #MDWXR/ID99207A,RCH3269,AAM7886W2324/MR4,120/MTKADW,1200,KADW 211200Z VRB06KT 9999 (7SM) SCT250 T07C A3027 REQUEST PIREP AS MISSION PERMITSE1E4',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.formatted.description).toBe('Weather Report');
    expect(result.raw.weather_report).toEqual({
      station: 'KADW',
      time: '1200',
      type: 'METAR',
      report:
        'KADW 211200Z VRB06KT 9999 (7SM) SCT250 T07C A3027 REQUEST PIREP AS MISSION PERMITS',
    });
  });

  test('TAF', () => {
    const result = decoder.decode({
      label: 'H1',
      text: '- #MDWXR/ID66162A,RCH3245,PAM7887W2324/MR1,48/MTPAED,0311,TAF PAED 210311Z 03009KT 9999 FEW030 BKN050 BKN100 QNH2979INS T0C-AUTO RESPONSE BASED ON AVAILABLE DATA-CONTACT C2 AGENCY FOR ADDITIONAL INFO2C6B',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.weather_report?.type).toBe('TAF');
    expect(result.raw.weather_report?.station).toBe('PAED');
  });

  test('report text containing slashes is kept whole', () => {
    const result = decoder.decode({
      label: 'H1',
      text: '- #MDWXR/ID99207A,RCH3269,AAM7886W2324/MR4,120/MTKADW,1200,KADW 211200Z 1/2SM FG OVC002 07/02 A3027192E',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.raw.weather_report?.type).toBe('METAR');
    expect(result.raw.weather_report?.report).toBe(
      'KADW 211200Z 1/2SM FG OVC002 07/02 A3027',
    );
  });

  test('text that is neither a METAR nor a TAF', () => {
    const result = decoder.decode({
      label: 'H1',
      text: '- #MDWXR/ID99207A,RCH3269,AAM7886W2324/MR4,120/MTKADW,1200,NO WX AVBL FOR KADWE023',
    });

    expect(result.decoded).toBe(true);
    expect(result.raw.weather_report?.type).toBe('UNKNOWN');
    const wx = result.formatted.items.find((i) => i.code === 'WX');
    expect(wx?.label).toBe('Weather Text');
  });
  test('trailing fuel and version fields are not part of the report', () => {
    const result = decoder.decode({
      label: 'H1',
      text: '- #MDWXR/ID99207A,RCH3269,AAM7886W2324/MR4,120/MTKADW,1200,KADW 211200Z 1/2SM FG/FB123/VR32E371',
    });

    expect(result.decoded).toBe(true);
    expect(result.decoder.decodeLevel).toBe('full');
    expect(result.raw.weather_report?.report).toBe('KADW 211200Z 1/2SM FG');
    expect(result.raw.fuel_on_board).toBe(123);
  });
});
