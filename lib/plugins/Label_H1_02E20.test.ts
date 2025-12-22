import { MessageDecoder } from "../MessageDecoder";
import { Label_H1_02E20 } from "./Label_H1_02E20";

describe("Label_H1 02E20", () => {
  let plugin: Label_H1_02E20;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_H1_02E20(decoder);
  });
  test("matches qualifiers", () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe("label-h1-02e20");
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ["H1"],
      preambles: ["02E20"],
    });
  });

  test("decodes discord example 1", () => {
    const text =
      "02E20HEGNLKPRN40359E02208116253601M627259020G    QN41179E02134316323599M617247037G    QN41591E02100516393603M610266040G    QN42393E02026716463602M600276033G    QN43197E01954316533598M592299037G    QN44023E01929517003596M587313033G    Q";
    const decodeResult = plugin.decode({ text: text });
    /*
  Route: HEGN-LKPR
1    40°35.9'N, 022°08.1'E    16:25    FL360    36,000 ft    -62.7°C    259°/20kts
2    41°17.9'N, 021°34.3'E    16:32    FL359    35,900 ft    -61.7°C    247°/37kts
3    41°59.1'N, 021°00.5'E    16:39    FL360    36,000 ft    -61.0°C    266°/40kts
4    42°39.3'N, 020°26.7'E    16:46    FL360    36,000 ft    -60.0°C    276°/33kts
5    43°19.7'N, 019°54.3'E    16:53    FL359    35,900 ft    -59.2°C    299°/37kts
6    44°02.3'N, 019°29.5'E    17:00    FL359    35,900 ft    -58.7°C    313°/33kts
  */
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe("full");
    expect(decodeResult.formatted.description).toBe("Weather Report");
    expect(decodeResult.message.text).toBe(text);
    const weather = decodeResult.raw.wind_data;
    expect(weather.length).toBe(6);
    expect(decodeResult.formatted.items[0].label).toBe("Origin");
    expect(decodeResult.formatted.items[0].value).toBe("HEGN");
    expect(decodeResult.formatted.items[1].label).toBe("Destination");
    expect(decodeResult.formatted.items[1].value).toBe("LKPR");
    expect(decodeResult.formatted.items[2].label).toBe("Wind Data");
    expect(decodeResult.formatted.items[2].value).toBe(
      "N40359E022081(40.598 N, 22.135 E)@16:25:00 at FL360: 259° at 20kt, -62.7°C at FL360"
    );
    expect(decodeResult.formatted.items[3].label).toBe("Wind Data");
    expect(decodeResult.formatted.items[3].value).toBe(
      "N41179E021343(41.298 N, 21.572 E)@16:32:00 at FL359: 247° at 37kt, -61.7°C at FL359"
    );
    expect(decodeResult.formatted.items[4].label).toBe("Wind Data");
    expect(decodeResult.formatted.items[4].value).toBe(
      "N41591E021005(41.985 N, 21.008 E)@16:39:00 at FL360: 266° at 40kt, -61°C at FL360"
    );
    expect(decodeResult.formatted.items[5].label).toBe("Wind Data");
    expect(decodeResult.formatted.items[5].value).toBe(
      "N42393E020267(42.655 N, 20.445 E)@16:46:00 at FL360: 276° at 33kt, -60°C at FL360"
    );
    expect(decodeResult.formatted.items[6].label).toBe("Wind Data");
    expect(decodeResult.formatted.items[6].value).toBe(
      "N43197E019543(43.328 N, 19.905 E)@16:53:00 at FL359: 299° at 37kt, -59.2°C at FL359"
    );
    expect(decodeResult.formatted.items[7].label).toBe("Wind Data");
    expect(decodeResult.formatted.items[7].value).toBe(
      "N44023E019295(44.038 N, 19.492 E)@17:00:00 at FL359: 313° at 33kt, -58.7°C at FL359"
    );
  });

  test("decodes discord example 2", () => {
    const text =
      "02E20EGKKLBSFN45081E01757116493501M577327021G    QN44401E01903016563499M575352028G    QN44115E02008017033468M550319029G    QN43420E02112317103296M525299036G    QN43125E02214517172023M277271022G    Q";
    const decodeResult = plugin.decode({ text: text });

    /*
  Route: EGKK-LBSF
1    FL350    ~35,000 ft    -57.7°C    327°/21kts
2    FL349    ~34,900 ft    -57.5°C    352°/28kts
3    FL346    ~34,600 ft    -55.0°C    319°/29kts
4    FL329    ~32,900 ft    -52.5°C    299°/36kts
5    FL202    ~20,200 ft    -27.7°C    271°/22kts
*/
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe("full");
    expect(decodeResult.formatted.description).toBe("Weather Report");
    expect(decodeResult.message.text).toBe(text);
    const weather = decodeResult.raw.wind_data;
    expect(weather.length).toBe(5);
    expect(decodeResult.formatted.items[0].label).toBe("Origin");
    expect(decodeResult.formatted.items[0].value).toBe("EGKK");
    expect(decodeResult.formatted.items[1].label).toBe("Destination");
    expect(decodeResult.formatted.items[1].value).toBe("LBSF");
    expect(decodeResult.formatted.items[2].label).toBe("Wind Data");
    expect(decodeResult.formatted.items[2].value).toBe(
      "N45081E017571(45.135 N, 17.952 E)@16:49:00 at FL350: 327° at 21kt, -57.7°C at FL350"
    );
    expect(decodeResult.formatted.items[3].label).toBe("Wind Data");
    expect(decodeResult.formatted.items[3].value).toBe(
      "N44401E019030(44.668 N, 19.050 E)@16:56:00 at FL349: 352° at 28kt, -57.5°C at FL349"
    );
    expect(decodeResult.formatted.items[4].label).toBe("Wind Data");
    expect(decodeResult.formatted.items[4].value).toBe(
      "N44115E020080(44.192 N, 20.133 E)@17:03:00 at FL346: 319° at 29kt, -55°C at FL346"
    );
    expect(decodeResult.formatted.items[5].label).toBe("Wind Data");
    expect(decodeResult.formatted.items[5].value).toBe(
      "N43420E021123(43.700 N, 21.205 E)@17:10:00 at FL329: 299° at 36kt, -52.5°C at FL329"
    );
    expect(decodeResult.formatted.items[6].label).toBe("Wind Data");
    expect(decodeResult.formatted.items[6].value).toBe(
      "N43125E022145(43.208 N, 22.242 E)@17:17:00 at FL202: 271° at 22kt, -27.7°C at FL202"
    );
  });

  test("decodes website example", () => {
    // https://app.airframes.io/messages/6025352132
    const text =
      "02E20EIDWKORDN44087W08505523383800M470251091G QN43210W08520623452813M442251113G QN42461W08539523522189M295256121G QN42380W08623723591780M227266100G Q";
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe("full");
    expect(decodeResult.formatted.description).toBe("Weather Report");
    expect(decodeResult.message.text).toBe(text);
    const weather = decodeResult.raw.wind_data;
    expect(weather.length).toBe(4);
    expect(decodeResult.formatted.items[0].label).toBe("Origin");
    expect(decodeResult.formatted.items[0].value).toBe("EIDW");
    expect(decodeResult.formatted.items[1].label).toBe("Destination");
    expect(decodeResult.formatted.items[1].value).toBe("KORD");
    expect(decodeResult.formatted.items[2].label).toBe("Wind Data");
    expect(decodeResult.formatted.items[2].value).toBe(
      "N44087W085055(44.145 N, 85.092 W)@23:38:00 at FL380: 251° at 91kt, -47°C at FL380"
    );
    expect(decodeResult.formatted.items[3].label).toBe("Wind Data");
    expect(decodeResult.formatted.items[3].value).toBe(
      "N43210W085206(43.350 N, 85.343 W)@23:45:00 at FL281: 251° at 113kt, -44.2°C at FL281"
    );
    expect(decodeResult.formatted.items[4].label).toBe("Wind Data");
    expect(decodeResult.formatted.items[4].value).toBe(
      "N42461W085395(42.768 N, 85.658 W)@23:52:00 at FL218: 256° at 121kt, -29.5°C at FL218"
    );
    expect(decodeResult.formatted.items[5].label).toBe("Wind Data");
    expect(decodeResult.formatted.items[5].value).toBe(
      "N42380W086237(42.633 N, 86.395 W)@23:59:00 at FL178: 266° at 100kt, -22.7°C at FL178"
    );
  });

  test("decodes invalid message", () => {
    const text = "02E20INVALID MESSAGE TEXT";
    const decodeResult = plugin.decode({ text: text });

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe("none");
    expect(decodeResult.formatted.description).toBe("Weather Report");
    expect(decodeResult.message.text).toBe(text);
    expect(decodeResult.remaining.text).toBe("02E20INVALID MESSAGE TEXT");
  });
});
