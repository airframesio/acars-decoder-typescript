declare class IcaoDecoder {
    name: string;
    icao: string;
    constructor(icao: string);
    isMilitary(): true | RegExpMatchArray | null;
}

/**
 * Representation of a Message
 */
interface Message {
    label?: string;
    sublabel?: string;
    text: string;
}
/**
 * Decoder Options
 */
interface Options {
    debug?: boolean;
}
/**
 * Results from decoding a message
 */
interface DecodeResult {
    decoded: boolean;
    decoder: {
        name: string;
        type: 'pattern-match' | 'none';
        decodeLevel: 'none' | 'partial' | 'full';
    };
    error?: string;
    formatted: {
        description: string;
        items: {
            type: string;
            code: string;
            label: string;
            value: string;
        }[];
    };
    message?: any;
    raw: any;
    remaining: {
        text?: string;
    };
}
interface DecoderPluginInterface {
    decode(message: Message): DecodeResult;
    meetsStateRequirements(): boolean;
    qualifiers(): any;
}

declare class MessageDecoder {
    name: string;
    plugins: Array<DecoderPluginInterface>;
    debug: boolean;
    constructor();
    registerPlugin(plugin: DecoderPluginInterface): boolean;
    decode(message: Message, options?: Options): DecodeResult;
    lookupAirportByIata(iata: string): any;
}

export { IcaoDecoder, MessageDecoder };
