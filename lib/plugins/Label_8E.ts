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
    // Match: arrival_icao,current_time
    const regex = /^(?<arrival_icao>\w{4}),(?<current_time>\d{4})$/;
    const results = message.text.match(regex);
    if (results) {
      if (options.debug) {
        console.log(`Label 8E ETA: groups`);
        console.log(results.groups);
      }

      decodeResult.raw.current_time = new Date();
      decodeResult.raw.current_time.setUTCHours(results.groups.current_time.substr(0, 2), results.groups.current_time.substr(2, 2));

      if(new Date().getUTCHours() > decodeResult.raw.current_time.getUTCHours()) { // Check if ETA is in the past, which would imply it is for the next day
        if(options.debug) {
          console.log("Label 8E: Moving ETA to subsequent day");
        }
        decodeResult.raw.current_time.setDate(decodeResult.raw.current_time.getDate() + 1);
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
