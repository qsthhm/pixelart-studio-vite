// Auto-extracted presets
/* ========== PRESETS ========== */
export const PRESETS = [
  { id: "fs-gb",        name: "Game Boy 砖",        tags: "抖动 · 量化",   params: { pixelSize: 4, dither: "fs", paletteKey: "gb",  glitchSlice: 0, rgbShift: 0, scanlines: 0, quant: 0, noise: 0, bloom: 0, sweep: "rgbShift" } },
  { id: "bayer8-mono",  name: "Bayer 8 单色",       tags: "抖动",          params: { pixelSize: 2, dither: "bayer8", paletteKey: "bw", glitchSlice: 0, rgbShift: 0, scanlines: 0, quant: 0, noise: 0, bloom: 0, sweep: "dither" } },
  { id: "crt-phosphor", name: "CRT 荧光",           tags: "CRT · 扫描",    params: { pixelSize: 3, dither: "none", paletteKey: "none", glitchSlice: 0, rgbShift: 2, scanlines: 70, quant: 0, noise: 4, bloom: 30, sweep: "scanlines" } },
  { id: "datamosh",     name: "数据模糊",           tags: "故障",          params: { pixelSize: 6, dither: "none", paletteKey: "none", glitchSlice: 60, rgbShift: 12, scanlines: 20, quant: 0, noise: 14, bloom: 0, sweep: "glitchSlice" } },
  { id: "vhs-hazed",    name: "VHS 雾化",           tags: "故障 · CRT",    params: { pixelSize: 2, dither: "bayer4", paletteKey: "none", glitchSlice: 10, rgbShift: 6, scanlines: 45, quant: 32, noise: 12, bloom: 20, sweep: "rgbShift" } },
  { id: "nes-tight",    name: "NES 紧凑",           tags: "量化 · 像素",   params: { pixelSize: 5, dither: "fs", paletteKey: "nes", glitchSlice: 0, rgbShift: 0, scanlines: 0, quant: 0, noise: 0, bloom: 0, sweep: "pixelSize" } },
  { id: "c64-crush",    name: "C64 压碎",           tags: "量化",          params: { pixelSize: 3, dither: "fs", paletteKey: "c64", glitchSlice: 0, rgbShift: 0, scanlines: 0, quant: 0, noise: 0, bloom: 0, sweep: "dither" } },
  { id: "hard-1bit",    name: "硬 1-Bit",           tags: "抖动 · 黑白",   params: { pixelSize: 2, dither: "bayer2", paletteKey: "bw", glitchSlice: 0, rgbShift: 0, scanlines: 0, quant: 0, noise: 0, bloom: 0, sweep: "pixelSize" } },
  { id: "chromo-burn",  name: "色差灼烧",           tags: "RGB · 故障",    params: { pixelSize: 1, dither: "none", paletteKey: "none", glitchSlice: 8, rgbShift: 22, scanlines: 0, quant: 0, noise: 0, bloom: 40, sweep: "rgbShift" } },
  { id: "lofi-tv",      name: "低保真电视",         tags: "CRT · 扫描",    params: { pixelSize: 4, dither: "bayer4", paletteKey: "pico8", glitchSlice: 4, rgbShift: 3, scanlines: 60, quant: 0, noise: 8, bloom: 10, sweep: "scanlines" } },
  { id: "pico-block",   name: "PICO 方块",          tags: "量化 · 像素",   params: { pixelSize: 8, dither: "fs", paletteKey: "pico8", glitchSlice: 0, rgbShift: 0, scanlines: 0, quant: 0, noise: 0, bloom: 0, sweep: "pixelSize" } },
  { id: "slice-shock",  name: "切片冲击",           tags: "故障",          params: { pixelSize: 1, dither: "none", paletteKey: "none", glitchSlice: 90, rgbShift: 6, scanlines: 0, quant: 0, noise: 4, bloom: 0, sweep: "glitchSlice" } },
  { id: "sepia-dither", name: "棕褐抖动",           tags: "抖动 · 量化",   params: { pixelSize: 3, dither: "fs", paletteKey: "sepia", glitchSlice: 0, rgbShift: 0, scanlines: 20, quant: 0, noise: 0, bloom: 0, sweep: "pixelSize" } },
  { id: "ice-field",    name: "冰原",               tags: "抖动",          params: { pixelSize: 2, dither: "bayer8", paletteKey: "ice", glitchSlice: 0, rgbShift: 0, scanlines: 0, quant: 0, noise: 0, bloom: 0, sweep: "dither" } },
  { id: "hot-glow",     name: "炽热辉光",           tags: "量化 · 辉光",   params: { pixelSize: 3, dither: "fs", paletteKey: "hot", glitchSlice: 0, rgbShift: 4, scanlines: 0, quant: 0, noise: 0, bloom: 50, sweep: "bloom" } },
];
