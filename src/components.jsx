import React, { useState, useEffect, useRef } from "react";
import { PALETTES, PALETTE_LABELS } from "./palettes.js";
import { PRESETS } from "./presets.js";
import { makeSample, SAMPLE_LABELS } from "./samples.js";

function Header({ tab, setTab, onExport, onExportPNG, onPlayPause, playing }) {
  return (
    <header className="hdr">
      <div className="brand">
        <div className="brand-mark" aria-hidden>
          <i className="on"/><i/><i className="on"/>
          <i/><i className="on"/><i/>
          <i className="on"/><i/><i className="on"/>
        </div>
        <div className="brand-name">PIXELART<span className="dot">·</span>STUDIO</div>
      </div>
      <nav>
        {[["effects","效果"],["frames","帧"],["palette","调色板"],["export","导出"]].map(([t,label]) => (
          <button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{label}</button>
        ))}
      </nav>
      <div className="spacer"/>
      <div className="hdr-meta">
        <div className="pulse"/> 实时 · v0.4.1 · 会话 &nbsp; <span style={{color:"var(--ink-2)"}}>0x4A7F</span>
      </div>
      <div className="hdr-btns">
        <button className="btn ghost" onClick={onPlayPause}>
          {playing ? "■ 停止" : "▶ 播放"} <span className="k">空格</span>
        </button>
        <button className="btn primary" onClick={onExport}>导出 GIF <span className="k" style={{color:"rgba(0,0,0,0.6)"}}>E</span></button>
      </div>
    </header>
  );
}

function Section({ title, tag, children }) {
  return (
    <section className="sec">
      <h3>{title}{tag ? <span className="tag">{tag}</span> : null}</h3>
      <div className="body">{children}</div>
    </section>
  );
}

function SampleCell({ kind, active, onClick }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const src = makeSample(kind, 80, 80);
    c.width = 80; c.height = 80;
    c.getContext("2d").drawImage(src, 0, 0);
  }, [kind]);
  return (
    <button className={`sample-cell${active?' active':''}`} onClick={onClick} title={SAMPLE_LABELS[kind]}>
      <canvas ref={ref}/>
    </button>
  );
}

function Viewer({ processedCanvasRef, originalCanvasRef, sourceCanvas, compareMode, compareX, setCompareX, showOriginal, showScan, zoom }) {
  const wrapRef = useRef(null);
  const dragging = useRef(false);

  const onMove = (e) => {
    if (!dragging.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    setCompareX(Math.max(0, Math.min(1, x)));
  };
  useEffect(() => {
    const up = () => dragging.current = false;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", up); };
  }, []);

  const size = Math.min(560, 520) * zoom;

  return (
    <div className="viewer" ref={wrapRef} style={{width: size, height: size}}
         onMouseDown={(e)=>{ if (compareMode==="split") { dragging.current = true; onMove(e); }}}>
      <span className="corner tl"/><span className="corner tr"/><span className="corner bl"/><span className="corner br"/>
      <div className="label green">已处理</div>

      <canvas ref={processedCanvasRef} style={{width:"100%", height:"100%"}}/>

      {compareMode === "split" && (
        <div className="compare-split" style={{position:"absolute", inset:0}}>
          <div className="orig" style={{width: `${compareX*100}%`}}>
            <canvas ref={originalCanvasRef} style={{width: size, height: size}}/>
            <div className="label" style={{color:"var(--ink-2)"}}>原图</div>
          </div>
          <div className="handle" style={{left: `${compareX*100}%`}}/>
        </div>
      )}

      {compareMode === "toggle" && showOriginal && (
        <div style={{position:"absolute", inset: 0}}>
          <canvas ref={originalCanvasRef} style={{width:"100%", height:"100%"}}/>
          <div className="label" style={{color:"var(--ink-2)"}}>原图</div>
        </div>
      )}

      {showScan && <div className="scan-overlay"/>}
    </div>
  );
}

function Slider({ label, value, min, max, step, unit, onChange, disabled }) {
  return (
    <div className="param">
      <div className="label-row">
        <span className="label">{label}</span>
        <span className="value">{typeof value === "number" ? value.toFixed(step < 1 ? 2 : 0) : value}<span className="unit">{unit}</span></span>
      </div>
      <input type="range" className="slider" min={min} max={max} step={step ?? 1} value={value}
             onChange={(e)=>onChange(parseFloat(e.target.value))} disabled={disabled}/>
    </div>
  );
}

function SmallStepper({ label, value, min, max, onChange }) {
  return (
    <div style={{flex: 1}}>
      <div style={{fontFamily:"var(--mono)", fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--ink-3)", marginBottom:4}}>{label}</div>
      <div className="stepper">
        <button onClick={()=>onChange(Math.max(min, value-1))}>−</button>
        <input value={value} onChange={e=>{
          const v = parseInt(e.target.value)||0;
          onChange(Math.max(min, Math.min(max, v)));
        }}/>
        <button onClick={()=>onChange(Math.min(max, value+1))}>+</button>
      </div>
    </div>
  );
}

function Knob({ label, value, min, max, onChange }) {
  const wrapRef = useRef(null);
  const startY = useRef(0);
  const startVal = useRef(0);
  const dragging = useRef(false);

  const pct = (value - min) / (max - min);
  const angle = -135 + pct * 270;

  const onDown = (e) => {
    dragging.current = true;
    startY.current = e.clientY;
    startVal.current = value;
  };
  useEffect(() => {
    const move = (e) => {
      if (!dragging.current) return;
      const dy = startY.current - e.clientY;
      const nv = startVal.current + (dy / 100) * (max - min);
      onChange(Math.max(min, Math.min(max, nv)));
    };
    const up = () => dragging.current = false;
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [min, max, onChange]);

  return (
    <div className="knob-wrap">
      <div className="knob" onMouseDown={onDown} ref={wrapRef}>
        <svg className="knob-tick" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="32" stroke="var(--line-2)" strokeWidth="1" fill="none" strokeDasharray="1 3"/>
        </svg>
        <div className="knob-ind" style={{transform: `translateX(-50%) rotate(${angle}deg)`}}/>
      </div>
      <div className="knob-label">{label}</div>
      <div className="knob-val">{Math.round(value)}</div>
    </div>
  );
}

function ParamsPanel({ params, updateParam, sweepParam, setSweepParam, sweepStart, setSweepStart, sweepEnd, setSweepEnd, tab }) {
  const ditherOptions = [
    { v: "none", l: "无" },
    { v: "bayer2", l: "Bayer 2" },
    { v: "bayer4", l: "Bayer 4" },
    { v: "bayer8", l: "Bayer 8" },
    { v: "fs", l: "Floyd–S." },
  ];
  const paletteKeys = Object.keys(PALETTES);

  return (
    <>
      <Section title={tab==="palette" ? "调色板" : "效果"} tag="实时">
        {tab === "palette" ? (
          <div style={{display:"grid", gap:6}}>
            {paletteKeys.map(k => {
              const pal = PALETTES[k];
              return (
                <button key={k} className={`preset${params.paletteKey===k?' active':''}`} onClick={()=>updateParam("paletteKey", k)}>
                  <span className="num" style={{minWidth:40, display:"flex", gap:2}}>
                    {pal
                      ? pal.slice(0,5).map((c,i)=>(<span key={i} style={{background:c, width:8, height:12, display:"inline-block"}}/>))
                      : <span style={{fontSize:9, color:"var(--ink-4)"}}>—</span>
                    }
                  </span>
                  <span>{PALETTE_LABELS[k]}</span>
                  <span className="tags">{pal ? pal.length : 0}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {tab !== "palette" && (
          <>
            <Slider label="像素尺寸" value={params.pixelSize} min={1} max={50} step={1} unit="px" onChange={v=>updateParam("pixelSize",v)}/>
            <div className="param">
              <div className="label-row"><span className="label">抖动算法</span></div>
              <div className="chipline">
                {ditherOptions.map(o => (
                  <button key={o.v} className={`chip${params.dither===o.v?' on':''}`} onClick={()=>updateParam("dither", o.v)}>{o.l}</button>
                ))}
              </div>
            </div>
            <div className="param">
              <div className="label-row"><span className="label">调色板</span><span className="value">{PALETTE_LABELS[params.paletteKey]}</span></div>
              <select value={params.paletteKey} onChange={(e)=>updateParam("paletteKey", e.target.value)}>
                {paletteKeys.map(k => <option key={k} value={k}>{PALETTE_LABELS[k]}</option>)}
              </select>
            </div>
            <Slider label="量化级数" value={params.quant} min={0} max={64} step={1} onChange={v=>updateParam("quant",v)}/>
          </>
        )}
      </Section>

      {tab !== "palette" && (
        <>
          <Section title="故障" tag="">
            <Slider label="RGB 偏移" value={params.rgbShift} min={0} max={30} step={1} unit="px" onChange={v=>updateParam("rgbShift",v)}/>
            <Slider label="切片" value={params.glitchSlice} min={0} max={100} step={1} unit="%" onChange={v=>updateParam("glitchSlice",v)}/>
            <Slider label="噪点" value={params.noise} min={0} max={40} step={1} onChange={v=>updateParam("noise",v)}/>
          </Section>

          <Section title="CRT / 润色" tag="">
            <div className="knobs">
              <Knob label="扫描" value={params.scanlines} min={0} max={100} onChange={v=>updateParam("scanlines", v)}/>
              <Knob label="辉光" value={params.bloom} min={0} max={100} onChange={v=>updateParam("bloom", v)}/>
              <Knob label="噪点" value={params.noise} min={0} max={40} onChange={v=>updateParam("noise", v)}/>
            </div>
          </Section>

          <Section title="帧扫推" tag="动画">
            <div className="param">
              <div className="label-row"><span className="label">参数</span></div>
              <select value={sweepParam} onChange={e=>setSweepParam(e.target.value)}>
                <option value="rgbShift">RGB 偏移</option>
                <option value="glitchSlice">切片</option>
                <option value="pixelSize">像素尺寸 ×10</option>
                <option value="scanlines">扫描线</option>
                <option value="noise">噪点</option>
                <option value="bloom">辉光</option>
                <option value="quant">量化</option>
                <option value="dither">抖动模式</option>
              </select>
            </div>
            <Slider label="起值" value={sweepStart} min={0} max={100} step={1} onChange={setSweepStart}/>
            <Slider label="终值" value={sweepEnd} min={0} max={100} step={1} onChange={setSweepEnd}/>
          </Section>
        </>
      )}
    </>
  );
}

function Frames({ thumbs, activeIdx, setIdx }) {
  return (
    <div className="frames">
      {thumbs.map((t, i) => (
        <div key={i} className={`frame${activeIdx===i?' active':''}`} onClick={()=>setIdx(i)}>
          <canvas ref={el => {
            if (!el || !t.thumb) return;
            el.width = 72; el.height = 72;
            el.getContext("2d").drawImage(t.thumb, 0, 0);
          }}/>
          <div className="fnum">{String(i+1).padStart(2,'0')}</div>
        </div>
      ))}
    </div>
  );
}

function NodeGraph({ params }) {
  const steps = [
    { id:"src", label:"源", on: true, x: 6 },
    { id:"px", label:`像素 ${params.pixelSize}×`, on: params.pixelSize>1, x: 14 },
    { id:"qz", label:`量化 ${params.quant||"—"}`, on: params.quant>0, x: 24 },
    { id:"dt", label:`抖动 ${params.dither}`, on: params.dither!=="none", x: 35 },
    { id:"pl", label:`调色 ${PALETTE_LABELS[params.paletteKey]}`, on: params.paletteKey!=="none", x: 46 },
    { id:"rg", label:`RGB ${params.rgbShift}`, on: params.rgbShift>0, x: 62 },
    { id:"sl", label:`切片 ${params.glitchSlice}`, on: params.glitchSlice>0, x: 72 },
    { id:"sc", label:`扫描 ${params.scanlines}`, on: params.scanlines>0, x: 82 },
    { id:"bl", label:`辉光 ${params.bloom}`, on: params.bloom>0, x: 92 },
  ];
  return (
    <div className="node-graph">
      {steps.map((s,i) => (
        <React.Fragment key={s.id}>
          <div className={`node${s.on?' on':''}`} style={{left:`${s.x}%`, top: i%2===0 ? 14 : 44}}>
            {s.label}
          </div>
          {i < steps.length-1 && (
            <div className={`node-conn${(s.on && steps[i+1].on)?' on':''}`}
                 style={{ left:`${s.x+7}%`, right:`${100 - steps[i+1].x}%`, top: i%2===0 ? 24 : 54}}/>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function ExportModal({ onClose, onExport, progress, stage, blobURL, fps, frames, size, setSize, quality, setQuality }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <h2>导出动画 GIF</h2>
        <div className="mbody">
          <div className="mrow">
            <label>尺寸</label>
            <select value={size} onChange={e=>setSize(parseInt(e.target.value))}>
              <option value="160">160 × 160</option>
              <option value="240">240 × 240</option>
              <option value="320">320 × 320</option>
              <option value="480">480 × 480</option>
              <option value="640">640 × 640</option>
            </select>
          </div>
          <div className="mrow">
            <label>质量</label>
            <select value={quality} onChange={e=>setQuality(parseInt(e.target.value))}>
              <option value="20">快速 (20)</option>
              <option value="10">平衡 (10)</option>
              <option value="5">高 (5)</option>
              <option value="1">极致 (1)</option>
            </select>
          </div>
          <div className="mrow">
            <label>帧</label>
            <div style={{fontFamily:"var(--mono)", fontSize:11, color:"var(--ink-2)"}}>{frames} 帧 @ {fps} fps · {(frames/fps).toFixed(2)}s 循环</div>
          </div>
          {stage === "rendering" && (
            <div style={{marginTop: 14}}>
              <div style={{fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--accent)", marginBottom:6}}>
                编码中… {Math.round(progress*100)}%
              </div>
              <div className="progress-bar"><div style={{width:`${progress*100}%`}}/></div>
            </div>
          )}
          {stage === "done" && blobURL && (
            <div style={{marginTop:14, display:"flex", alignItems:"center", gap: 12}}>
              <img src={blobURL} style={{width: 120, height: 120, imageRendering:"pixelated", border:"1px solid var(--line-2)"}}/>
              <div style={{flex:1}}>
                <div style={{fontFamily:"var(--mono)", fontSize:10, color:"var(--accent)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:6}}>✓ 渲染完成</div>
                <a className="btn primary" href={blobURL} download="pixelart.gif" style={{textDecoration:"none"}}>下载 .gif</a>
              </div>
            </div>
          )}
        </div>
        <div className="mfoot">
          <button className="btn ghost" onClick={onClose}>关闭</button>
          <button className="btn primary" onClick={onExport} disabled={stage==="rendering"}>
            {stage === "rendering" ? "编码中…" : stage === "done" ? "重新编码" : "渲染"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TweaksPanel({ tweaks, save, onClose }) {
  return (
    <div className="tweaks-panel">
      <header>
        <span>微调</span>
        <button onClick={onClose}>×</button>
      </header>
      <div className="tbody">
        <div>
          <label>主题</label>
          <div className="chipline">
            {[["dark","暗色"],["y2k","Y2K"],["mono","浅色"]].map(([t,label]) => (
              <button key={t} className={`chip${tweaks.theme===t?' on':''}`} onClick={()=>save({...tweaks, theme:t})}>{label}</button>
            ))}
          </div>
        </div>
        <div>
          <label>着色（仅暗色主题）</label>
          <div className="chipline">
            {["#b7ff3d","#ff5ad9","#5ad9ff","#ffb84d","#ff5a5a"].map(c => (
              <button key={c} onClick={()=>save({...tweaks, accent:c})}
                style={{width:28, height:22, border:`1px solid ${tweaks.accent===c?'#fff':'var(--line-2)'}`, background:c, cursor:"pointer"}}/>
            ))}
          </div>
        </div>
        <div>
          <label>密度</label>
          <div className="chipline">
            {[["compact","紧凑"],["comfortable","舒适"]].map(([d,label]) => (
              <button key={d} className={`chip${tweaks.density===d?' on':''}`} onClick={()=>save({...tweaks, density:d})}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


export {
  Header, Section, SampleCell, Viewer,
  Slider, SmallStepper, Knob,
  ParamsPanel, Frames, NodeGraph,
  ExportModal, TweaksPanel,
};
