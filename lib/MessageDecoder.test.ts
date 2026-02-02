import { MessageDecoder } from "./MessageDecoder"

describe('MessageDecoder', () => {
  let decoder: MessageDecoder;

  beforeEach(() => {
    decoder = new MessageDecoder();
  });

  test('Handles Multiple decodes', () => {
    const message = {
      label: 'H1',
      text: 'POSN43312W123174,EASON,215754,370,EBINY,220601,ELENN,M48,02216,185/TS215754,0921227A40'
    };

    decoder.decode(message);
    const decodeResult = decoder.decode(message);
    if(!decodeResult.message) {
      expect(decodeResult.message).toBeDefined();
    return;
    }
    expect(decodeResult.message.label).toBe('H1');
    expect(decodeResult.formatted.items.length).toBe(5);
  });
});