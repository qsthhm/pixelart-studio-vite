import React, { useState, useEffect, useRef, useMemo } from "react";
import GIF from "gif.js";
import gifWorker from "gif.js/dist/gif.worker.js?url";

import { PALETTES, PALETTE_LABELS } from "./palettes.js";
import { PRESETS } from "./presets.js";
import { processImage } from "./processImage.js";
import { makeSample, SAMPLE_KINDS, SAMPLE_LABELS } from "./samples.js";
import { TWEAK_DEFAULTS } from "./tweakDefaults.js";
import {
  Header, Section, SampleCell, Viewer,
  Slider, SmallStepper, Knob,
  ParamsPanel, Frames, NodeGraph,
  ExportModal, TweaksPanel, CropModal,
} from "./components.jsx";

function App() {
  const [tweaks, setTweaks] = useState(() => {
    try {
      const saved = localStorage.getItem("pixelart-studio:tweaks");
      if (saved) return { ...TWEAK_DEFAULTS, ...JSON.parse(saved) };
    } catch (e) {}
    return TWEAK_DEFAULTS;
  });
  const [editMode, setEditMode] = useState(false);
  const [sourceCanvas, setSourceCanvas] = useState(null);
  const [sourceLabel, setSourceLabel] = useState(null);
  const [activeSample, setActiveSample] = useState("portrait");
  const [activePreset, setActivePreset] = useState("fs-gb");
  const [params, setParams] = useState(PRESETS[0].params);
  const [showSplit, setShowSplit] = useState(true);
  const [compareX, setCompareX] = useState(0.5);
  const [showScan, setShowScan] = useState(true);
  const [zoom, setZoom] = useState(1);

  const [frameCount, setFrameCount] = useState(12);
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(10);
  const [frameThumbs, setFrameThumbs] = useState([]);
  const [sweepParam, setSweepParam] = useState(PRESETS[0].params.sweep);
  const [sweepStart, setSweepStart] = useState(0);
  const [sweepEnd, setSweepEnd] = useState(100);

  const [showExport, setShowExport] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportBlobURL, setExportBlobURL] = useState(null);
  const [exportStage, setExportStage] = useState("idle");
  const [exportSize, setExportSize] = useState(320);
  const [exportQuality, setExportQuality] = useState(10);

  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("effects");
  const [showTweaks, setShowTweaks] = useState(false);
  const [showNodeGraph, setShowNodeGraph] = useState(false);

  // Crop modal state
  const [cropImage, setCropImage] = useState(null); // HTMLImageElement waiting to be cropped
  const [showCrop, setShowCrop] = useState(false);

  // User uploaded thumbnail (data URL for display in sample grid)
  const [userThumb, setUserThumb] = useState(null);
  // Persist user's uploaded canvas so it can be re-selected after switching to a sample
  const [userSourceCanvas, setUserSourceCanvas] = useState(null);

  const viewerRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const playRAF = useRef(null);
  const playStart = useRef(null);

  const MAX_DIM = 512;

  /* --- Tweak mode sync --- */
  useEffect(() => {
    const onMsg = (e) => {
      const m = e.data;
      if (!m || typeof m !== "object") return;
      if (m.type === "__activate_edit_mode") setEditMode(true);
      else if (m.type === "__deactivate_edit_mode") setEditMode(false);
    };
    window.addEventListener("message", onMsg);
    try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch (e) {}
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    if (editMode) setShowTweaks(true);
  }, [editMode]);

  const saveTweak = (next) => {
    setTweaks(next);
    try { localStorage.setItem("pixelart-studio:tweaks", JSON.stringify(next)); } catch (e) {}
    try { window.parent.postMessage({ type: "__edit_mode_set_keys", edits: next }, "*"); } catch (e) {}
  };

  /* --- Apply theme on root --- */
  useEffect(() => {
    const root = document.body;
    root.dataset.theme = tweaks.theme === "y2k" ? "y2k" : tweaks.theme === "mono" ? "mono" : "";
    if (tweaks.accent && tweaks.theme === "dark") {
      document.documentElement.style.setProperty("--accent", tweaks.accent);
    } else {
      document.documentElement.style.removeProperty("--accent");
    }
  }, [tweaks]);

  /* --- Sample init --- */
  useEffect(() => {
    if (!activeSample) return;
    const c = makeSample(activeSample, 320, 320);
    setSourceCanvas(c);
    setSourceLabel(SAMPLE_LABELS[activeSample]);
  }, [activeSample]);

  /* --- Re-process on change --- */
  const processedRef = useRef(null);
  useEffect(() => {
    if (!sourceCanvas) return;
    const out = processImage(sourceCanvas, params);
    processedRef.current = out;
    drawViewer(out);
  }, [sourceCanvas, params]);

  const drawViewer = (canvas) => {
    if (!processedCanvasRef.current || !canvas) return;
    const target = processedCanvasRef.current;
    target.width = canvas.width; target.height = canvas.height;
    target.getContext("2d").drawImage(canvas, 0, 0);
    if (originalCanvasRef.current && sourceCanvas) {
      originalCanvasRef.current.width = sourceCanvas.width;
      originalCanvasRef.current.height = sourceCanvas.height;
      originalCanvasRef.current.getContext("2d").drawImage(sourceCanvas, 0, 0);
    }
  };

  /* --- Preset apply --- */
  const applyPreset = (p) => {
    setActivePreset(p.id);
    setParams(p.params);
    setSweepParam(p.params.sweep || "rgbShift");
    toastIt(`预设：${p.name}`);
  };

  /* --- Frames generation --- */
  useEffect(() => {
    if (!sourceCanvas) return;
    generateFrames();
  }, [sourceCanvas, params, frameCount, sweepParam, sweepStart, sweepEnd]);

  const buildFrameParams = (i) => {
    const t = frameCount <= 1 ? 0 : (i / (frameCount - 1));
    const sweep = { ...params };
    if (sweepParam === "dither") {
      const modes = ["none","bayer2","bayer4","bayer8","fs"];
      sweep.dither = modes[Math.min(modes.length - 1, Math.floor(t * modes.length))];
    } else if (sweepParam === "pixelSize") {
      sweep.pixelSize = Math.max(1, Math.round(sweepStart/10 + (sweepEnd/10 - sweepStart/10) * t));
    } else {
      sweep[sweepParam] = sweepStart + (sweepEnd - sweepStart) * t;
    }
    return sweep;
  };

  const generateFrames = () => {
    if (!sourceCanvas) return;
    if (generateFrames._cancel) generateFrames._cancel();
    let cancelled = false;
    generateFrames._cancel = () => { cancelled = true; };

    const thumbs = [];
    let i = 0;
    const step = () => {
      if (cancelled) return;
      if (i >= frameCount) {
        setFrameThumbs(thumbs);
        return;
      }
      const fp = buildFrameParams(i);
      const c = processImage(sourceCanvas, fp);
      const t = document.createElement("canvas");
      t.width = 60; t.height = 60;
      const tc = t.getContext("2d");
      tc.imageSmoothingEnabled = false;
      tc.drawImage(c, 0, 0, 60, 60);
      thumbs.push({ canvas: c, thumb: t });
      i++;
      setTimeout(step, 0);
    };
    step();
  };

  /* --- Play timeline --- */
  useEffect(() => {
    if (!playing || !frameThumbs.length) {
      cancelAnimationFrame(playRAF.current);
      return;
    }
    let last = performance.now();
    const step = () => {
      const now = performance.now();
      if (now - last >= 1000 / fps) {
        last = now;
        setFrameIdx((idx) => (idx + 1) % frameCount);
      }
      playRAF.current = requestAnimationFrame(step);
    };
    playRAF.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(playRAF.current);
  }, [playing, fps, frameThumbs, frameCount]);

  useEffect(() => {
    if (!frameThumbs[frameIdx]) return;
    drawViewer(frameThumbs[frameIdx].canvas);
  }, [frameIdx, frameThumbs]);

  /* --- File handling --- */
  const applyImageAsSource = (img, cropRect) => {
    // cropRect: { x, y, w, h } in original image coordinates
    const sx = cropRect ? cropRect.x : 0;
    const sy = cropRect ? cropRect.y : 0;
    const sw = cropRect ? cropRect.w : img.width;
    const sh = cropRect ? cropRect.h : img.height;

    const scale = Math.min(1, MAX_DIM / Math.max(sw, sh));
    const cw = Math.max(1, Math.round(sw * scale));
    const ch = Math.max(1, Math.round(sh * scale));
    const c = document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    c.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);

    setSourceCanvas(c);
    setSourceLabel("用户图片");
    setActiveSample(null);
    setUserSourceCanvas(c);

    // Generate thumbnail for sample grid
    const thumbC = document.createElement("canvas");
    thumbC.width = 80; thumbC.height = 80;
    const tctx = thumbC.getContext("2d");
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(c, 0, 0, 80, 80);
    setUserThumb(thumbC.toDataURL());

    toastIt("图片已载入");
  };

  const loadImage = (src) => {
    const img = new Image();
    img.onload = () => {
      const shortSide = Math.min(img.width, img.height);
      if (shortSide < 100) {
        // Small image: skip crop, use directly
        applyImageAsSource(img, null);
      } else {
        // Show crop modal
        setCropImage(img);
        setShowCrop(true);
      }
    };
    img.onerror = () => toastIt("图片载入失败");
    img.src = src;
  };

  const onCropConfirm = (cropRect) => {
    if (cropImage) {
      applyImageAsSource(cropImage, cropRect);
    }
    setShowCrop(false);
    setCropImage(null);
  };

  const onCropCancel = () => {
    setShowCrop(false);
    setCropImage(null);
  };

  const onFile = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => loadImage(r.result);
    r.readAsDataURL(file);
  };

  useEffect(() => {
    const onPaste = (e) => {
      const items = e.clipboardData?.items || [];
      for (const it of items) {
        if (it.type.startsWith("image/")) {
          onFile(it.getAsFile());
          e.preventDefault();
          return;
        }
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  const toastIt = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  /* --- Drag + drop --- */
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) onFile(f);
  };

  /* --- Export GIF --- */
  const exportGIF = () => {
    if (!frameThumbs.length) return;
    setExportStage("rendering");
    setExportProgress(0);
    const gif = new GIF({
      workers: 2,
      quality: exportQuality,
      width: exportSize,
      height: exportSize,
      workerScript: gifWorker,
    });
    frameThumbs.forEach(f => {
      const c = document.createElement("canvas");
      c.width = exportSize; c.height = exportSize;
      const cx = c.getContext("2d");
      cx.imageSmoothingEnabled = false;
      cx.drawImage(f.canvas, 0, 0, exportSize, exportSize);
      gif.addFrame(c, { delay: 1000 / fps });
    });
    gif.on("progress", (p) => setExportProgress(p));
    gif.on("finished", (blob) => {
      const url = URL.createObjectURL(blob);
      setExportBlobURL(url);
      setExportStage("done");
    });
    gif.render();
  };

  const exportPNG = () => {
    if (!processedRef.current) return;
    processedRef.current.toBlob((b) => {
      const url = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = url; a.download = "pixelart.png"; a.click();
    });
  };

  /* --- Param helpers --- */
  const updateParam = (k, v) => setParams(p => ({...p, [k]: v}));

  /* --- Keyboard shortcuts --- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" && e.target.type !== "range") return;
      if (e.key === " ") { e.preventDefault(); setPlaying(p => !p); }
      if (e.key === "e" || e.key === "E") setShowExport(true);
      if (e.key === "r" || e.key === "R") { if (frameThumbs.length) setFrameIdx(0); }
      if (e.key === "ArrowLeft") setFrameIdx(i => (i - 1 + frameCount) % frameCount);
      if (e.key === "ArrowRight") setFrameIdx(i => (i + 1) % frameCount);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [frameThumbs, frameCount]);

  /* --- Render --- */
  return (
    <div className="app-root" onDragOver={e=>{e.preventDefault(); setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={onDrop}>

      <Header
        tab={tab} setTab={setTab}
        onExport={() => setShowExport(true)}
        onExportPNG={exportPNG}
        onPlayPause={()=> setPlaying(p=>!p)}
        playing={playing}
      />

      <div className="mid">
        {/* LEFT: source + presets */}
        <aside className="side">
          <Section title="源文件" tag={sourceLabel}>
            <div className="input-row" style={{marginBottom:10}}>
              <label className="input-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5-5 5 5M12 6v12"/></svg>
                上传
                <input type="file" accept="image/*" style={{display:"none"}} onChange={(e)=>onFile(e.target.files[0])}/>
              </label>
              <button className="input-chip" onClick={()=>toastIt("粘贴图片 (⌘V / CTRL+V)")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="12" height="16" rx="1"/><path d="M9 4h6v2H9z"/></svg>
                粘贴
              </button>
            </div>
            <p style={{margin:"0 0 10px", fontSize: 10, fontFamily: "var(--mono)", color: "var(--ink-3)", letterSpacing: "0.08em"}}>
              或拖放图片到任意处 · 下方为示例
            </p>
            <div className="samples">
              {/* User uploaded thumbnail */}
              {userThumb && (
                <button
                  className={`sample-cell${activeSample === null ? ' active' : ''}`}
                  onClick={() => {
                    if (userSourceCanvas) {
                      setActiveSample(null);
                      setSourceCanvas(userSourceCanvas);
                      setSourceLabel("用户图片");
                    }
                  }}
                  title="用户图片"
                >
                  <div style={{position:"relative", width:"100%", height:"100%"}}>
                    <img src={userThumb} style={{width:"100%", height:"100%", imageRendering:"pixelated", display:"block"}} alt="用户"/>
                    <span className="user-badge">本地</span>
                  </div>
                </button>
              )}
              {SAMPLE_KINDS.map(k => (
                <SampleCell key={k} kind={k} active={activeSample === k} onClick={()=>setActiveSample(k)}/>
              ))}
            </div>
          </Section>

          <Section title="预设" tag={`${PRESETS.length}`}>
            <div className="preset-list">
              {PRESETS.map((p,i) => (
                <div key={p.id} className={`preset${activePreset===p.id?' active':''}`} onClick={()=>applyPreset(p)}>
                  <span className="num">{String(i+1).padStart(2,'0')}</span>
                  <span>{p.name}</span>
                  <span className="tags">{p.tags}</span>
                </div>
              ))}
            </div>
          </Section>
        </aside>

        {/* MIDDLE: stage */}
        <main className="stage" ref={viewerRef}>
          {!sourceCanvas ? (
            <div className="empty-state">
              <pre className="empty-ascii">{`  █ █ █ █\n  █   █ █\n  █ █ █ █\n  █     █`}</pre>
              <h2>暂无源文件</h2>
              <p>拖放图片、从剪贴板粘贴，或选择一张示例。</p>
            </div>
          ) : (
            <Viewer
              processedCanvasRef={processedCanvasRef}
              originalCanvasRef={originalCanvasRef}
              sourceCanvas={sourceCanvas}
              showSplit={showSplit}
              compareX={compareX}
              setCompareX={setCompareX}
              showScan={showScan}
              zoom={zoom}
              params={params}
            />
          )}

          {sourceCanvas && (
            <>
              <div className="stage-overlay-bl">
                <span>源 <b>{sourceCanvas.width}×{sourceCanvas.height}</b></span>
                <span>输出 <b>{sourceCanvas.width}×{sourceCanvas.height}</b></span>
                <span>像素 <b>{params.pixelSize}x</b></span>
                <span>帧率 <b>{fps}</b></span>
                <span>帧 <b>{frameIdx+1}/{frameCount}</b></span>
              </div>
              <div className="stage-overlay-br">
                <button className={showSplit?"on":""} onClick={()=>setShowSplit(s=>!s)}>对分</button>
                <button className={showScan?"on":""} onClick={()=>setShowScan(s=>!s)}>扫描线</button>
                <button onClick={()=>setZoom(z=> z >= 3 ? 1 : z+0.5)}>缩放 {zoom.toFixed(1)}×</button>
              </div>
            </>
          )}

          {dragOver && <div className="dropzone">▽ 松开以载入图片 ▽</div>}
        </main>

        {/* RIGHT: params */}
        <aside className="side right">
          <ParamsPanel
            params={params}
            updateParam={updateParam}
            sweepParam={sweepParam} setSweepParam={setSweepParam}
            sweepStart={sweepStart} setSweepStart={setSweepStart}
            sweepEnd={sweepEnd} setSweepEnd={setSweepEnd}
            tab={tab}
          />
        </aside>
      </div>

      {/* BOTTOM TIMELINE */}
      <div className="bottom">
        <div className="bot-left">
          <div style={{fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--ink-3)", marginBottom:10}}>
            播放控制
          </div>
          <div className="transport">
            <button className="tbtn" onClick={()=>setFrameIdx(0)} title="Start (R)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h2v16H6zM10 12l10-8v16z"/></svg>
            </button>
            <button className="tbtn" onClick={()=>setFrameIdx(i => Math.max(0, i-1))}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 4l-10 8 10 8z"/></svg>
            </button>
            <button className={`tbtn ${playing?"on":""}`} onClick={()=>setPlaying(p=>!p)} title="Play/Pause (Space)">
              {playing
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z"/></svg>
              }
            </button>
            <button className="tbtn" onClick={()=>setFrameIdx(i => Math.min(frameCount-1, i+1))}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4l10 8-10 8z"/></svg>
            </button>
            <button className="tbtn" onClick={()=>setFrameIdx(frameCount - 1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 4h2v16h-2zM14 12l-10 8V4z"/></svg>
            </button>
          </div>
          <div style={{marginTop: 12, display:"flex", gap:8}}>
            <SmallStepper label="帧率" value={fps} min={1} max={30} onChange={setFps}/>
            <SmallStepper label="帧数" value={frameCount} min={2} max={48} onChange={setFrameCount}/>
          </div>
        </div>

        <div className="bot-mid">
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
            <div style={{fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--ink-3)"}}>
              时间轴 · {frameCount} 帧 · 扫推 [{sweepParam}] {Math.round(sweepStart)}→{Math.round(sweepEnd)}
            </div>
            <button
              onClick={()=>setShowNodeGraph(g=>!g)}
              style={{background:"transparent", border:0, color:showNodeGraph?"var(--accent)":"var(--ink-3)", fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer"}}>
              {showNodeGraph ? "▼ 节点图" : "▶ 节点图"}
            </button>
          </div>

          {showNodeGraph
            ? <NodeGraph params={params}/>
            : <Frames thumbs={frameThumbs} activeIdx={frameIdx} setIdx={setFrameIdx}/>
          }
          <div className="scrubber-wrap" style={{marginTop: 8}}>
            <div className="scrubber-track"/>
            <div className="scrubber-fill" style={{width: `${(frameIdx/(Math.max(1,frameCount-1)))*100}%`}}/>
            <input type="range" className="scrubber-input" min={0} max={frameCount-1} value={frameIdx}
                   onChange={(e)=> setFrameIdx(parseInt(e.target.value))}/>
          </div>
        </div>

        <div className="bot-right">
          <div style={{fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--ink-3)", marginBottom:10}}>
            导出
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            <button className="btn primary" style={{width:"100%", justifyContent:"center"}} onClick={()=>setShowExport(true)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v12M6 10l6 6 6-6M4 20h16"/></svg>
              导出 GIF
              <span className="k">E</span>
            </button>
            <button className="btn ghost" style={{width:"100%", justifyContent:"center"}} onClick={exportPNG}>PNG</button>
          </div>
        </div>
      </div>

      {showExport && (
        <ExportModal
          onClose={()=>{ setShowExport(false); setExportStage("idle"); setExportBlobURL(null); }}
          onExport={exportGIF}
          progress={exportProgress}
          stage={exportStage}
          blobURL={exportBlobURL}
          fps={fps}
          frames={frameCount}
          size={exportSize} setSize={setExportSize}
          quality={exportQuality} setQuality={setExportQuality}
        />
      )}

      {showCrop && cropImage && (
        <CropModal
          image={cropImage}
          onConfirm={onCropConfirm}
          onCancel={onCropCancel}
        />
      )}

      {showTweaks && (
        <TweaksPanel tweaks={tweaks} save={saveTweak} onClose={()=>setShowTweaks(false)}/>
      )}
      {!showTweaks && (
        <button
          onClick={()=>setShowTweaks(true)}
          title="打开微调"
          style={{
            position:"fixed", right:16, bottom:16, zIndex:60,
            width:44, height:44, borderRadius:"50%",
            background:"var(--ink-1)", color:"var(--bg-0)",
            border:"1px solid var(--line-2)",
            boxShadow:"0 6px 20px rgba(0,0,0,0.3)",
            cursor:"pointer", fontSize:18, fontFamily:"inherit",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
