import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

/**
 * A field of an A02 block. `scale` is given only where the scaling is settled; every other
 * value is shown as sent, and `unscaled` marks the ones whose scaling is still open so they are
 * not read as finished numbers.
 */
interface Field {
  key: string;
  label: string;
  scale?: Scale;
  unscaled?: true;
  /** a raw field with a single value (altitude, mach, gross weight): keep the first block's */
  first?: true;
}

interface Scale {
  divisor?: number;
  multiplier?: number;
  decimals: number;
  unit: string;
}

interface Group {
  blocks: string[];
  /** blocks laid out for CFM engines only; IAE engines send them in another layout */
  cfm?: true;
  fields: Field[];
}

const tenths = (unit: string) => ({ divisor: 10, decimals: 1, unit });
const whole = (unit: string) => ({ divisor: 1, decimals: 0, unit });

const VIBRATION: Field[] = [
  { key: 'vn', label: 'Fan Vibration, N1 Track (VN)', unscaled: true },
  {
    key: 'vl',
    label: 'Turbine Rear Frame Vibration, N1 Track (VL)',
    unscaled: true,
  },
  { key: 'pha', label: 'Fan Phase Angle (PHA)', scale: whole(' degrees') },
  {
    key: 'pht',
    label: 'Turbine Rear Frame Phase Angle (PHT)',
    scale: whole(' degrees'),
  },
];

const GROUPS: Group[] = [
  {
    blocks: ['CE', 'CN'],
    fields: [
      { key: 'tat', label: 'Total Air Temperature', scale: tenths(' C') },
      {
        key: 'altitude',
        label: 'Pressure Altitude',
        scale: whole(' feet'),
        first: true,
      },
      { key: 'cas', label: 'Calibrated Airspeed', scale: whole(' knots') },
      {
        key: 'mach',
        label: 'Mach',
        scale: { divisor: 1000, decimals: 3, unit: '' },
        first: true,
      },
      { key: 'gross_weight', label: 'Gross Weight', first: true },
      { key: 'cg', label: 'Centre of Gravity (CG)', unscaled: true },
      { key: 'dmu_software', label: 'DMU Software (DMU/SW)' },
    ],
  },
  {
    blocks: ['EC', 'EE'],
    cfm: true,
    fields: [
      { key: 'engine_serial', label: 'Engine Serial Number' },
      {
        key: 'engine_hours',
        label: 'Engine Flight Hours (EHRS)',
        unscaled: true,
      },
      {
        key: 'engine_running_time',
        label: 'Engine Running Time (ERT)',
        unscaled: true,
      },
      { key: 'engine_cycles', label: 'Engine Cycles (ECYC)', unscaled: true },
      // a constant 73 on every report seen, so not a live autopilot status
      { key: 'ap', label: 'AP (meaning contested)' },
      {
        key: 'quality_aircraft',
        label: 'Aircraft Stability Quality (QA, 00 best)',
        unscaled: true,
      },
      {
        key: 'quality_engine',
        label: 'Engine Stability Quality (QE, 00 best)',
        unscaled: true,
      },
    ],
  },
  {
    blocks: ['N1', 'N2'],
    cfm: true,
    fields: [
      { key: 'n1', label: 'N1', scale: tenths(' %') },
      { key: 'n1_command', label: 'N1 Command', scale: tenths(' %') },
      { key: 'n2', label: 'N2', scale: tenths(' %') },
      { key: 'egt', label: 'EGT', scale: tenths(' C') },
      { key: 'fuel_flow', label: 'Fuel Flow' },
      { key: 'ps13', label: 'PS13 Static Pressure', unscaled: true },
    ],
  },
  {
    blocks: ['S1', 'S2'],
    cfm: true,
    fields: [
      { key: 'p25', label: 'P25 Compressor Pressure', unscaled: true },
      { key: 't25', label: 'T25 Compressor Temperature', unscaled: true },
      { key: 'p3', label: 'P3 Compressor Discharge Pressure', unscaled: true },
      {
        key: 't3',
        label: 'T3 Compressor Discharge Temperature',
        unscaled: true,
      },
      { key: 't5', label: 'T5 Station 5 Temperature', unscaled: true },
      {
        key: 'vsv',
        label: 'Variable Stator Vane Position (VSV)',
        unscaled: true,
      },
      {
        key: 'vbv',
        label: 'Variable Bleed Valve Position (VBV)',
        unscaled: true,
      },
    ],
  },
  {
    blocks: ['T1', 'T2'],
    cfm: true,
    fields: [
      {
        key: 'hpt_clearance',
        label: 'HPT Clearance Control',
        scale: whole(' %'),
      },
      {
        key: 'lpt_clearance',
        label: 'LPT Clearance Control',
        scale: whole(' %'),
      },
      { key: 'generator_load', label: 'Generator Load', scale: whole(' %') },
      {
        key: 'precooler_pressure',
        label: 'Precooler Inlet Pressure',
        scale: whole(' psi'),
      },
      {
        key: 'nacelle_temperature',
        label: 'Nacelle Temperature',
        scale: whole(' C'),
      },
      { key: 'pt2', label: 'PT2 Total Pressure', unscaled: true },
      {
        key: 'oil_consumption',
        label: 'Oil Consumption (OIQH)',
        unscaled: true,
      },
    ],
  },
  {
    blocks: ['V1', 'V2'],
    cfm: true,
    fields: [
      ...VIBRATION,
      { key: 'vc', label: 'Fan Vibration, N2 Track (VC)', unscaled: true },
      {
        key: 'vh',
        label: 'Turbine Rear Frame Vibration, N2 Track (VH)',
        unscaled: true,
      },
      { key: 'evm', label: 'Vibration Monitoring Status (EVM)' },
    ],
  },
  {
    // from the last stable descent: N1 61.7-62.1 %, against 91.5-93.1 % in V5/V6
    blocks: ['V3', 'V4'],
    cfm: true,
    fields: [
      ...VIBRATION.map((f) => ({
        ...f,
        key: `descent_${f.key}`,
        label: `Descent ${f.label}`,
      })),
      { key: 'descent_n1', label: 'Descent N1', scale: tenths(' %') },
    ],
  },
  {
    // from the last stable climb
    blocks: ['V5', 'V6'],
    cfm: true,
    fields: [
      ...VIBRATION.map((f) => ({
        ...f,
        key: `climb_${f.key}`,
        label: `Climb ${f.label}`,
      })),
      { key: 'climb_n1', label: 'Climb N1', scale: tenths(' %') },
    ],
  },
  {
    blocks: ['V7', 'V8'],
    cfm: true,
    fields: [
      { key: 'oil_pressure', label: 'Oil Pressure (OIP)', unscaled: true },
      {
        key: 'oil_temperature',
        label: 'Oil Temperature (OIT)',
        unscaled: true,
      },
      { key: 'ecw1', label: 'Engine Control Word 1 (ECW1, hex)' },
      { key: 'ssel', label: 'Sensor Selection (SSEL)' },
    ],
  },
  {
    blocks: ['X1', 'X2'],
    fields: [
      // kilograms; X2 is above X1 on every report seen, so which is left and which right is
      // not established
      {
        key: 'wing_fuel',
        label: 'Inner Wing Fuel Quantity (WFQ, X1 / X2)',
        scale: whole(' kg'),
      },
      { key: 'elevator', label: 'Elevator Position', unscaled: true },
      { key: 'aoa', label: 'Angle of Attack', unscaled: true },
      { key: 'sideslip', label: 'Sideslip Angle', unscaled: true },
      {
        key: 'flight_path_acceleration',
        label: 'Flight Path Acceleration (CFPG)',
        unscaled: true,
      },
      {
        key: 'inertial_vertical_speed',
        label: 'Inertial Vertical Speed (CIVV)',
        unscaled: true,
      },
    ],
  },
  {
    blocks: ['X3'],
    fields: [
      { key: 'rudder', label: 'Rudder Position', unscaled: true },
      { key: 'rudder_trim', label: 'Rudder Trim', unscaled: true },
      { key: 'aileron_left', label: 'Left Aileron', unscaled: true },
      { key: 'aileron_right', label: 'Right Aileron', unscaled: true },
      { key: 'stabilizer', label: 'Horizontal Stabilizer', unscaled: true },
      { key: 'roll', label: 'Roll Attitude', unscaled: true },
      { key: 'yaw', label: 'Yaw Rate', unscaled: true },
    ],
  },
  {
    blocks: ['X4', 'X5'],
    fields: [
      { key: 'roll_spoiler_2', label: 'Roll Spoiler 2', unscaled: true },
      { key: 'roll_spoiler_3', label: 'Roll Spoiler 3', unscaled: true },
      { key: 'roll_spoiler_4', label: 'Roll Spoiler 4', unscaled: true },
      { key: 'roll_spoiler_5', label: 'Roll Spoiler 5', unscaled: true },
      { key: 'flap', label: 'Flap Position', unscaled: true },
      { key: 'slat', label: 'Slat Position', unscaled: true },
    ],
  },
  {
    blocks: ['X6', 'X7'],
    fields: [
      { key: 'true_heading', label: 'True Heading', scale: tenths(' degrees') },
      { key: 'longitude', label: 'Longitude' },
      { key: 'latitude', label: 'Latitude' },
      { key: 'wind_speed', label: 'Wind Speed', scale: whole(' knots') },
      {
        key: 'wind_direction',
        label: 'Wind Direction',
        scale: whole(' degrees'),
      },
      {
        key: 'fuel_temperature',
        label: 'Fuel Temperature',
        scale: tenths(' C'),
      },
      { key: 'fuel_density', label: 'Fuel Density (FD)', unscaled: true },
    ],
  },
];

// unit configuration (C1 field 4): gross weight and fuel flow units
const POUNDS = ['09', '11'];
const KILOGRAMS = ['42', '45', '46'];

const NOT_AVAILABLE = /^[X-]+$/;
const NUMBER = /^[N-]?\d+$/;
const BLOCK = /^(CC|C1|CE|CN|EC|EE|N1|N2|S1|S2|T1|T2|V[1-8]|X[1-7])(.*)$/;

const signed = (value: string) =>
  /^[N-]/.test(value) ? -Number(value.slice(1)) : Number(value);

/**
 * Airbus ACMS cruise performance report <02> (A02), sent on H1 by A319, A320 and A321s
 * (AMM 31-37-73). A header, then `/`-separated blocks: CC flight, C1 report codes, CE/CN air
 * data, and per-engine pairs EC/EE, N1/N2, S1/S2, T1/T2, V1-V8, then aircraft X1-X7. The engine
 * blocks follow the CFMI Advanced EVMU layout; aircraft with IAE engines send them in another
 * layout, shown as sent. Field names and order follow the AMM, checked against 11 reports from
 * at least 7 operators; a value is scaled only where its scaling is settled, and every other
 * value is shown as sent.
 */
export class Label_H1_A02 extends DecoderPlugin {
  name = 'label-h1-a02';

  qualifiers() {
    return {
      labels: ['H1'],
      preambles: ['A02/A'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(message, 'Cruise Performance Report');

    const text = message.text.replace(/\r?\n/g, '');
    const parts = text.split('/');
    // A02/A31902,1,1: aircraft type, report number again, page and pages
    const header = parts[1]?.match(/^A(\d{3})02,(\d+),(\d+)$/);
    if (parts[0] !== 'A02' || !header) {
      return this.failUnknown(decodeResult, message.text, options);
    }
    ResultFormatter.raw(
      decodeResult,
      'aircraft_type',
      'ACTYPE',
      'Aircraft Type',
      `A${header[1]}`,
    );
    ResultFormatter.raw(
      decodeResult,
      'page',
      'PAGE',
      'Page',
      `${header[2]} of ${header[3]}`,
      Number(header[2]),
    );

    // a complete report ends with '/'; a copy of the first block alone is cut short
    const cut = !text.endsWith('/');
    const blocks: Record<string, string[]> = {};
    const unknown: string[] = [];
    parts.slice(2).forEach((part, i, all) => {
      if (part === '') return;
      const m = part.match(BLOCK);
      if (!m || (cut && i === all.length - 1)) {
        unknown.push(part);
        return;
      }
      const fields = m[2].split(',');
      if (fields[fields.length - 1] === '') fields.pop();
      blocks[m[1]] = fields;
    });

    this.flight(decodeResult, blocks['CC']);
    const config = this.codes(decodeResult, blocks['C1']);
    const iae = blocks['CE']?.[6]?.startsWith('I') ?? false;

    for (const group of GROUPS) {
      const present = group.blocks.filter((b) => blocks[b]);
      if (present.length === 0) continue;
      if (group.cfm && iae) {
        for (const b of present) {
          ResultFormatter.raw(
            decodeResult,
            `iae_${b.toLowerCase()}`,
            b,
            `${b} (IAE layout, unscaled)`,
            blocks[b].join(','),
          );
        }
        continue;
      }
      const width = Math.max(...present.map((b) => blocks[b].length));
      for (let i = 0; i < width; i++) {
        const field = group.fields[i];
        const values = present
          .map((b) => blocks[b][i])
          .filter((v) => v !== undefined);
        if (!field) {
          unknown.push(values.join(','));
          continue;
        }
        if (field.key === 'gross_weight' || field.key === 'fuel_flow') {
          this.unitField(decodeResult, field, values, config);
        } else if (field.key === 'longitude' || field.key === 'latitude') {
          // the pair of position fields is shown once, as a position
          if (field.key === 'latitude')
            this.position(decodeResult, present, blocks);
        } else {
          this.field(decodeResult, field, values);
        }
      }
    }

    if (unknown.length > 0)
      ResultFormatter.unknownArr(decodeResult, unknown, '/');
    this.setDecodeLevel(decodeResult, true);
    return decodeResult;
  }

  private flight(decodeResult: DecodeResult, cc: string[] | undefined) {
    if (!cc) return;
    // registration (some send it after a '.'), date (no year), time, origin, destination, flight
    const [registration, date, time, origin, destination, flight] = cc;
    if (registration)
      ResultFormatter.tail(decodeResult, registration.replace(/^\.+/, ''));
    if (date)
      ResultFormatter.raw(
        decodeResult,
        'report_date',
        'DATE',
        'Report Date',
        date,
      );
    if (time && /^\d{6}$/.test(time)) {
      ResultFormatter.raw(
        decodeResult,
        'report_time',
        'TIME',
        'Report Time',
        `${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`,
        time,
      );
    } else if (time) {
      ResultFormatter.unknown(decodeResult, time, '/');
    }
    if (origin) ResultFormatter.departureAirport(decodeResult, origin);
    if (destination) ResultFormatter.arrivalAirport(decodeResult, destination);
    if (flight) ResultFormatter.flightNumber(decodeResult, flight);
  }

  /** C1: flight phase, CNT, trigger code, unit configuration, bleed and APU flags */
  private codes(
    decodeResult: DecodeResult,
    c1: string[] | undefined,
  ): string | undefined {
    if (!c1) return undefined;
    const [phase, cnt, code, config, ...bleed] = c1;
    if (phase)
      ResultFormatter.raw(
        decodeResult,
        'flight_phase',
        'PH',
        'Flight Phase (PH)',
        phase,
      );
    // constant on unrelated aircraft, so not the report counter it is documented as
    if (cnt)
      ResultFormatter.raw(
        decodeResult,
        'cnt',
        'CNT',
        'CNT (not a report counter)',
        cnt,
      );
    if (code)
      ResultFormatter.raw(
        decodeResult,
        'trigger_code',
        'CODE',
        'Report Trigger Code',
        code,
      );
    if (config) {
      const units = POUNDS.includes(config)
        ? 'pounds'
        : KILOGRAMS.includes(config)
          ? 'kilograms'
          : 'units not sent';
      ResultFormatter.raw(
        decodeResult,
        'unit_config',
        'UNITS',
        'Unit Configuration',
        `${config} (${units})`,
        config,
      );
    }
    if (bleed.length > 0) {
      ResultFormatter.raw(
        decodeResult,
        'bleed_apu',
        'BLEED',
        'Bleed Status and APU',
        bleed.join(','),
      );
    }
    return config;
  }

  private field(decodeResult: DecodeResult, field: Field, values: string[]) {
    const shown = values.map((v) => this.value(v, field));
    ResultFormatter.raw(
      decodeResult,
      field.key,
      field.key.toUpperCase(),
      field.unscaled ? `${field.label} (unscaled)` : field.label,
      shown.map((s) => s.text).join(' / '),
      shown.length === 1 || field.first
        ? shown[0].value
        : shown.map((s) => s.value),
    );
  }

  private value(value: string, field: Field): { text: string; value: unknown } {
    if (NOT_AVAILABLE.test(value))
      return { text: 'not available', value: undefined };
    const scale = field.scale;
    if (!scale || !NUMBER.test(value)) return { text: value, value };
    const n = (signed(value) * (scale.multiplier ?? 1)) / (scale.divisor ?? 1);
    return { text: `${n.toFixed(scale.decimals)}${scale.unit}`, value: n };
  }

  /**
   * Gross weight (x100 lb or x10 kg) and fuel flow per engine (x10 lb/h or x1 kg/h): the unit
   * configuration picks the units. Without a known one the values are shown as sent.
   */
  private unitField(
    decodeResult: DecodeResult,
    field: Field,
    values: string[],
    config: string | undefined,
  ) {
    const weight = field.key === 'gross_weight';
    const scale: Scale | undefined = POUNDS.includes(config ?? '')
      ? weight
        ? { multiplier: 100, decimals: 0, unit: ' lb' }
        : { multiplier: 10, decimals: 0, unit: ' lb/h' }
      : KILOGRAMS.includes(config ?? '')
        ? weight
          ? { multiplier: 10, decimals: 0, unit: ' kg' }
          : { decimals: 0, unit: ' kg/h' }
        : undefined;
    if (scale) {
      this.field(decodeResult, { ...field, scale }, values);
    } else {
      this.field(
        decodeResult,
        {
          ...field,
          label: `${field.label} (unscaled, unit configuration not sent)`,
        },
        values,
      );
    }
  }

  /** X6/X7 fields 2 and 3: longitude W0822 and latitude N410, tenths of a degree */
  private position(
    decodeResult: DecodeResult,
    present: string[],
    blocks: Record<string, string[]>,
  ) {
    const positions = present.map((b) => {
      const lon = blocks[b][1]?.match(/^([EW])(\d{4})$/);
      const lat = blocks[b][2]?.match(/^([NS])(\d{3})$/);
      if (!lon || !lat) return undefined;
      return {
        latitude: (lat[1] === 'S' ? -1 : 1) * (Number(lat[2]) / 10),
        longitude: (lon[1] === 'W' ? -1 : 1) * (Number(lon[2]) / 10),
      };
    });
    if (positions.some((p) => p === undefined)) {
      ResultFormatter.unknown(
        decodeResult,
        present.map((b) => `${blocks[b][1]},${blocks[b][2]}`).join(','),
        '/',
      );
      return;
    }
    const valid = positions as { latitude: number; longitude: number }[];
    ResultFormatter.raw(
      decodeResult,
      'position',
      'POS',
      'Aircraft Position',
      valid.map((p) => CoordinateUtils.coordinateString(p)).join(' / '),
      valid[0],
    );
  }
}
