const SIDES: Record<string, string> = {
  N: 'north',
  NE: 'northeast',
  E: 'east',
  SE: 'southeast',
  S: 'south',
  SW: 'southwest',
  W: 'west',
  NW: 'northwest',
};

export class RunwayUtils {
  /**
   * Describe the condition that names a runway variant in Southwest landing data, e.g.
   * `11/AIB -E1804F`: the runway, the variant's code and its condition.
   *
   * -E1804F is 1804 feet taken off the east end, -SWCBL the arresting cable at the southwest
   * end. Checked on the LRW01 runway lists of six airports, where every variant's length is
   * the runway's less the feet given, or less 1500 feet for a cable. LAHSO is sent as written.
   *
   * @param name - the runway as sent, with its variant
   * @returns a description of the condition, or undefined when the name has none
   */
  public static variantDescription(name: string): string | undefined {
    const text = name.trim();
    const cut = text.match(/-(NE|NW|SE|SW|N|E|S|W)(\d+)F$/);
    if (cut) {
      return `${Number(cut[2])} feet off the ${SIDES[cut[1]]} end`;
    }
    const cable = text.match(/-(NE|NW|SE|SW|N|E|S|W)CBL$/);
    if (cable) {
      return `arresting cable at the ${SIDES[cable[1]]} end`;
    }
    if (/(^|\s)LAHSO$/.test(text)) {
      return 'land and hold short';
    }
    return undefined;
  }
}
