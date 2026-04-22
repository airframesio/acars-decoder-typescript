import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

export class Label_5Z_Slash extends DecoderPlugin {
  name = 'label-5z-slash';

  descriptions: Record<string, string> = {
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

  qualifiers() {
    return {
      labels: ['5Z'],
      preambles: ['/'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.defaultResult();
    decodeResult.decoder.name = this.name;

    decodeResult.formatted.description = 'Airline Designated Downlink';

    const lines = message.text.split('\r\n');
    if (lines[0] === '/TXT') {
      // not UA, but starts with `/`
      ResultFormatter.text(decodeResult, lines.slice(1).join('\r\n'));
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'full';
      return decodeResult;
    }

    const data = lines[0].split('/');
    const header = data[1].split(' '); //data[0] is blank
    const type = header[0];
    const typeDescription = this.descriptions[type];

    if (typeDescription) {
      decodeResult.raw.airline = 'United Airlines';
      decodeResult.formatted.items.push({
        type: 'airline',
        code: 'AIRLINE',
        label: 'Airline',
        value: 'United Airlines',
      });
      decodeResult.raw.message_type = type;
      decodeResult.formatted.items.push({
        type: 'message_type',
        code: 'MSG_TYPE',
        label: 'Message Type',
        value: `${typeDescription} (${type})`,
      });

      if (type === 'B3' && data[1] === 'B3 TO DATA REQ    ') {
        const info = data[2].split(' ');
        //info[0] is blank
        ResultFormatter.departureAirport(decodeResult, info[1]);
        ResultFormatter.arrivalAirport(decodeResult, info[2]);
        decodeResult.raw.day = Number(info[3]);
        ResultFormatter.timestamp(
          decodeResult,
          DateTimeUtils.convertHHMMSSToTod(info[4]),
        );
        ResultFormatter.arrivalRunway(decodeResult, info[5].slice(1));
        ResultFormatter.unknownArr(decodeResult, data.slice(3), '/');
      } else if (type === 'B3') {
        ResultFormatter.departureAirport(
          decodeResult,
          header[1].substring(0, 3),
          'IATA',
        );
        ResultFormatter.arrivalAirport(
          decodeResult,
          header[1].substring(3),
          'IATA',
        );
        decodeResult.raw.day = Number(header[2]);
        ResultFormatter.arrivalRunway(decodeResult, header[3].slice(1));
        if (header.length > 4) {
          ResultFormatter.unknownArr(decodeResult, header.slice(4), '/');
        }
      } else if (type === 'C3' && data[1] === 'C3 GATE REQ       ') {
        const info = data[2].split(' ');
        //info[0] is blank
        ResultFormatter.departureAirport(decodeResult, info[1]);
        ResultFormatter.arrivalAirport(decodeResult, info[2]);
        decodeResult.raw.day = Number(info[3]);
        ResultFormatter.timestamp(
          decodeResult,
          DateTimeUtils.convertHHMMSSToTod(info[4]),
        );
        ResultFormatter.unknownArr(decodeResult, info.slice(5), ' ');
      } else if (type === 'C3') {
        ResultFormatter.departureAirport(
          decodeResult,
          header[1].substring(0, 3),
          'IATA',
        );
        ResultFormatter.arrivalAirport(
          decodeResult,
          header[1].substring(3),
          'IATA',
        );
      } else if (type === 'ET') {
        const airports = data[2].split(' ');
        // airports[0] is blank
        ResultFormatter.departureAirport(decodeResult, airports[1]);
        ResultFormatter.arrivalAirport(decodeResult, airports[2]);
        decodeResult.raw.day = Number(airports[3]);
        decodeResult.formatted.items.push({
          type: 'day',
          code: 'DAY',
          label: 'Day of Month',
          value: airports[3],
        });
        ResultFormatter.timestamp(
          decodeResult,
          DateTimeUtils.convertHHMMSSToTod(airports[4]),
        );

        const estimates = data[3].split(' ');
        // estimates[0] is the EON tag (or other estimate marker)
        const eonTag = estimates[0];
        decodeResult.raw.estimate_tag = eonTag;
        decodeResult.formatted.items.push({
          type: 'estimate_tag',
          code: 'ESTTAG',
          label: 'Estimate Tag',
          value:
            eonTag === 'EON'
              ? 'EON (Estimated On — wheels-on touchdown)'
              : eonTag,
        });
        ResultFormatter.eta(
          decodeResult,
          DateTimeUtils.convertHHMMSSToTod(estimates[1]),
        );
        // estimates[2] is the qualifier (typ. AUTO = FMS-generated)
        if (estimates[2]) {
          const qual = estimates[2];
          decodeResult.raw.estimate_qualifier = qual;
          decodeResult.formatted.items.push({
            type: 'estimate_qualifier',
            code: 'ESTQUAL',
            label: 'Estimate Qualifier',
            value:
              qual === 'AUTO'
                ? 'AUTO (FMS-generated, not crew-entered)'
                : qual,
          });
        }
        if (estimates.length > 3) {
          ResultFormatter.unknownArr(
            decodeResult,
            estimates.slice(3),
            ' ',
          );
        }
      } else if (type === 'R3') {
        // Request HOWGOZIT Message
        // Documented format:
        //   /R3 HOWGOZIT REQ   / <DEP> <ARR> <DAY> <HHMMSS> <FLIGHT> <DAY-echo> <DEP-echo>
        // Example: /R3 HOWGOZIT REQ   / KRSW KIAH 19 213658 2388 19 KRSW
        const parts = data[2].split(' ').filter((s) => s !== '');
        // parts now holds: [DEP, ARR, DAY, HHMMSS, FLIGHT, DAY-echo, DEP-echo]
        if (parts[0]) ResultFormatter.departureAirport(decodeResult, parts[0]);
        if (parts[1]) ResultFormatter.arrivalAirport(decodeResult, parts[1]);
        if (parts[2]) {
          decodeResult.raw.day = Number(parts[2]);
          decodeResult.formatted.items.push({
            type: 'day',
            code: 'DAY',
            label: 'Day of Month',
            value: parts[2],
          });
        }
        if (parts[3]) {
          ResultFormatter.timestamp(
            decodeResult,
            DateTimeUtils.convertHHMMSSToTod(parts[3]),
          );
        }
        if (parts[4]) {
          ResultFormatter.flightNumber(decodeResult, parts[4]);
        }
        // Trailing DAY + DEP echo — document but don't duplicate the main fields
        if (parts[5]) {
          decodeResult.raw.day_echo = parts[5];
        }
        if (parts[6]) {
          decodeResult.raw.departure_echo = parts[6];
        }
        if (parts[5] || parts[6]) {
          decodeResult.formatted.items.push({
            type: 'trailing_echo',
            code: 'ECHO',
            label: 'Trailing Echo (DAY / DEP)',
            value: [parts[5], parts[6]].filter(Boolean).join(' / '),
          });
        }
        if (parts.length > 7) {
          ResultFormatter.unknownArr(decodeResult, parts.slice(7), ' ');
        }
      } else {
        if (options.debug) {
          console.log(`Decoder: Unkown 5Z RDC format: ${message.text}`);
        }
      }
      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = decodeResult.remaining.text
        ? 'partial'
        : 'full';
    } else {
      // Unknown
      if (options.debug) {
        console.log(`Decoder: Unknown 5Z message: ${message.text}`);
      }
      ResultFormatter.unknown(decodeResult, message.text);
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }

    return decodeResult;
  }
}
