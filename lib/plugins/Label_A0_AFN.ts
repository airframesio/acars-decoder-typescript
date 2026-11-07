import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';

/**
 * Label A0 — AFN (ATS Facilities Notification / FANS Logon)
 *
 * Downlink (aircraft → ground) message used by the FANS 1/A suite to
 * establish a data-link context between an aircraft and a specific ATC
 * facility. Under ARINC 622, AFN is the substitute for the ATN Context
 * Management (CM) logon procedure.
 *
 * Observed variants in the wild:
 *
 *   1. /LPAFAYA.AFN/FMHIBE0105,.EC-NVR,,093150/FAK4,GCCC,LPAFAYAF015
 *        envelope + 4-digit seq + tail + reason + time + single /capability,atc,addr
 *
 *   2. /PIKCPYA.AFN/FMHVIR8Y,.G-VPRD,,095426/FCASNNCPXA,0E7A6
 *        aircraft address carries a trailing sub-qualifier (no 4-digit seq),
 *        capability,addr instead of capability,atc,addr
 *
 *   3. /SNNCPXA.AFN/FMHVIR8Y,.G-VPRD/FAK0,EISN/FARADS,2/FARATC,0B5E0
 *        no timestamp/reason, multiple slash-delimited capability blocks
 *
 * The parser below handles all three by:
 *   • extracting /GROUND.APPL/AIRCRAFT header first,
 *   • then splitting whatever comes next into one pre-slash CSV block
 *     (tail/reason/time) and zero-or-more slash-delimited capability
 *     blocks (each with its own comma-separated tokens).
 */
export class Label_A0_AFN extends DecoderPlugin {
  name = 'label-a0-afn';

  qualifiers() {
    return {
      labels: ['A0'],
    };
  }

  decode(message: Message, options: Options = {}): DecodeResult {
    const decodeResult = this.initResult(
      message,
      'AFN — ATS Facilities Notification (FANS 1/A data-link logon)',
    );

    const text = (message.text || '').trim();
    if (!text) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    // 1) Envelope: /GROUND.APPL/AIRCRAFT  (aircraft may include a sub-qualifier)
    const envelope =
      /^\/(?<ground>[A-Z0-9]{6,8})\.(?<appl>[A-Z0-9]+)\/(?<aircraft>[A-Z0-9]{4,10})/;
    const env = text.match(envelope);
    if (!env?.groups) {
      this.setDecodeLevel(decodeResult, false);
      return decodeResult;
    }

    let { ground, appl, aircraft } = env.groups;

    // 2) Detect an optional trailing 4-digit message sequence on the aircraft token
    let seq = '';
    const seqMatch = aircraft.match(/^([A-Z0-9]+?)(\d{4})$/);
    if (seqMatch && seqMatch[1].length >= 4) {
      aircraft = seqMatch[1];
      seq = seqMatch[2];
    }

    decodeResult.raw.ground_address = ground;
    decodeResult.raw.application = appl;
    decodeResult.raw.aircraft_address = aircraft;
    if (seq) decodeResult.raw.message_sequence = seq;

    // Remainder after the envelope (+ seq digits if we peeled them off)
    const consumed = env[0].length + (seq ? -0 : 0); // env[0] already included seq digits
    const remainderRaw = text.substring(consumed);
    const remainder = remainderRaw.startsWith(',')
      ? remainderRaw
      : remainderRaw; // may or may not start with comma

    // 3) Split into a pre-slash CSV block and subsequent slash-delimited blocks
    // Example remainder shapes:
    //   ",.TAIL,,HHMMSS/CAP,ATC,GND"
    //   ",.TAIL/CAP,ATC/CAP2,EXTRA"
    //   "/CAP,ATC,GND"      (no CSV block at all)
    const firstSlash = remainder.indexOf('/');
    const preSlash =
      firstSlash >= 0 ? remainder.substring(0, firstSlash) : remainder;
    const postSlash = firstSlash >= 0 ? remainder.substring(firstSlash) : '';

    // 4) Parse pre-slash CSV fields: first token empty (leading comma), then
    //    .TAIL, reason, HHMMSS — all optional
    if (preSlash.startsWith(',')) {
      const tokens = preSlash.substring(1).split(',');
      const tailTok = (tokens[0] || '').trim();
      const reasonTok = (tokens[1] || '').trim();
      const timeTok = (tokens[2] || '').trim();

      if (tailTok) {
        const clean = tailTok.startsWith('.') ? tailTok.substring(1) : tailTok;
        if (clean) decodeResult.raw.tail = clean;
      }
      if (reasonTok) decodeResult.raw.reason_code = reasonTok;
      if (timeTok && /^\d{6}$/.test(timeTok)) {
        decodeResult.raw.message_timestamp = `${timeTok.substring(0, 2)}:${timeTok.substring(2, 4)}:${timeTok.substring(4, 6)}Z`;
      } else if (timeTok) {
        decodeResult.raw.message_timestamp = timeTok;
      }
    } else if (preSlash) {
      // Unusual shape — record it so the user sees it rather than losing it
      decodeResult.raw.header_extra = preSlash;
    }

    // 5) Parse slash-delimited capability blocks. Each block after `/` has
    //    one-or-more comma-separated tokens. We expose them as:
    //      - capability_code (first token)
    //      - atc_center_icao (second token, if it looks like an ICAO)
    //      - extra_<n> (remaining tokens)
    //    If there are multiple blocks we expose them in an array too.
    const blocks: Array<{ capability: string; tokens: string[] }> = [];
    if (postSlash) {
      const parts = postSlash.split('/').filter((s) => s.length > 0);
      for (const p of parts) {
        const tokens = p.split(',').map((t) => t.trim());
        blocks.push({ capability: tokens[0] || '', tokens: tokens.slice(1) });
      }
    }

    if (blocks.length) {
      decodeResult.raw.capability_blocks = blocks;
      // Convenience single-value shortcuts from the first block
      const first = blocks[0];
      if (first.capability) decodeResult.raw.capability_code = first.capability;
      // If second token looks like a 4-char ICAO, treat it as the ATC center
      if (first.tokens[0] && /^[A-Z]{4}$/.test(first.tokens[0])) {
        decodeResult.raw.atc_center_icao = first.tokens[0];
        decodeResult.raw.arrival_icao = first.tokens[0];
      }
      // Remaining tokens are extras
      if (first.tokens.length) {
        decodeResult.raw.ground_facility_full = first.tokens[first.tokens.length - 1];
        const vm = String(decodeResult.raw.ground_facility_full).match(/^([A-Z0-9]+?)(F\d{2,4})$/);
        if (vm) {
          decodeResult.raw.ground_facility_address = vm[1];
          decodeResult.raw.ground_facility_version = vm[2];
        }
      }
    }

    // ── Formatted (one row per field) ──
    decodeResult.formatted.items.push(
      {
        type: 'message_type',
        code: 'MSGTYP',
        label: 'Message Type',
        value: 'AFN — ATS Facilities Notification (FANS 1/A logon)',
      },
      {
        type: 'direction',
        code: 'DIR',
        label: 'Direction',
        value: 'Downlink (aircraft → ground)',
      },
      {
        type: 'ground_address',
        code: 'GNDADDR',
        label: 'Ground ACARS Address',
        value: ground,
      },
      {
        type: 'application',
        code: 'APPL',
        label: 'Application',
        value: appl === 'AFN' ? 'AFN (ATS Facilities Notification)' : appl,
      },
      {
        type: 'aircraft_address',
        code: 'ACADDR',
        label: 'Aircraft ACARS Address',
        value: aircraft,
      },
    );

    if (seq) {
      decodeResult.formatted.items.push({
        type: 'sequence',
        code: 'SEQ',
        label: 'Message Sequence',
        value: seq,
      });
    }
    if (decodeResult.raw.tail) {
      decodeResult.formatted.items.push({
        type: 'tail',
        code: 'TAIL',
        label: 'Aircraft Registration',
        value: String(decodeResult.raw.tail),
      });
    }
    if (decodeResult.raw.reason_code != null) {
      decodeResult.formatted.items.push({
        type: 'reason',
        code: 'REASON',
        label: 'Reason / Spare',
        value: String(decodeResult.raw.reason_code),
      });
    }
    if (decodeResult.raw.message_timestamp) {
      decodeResult.formatted.items.push({
        type: 'timestamp',
        code: 'TIME',
        label: 'Message Time (UTC)',
        value: String(decodeResult.raw.message_timestamp),
      });
    }

    // Emit one row per capability block so the user can read each one
    if (blocks.length === 1) {
      const b = blocks[0];
      if (b.capability) {
        decodeResult.formatted.items.push({
          type: 'capability',
          code: 'CAPAB',
          label: 'FANS Capability Code',
          value: b.capability,
        });
      }
      if (decodeResult.raw.atc_center_icao) {
        decodeResult.formatted.items.push({
          type: 'atc_center',
          code: 'ATCCTR',
          label: 'ATC Centre',
          value: String(decodeResult.raw.atc_center_icao),
        });
      }
      if (decodeResult.raw.ground_facility_full) {
        let val = String(decodeResult.raw.ground_facility_full);
        if (decodeResult.raw.ground_facility_address && decodeResult.raw.ground_facility_version) {
          val = `${decodeResult.raw.ground_facility_address} (version ${decodeResult.raw.ground_facility_version})`;
        }
        if (val !== decodeResult.raw.atc_center_icao) {
          decodeResult.formatted.items.push({
            type: 'ground_facility',
            code: 'GNDFAC',
            label: 'Ground Facility (full)',
            value: val,
          });
        }
      }
    } else {
      blocks.forEach((b, i) => {
        const parts = [b.capability, ...b.tokens].filter(Boolean);
        decodeResult.formatted.items.push({
          type: 'capability_block',
          code: `BLK${i + 1}`,
          label: `Block ${i + 1}`,
          value: parts.join(' · '),
        });
      });
    }

    this.setDecodeLevel(decodeResult, true, 'full');
    return decodeResult;
  }
}
