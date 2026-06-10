// Escape-hatch port of lib/plugins/Label_5Z_Slash.ts decode().
// Multi-format airline-defined downlink with magic-string discriminants.

import type { DecodeResult, Message, Options } from '@airframes/ads-runtime-ts';
import { DecoderPlugin } from '@airframes/ads-runtime-ts';
import { DateTimeUtils, ResultFormatter } from '@airframes/ads-runtime-ts';

const descriptions: Record<string, string> = {
  B1: 'Request Weight and Balance',
  B3: 'Request Departure Clearance',
  CD: 'Weight and Balance',
  CG: 'Request Pre-departure clearance, PDC',
  CM: 'Crew Scheduling',
  C3: 'Off Message',
  C4: 'Flight Dispatch',
  C5: 'Maintenance Message',
  C6: 'Customer Service',
  10: 'PIREP',
  C11: 'International PIREP',
  DS: 'Late Message',
  D3: 'Holding Pattern Message',
  D6: 'From-To + Date',
  D7: 'From-To + Alternate + Time',
  EO: 'In Range',
  ET: 'Expected Time',
  PW: 'Position Weather',
  RL: 'Request Release',
  R3: 'Request HOWGOZIT Message',
  R4: 'Request the Latest POSBD',
  TC: 'From-To Fuel',
  WB: 'From-To',
  W1: 'Request Weather for City',
};

export function label_5z_slash_parse(
  _plugin: DecoderPlugin,
  message: Message,
  result: DecodeResult,
  options: Options,
): DecodeResult {
  const lines = message.text.split('\r\n');
  if (lines[0] === '/TXT') {
    // not UA, but starts with `/`
    ResultFormatter.text(result, lines.slice(1).join('\r\n'));
    result.decoded = true;
    result.decoder.decodeLevel = 'full';
    return result;
  }

  const data = lines[0].split('/');
  const header = data[1].split(' '); //data[0] is blank
  const type = header[0];
  const typeDescription = descriptions[type];

  if (typeDescription) {
    result.raw.airline = 'United Airlines';
    result.formatted.items.push({
      type: 'airline',
      code: 'AIRLINE',
      label: 'Airline',
      value: 'United Airlines',
    });
    result.raw.message_type = type;
    result.formatted.items.push({
      type: 'message_type',
      code: 'MSG_TYPE',
      label: 'Message Type',
      value: `${typeDescription} (${type})`,
    });

    if (type === 'B3' && data[1] === 'B3 TO DATA REQ    ') {
      const info = data[2].split(' ');
      //info[0] is blank
      ResultFormatter.departureAirport(result, info[1]);
      ResultFormatter.arrivalAirport(result, info[2]);
      result.raw.day = Number(info[3]);
      ResultFormatter.timestamp(
        result,
        DateTimeUtils.convertHHMMSSToTod(info[4]),
      );
      ResultFormatter.arrivalRunway(result, info[5].slice(1));
      ResultFormatter.unknownArr(result, data.slice(3), '/');
    } else if (type === 'B3') {
      ResultFormatter.departureAirport(
        result,
        header[1].substring(0, 3),
        'IATA',
      );
      ResultFormatter.arrivalAirport(result, header[1].substring(3), 'IATA');
      result.raw.day = Number(header[2]);
      ResultFormatter.arrivalRunway(result, header[3].slice(1));
      if (header.length > 4) {
        ResultFormatter.unknownArr(result, header.slice(4), '/');
      }
    } else if (type === 'C3' && data[1] === 'C3 GATE REQ       ') {
      const info = data[2].split(' ');
      //info[0] is blank
      ResultFormatter.departureAirport(result, info[1]);
      ResultFormatter.arrivalAirport(result, info[2]);
      result.raw.day = Number(info[3]);
      ResultFormatter.timestamp(
        result,
        DateTimeUtils.convertHHMMSSToTod(info[4]),
      );
      ResultFormatter.unknownArr(result, info.slice(5), ' ');
    } else if (type === 'C3') {
      ResultFormatter.departureAirport(
        result,
        header[1].substring(0, 3),
        'IATA',
      );
      ResultFormatter.arrivalAirport(result, header[1].substring(3), 'IATA');
    } else if (type === 'ET') {
      const airports = data[2].split(' ');
      // aiports[0] is blank
      ResultFormatter.departureAirport(result, airports[1]);
      ResultFormatter.arrivalAirport(result, airports[2]);
      result.raw.day = Number(airports[3]);
      ResultFormatter.timestamp(
        result,
        DateTimeUtils.convertHHMMSSToTod(airports[4]),
      );

      const estimates = data[3].split(' ');
      ResultFormatter.eta(
        result,
        DateTimeUtils.convertHHMMSSToTod(estimates[1]),
      );
      ResultFormatter.unknown(result, estimates[2]);
    } else {
      if (options.debug) {
        console.log(`Decoder: Unkown 5Z RDC format: ${message.text}`);
      }
    }
    result.decoded = true;
    result.decoder.decodeLevel = result.remaining.text ? 'partial' : 'full';
  } else {
    // Unknown
    if (options.debug) {
      console.log(`Decoder: Unknown 5Z message: ${message.text}`);
    }
    ResultFormatter.unknown(result, message.text);
    result.decoded = false;
    result.decoder.decodeLevel = 'none';
  }

  return result;
}
