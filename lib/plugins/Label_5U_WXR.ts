import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

/**
 * Label 5U — Autonomous Weather Information Request (WXRQ)
 *
 * Downlink sent by the aircraft (typically shortly after takeoff or prior
 * to arrival) requesting weather data (e.g. METAR) for a destination or
 * alternate airport.
 *
 * Wire format (only the first three documented fields are decoded here):
 *
 *   OS KHRL /WXRKHRL ,
 *   |  |    |        |
 *   |  |    |        └── Trailing list delimiter (ignored — may precede
 *   |  |    |            additional comma-separated entries, e.g. alternates)
 *   |  |    └─────────── Weather request: `/WXR` + target ICAO (e.g. /WXRKHRL)
 *   |  └──────────────── Destination airport ICAO (4 chars)
 *   └─────────────────── Message subtype / system identifier
 *                        (undocumented — exposed raw, per analyst guidance)
 *
 * Observed example:  `OS KHRL/WXRKHRL,`
 */
export class Label_5U_WXR extends DecoderPlugin {
  name = 'label-5u-wxr';

  qualifiers() {
    return {
      labels: ['5U'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'Autonomous Weather Information Request (WXRQ)',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // ── Form B: Air France / Airbus-style slash-delimited ICAO list ──
    //   <count-or-seq><ICAO1>/<ICAO2>/<ICAO3>[/<ICAO4>…]
    //   Example:  `3LFRB/EINN/BIKF`
    const formB = text.match(
      /^(?<count>\d+)(?<icaos>[A-Z]{4}(?:\/[A-Z]{4})+)\s*$/,
    );
    if (formB?.groups) {
      const count = formB.groups.count;
      const icaos = formB.groups.icaos.split('/');
      const [dep, dest, ...alternates] = icaos;

      decodeResult.raw.count = count;
      decodeResult.raw.icaos = icaos;
      ResultFormatter.departureAirport(decodeResult, dep);
      if (dest) ResultFormatter.arrivalAirport(decodeResult, dest);

      decodeResult.formatted.items.unshift(
        {
          type: 'message_type',
          code: 'MSGTYP',
          label: 'Message Type',
          value: 'Weather Information Request (WXRQ)',
        },
        {
          type: 'count',
          code: 'COUNT',
          label: 'Sequence / Count',
          value: count,
        },
      );
      alternates.forEach((alt, i) => {
        decodeResult.formatted.items.push({
          type: 'alternate',
          code: `ALT${i + 1}`,
          label: i === 0 ? 'Alternate' : `Alternate ${i + 1}`,
          value: alt,
        });
      });
      decodeResult.formatted.items.push({
        type: 'wxr_request',
        code: 'WXRREQ',
        label: 'Weather Requested For',
        value: icaos.join(', '),
      });

      this.setDecodeLevel(decodeResult, true, 'full');
      return decodeResult;
    }

    // ── Form A: `<subtype> <ICAO>/WXR<ICAO>` (e.g. `OS KHRL/WXRKHRL,`) ──
    const regex =
      /^(?<subtype>[A-Z]{1,4})\s+(?<dest>[A-Z]{3,4})\/WXR(?<wxrIcao>[A-Z]{3,4})/;
    const m = text.match(regex);
    if (!m?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    const { subtype, dest, wxrIcao } = m.groups;

    decodeResult.raw.subtype = subtype;
    ResultFormatter.arrivalAirport(decodeResult, dest);
    decodeResult.raw.wxr_request_icao = wxrIcao;

    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'Weather Information Request (WXRQ)',
      },
      {
        type: 'subtype',
        code: 'SUBTYPE',
        label: 'Subtype',
        value: subtype,
      },
    );
    decodeResult.formatted.items.push({
      type: 'wxr_request',
      code: 'WXRREQ',
      label: 'Weather Request',
      value: `WXR for ${wxrIcao}`,
    });

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
