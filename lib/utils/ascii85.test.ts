import { ascii85Decode } from './ascii85';

describe('ascii85Decode', () => {
  it('decodes a full 5-character group', () => {
    expect(ascii85Decode('<~9jqo^~>')).toEqual(
      new Uint8Array([0x4d, 0x61, 0x6e, 0x20]),
    );
  });

  it.each(['<~uu~>', '<~uuu~>', '<~uuuu~>'])(
    'rejects the short tail group %s whose padded value overflows uint32',
    (input) => {
      expect(ascii85Decode(input)).toBeNull();
    },
  );
});
