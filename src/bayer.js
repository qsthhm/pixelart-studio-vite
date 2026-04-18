// Auto-extracted bayer matrices
/* ========== BAYER MATRICES ========== */
export const BAYER2 = [[0,2],[3,1]];
export const BAYER4 = [
  [0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]
];
export const BAYER8 = (() => {
  const m = Array(8).fill().map(()=>Array(8).fill(0));
  for (let y=0;y<8;y++) for (let x=0;x<8;x++) {
    const xc = x ^ y, yc = y;
    let v = 0;
    for (let p=2; p<=8; p*=2) {
      const bit = ((yc >> (Math.log2(p))) & 1) | (((xc >> (Math.log2(p))) & 1)<<1);
      v = (v << 2) | bit;
    }
    m[y][x] = v;
  }
  return m;
})();
