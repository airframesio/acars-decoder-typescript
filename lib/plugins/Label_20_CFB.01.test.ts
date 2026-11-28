import { beforeEach, describe, expect, it } from '@jest/globals';
import { MessageDecoder } from '../MessageDecoder';
import { Label_20_CFB01 } from './Label_20_CFB.01';

describe('Label_20_CFB01', () => {
  let plugin: Label_20_CFB01;

  beforeEach(() => {
    const decoder = new MessageDecoder();
    plugin = new Label_20_CFB01(decoder);
  });

  it('does not report a full decode when the body does not match', () => {
    const res = plugin.decode({ label: '20', text: '#CFB.01 anything' });

    expect(res.decoded).toBe(false);
    expect(res.decoder.decodeLevel).toBe('none');
  });
});
