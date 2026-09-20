import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { ResultFormatter } from '../utils/result_formatter';

/**
 * Label AA — FANS-1/A CPDLC (Controller–Pilot Data Link Communications)
 *
 * Carried inside the ARINC 622 envelope. Two sub-formats are observed:
 *
 * Form 1 — double-dot separator (service-qualifier form):
 *
 *   / USADCXA . AT1 . JA788A 222E042A4E61CF9D1A4D29A821D08932…
 *   | |       |  |  | |      |
 *   | |       |  |  | |      └ CPDLC payload, ASN.1 PER hex + 4-char CRC
 *   | |       |  |  | └────── Aircraft registration (typ. 6 chars, may contain '-')
 *   | |       |  |  └──────── Separator
 *   | |       |  └─────────── Service qualifier (AT1, ATN, …)
 *   | |       └────────────── Separator
 *   | └────────────────────── Ground-station ARINC address (5–9 chars)
 *   └──────────────────────── ARINC-622 routing delimiter '/'
 *
 * Form 2 — single-dot, concatenated IMI + sublabel + tail (analyst example):
 *
 *   / FUKJJYA . CR 1 B-16332 201EFEA8E94A9528 7147
 *   | |       | |  | |       |                |
 *   | |       | |  | |       |                └ 4-char CRC
 *   | |       | |  | |       └───────────────── CPDLC payload hex (ASN.1 PER)
 *   | |       | |  | └───────────────────────── Aircraft registration (e.g. B-16332)
 *   | |       | |  └─────────────────────────── Sublabel / qualifier char
 *   | |       | └────────────────────────────── IMI (Imbedded Message Identifier, 2 chars)
 *   | |       └──────────────────────────────── Separator
 *   | └──────────────────────────────────────── Ground-station ARINC address (7 chars)
 *   └────────────────────────────────────────── ARINC-622 routing delimiter '/'
 *
 * Known IMIs (Form 2):
 *   AT1 / ATN     — CPDLC uplink (ground → aircraft) — also Form 1 service qualifier
 *   CR            — CPDLC response (WILCO / UNABLE / STANDBY / ROGER, etc.)
 *
 * The CPDLC payload is binary ASN.1 PER — the plugin preserves it as
 * `cpdlc_payload_hex` so a downstream ASN.1 decoder (libacars et al.) can
 * parse the specific message element(s). The trailing 4 hex chars are the
 * ARINC-622 16-bit CRC appended as 4 ASCII hex digits.
 */
export class Label_AA_CPDLC extends DecoderPlugin {
  name = 'label-aa-cpdlc';

  private readonly imiDescriptions: Record<string, string> = {
    AT1: 'FANS-1/A ATC Type 1 (CPDLC uplink)',
    ATN: 'ATN CPDLC',
    CR: 'CPDLC Response (WILCO / UNABLE / STANDBY / ROGER)',
  };

  qualifiers() {
    return {
      labels: ['AA'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'FANS-1/A CPDLC — Controller–Pilot Data Link Communications',
    );

    const text = (message.text || '').trim();
    if (!text || !text.startsWith('/')) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // ── Form 1: /GROUND.QUAL.REST (two dots) ──
    const doubleDot = text.match(
      /^\/(?<ground>[A-Z0-9]{5,9})\.(?<qual>[A-Z0-9]{2,4})\.(?<rest>.+)$/,
    );

    // ── Form 2: /GROUND.IMI+SUBLABEL+REST (one dot) ──
    const singleDot = !doubleDot
      ? text.match(
          /^\/(?<ground>[A-Z0-9]{5,9})\.(?<imi>[A-Z]{2})(?<sublabel>[A-Z0-9])(?<rest>.+)$/,
        )
      : null;

    let ground: string;
    let qualOrImi: string;
    let sublabel: string | undefined;
    let rest: string;
    let formNote: string;

    if (doubleDot?.groups) {
      ground = doubleDot.groups.ground;
      qualOrImi = doubleDot.groups.qual;
      rest = doubleDot.groups.rest;
      formNote = 'Form 1 (qualifier.tail)';
    } else if (singleDot?.groups) {
      ground = singleDot.groups.ground;
      qualOrImi = singleDot.groups.imi;
      sublabel = singleDot.groups.sublabel;
      rest = singleDot.groups.rest;
      formNote = 'Form 2 (IMI+sublabel+tail)';
    } else {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    decodeResult.raw.ground_address = ground;
    decodeResult.raw.imi = qualOrImi;
    if (sublabel) decodeResult.raw.sublabel = sublabel;

    // ── Split `rest` into tail + (payload + CRC) ──
    // Tails are notoriously ambiguous because after a hyphen the registration
    // digits look identical to the hex payload that follows. We try a
    // cascade of known ICAO registration patterns and accept the first one
    // whose trailing hex block has even length (ASN.1 PER bytes) after the
    // 4-char CRC is removed.
    const tailCandidates: RegExp[] = [
      /^([A-Z]-\d{4,5})/,           // B-NNNN / B-NNNNN (Taiwan/China)
      /^([A-Z]{1,2}-[A-Z0-9]{3,5})/, // A7-ANT, 9V-SMI, LN-RKN, VH-ABC, etc.
      /^(N\d{1,5}[A-Z]{0,2})/,      // US N-numbers (N123AB)
      /^(JA\d{1,4}[A-Z]?)/,         // Japan
      /^(HL\d{4})/,                  // Korea
    ];
    let tail = '';
    let hexBlock = '';
    for (const re of tailCandidates) {
      const m = rest.match(re);
      if (!m) continue;
      const candidateTail = m[1];
      const candidateHex = rest.substring(candidateTail.length);
      if (
        /^[0-9A-F]+$/.test(candidateHex) &&
        candidateHex.length >= 4 &&
        (candidateHex.length - 4) % 2 === 0
      ) {
        tail = candidateTail;
        hexBlock = candidateHex;
        break;
      }
    }
    if (!tail) {
      // Fallback: scan first 10 chars for non-hex character (handles oddball
      // tails the pattern list missed).
      const window = rest.substring(0, Math.min(10, rest.length));
      let lastNonHex = -1;
      for (let i = 0; i < window.length; i++) {
        if (!/[0-9A-F]/.test(window[i])) lastNonHex = i;
      }
      if (lastNonHex >= 0) {
        tail = rest.substring(0, lastNonHex + 1);
        hexBlock = rest.substring(lastNonHex + 1);
      } else {
        tail = rest.substring(0, 6);
        hexBlock = rest.substring(6);
      }
    }

    // ── Trailing 4 hex chars are the 16-bit CRC ──
    let payload = '';
    let crc = '';
    if (/^[0-9A-F]+$/.test(hexBlock) && hexBlock.length >= 4) {
      crc = hexBlock.slice(-4);
      payload = hexBlock.slice(0, -4);
    } else {
      // Non-hex leftover — expose raw for downstream inspection
      decodeResult.raw.air_data = rest;
    }

    decodeResult.raw.tail = tail;
    ResultFormatter.tail(decodeResult, tail);
    if (payload) {
      decodeResult.raw.cpdlc_payload_hex = payload;
      decodeResult.raw.cpdlc_payload_bytes = payload.length / 2;
    }
    if (crc) decodeResult.raw.crc = crc;

    // Direction is unambiguous for Form 1 (AT1 = uplink). For Form 2, CR
    // is a response (downlink). AT1/ATN as IMI still implies uplink.
    const direction =
      qualOrImi === 'CR' ? 'Downlink (aircraft → ground)' : 'Uplink (ground → aircraft)';
    decodeResult.raw.direction = direction;

    // ── Formatted items ──
    decodeResult.formatted.items.unshift(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'FANS-1/A CPDLC — Controller–Pilot Data Link Communications',
      },
      {
        type: 'direction',
        code: 'DIR',
        label: 'Direction',
        value: direction,
      },
      {
        type: 'form',
        code: 'FORM',
        label: 'Envelope Form',
        value: formNote,
      },
      {
        type: 'ground_address',
        code: 'GNDADDR',
        label: 'Ground ATS Facility',
        value: ground,
      },
    );

    const imiLabel = this.imiDescriptions[qualOrImi]
      ? `${qualOrImi} (${this.imiDescriptions[qualOrImi]})`
      : qualOrImi;
    decodeResult.formatted.items.push({
      type: 'imi',
      code: doubleDot ? 'SVCQUAL' : 'IMI',
      label: doubleDot ? 'Service Qualifier' : 'IMI',
      value: imiLabel,
    });
    if (sublabel) {
      decodeResult.formatted.items.push({
        type: 'sublabel',
        code: 'SUBLBL',
        label: 'Sublabel',
        value: sublabel,
      });
    }

    if (payload) {
      const bytes = payload.length / 2;
      const display =
        payload.length > 96
          ? `${payload.substring(0, 48)}…${payload.substring(payload.length - 48)}`
          : payload;
      decodeResult.formatted.items.push({
        type: 'payload_hex',
        code: 'PAYLOAD',
        label: 'CPDLC Payload (ASN.1 PER, hex)',
        value: `${display} (${bytes} byte${bytes === 1 ? '' : 's'})`,
      });
    }
    if (crc) {
      decodeResult.formatted.items.push({
        type: 'crc',
        code: 'CRC',
        label: 'CRC (16-bit, ARINC-622)',
        value: crc,
      });
    }
    if (payload) {
      decodeResult.formatted.items.push({
        type: 'payload_note',
        code: 'NOTE',
        label: 'Note',
        value:
          'Payload is ASN.1 PER binary — full message element decode requires a FANS-1/A ASN.1 decoder (e.g. libacars).',
      });
    }
    if (decodeResult.raw.air_data) {
      decodeResult.formatted.items.push({
        type: 'air_data',
        code: 'AIRDATA',
        label: 'Air Data (unparsed)',
        value: String(decodeResult.raw.air_data),
      });
    }

    const level: 'full' | 'partial' = payload ? 'full' : 'partial';
    this.setDecodeLevel(decodeResult, true, level);
    return decodeResult;
  }
}
