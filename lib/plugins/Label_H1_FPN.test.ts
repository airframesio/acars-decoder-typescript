=import { MessageDecoder } from '../MessageDecoder';
import { Label_H1 } from './Label_H1';

describe('Label_H1 FPN', () => {

  let plugin: Label_H1;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1(decoder);
  });

  test('decodes Label H1 Preamble FPN landing', () => {
    const text = 'FPN/RI:DA:KEWR:AA:KDFW:CR:EWRDFW01(17L)..SAAME.J6.HVQ.Q68.LITTR..MEEOW..FEWWW:A:SEEVR4.FEWWW:F:VECTOR..DISCO..RIVET:AP:ILS 17L.RIVET:F:TACKEC8B5';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Flight Plan');
    expect(decodeResult.formatted.items.length).toBe(9);
    expect(decodeResult.formatted.items[0].label).toBe('Route Status');
    expect(decodeResult.formatted.items[0].value).toBe('Route Inactive');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('KEWR');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('KDFW');
    expect(decodeResult.formatted.items[3].label).toBe('Company Route');
    expect(decodeResult.formatted.items[3].value).toBe('EWRDFW01(17L): >> SAAME > J6 > HVQ > Q68 > LITTR >> MEEOW >> FEWWW');
    expect(decodeResult.formatted.items[4].label).toBe('Arrival Procedure');
    expect(decodeResult.formatted.items[4].value).toBe('SEEVR4 starting at FEWWW');
    expect(decodeResult.formatted.items[5].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[5].value).toBe('VECTOR >> DISCO >> RIVET');
    expect(decodeResult.formatted.items[6].label).toBe('Approach Procedure');
    expect(decodeResult.formatted.items[6].value).toBe('ILS 17L starting at RIVET');
    expect(decodeResult.formatted.items[7].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[7].value).toBe('TACKE');
    expect(decodeResult.formatted.items[8].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[8].value).toBe('0xc8b5');
  });

  test('decodes Label H1 Preamble FPN full flight', () => {
    // https://app.airframes.io/messages/2161768398
    const text = 'FPN/FNAAL1956/RP:DA:KPHL:AA:KPHX:CR:PHLPHX61:R:27L(26O):D:PHL3:A:EAGUL6.ZUN:AP:ILS26..AIR,N40010W080490.J110.BOWRR..VLA,N39056W089097..STL,N38516W090289..GIBSN,N38430W092244..TYGER,N38410W094050..GCK,N37551W100435..DIXAN,N36169W105573..ZUN,N34579W109093293B';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.flight_number).toBe('AAL1956');
    expect(decodeResult.raw.company_route.waypoints).toBeUndefined();
    expect(decodeResult.formatted.description).toBe('Flight Plan');
    expect(decodeResult.formatted.items.length).toBe(10);
    expect(decodeResult.formatted.items[0].label).toBe('Route Status');
    expect(decodeResult.formatted.items[0].value).toBe('Route Planned');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('KPHL');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('KPHX');
    expect(decodeResult.formatted.items[3].label).toBe('Company Route');
    expect(decodeResult.formatted.items[3].value).toBe('PHLPHX61');
    expect(decodeResult.formatted.items[4].label).toBe('Arrival Runway');
    expect(decodeResult.formatted.items[4].value).toBe('26O');
    expect(decodeResult.formatted.items[5].label).toBe('Departure Runway');
    expect(decodeResult.formatted.items[5].value).toBe('27L');
    expect(decodeResult.formatted.items[6].label).toBe('Departure Procedure');
    expect(decodeResult.formatted.items[6].value).toBe('PHL3');
    expect(decodeResult.formatted.items[7].label).toBe('Arrival Procedure');
    expect(decodeResult.formatted.items[7].value).toBe('EAGUL6 starting at ZUN');
    expect(decodeResult.formatted.items[8].label).toBe('Approach Procedure');
    expect(decodeResult.formatted.items[8].value).toBe('ILS26: >> AIR(40.017 N, 80.817 W) > J110 > BOWRR >> VLA(39.093 N, 89.162 W) >> STL(38.860 N, 90.482 W) >> GIBSN(38.717 N, 92.407 W) >> TYGER(38.683 N, 94.083 W) >> GCK(37.918 N, 100.725 W) >> DIXAN(36.282 N, 105.955 W) >> ZUN(34.965 N, 109.155 W)');
    expect(decodeResult.formatted.items[9].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[9].value).toBe('0x293b');
  });

  test('decodes Label H1 Preamble FPN in-flight', () => {
    // https://app.airframes.io/messages/2161761202
    const text = 'FPN/FNUAL1187/RP:DA:KSFO:AA:KPHX:F:KAYEX,N36292W120569..LOSHN,N35509W120000..BOILE,N34253W118016..BLH,N33358W114457DDFB';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.flight_number).toBe('UAL1187')
    expect(decodeResult.formatted.description).toBe('Flight Plan');
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Route Status');
    expect(decodeResult.formatted.items[0].value).toBe('Route Planned');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('KSFO');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('KPHX');
    expect(decodeResult.formatted.items[3].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[3].value).toBe('KAYEX(36.487 N, 120.948 W) >> LOSHN(35.848 N, 120.000 W) >> BOILE(34.422 N, 118.027 W) >> BLH(33.597 N, 114.762 W)');
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[4].value).toBe('0xddfb');
  });

  test('decodes Label H1 Preamble FPN with WS', () => {
    // https://app.airframes.io/messages/2372685289
    const text = 'FPN/TS140017,021724/RP:DA:EHAM:AA:KMSP..N55064W000477..N55163W001141..ERAKA..N60000W020000..N61000W030000:WS:N61000W030000,370..N61000W040000..N60000W050000..URTAK:WS:URTAK,380..LAKES:WS:LAKES,400..N57000W070000..N54300W080000..N49000W090000..DLH..COLDD:A:BAINY3:AP:ILS30L(30L)/PR4356,344,360,1060,,,13,,,30,,,P50,M40,36090,,3296,292/DTKMSP,30L,172,215117156D';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.message_timestamp).toBe(1708178417);
    expect(decodeResult.formatted.description).toBe('Flight Plan');
    expect(decodeResult.formatted.items.length).toBe(9);
    expect(decodeResult.formatted.items[0].label).toBe('Route Status');
    expect(decodeResult.formatted.items[0].value).toBe('Route Planned');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('EHAM');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('KMSP..N55064W000477..N55163W001141..ERAKA..N60000W020000..N61000W030000'); // FIXME - just 'KMSP'
    expect(decodeResult.formatted.items[3].label).toBe('Arrival Procedure');
    expect(decodeResult.formatted.items[3].value).toBe('BAINY3');
    expect(decodeResult.formatted.items[4].label).toBe('Approach Procedure');
    expect(decodeResult.formatted.items[4].value).toBe('ILS30L(30L)');
    expect(decodeResult.formatted.items[5].label).toBe('Arrival Runway');
    expect(decodeResult.formatted.items[5].value).toBe('30L');
    expect(decodeResult.formatted.items[6].label).toBe('Fuel On Board');
    expect(decodeResult.formatted.items[6].value).toBe('172');
    expect(decodeResult.formatted.items[7].label).toBe('Estimated Time of Arrival');
    expect(decodeResult.formatted.items[7].value).toBe('21:51:17');
    expect(decodeResult.formatted.items[8].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[8].value).toBe('0x156d');
    expect(decodeResult.remaining.text).toBe(':WS:N61000W030000,370..N61000W040000..N60000W050000..URTAK:WS:URTAK,380..LAKES:WS:LAKES,400..N57000W070000..N54300W080000..N49000W090000..DLH..COLDD/PR4356,344,360,1060,,,13,,,30,,,P50,M40,36090,,3296,292,KMSP,30L,172,215117');
  });

  test('decodes Label H1 Preamble FPN with newlines', () => {
    // https://app.airframes.io/messages/2381936957
    const text = 'FPN/SN2125/FNQFA780/RI:DA:YPPH:CR:PERMEL001:AA:YMML..MEMUP,S33451E\r\n120525.Y53.WENDY0560'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.flight_number).toBe('QFA780');
    expect(decodeResult.raw.serial_number).toBe('2125');
    expect(decodeResult.formatted.description).toBe('Flight Plan');
    expect(decodeResult.formatted.items.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe('Route Status');
    expect(decodeResult.formatted.items[0].value).toBe('Route Inactive');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('YPPH');
    expect(decodeResult.formatted.items[2].label).toBe('Company Route');
    expect(decodeResult.formatted.items[2].value).toBe('PERMEL001');
    expect(decodeResult.formatted.items[3].label).toBe('Destination');
    expect(decodeResult.formatted.items[3].value).toBe('YMML..MEMUP,S33451E120525.Y53.WENDY'); //TODO - pull out route
    expect(decodeResult.formatted.items[4].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[4].value).toBe('0x0560');
  });

  test('decodes Label H1 Preamble FPN with SN and TS', () => {
    // https://app.airframes.io/messages/2372685289
    const text = 'FPN/TS155631,170224/SN155631/RP:DA:PHNL:AA:KASE:D:MKK5.KOLEA:F:KOLEA,N22354W155133..CLUTS,N23002W154393.R465.CINNY,N36109W124456..OAL,N38002W117462.J58.ILC,N38150W114237..EYELO,N38455W110469..SAKES,N38500W110163.J80.DBL,N39264W106537F5E1'
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.message_timestamp).toBe(1708185391);
    expect(decodeResult.raw.serial_number).toBe('155631');
    expect(decodeResult.formatted.description).toBe('Flight Plan');
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.formatted.items[0].label).toBe('Route Status');
    expect(decodeResult.formatted.items[0].value).toBe('Route Planned');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('PHNL');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('KASE');
    expect(decodeResult.formatted.items[3].label).toBe('Departure Procedure');
    expect(decodeResult.formatted.items[3].value).toBe('MKK5 starting at KOLEA');
    expect(decodeResult.formatted.items[4].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[4].value).toBe('KOLEA(22.590 N, 155.222 W) >> CLUTS(23.003 N, 154.655 W) > R465 > CINNY(36.182 N, 124.760 W) >> OAL(38.003 N, 117.770 W) > J58 > ILC(38.250 N, 114.395 W) >> EYELO(38.758 N, 110.782 W) >> SAKES(38.833 N, 110.272 W) > J80 > DBL(39.440 N, 106.895 W)');
    expect(decodeResult.formatted.items[5].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[5].value).toBe('0xf5e1');
  });

  test('decodes Label H1 Preamble FPN with FN', () => {
    // https://app.airframes.io/messages/3281723743
    const text = 'FPN/RP:DA:KSEA:AA:KPHX:D:SUMMA2.SUMMA:F:SUMMA,N46371W121593..LTJ,N45428W121061..IMB,N44389W119427.Q35..CORKR,N36050W112240..TENTS,N35295W112271:A:BRUSR1.TENTS/FNFFT17245D16';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Flight Plan');
    expect(decodeResult.raw.flight_number).toBe('FFT1724');
    expect(decodeResult.formatted.items.length).toBe(7);
    expect(decodeResult.formatted.items[0].label).toBe('Route Status');
    expect(decodeResult.formatted.items[0].value).toBe('Route Planned');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('KSEA');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('KPHX');
    expect(decodeResult.formatted.items[3].label).toBe('Departure Procedure');
    expect(decodeResult.formatted.items[3].value).toBe('SUMMA2 starting at SUMMA');
    expect(decodeResult.formatted.items[4].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[4].value).toBe('SUMMA(46.618 N, 121.988 W) >> LTJ(45.713 N, 121.102 W) >> IMB(44.648 N, 119.712 W) > Q35 >> CORKR(36.083 N, 112.400 W) >> TENTS(35.492 N, 112.452 W)');
    expect(decodeResult.formatted.items[5].label).toBe('Arrival Procedure');
    expect(decodeResult.formatted.items[5].value).toBe('BRUSR1 starting at TENTS');
    expect(decodeResult.formatted.items[6].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[6].value).toBe('0x5d16');
  });

  test('decodes Label H1 Preamble #M1BFPN', () => {
    // https://app.airframes.io/messages/2400593101
    const text = '#M1BFPN/RI:DA:KJFK:AA:KPHX:CR:JFKPHX20..KG701..KG702..KP702..KP703..KD601..KD602..PUB..ALS.J102.GUP:A:EAGUL6.GUP:F:HOMRR90E1';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.formatted.description).toBe('Flight Plan');
    expect(decodeResult.formatted.items.length).toBe(7);
    expect(decodeResult.formatted.items[0].label).toBe('Route Status');
    expect(decodeResult.formatted.items[0].value).toBe('Route Inactive');
    expect(decodeResult.formatted.items[1].label).toBe('Origin');
    expect(decodeResult.formatted.items[1].value).toBe('KJFK');
    expect(decodeResult.formatted.items[2].label).toBe('Destination');
    expect(decodeResult.formatted.items[2].value).toBe('KPHX');
    expect(decodeResult.formatted.items[3].label).toBe('Company Route');
    expect(decodeResult.formatted.items[3].value).toBe('JFKPHX20: >> KG701 >> KG702 >> KP702 >> KP703 >> KD601 >> KD602 >> PUB >> ALS > J102 > GUP');
    expect(decodeResult.formatted.items[4].label).toBe('Arrival Procedure');
    expect(decodeResult.formatted.items[4].value).toBe('EAGUL6 starting at GUP');
    expect(decodeResult.formatted.items[5].label).toBe('Aircraft Route');
    expect(decodeResult.formatted.items[5].value).toBe('HOMRR');
    expect(decodeResult.formatted.items[6].label).toBe('Message Checksum');
    expect(decodeResult.formatted.items[6].value).toBe('0x90e1');
  });

  // Does not match the preamble
  // This might move to a different parser, but while we're here...
  test('decodes Label H1 #M1BFPN No Preamble', () => {
    // https://app.airframes.io/messages/2400409588
    const text = 'F37AKL0767#M1BFPN/TS232008,022324/RP:DA:TNCA:AA:TNCB:R:11O:D:ADRI1F..IRLEP.A574..PJG:AP:RNV10(10O)/PR,,110,,183,7,13,,M7,25,,,P30,M40,36090,13,3455,300/DTTNCB,10O,119,23440847C0';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.message_timestamp).toBe(1708730408);
    expect(decodeResult.raw.flight_number).toBe('KL0767');
    expect(decodeResult.raw.route_status).toBe('RP');
    expect(decodeResult.raw.departure_icao).toBe('TNCA');
    expect(decodeResult.raw.arrival_icao).toBe('TNCB');
    expect(decodeResult.raw.departure_runway).toBe('11O');
    expect(decodeResult.raw.procedures.length).toBe(2);
    expect(decodeResult.raw.procedures[0].type).toBe('departure');
    expect(decodeResult.raw.procedures[0].route.name).toBe('ADRI1F');
    expect(decodeResult.raw.procedures[1].type).toBe('approach');
    expect(decodeResult.raw.procedures[1].route.name).toBe('RNV10(10O)');
    expect(decodeResult.raw.fuel_on_board).toBe(119);
    expect(decodeResult.raw.eta_time).toBe(85448);
    expect(decodeResult.raw.checksum).toBe(0x47c0);
    expect(decodeResult.formatted.description).toBe('Flight Plan');
    expect(decodeResult.formatted.items.length).toBe(11);
    expect(decodeResult.remaining.text).toBe('F37A#M1B/PR,,110,,183,7,13,,M7,25,,,P30,M40,36090,13,3455,300');
  });

  test('decodes Label H1 Preamble FPN <invalid>', () => {
    const text = 'FPN Bogus message';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe('none');
    expect(decodeResult.formatted.description).toBe('Unknown');
    expect(decodeResult.message.text).toBe(text);
  });

  test('decode RM', () => { // TODO: enable
    const text = 'FPN/ID88194A,RCH857,PMZM107QP021/MR2,/RM:AA:FJDG:F:DOH.N300..NOLSU.P307..SETSI.P307..PARAR..N20000E063000..RIGLO.L516..ELKEL.L516..BUMMR/WP,,,,E3E9';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('partial');
    expect(decodeResult.raw.tail).toBe('88194A');
    expect(decodeResult.raw.flight_number).toBe('RCH857');
    expect(decodeResult.raw.mission_number).toBe('PMZM107QP021');
    expect(decodeResult.raw.route_status).toBe('RM');
    expect(decodeResult.raw.arrival_icao).toBe('FJDG');
    expect(decodeResult.raw.route.waypoints.length).toBe(20);
    expect(decodeResult.raw.route.waypoints[0].name).toBe('DOH');
    expect(decodeResult.raw.route.waypoints[19].name).toBe('BUMMR');
    expect(decodeResult.raw.checksum).toBe(0xe3e9);
    expect(decodeResult.formatted.description).toBe('Flight Plan');
    expect(decodeResult.formatted.items.length).toBe(6);
    expect(decodeResult.message.text).toBe(text);
  });

    test('Decodes Empty Message', () => {
    const text = 'FPNEEE6';
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe('full');
    expect(decodeResult.raw.checksum).toBe(0xeee6);
    expect(decodeResult.formatted.items.length).toBe(1);
  });
});