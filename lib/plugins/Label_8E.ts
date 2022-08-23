import { DecoderPlugin } from '../DecoderPlugin';

// ETA
export class Label_8E extends DecoderPlugin {
  name = 'label-8E';

  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ["8E"],
    };
  }

  decode(message: any, options: any = {}) : any {
    const decodeResult: any = this.defaultResult;
    decodeResult.decoder.name = this.name;
    decodeResult.formatted.description = 'ETA Report';
    decodeResult.message = message;

    // Style: EGSS,1618
    // Match: arrival_icao,arrival_eta
    const regex = /^(?<arrival_icao>\w{4}),(?<arrival_eta>\d{4})$/;
    const results = message.text.match(regex);
    if (results) {
      if (options.debug) {
        console.log(`Label 8E ETA: groups`);
        console.log(results.groups);
      }

      decodeResult.raw.arrival_eta = new Date();
      decodeResult.raw.arrival_eta.setUTCHours(results.groups.arrival_eta.substr(0, 2), results.groups.arrival_eta.substr(2, 2));

      if(new Date().getUTCHours() > decodeResult.raw.arrival_eta.getUTCHours()) { // Check if ETA is in the past, which would imply it is for the next day
        if(options.debug) {
          console.log("Label 8E: Moving ETA to subsequent day");
        }
        decodeResult.raw.arrival_eta.setDate(decodeResult.raw.arrival_eta.getDate() + 1);
      }

      decodeResult.raw.arrival_icao = results.groups.arrival_icao;
      decodeResult.formatted.items.push({
        type: 'destination',
        code: 'DST',
        label: 'Destination',
        value: decodeResult.raw.arrival_icao,
      });

    }

    decodeResult.decoded = true;
    decodeResult.decoder.decodeLevel = 'full';

    return decodeResult;
  }
}

export default {};
