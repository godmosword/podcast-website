/** 三星制：bit0=通關 bit1=無失誤 bit2=全收集。 */
export function medalFlags(cleared: boolean, flawless: boolean, collectedAll: boolean): number {
  return (cleared ? 1 : 0) | (flawless ? 2 : 0) | (collectedAll ? 4 : 0);
}

export function medalCount(flags: number): number {
  let n = 0;
  if (flags & 1) n += 1;
  if (flags & 2) n += 1;
  if (flags & 4) n += 1;
  return n;
}
