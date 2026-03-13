import { MessageDecoder } from '../MessageDecoder';
import { Arinc702 } from './ARINC_702';

describe('Arinc 702 Messages', () => {
  let plugin: Arinc702;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Arinc702(decoder);
  });

  test('matches Label H1 Preamble FLR qualifiers', () => {
    expect(plugin.decode).toBeDefined();
    expect(plugin.name).toBe('arinc-702');
    expect(plugin.qualifiers).toBeDefined();
    expect(plugin.qualifiers()).toEqual({
      labels: ['*'],
    });
  });
});
