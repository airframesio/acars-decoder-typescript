import { RunwayUtils } from './runway_utils';

describe('RunwayUtils.variantDescription', () => {
  test.each([
    // KMSY landing card, https://app.airframes.io/messages/7905994932
    ['11/AIB -E1804F', '1804 feet off the east end'],
    // PHNL landing card, sent with no space, https://app.airframes.io/messages/7939138417
    ['08L/AIC-E5360F', '5360 feet off the east end'],
    // PHNL, KMIA and KATL runway lists, https://app.airframes.io/messages/7946369148,
    // 7906177418 and 7805481210
    ['04R/BBB  -NE2700F', '2700 feet off the northeast end'],
    ['12 /BCD  -SE479F', '479 feet off the southeast end'],
    ['27L/AJF  -W265F', '265 feet off the west end'],
    ['04R/BGA  -SWCBL', 'arresting cable at the southwest end'],
    ['08R/BAD  -ECBL', 'arresting cable at the east end'],
    ['09 /12   LAHSO', 'land and hold short'],
    // a landing card's list of alternative runways, https://app.airframes.io/messages/7904009994
    ['11-E1804F', '1804 feet off the east end'],
  ])('describes %s', (name, description) => {
    expect(RunwayUtils.variantDescription(name)).toBe(description);
  });

  test('has nothing to add to a plain runway or a variant code alone', () => {
    expect(RunwayUtils.variantDescription('35L')).toBeUndefined();
    expect(RunwayUtils.variantDescription('11/AIB')).toBeUndefined();
    expect(RunwayUtils.variantDescription('09/12')).toBeUndefined();
  });
});
