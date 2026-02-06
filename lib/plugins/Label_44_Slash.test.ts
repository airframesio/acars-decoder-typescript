import { MessageDecoder } from "../MessageDecoder";
import { Label_44_Slash } from "./Label_44_Slash";

describe("Label 44 Slash", () => {
  let plugin: Label_44_Slash;
  const message = { label: "44", text: "" };

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_44_Slash(decoder);
  });

  test("matches qualifiers", () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe("label-44-slash");
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ["44"],
      preambles: [" /FB"],
    });
  });

  test("decodes variant 1", () => {
    // https://app.airframes.io/messages/3563679058
    message.text = " /FB 0160/AD KORH/N 38.655,W 75.325,JBU2834,INA03,KORH,2043";
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe("partial");
    expect(decodeResult.raw.flight_number).toBe("JBU2834");
    expect(decodeResult.raw.arrival_icao).toBe("KORH");
    expect(decodeResult.raw.eta_time).toBe(74580);
    expect(decodeResult.raw.position.latitude).toBeCloseTo(38.655, 3);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-75.325, 3);
    expect(decodeResult.formatted.items.length).toBe(4);
    expect(decodeResult.remaining.text).toBe(" /FB 0160,INA03");
  });

  test("decodes variant 2", () => {
    const text =
      " /FB ----/AD KTPA/N 27.971,W 82.558,JBU91,FLS03,KTPA,53988,53988,----,1943,1943,1,1L,VIS1L,0,2,0,,";
    const decodeResult = plugin.decode(message);
    expect(decodeResult.decoded).toBe(true);
    expect(decodeResult.decoder.decodeLevel).toBe("partial");
    expect(decodeResult.raw.flight_number).toBe("JBU91");
    expect(decodeResult.raw.arrival_icao).toBe("KTPA");
    expect(decodeResult.raw.eta_time).toBe(196688);
    expect(decodeResult.raw.arrival_runway).toBe("1L");
    expect(decodeResult.raw.procedures[0].route.name).toBe("VIS1L");
    expect(decodeResult.raw.fuel_remaining).toBe(1943);
    expect(decodeResult.raw.position.latitude).toBeCloseTo(27.971, 3);
    expect(decodeResult.raw.position.longitude).toBeCloseTo(-82.558, 3);
    expect(decodeResult.formatted.items.length).toBe(7);
    expect(decodeResult.remaining.text).toBe(" /FB ----,FLS03,53988,----,1943,1,0,2,0,,");
  });

  test("does not decode invalid", () => {
    message.text = "00OFF01 Bogus message";
    const decodeResult = plugin.decode(message);

    expect(decodeResult.decoded).toBe(false);
    expect(decodeResult.decoder.decodeLevel).toBe("none");
    expect(decodeResult.message).toBe(message);
  });
});
