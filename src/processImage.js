// Image processing algorithms
import { BAYER2, BAYER4, BAYER8 } from "./bayer.js";
import { PALETTES } from "./palettes.js";

/* ========== IMAGE PROCESSING ========== */
export function hexToRgb(hex) {
  const s = hex.replace("#","");
  return [parseInt(s.slice(0,2),16), parseInt(s.slice(2,4),16), parseInt(s.slice(4,6),16)];
}
export function nearestPaletteColor(r,g,b, palette) {
  let best = 0, bd = Infinity;
  for (let i=0; i<palette.length; i++) {
    const [pr,pg,pb] = palette[i];
    const d = (pr-r)*(pr-r) + (pg-g)*(pg-g) + (pb-b)*(pb-b);
    if (d < bd) { bd = d; best = i; }
  }
  return palette[best];
}

export function processImage(srcCanvas, params, cb) {
  const w = srcCanvas.width, h = srcCanvas.height;
  const out = document.createElement("canvas");
  out.width = w; out.height = h;
  const octx = out.getContext("2d");
  octx.imageSmoothingEnabled = false;

  // 1) pixelation: draw to small then scale up
  const ps = Math.max(1, Math.floor(params.pixelSize || 1));
  const sw = Math.max(1, Math.floor(w / ps));
  const sh = Math.max(1, Math.floor(h / ps));
  const tiny = document.createElement("canvas");
  tiny.width = sw; tiny.height = sh;
  const tctx = tiny.getContext("2d");
  tctx.imageSmoothingEnabled = false;
  tctx.drawImage(srcCanvas, 0, 0, sw, sh);

  const imgd = tctx.getImageData(0,0,sw,sh);
  const data = imgd.data;

  // Noise
  const noiseAmt = params.noise || 0;
  if (noiseAmt > 0) {
    for (let i=0;i<data.length;i+=4) {
      const n = (Math.random() - 0.5) * noiseAmt * 4;
      data[i]   = Math.max(0, Math.min(255, data[i]   + n));
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + n));
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + n));
    }
  }

  // Quantization (bits per channel, 0=off)
  if (params.quant > 0) {
    const levels = Math.max(2, Math.round(params.quant));
    const step = 255 / (levels - 1);
    for (let i=0;i<data.length;i+=4) {
      data[i]   = Math.round(Math.round(data[i]   / step) * step);
      data[i+1] = Math.round(Math.round(data[i+1] / step) * step);
      data[i+2] = Math.round(Math.round(data[i+2] / step) * step);
    }
  }

  // Palette + dithering
  const paletteKey = params.paletteKey || "none";
  const pal = PALETTES[paletteKey];
  const palRGB = pal ? pal.map(hexToRgb) : null;
  const dither = params.dither || "none";

  if (palRGB) {
    if (dither === "fs") {
      // Floyd-Steinberg
      for (let y=0; y<sh; y++) {
        for (let x=0; x<sw; x++) {
          const i = (y*sw + x)*4;
          const oldR = data[i], oldG = data[i+1], oldB = data[i+2];
          const [nr,ng,nb] = nearestPaletteColor(oldR, oldG, oldB, palRGB);
          data[i] = nr; data[i+1] = ng; data[i+2] = nb;
          const er = oldR - nr, eg = oldG - ng, eb = oldB - nb;
          const push = (xx,yy,f) => {
            if (xx<0||xx>=sw||yy<0||yy>=sh) return;
            const j = (yy*sw + xx)*4;
            data[j]   = Math.max(0, Math.min(255, data[j]   + er*f));
            data[j+1] = Math.max(0, Math.min(255, data[j+1] + eg*f));
            data[j+2] = Math.max(0, Math.min(255, data[j+2] + eb*f));
          };
          push(x+1, y,   7/16);
          push(x-1, y+1, 3/16);
          push(x,   y+1, 5/16);
          push(x+1, y+1, 1/16);
        }
      }
    } else if (dither.startsWith("bayer")) {
      const M = dither === "bayer2" ? BAYER2 : dither === "bayer4" ? BAYER4 : BAYER8;
      const Ms = M.length;
      const max = Ms*Ms;
      for (let y=0;y<sh;y++) {
        for (let x=0;x<sw;x++) {
          const i = (y*sw+x)*4;
          const t = (M[y%Ms][x%Ms] / max - 0.5) * 80;
          const r = Math.max(0, Math.min(255, data[i]   + t));
          const g = Math.max(0, Math.min(255, data[i+1] + t));
          const b = Math.max(0, Math.min(255, data[i+2] + t));
          const [nr,ng,nb] = nearestPaletteColor(r,g,b, palRGB);
          data[i]=nr; data[i+1]=ng; data[i+2]=nb;
        }
      }
    } else {
      for (let i=0;i<data.length;i+=4) {
        const [nr,ng,nb] = nearestPaletteColor(data[i], data[i+1], data[i+2], palRGB);
        data[i]=nr; data[i+1]=ng; data[i+2]=nb;
      }
    }
  } else if (dither.startsWith("bayer")) {
    // threshold dither without palette -> B/W classic
    const M = dither === "bayer2" ? BAYER2 : dither === "bayer4" ? BAYER4 : BAYER8;
    const Ms = M.length;
    for (let y=0;y<sh;y++) {
      for (let x=0;x<sw;x++) {
        const i = (y*sw+x)*4;
        const lum = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
        const thr = (M[y%Ms][x%Ms] + 0.5) * (255/(Ms*Ms));
        const v = lum > thr ? 255 : 0;
        data[i]=data[i+1]=data[i+2]=v;
      }
    }
  }

  tctx.putImageData(imgd, 0, 0);

  // 2) Scale back up nearest-neighbor
  octx.drawImage(tiny, 0, 0, w, h);

  // 3) RGB shift (horizontal channel split)
  if (params.rgbShift > 0) {
    const shift = Math.round(params.rgbShift);
    const base = octx.getImageData(0,0,w,h);
    const out2 = octx.createImageData(w,h);
    const d1 = base.data, d2 = out2.data;
    for (let y=0;y<h;y++) {
      for (let x=0;x<w;x++) {
        const i = (y*w + x)*4;
        const rx = Math.max(0, Math.min(w-1, x - shift));
        const bx = Math.max(0, Math.min(w-1, x + shift));
        d2[i]   = d1[(y*w + rx)*4];
        d2[i+1] = d1[i+1];
        d2[i+2] = d1[(y*w + bx)*4 + 2];
        d2[i+3] = 255;
      }
    }
    octx.putImageData(out2, 0, 0);
  }

  // 4) Slice glitch — 水平行撕裂 + 垂直彩色条纹 + 彩色雪花点
  if (params.glitchSlice > 0) {
    const amount = params.glitchSlice / 100;

    // 4a) 水平行撕裂（短行位移，数量多、幅度各异）
    const slices = Math.floor(6 + amount * 40);
    for (let s=0; s<slices; s++) {
      const sy = Math.floor(Math.random() * h);
      const shh = 1 + Math.floor(Math.random() * Math.max(2, h * amount * 0.15));
      const shift = (Math.random() - 0.5) * w * amount * 0.8;
      const strip = octx.getImageData(0, sy, w, Math.min(shh, h - sy));
      octx.putImageData(strip, shift, sy);
    }

    // 4b) 垂直彩色条纹（宽窄不一、颜色不一的竖向色柱）
    const bars = Math.floor(3 + amount * 18);
    const barColors = [
      [0, 220, 160],   // 青绿
      [255, 80, 220],  // 洋红
      [90, 220, 255],  // 青蓝
      [180, 255, 40],  // 黄绿
      [80, 40, 255],   // 深紫蓝
      [255, 180, 80],  // 橙黄
      [255, 255, 255], // 白
      [20, 20, 20],    // 深黑
    ];
    for (let b=0; b<bars; b++) {
      const bx = Math.floor(Math.random() * w);
      // 宽度从 1px 到 ~8% 画面宽
      const bw = 1 + Math.floor(Math.pow(Math.random(), 2.2) * w * 0.08);
      const col = barColors[Math.floor(Math.random() * barColors.length)];
      const alpha = 0.35 + Math.random() * 0.55;
      // 部分条纹：复制一列像素并垂直拉伸（形成同色竖条）
      if (Math.random() < 0.45) {
        const src = octx.getImageData(bx, 0, 1, h);
        // 横向拉伸到 bw 像素
        const tmp = document.createElement("canvas");
        tmp.width = 1; tmp.height = h;
        tmp.getContext("2d").putImageData(src, 0, 0);
        octx.drawImage(tmp, bx, 0, bw, h);
      } else {
        octx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`;
        octx.fillRect(bx, 0, bw, h);
      }
    }

    // 4c) 水平细扫描线（1px 横贯的深色/彩色线）
    const lineCount = Math.floor(2 + amount * 14);
    for (let l=0; l<lineCount; l++) {
      const ly = Math.floor(Math.random() * h);
      const dark = Math.random() < 0.7;
      octx.fillStyle = dark
        ? `rgba(20,20,30,${0.4 + Math.random()*0.4})`
        : `rgba(255,255,255,${0.3 + Math.random()*0.3})`;
      octx.fillRect(0, ly, w, 1);
    }

    // 4d) 彩色雪花噪点（高饱和单像素，分布均匀）
    const noiseImg = octx.getImageData(0,0,w,h);
    const nd = noiseImg.data;
    const snowDensity = amount * 0.015; // 最高约 1.5% 像素
    const snowPalette = [
      [255, 60, 180], [120, 0, 200], [30, 20, 160],
      [255, 255, 255], [220, 40, 60], [60, 200, 255],
      [180, 255, 0], [255, 200, 0],
    ];
    const total = w * h;
    const snowCount = Math.floor(total * snowDensity);
    for (let n=0; n<snowCount; n++) {
      const px = Math.floor(Math.random() * total);
      const idx = px * 4;
      const c = snowPalette[Math.floor(Math.random() * snowPalette.length)];
      nd[idx]   = c[0];
      nd[idx+1] = c[1];
      nd[idx+2] = c[2];
    }
    octx.putImageData(noiseImg, 0, 0);
  }

  // 5) Scanlines
  if (params.scanlines > 0) {
    const a = (params.scanlines / 100) * 0.55;
    octx.fillStyle = `rgba(0,0,0,${a})`;
    for (let y=0; y<h; y+=2) octx.fillRect(0, y, w, 1);
  }

  // 6) Bloom (simple)
  if (params.bloom > 0) {
    octx.globalCompositeOperation = "lighter";
    octx.globalAlpha = params.bloom / 200;
    octx.filter = "blur(4px)";
    octx.drawImage(out, 0, 0);
    octx.filter = "none";
    octx.globalAlpha = 1;
    octx.globalCompositeOperation = "source-over";
  }

  if (cb) cb(out);
  return out;
}
