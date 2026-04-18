// Sample images
/* ========== SAMPLE IMAGES (procedurally drawn) ========== */
export function makeSample(kind, w=320, h=320) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  if (kind === "portrait") {
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0, "#3a1f6b"); g.addColorStop(1, "#0b0920");
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    // face
    const cx = w*0.5, cy = h*0.46;
    const face = ctx.createRadialGradient(cx-20, cy-30, 10, cx, cy, 120);
    face.addColorStop(0, "#ffd2a8"); face.addColorStop(1, "#8a4a2a");
    ctx.fillStyle = face;
    ctx.beginPath(); ctx.ellipse(cx, cy, 82, 104, 0, 0, Math.PI*2); ctx.fill();
    // hair
    ctx.fillStyle = "#1a0b24";
    ctx.beginPath(); ctx.ellipse(cx, cy-70, 96, 60, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx-96, cy-70, 28, 90);
    ctx.fillRect(cx+68, cy-70, 28, 90);
    // eyes
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(cx-42, cy-14, 16, 6);
    ctx.fillRect(cx+26, cy-14, 16, 6);
    // mouth
    ctx.fillStyle = "#6b1f2a";
    ctx.fillRect(cx-18, cy+44, 36, 6);
    // highlight
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath(); ctx.ellipse(cx-36, cy-26, 12, 18, 0.6, 0, Math.PI*2); ctx.fill();
  } else if (kind === "landscape") {
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0, "#ffb148"); g.addColorStop(0.4, "#ff6a3d"); g.addColorStop(0.7, "#6b1f6a"); g.addColorStop(1, "#0e0828");
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    // sun
    ctx.fillStyle = "#ffe38a";
    ctx.beginPath(); ctx.arc(w*0.68, h*0.44, 40, 0, Math.PI*2); ctx.fill();
    // mountains
    ctx.fillStyle = "#1a0e2a";
    ctx.beginPath();
    ctx.moveTo(0, h*0.7);
    ctx.lineTo(w*0.2, h*0.5);
    ctx.lineTo(w*0.35, h*0.66);
    ctx.lineTo(w*0.55, h*0.42);
    ctx.lineTo(w*0.75, h*0.62);
    ctx.lineTo(w, h*0.5);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    // foreground
    ctx.fillStyle = "#04020a"; ctx.fillRect(0, h*0.82, w, h*0.18);
    // reflection streak
    ctx.fillStyle = "rgba(255, 200, 120, 0.15)"; ctx.fillRect(w*0.6, h*0.82, 14, h*0.18);
  } else if (kind === "still") {
    ctx.fillStyle = "#14110c"; ctx.fillRect(0,0,w,h);
    // table
    ctx.fillStyle = "#3a2918"; ctx.fillRect(0, h*0.7, w, h*0.3);
    // vase
    const vg = ctx.createLinearGradient(w*0.4,0,w*0.6,0);
    vg.addColorStop(0,"#6b3a2a"); vg.addColorStop(1,"#c77a5a");
    ctx.fillStyle = vg;
    ctx.beginPath();
    ctx.moveTo(w*0.42, h*0.7);
    ctx.quadraticCurveTo(w*0.3, h*0.5, w*0.44, h*0.35);
    ctx.quadraticCurveTo(w*0.5, h*0.3, w*0.56, h*0.35);
    ctx.quadraticCurveTo(w*0.7, h*0.5, w*0.58, h*0.7);
    ctx.closePath(); ctx.fill();
    // flowers
    ["#ff4d6d","#f7b538","#d0f4de","#ff8ac6"].forEach((c,i)=>{
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(w*0.35 + i*30, h*0.28 - (i%2)*20, 16, 0, Math.PI*2); ctx.fill();
    });
    ctx.strokeStyle = "#2d4a1e"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(w*0.5, h*0.36); ctx.lineTo(w*0.5, h*0.15); ctx.stroke();
  } else if (kind === "cat") {
    ctx.fillStyle = "#1a1220"; ctx.fillRect(0,0,w,h);
    // body
    ctx.fillStyle = "#f6a623";
    ctx.beginPath(); ctx.ellipse(w/2, h*0.65, 100, 80, 0, 0, Math.PI*2); ctx.fill();
    // head
    ctx.beginPath(); ctx.ellipse(w/2, h*0.38, 68, 60, 0, 0, Math.PI*2); ctx.fill();
    // ears
    ctx.beginPath(); ctx.moveTo(w/2-54, h*0.2); ctx.lineTo(w/2-30, h*0.06); ctx.lineTo(w/2-12, h*0.22); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w/2+54, h*0.2); ctx.lineTo(w/2+30, h*0.06); ctx.lineTo(w/2+12, h*0.22); ctx.closePath(); ctx.fill();
    // eyes
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath(); ctx.ellipse(w/2-22, h*0.38, 6, 10, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w/2+22, h*0.38, 6, 10, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#ffd400";
    ctx.beginPath(); ctx.ellipse(w/2-22, h*0.36, 3, 4, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w/2+22, h*0.36, 3, 4, 0, 0, Math.PI*2); ctx.fill();
    // nose
    ctx.fillStyle = "#ff7088";
    ctx.beginPath(); ctx.moveTo(w/2-6, h*0.44); ctx.lineTo(w/2+6, h*0.44); ctx.lineTo(w/2, h*0.48); ctx.closePath(); ctx.fill();
    // stripes
    ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 3;
    for (let i=0;i<4;i++) { ctx.beginPath(); ctx.moveTo(w/2-80+i*40, h*0.6); ctx.lineTo(w/2-60+i*40, h*0.72); ctx.stroke(); }
  } else if (kind === "geo") {
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, "#0c132a"); g.addColorStop(1, "#14235f");
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = "#ff3366"; ctx.beginPath(); ctx.arc(w*0.35, h*0.4, 60, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#33ccff"; ctx.fillRect(w*0.5, h*0.3, 120, 120);
    ctx.fillStyle = "#f9d71c";
    ctx.beginPath(); ctx.moveTo(w*0.2, h*0.8); ctx.lineTo(w*0.4, h*0.55); ctx.lineTo(w*0.6, h*0.8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
    for (let i=0;i<10;i++) { ctx.strokeRect(10+i*10, h-10-i*12, 10, 10); }
  } else if (kind === "city") {
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0, "#ff7eb6"); g.addColorStop(0.5, "#8b4fa4"); g.addColorStop(1, "#071026");
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = "#ffe066";
    ctx.beginPath(); ctx.arc(w*0.5, h*0.5, 50, 0, Math.PI*2); ctx.fill();
    // skyline
    ctx.fillStyle = "#0a0818";
    const bs = [[20,90],[70,140],[130,100],[180,170],[230,120],[280,160]];
    bs.forEach(([x,hh]) => ctx.fillRect(x, h - hh, 40, hh));
    // windows
    ctx.fillStyle = "#ffe066";
    bs.forEach(([x,hh]) => {
      for (let y=h-hh+10; y<h-10; y+=15) for (let xx=x+4; xx<x+36; xx+=8) {
        if (Math.random()<0.6) ctx.fillRect(xx,y,4,6);
      }
    });
  }
  return c;
}

export const SAMPLE_KINDS = ["portrait","landscape","still","cat","geo","city"];
export const SAMPLE_LABELS = {
  portrait: "人像", landscape: "日落", still: "静物",
  cat: "猫咪", geo: "几何", city: "天际线"
};
