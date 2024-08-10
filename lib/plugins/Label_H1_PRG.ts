import { DateTimeUtils } from '../DateTimeUtils';
import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { FlightPlanUtils } from '../utils/flight_plan_utils';

export class Label_H1_PRG extends DecoderPlugin { // eslint-disable-line camelcase
  name = 'label-h1-prg';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['H1'],
      preambles: ['PRG', '#M1BPRG'],
    };
  }

  // https://acars-vdl2.groups.io/g/main/topic/decoding_last_part_of_prg/28964299
  decode(message: Message, options: Options = {}) : DecodeResult {
    const decodeResult: any = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'Progress Report';
    decodeResult.message = message;
    decodeResult.remaining.text = '';

    // console.log('DECODER: H1 #M1BPRG detected');
    const checksum = message.text.slice(-4);
    //strip POS and checksum
    const data = message.text.substring(3, message.text.length-4);
    const fields = data.split(',');
    if(fields.length === 5) {
      const allKnownFields = FlightPlanUtils.parseHeader(decodeResult, fields[0]);
      processRunway(decodeResult, fields[1]);
      processCurrentFuel(decodeResult, fields[2]);
      processETA(decodeResult, fields[3]);
      processRemainingFuel(decodeResult, fields[4]);
      addChecksum(decodeResult, checksum);

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = allKnownFields ? 'full' : 'partial';
    } else if(fields.length === 6) {
      const allKnownFields = FlightPlanUtils.parseHeader(decodeResult, fields[0]);
      processRunway(decodeResult, fields[1]);
      processCurrentFuel(decodeResult, fields[2]);
      processETA(decodeResult, fields[3]);
      processRemainingFuel(decodeResult, fields[4]);
      addChecksum(decodeResult, checksum);

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = allKnownFields ? 'full' : 'partial';
    } else if(fields.length === 19) {
      const allKnownFields = FlightPlanUtils.parseHeader(decodeResult, fields[0]);
      processUnknown(decodeResult, fields[1]);
      processFlightNumber(decodeResult, fields[2]);
      processDeptApt(decodeResult, fields[3]);
      processArrvApt(decodeResult, fields[4]);
      processRunway(decodeResult, fields[5]);
      processUnknown(decodeResult, fields.slice(6, 19).join(','));
      addChecksum(decodeResult, checksum);

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';
    } else if(fields.length === 21) {
      const allKnownFields = FlightPlanUtils.parseHeader(decodeResult, fields[0]);
      processRunway(decodeResult, fields[1]);
      processUnknown(decodeResult, fields.slice(2, 21).join(','));
      FlightPlanUtils.processFlightPlan(decodeResult, fields[21].split(':'));
      addChecksum(decodeResult, checksum);

      decodeResult.decoded = true;
      decodeResult.decoder.decodeLevel = 'partial';
    } else {
      // Unknown
      if (options.debug) {
        console.log(`Decoder: Unknown H1 message: ${message.text}`);
      }
      decodeResult.remaining.text = message.text;
      decodeResult.decoded = false;
      decodeResult.decoder.decodeLevel = 'none';
    }

    return decodeResult;
  }
}

export default {};

function processFlightNumber(decodeResult: any, value: string) {
  decodeResult.raw.flight_number = value;
};

function processDeptApt(decodeResult: any, value: string) {
  decodeResult.raw.departure_icao = value;
  decodeResult.formatted.items.push({
    type: 'origin',
    code: 'ORG',
    label: 'Origin',
    value: decodeResult.raw.departure_icao,
  });
};

function processArrvApt(decodeResult: any, value: string) {
  decodeResult.raw.arrival_icao = value;
  decodeResult.formatted.items.push({
    type: 'destination',
    code: 'DST',
    label: 'Destination',
    value: decodeResult.raw.arrival_icao,
  });
};

function processETA(decodeResult:DecodeResult, value: string) {
  decodeResult.formatted.items.push({
    type: 'eta',
    code: 'ETA',
    label: 'Estimated Time of Arrival',
    value: value.substring(0,2) + ':' + value.substring(2,4) + ':' + value.substring(4,6),
  });
}

function processRunway(decodeResult: any, value: string) {
  decodeResult.raw.arrival_runway = value;
  decodeResult.formatted.items.push({
    type: 'runway',
    label: 'Arrival Runway',
    value: decodeResult.raw.arrival_runway,
  });
};


function processCurrentFuel(decodeResult: any, value: string) {
  decodeResult.raw.fuel_on_board = Number(value);
  decodeResult.formatted.items.push({
    type: 'fuel_on_board',
    code: 'FOB',
    label: 'Fuel On Board',
    value: decodeResult.raw.fuel_on_board.toString(),
  });
};
function processRemainingFuel(decodeResult: any, value: string) {
  decodeResult.raw.fuel_remaining = Number(value);
  decodeResult.formatted.items.push({
    type: 'fuel_remaining',
    label: 'Fuel Remaining',
    value: decodeResult.raw.fuel_remaining.toString(),
  });
};


function addChecksum(decodeResult: DecodeResult, value: string) {
    decodeResult.raw.checksum = Number("0x"+value);
    decodeResult.formatted.items.push({
      type: 'message_checksum',
      code: 'CHECKSUM',
      label: 'Message Checksum',
      value: '0x' + ('0000' + decodeResult.raw.checksum.toString(16)).slice(-4),
    });    
  }
  function processUnknown(decodeResult: any, value: string) {
    decodeResult.remaining.text += ',' + value;
  }