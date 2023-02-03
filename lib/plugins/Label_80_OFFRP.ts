import { DecoderPlugin } from '../DecoderPlugin';

/*
1106 OFFRP   0236 /01  YBBN/ WSSS  .9V-SHV  01022023 0458
/OUT  0444/OFF  0458/FOB 045.4/ETA  1209


1106 OFFRP   0325 /19  EDDF/ WSSS  .9V-SMD  19122022 2132
/OUT  2111/OFF  2132/FOB 079.0/ETA  0917


1106 OFFRP   0027 /--  KSEA/ WSSS  .9V-SJE  20122022 1707
/OUT  1645/OFF  1707/FOB 109.5/ETA  0950


1106 OFFRP   0025 /20 :EDDF/:WSSS  .9V-SKM  20122022 1141
/OUT  1122/OFF  1141/FOB 166.4/ETA  2329


1101 OFFRP  1311/20 WMKI/WSSS .9M-AHJ
/OUT 0148/OFF 0154/FOB 0070/ETA     


M06AXJ03901101 OFFRP  0390/20 VTBS/YMML .HS-XTC
	/OUT 1723/OFF 1757/FOB 05790/ETA 0300


1101 OFFRP  UAE67M    /31 YMML/OMDB .A6-EEU
/OUT 1916/OFF 1932/FOB 1803/ETA 0907

*/
export class Label_80_OFFRP extends DecoderPlugin {
  name = 'label-80-offrp';


  qualifiers() { // eslint-disable-line class-methods-use-this
    return {
      labels: ['80'],
      preambles: ["1106 OFFRP", "1101 OFFRP"],
    };
  }

  decode(message: any, options: any = {}) : any {
    const decodeResult: any = this.defaultResult;
    decodeResult.decoder.name = this.name;

    decodeResult.formatted.description = 'Airline Defined Off Report';

    let results;
    if(message.text.startsWith("1106 OFFRP")) { // Appears to be a newer version
      results = message.text.match(/(?<origin_icao>[A-Z]{4})\/.*(?<destination_icao>[A-Z]{4}) +.(?<registration>(.*?))  (?<atd_date_utc>\d{8}) (?<atd_time_utc>\d{4})\n\/OUT  (?<gate_departure_time_utc>\d{4})\/OFF  (?<weight_off_wheels_utc>\d{4})\/FOB (?<fuel_on_board_tonnes>[0-9\.]*)\/ETA  (?<eta_time_utc>\d{4})/);
    } else if(message.text.startsWith("1101 OFFRP")) {
      results = message.text.match(/(?<origin_icao>[A-Z]{4})\/.*(?<destination_icao>[A-Z]{4}) +\.(?<registration>(.*?))\n\/OUT +(?<gate_departure_time_utc>\d{4})\/OFF +(?<weight_off_wheels_utc>\d{4})\/FOB (?<fuel_on_board_tonnes>[0-9\.]*)\/ETA +(?<eta_time_utc>[\d ]{4})/);
    }

    if (results && results.length > 0) {
      decodeResult.raw.origin = results.groups.origin_icao;
      decodeResult.formatted.items.push({
        type: 'origin',
        code: 'ORG',
        label: 'Origin',
        value: `${results.groups.origin_icao}`,
      });

      decodeResult.raw.destination = results.groups.destination_icao;
      decodeResult.formatted.items.push({
        type: 'destination',
        code: 'DST',
        label: 'Destination',
        value: `${results.groups.destination_icao}`,
      });

      decodeResult.raw.tail = results.groups.registration;
      decodeResult.formatted.items.push({
        type: 'tail',
        label: 'Tail',
        value: `${results.groups.registration}`,
      });

      // TODO: atd_date_utc, atd_time_utc, gate_departure_time_utc, weight_off_wheels_utc, fuel_on_board_tonnes, eta_time_utc
      
      // FOB is normally expressed in tonnes, but there are some examples where it appears to be expressed in kg and sometimes even lbs (only found one example of lbs, however)
      // To make things more confusing, see the 9M-AHJ example - this is quite likely 7 tonnes of fuel but there is no decimal point to go by
      // Might be worth doing a sanity check on FOB to determine if it is in kg or tonnes, but that wouldn't help in the above scenario

      // No date is given for eta_time_utc and weight_off_wheels_utc. Weight off wheels appears to always be the same as the ATD. For the ETA, should check if time is less than the ATD, which would then put it on the next day

      decodeResult.decoded = true;
    }

    return decodeResult;
  }
}

export default {};
