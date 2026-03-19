import { DecoderPlugin } from '../DecoderPlugin';
import { DecodeResult, Message, Options } from '../DecoderPluginInterface';
import { CoordinateUtils } from '../utils/coordinate_utils';
import { ResultFormatter } from '../utils/result_formatter';

/**
 * Base class for Label 44 event-style decoders (ON, OFF, IN, ETA).
 *
 * These all share the same CSV structure:
 *   preamble, coordinates, [field(s)...], departure, arrival, date, time(s), fuel
 *
 * Subclasses provide the description, qualifiers, minimum field count,
 * and a hook to decode their specific fields from the CSV data.
 */
export abstract class Label_44_Base extends DecoderPlugin {
  /** Human-readable description of this report type (e.g. "On Runway Report"). */
  abstract get description(): string;

  /** Minimum number of CSV fields required for a valid message. */
  abstract get minFields(): number;

  /**
   * Decode the fields that are specific to this report type.
   * The common fields (position, airports, date) are already handled.
   * @param result - The in-progress decode result to populate
   * @param data - The full CSV-split message fields
   * @param options - Decoder options
   */
  abstract decodeEventFields(
    result: DecodeResult,
    data: string[],
    options: Options,
  ): void;

  decode(message: Message, options: Options = {}): DecodeResult {
    const result = this.initResult(message, this.description);

    const data = message.text.split(',');
    if (data.length < this.minFields) {
      return this.failUnknown(result, message.text, options);
    }

    this.debug(options, `${this.description}: fields`, data);

    // Common fields shared by all Label 44 event decoders
    ResultFormatter.position(
      result,
      CoordinateUtils.decodeStringCoordinatesDecimalMinutes(data[1]),
    );
    ResultFormatter.departureAirport(result, data[2]);
    ResultFormatter.arrivalAirport(result, data[3]);
    ResultFormatter.month(result, Number(data[4].substring(0, 2)));
    ResultFormatter.day(result, Number(data[4].substring(2, 4)));

    // Subclass-specific fields
    this.decodeEventFields(result, data, options);

    this.setDecodeLevel(result, true, 'full');
    return result;
  }

  /**
   * Helper to parse a fuel value from a CSV field.
   * Returns undefined if the value is not a valid number.
   */
  protected parseFuel(result: DecodeResult, value: string): void {
    const fuel = Number(value);
    if (!isNaN(fuel)) {
      ResultFormatter.remainingFuel(result, fuel);
    }
  }

  /**
   * Helper to add any remaining fields as unknown.
   */
  protected addRemainingFields(
    result: DecodeResult,
    data: string[],
    startIndex: number,
  ): void {
    if (data.length > startIndex) {
      ResultFormatter.unknownArr(result, data.slice(startIndex));
    }
  }
}
