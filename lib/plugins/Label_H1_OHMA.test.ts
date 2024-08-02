import { MessageDecoder } from '../MessageDecoder';
import { Label_H1_OHMA } from './Label_H1_OHMA';

test('matches Label H1 Preamble OHMA qualifiers', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_OHMA(decoder);

  expect(decoderPlugin.decode).toBeDefined();
  expect(decoderPlugin.name).toBe('label-h1-ohma');
  expect(decoderPlugin.qualifiers).toBeDefined();
  expect(decoderPlugin.qualifiers()).toEqual({
    labels: ['H1'],
    preambles: ['OHMA', '/RTNBOCR.OHMA'],
  });
});

test('decodes Label H1 Preamble OHMA valid', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_OHMA(decoder);

  // https://app.airframes.io/messages/3126721669
  const text = 'OHMAeJy1Ul2PojAU/SubPiuhlA/ljQHMkAElgDuTXTakqx2nCaAp1WQz8b/vFXTGEcw+LX26veece88p7+jARMO3NbKRpqhohCrWNHTDoH7P0arkrJbBOkd2jhaPkZOjUX6BeFSytqGpmj5WJ2NVyzC2ydTWiWJN9B8teE0lBRSIUS52Ja1ZA+VPqCXl5Xxf/WaiVZkTyzD0bsB2zcr2si1fS755kxfamu2okHvBHNDbCukCuMU+PSzSFk+F4Ada9vqLxLvSuxq9dELDtK56IdukEqZkvOpbVG0VXIJFYnYW2QFCuqzXFm5Jm+YcG2xLKyYFX32CB3V70XXQPzv2EX8R+Vn3BrxuJK1XH2HW9KxYyRgWv5gDJCSx72CnOH8dR1/RLhXl9+4f6MF1xRhgJPuSNUzeI1nE+hY5L7ZtO4/RmFjRQwj+4MNqCJf4pNhp/reosggXbhjEke8Fzrxwk2WQ+kUSZ8U/wgNi5kcxhpy9G2PENBVtqt+kcSZoQ4QJViyTDBO8YDYb4GBDwQTfUOIIx4mfpsvEH1xMhzHmfc7gbkTR1R7HcZ9m4eL53m5YmeAhTjA/jbrDMhULT08P3p0jOv4FG0dfvQ==';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('full');
  expect(decodeResult.decoder.name).toBe('label-h1-ohma');
  expect(decodeResult.formatted.description).toBe('OHMA Message');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.ohma).toBe('{\"version\":\"2.0\",\"message\":\"{\\\"clientId\\\":\\\"OHMA\\\",\\\"messageDate\\\":\\\"2024-08-02T11:39:43.784Z\\\",\\\"data\\\":{\\\"airplanes\\\":[{\\\"tailNumber\\\":\\\"N37554\\\",\\\"model\\\":\\\"\\\",\\\"flights\\\":[{\\\"departureAirportCode\\\":\\\"KBOS\\\",\\\"arrivalAirportCode\\\":\\\"KORD\\\",\\\"flightNumber\\\":\\\"UAL567\\\",\\\"flightLegStartTime\\\":\\\"2024-08-02T10:01:33.736Z\\\",\\\"events\\\":[{\\\"eventClassId\\\":\\\"parametric\\\",\\\"eventTime\\\":\\\"2024-08-02T11:39:43.784Z\\\",\\\"eventType\\\":\\\"OHMA_META\\\",\\\"instances\\\":[{\\\"name\\\":\\\"mtPartNumber\\\",\\\"values\\\":[\\\"\\\"]},{\\\"name\\\":\\\"mtCarlVersion\\\",\\\"values\\\":[\\\"4.5\\\"]},{\\\"name\\\":\\\"mtRulesetVersion\\\",\\\"values\\\":[\\\"737 MAX:::AHM-37MBL8-000010L:::1\\\"]}]},{\\\"eventClassId\\\":\\\"parametric\\\",\\\"eventTime\\\":\\\"2024-08-02T11:39:43.784Z\\\",\\\"eventType\\\":\\\"TM1_CLIPMEDIAN_CRUISE_RPT_A\\\",\\\"instances\\\":[{\\\"name\\\":\\\"TM1TEMP1_MED\\\",\\\"values\\\":[366.294]},{\\\"name\\\":\\\"TM1TEMP2_MED\\\",\\\"values\\\":[381.763]},{\\\"name\\\":\\\"TM1TEMPDIFF_MED\\\",\\\"values\\\":[15.131]},{\\\"name\\\":\\\"PM1PRESSURE1_MED\\\",\\\"values\\\":[34.766]},{\\\"name\\\":\\\"PM1PRESSURE2_MED\\\",\\\"values\\\":[33.406]},{\\\"name\\\":\\\"PACKFLOWDIFF_MED\\\",\\\"values\\\":[11.816]},{\\\"name\\\":\\\"PACKINPRESDIFF_MED\\\",\\\"values\\\":[6.719]}]}]}]}]}}\"}');
  expect(decodeResult.formatted.items.length).toBe(1);
  expect(decodeResult.formatted.items[0].type).toBe('ohma');
  expect(decodeResult.formatted.items[0].code).toBe('OHMA');
  expect(decodeResult.formatted.items[0].label).toBe('OHMA Downlink');
  expect(decodeResult.formatted.items[0].value.length).toBe(2658); // instead of comparing to a giant json obj
}); 

test('decodes Label H1 Preamble OHMA RTN', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_OHMA(decoder);

  // https://app.airframes.io/messages/3125950763
  const text = '/RTNBOCR.OHMAeJyrVipLLSrOzM9TslIy0jNQ0lHKTS0uTkxPBfJL81JS0zLzUlOUagH7TQzW'
  const decodeResult = decoderPlugin.decode({ text: text }, { debug: true });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('full');
  expect(decodeResult.decoder.name).toBe('label-h1-ohma');
  expect(decodeResult.formatted.description).toBe('OHMA Message');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.ohma).toBe('{\"version\":\"2.0\",\"message\":\"undefined\"}');
  expect(decodeResult.formatted.items.length).toBe(1);
  expect(decodeResult.formatted.items[0].type).toBe('ohma');
  expect(decodeResult.formatted.items[0].code).toBe('OHMA');
  expect(decodeResult.formatted.items[0].label).toBe('OHMA Downlink');
  expect(decodeResult.formatted.items[0].value).toBe('undefined');
}); 

xtest('decodes Label H1 Preamble OHMA partial', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_OHMA(decoder);

  // https://app.airframes.io/messages/3126673935
  const text = '#T1B/RTNBOCR.OHMAeJy1km+vmjAUxr/K0tfSlPLXvuMi5pJRL0Hc3MZCOu0cSUFTqsly43dfBb3zKmavBq9O+3uec84Dr+DAZVttG0AAhgiMQM3blm24rl8LsBIVb1S8LgApwMszDQowKi7IhCneXWCEbQP5BsI58gmyiWVD3/S+dvCaKaYpbcYquROs4a0uv+lasUrM9vUPLjuXZ'
  const decodeResult = decoderPlugin.decode({ text: text }, { debug: true });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(true);
  expect(decodeResult.decoder.decodeLevel).toBe('full');
  expect(decodeResult.decoder.name).toBe('label-h1-ohma');
  expect(decodeResult.formatted.description).toBe('OHMA Message');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.raw.ohma).toBe('{"version":"2.0","message":"{\"clientId\":\"OHMA\",\"messageDate\":\"2024-08-02T08:04:34.817Z\",\"data\":{\"airplanes\":[{\"tailNumber\":\"');
  expect(decodeResult.formatted.items.length).toBe(1);
  expect(decodeResult.formatted.items[0].type).toBe('ohma');
  expect(decodeResult.formatted.items[0].code).toBe('OHMA');
  expect(decodeResult.formatted.items[0].label).toBe('OHMA Downlink');
  expect(decodeResult.formatted.items[0].value).toBe('DO WE EVEN WANT IT FORMATTED?');
}); 

test('decodes Label H1 Preamble OHMA invalid', () => {
  const decoder = new MessageDecoder();
  const decoderPlugin = new Label_H1_OHMA(decoder);

  const text = 'OHMA <Invalid text>';
  const decodeResult = decoderPlugin.decode({ text: text });
  console.log(JSON.stringify(decodeResult, null, 2));

  expect(decodeResult.decoded).toBe(false);
  expect(decodeResult.decoder.decodeLevel).toBe('none');
  expect(decodeResult.decoder.name).toBe('label-h1-ohma');
  expect(decodeResult.formatted.description).toBe('OHMA Message');
  expect(decodeResult.message.text).toBe(text);
  expect(decodeResult.remaining.text).toBe(text);
});