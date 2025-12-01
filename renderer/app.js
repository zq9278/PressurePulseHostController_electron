// Clean renderer logic (replaces main.js)
(function(){
  if (window.__PPHC_BOOTED__) return; window.__PPHC_BOOTED__ = true;
  const $ = (q) => document.querySelector(q);
  const api = window.api;

  const state = { connected: false, latest: {0:null,2:null,1:null,3:null}, buf:{0:[],2:[],1:[],3:[]}, max:600, ports:[], selectedPort:'' };

  function populatePorts(ports){
    state.ports = Array.isArray(ports)? ports: [];
    const info=$('#portInfo'), btn=$('#portPicker'), menu=$('#portMenu'), list=$('#portList'), empty=$('#portEmpty');
    if (info){ if(!state.ports.length){info.textContent='0 个端口'; info.title='';} else {info.textContent=`${state.ports.length} 个端口`; info.title=state.ports.join(', ');} }
    if (list){ list.innerHTML=''; if(!state.ports.length){ if(empty) empty.hidden=false; } else { if(empty) empty.hidden=true; for(const p of state.ports){ const item=document.createElement('div'); item.className='dropdown-item'; item.setAttribute('role','option'); item.textContent=p; item.addEventListener('mousedown',e=>e.stopPropagation()); item.addEventListener('click',e=>{ e.stopPropagation(); setSelectedPort(p); closePortMenu(); }); list.appendChild(item);} } }
    if (btn) btn.textContent = state.selectedPort || '请选择串口';
    if (btn && menu && state.ports.length>0 && !state.selectedPort && menu.hidden) openPortMenu();
  }

  async function refreshPorts(){ try{ if(!api||!api.listPorts){ populatePorts([]); return;} const ports=await api.listPorts(); populatePorts(ports);} catch{ populatePorts([]);} }

  function setConnected(on){ state.connected=on; const s=$('#status'); s.textContent = on? '已连接':'未连接'; s.classList.toggle('on', on); s.classList.toggle('off', !on); $('#btnConnect').textContent = on? '断开':'连接'; }

  let chartP, chartT;
  function initCharts(){ if(typeof echarts==='undefined') return; chartP=echarts.init(document.getElementById('chartPressure')); chartT=echarts.init(document.getElementById('chartTemp'));
    const baseOpt={ animation:false, grid:{left:40,right:10,top:10,bottom:22},
      xAxis:{type:'category',boundaryGap:false,axisLabel:{show:false},axisLine:{lineStyle:{color:'#555'}},axisPointer:{show:true}},
      yAxis:{type:'value',axisLine:{lineStyle:{color:'#555'}},splitLine:{lineStyle:{color:'rgba(255,255,255,0.08)'}},axisPointer:{show:true}},
      axisPointer:{ show:true, type:'line', snap:false, label:{show:false}, triggerTooltip:false },
      dataZoom:[
        {id:'zx',type:'inside',xAxisIndex:0,filterMode:'none',zoomOnMouseWheel:false,moveOnMouseMove:true,moveOnMouseWheel:false,throttle:10},
        {id:'zy',type:'inside',yAxisIndex:0,filterMode:'none',zoomOnMouseWheel:false,moveOnMouseMove:true,moveOnMouseWheel:false,throttle:10}
      ],
      series:[] };
    chartP.setOption({...baseOpt, series:[ {name:'L',type:'line',showSymbol:false,lineStyle:{width:1.2,color:'#22c55e'},data:[]}, {name:'R',type:'line',showSymbol:false,lineStyle:{width:1.2,color:'#eab308'},data:[]} ]});
    chartT.setOption({...baseOpt, series:[ {name:'L',type:'line',showSymbol:false,lineStyle:{width:1.2,color:'#3b82f6'},data:[]}, {name:'R',type:'line',showSymbol:false,lineStyle:{width:1.2,color:'#ef4444'},data:[]} ]});
    setupAxisAwareZoom(chartP, baseOpt.grid, 'p');
    setupAxisAwareZoom(chartT, baseOpt.grid, 't');
    attachAxisPointerLabels(chartP, baseOpt.grid, 'p');
    attachAxisPointerLabels(chartT, baseOpt.grid, 't');
  }

  function updateCharts(){ const x=Array.from({length:state.max},(_,i)=>i); if(chartP) chartP.setOption({xAxis:{data:x},series:[{data:state.buf[0]},{data:state.buf[2]}]}); if(chartT) chartT.setOption({xAxis:{data:x},series:[{data:state.buf[1]},{data:state.buf[3]}]}); updateInteractiveOverlays(); }
  function pushData(ch,v){ const arr=state.buf[ch]||(state.buf[ch]=[]); arr.push(v); if(arr.length>state.max) arr.shift(); state.latest[ch]=v; }

  function wireUI(){ $('#btnConnect').addEventListener('click', async()=>{ if(!state.connected){ const port=state.selectedPort||state.ports[0]||''; const baud=Number($('#baud').value); const ok=await api.connect(port,baud); if(ok) setConnected(true);} else { await api.disconnect(); setConnected(false);} }); $('#btnRefreshPorts').addEventListener('click', refreshPorts);
    const pr=$('#powerRange'), ps=$('#powerSpin'); const sync=(src,dst)=>src.addEventListener('input',()=>{dst.value=src.value;}); sync(pr,ps); sync(ps,pr);
    $('#btnSetTemp').addEventListener('click',()=>{ const v=Number($('#temp').value)||37; api.sendF32(0x1002,v); api.sendF32(0x1003,v); });
    $('#btnSetPress').addEventListener('click',()=>{ const v=Number($('#press').value)||15; api.sendF32(0x1001,v); });
    $('#btnSetPower').addEventListener('click',()=>{ const v=Number($('#powerSpin').value)||128; api.sendU8(0x1008,v); });
    // Hold/Release time controls (10-10000 ms)
    const hr=$('#holdRange'), hs=$('#holdSpin'); const rr=$('#relRange'), rs=$('#relSpin');
    const bindSync=(a,b)=>{ a.addEventListener('input',()=>{ b.value=a.value; }); b.addEventListener('input',()=>{ a.value=b.value; }); };
    bindSync(hr,hs); bindSync(rr,rs);
    $('#btnSetHold').addEventListener('click',()=>{ let v=Number($('#holdSpin').value)||10; v=Math.max(10,Math.min(10000,v)); api.sendU32(0x1009, v); });
    $('#btnSetRelease').addEventListener('click',()=>{ let v=Number($('#relSpin').value)||10; v=Math.max(10,Math.min(10000,v)); api.sendU32(0x100A, v); });
    $('#prL').addEventListener('change', async(e)=>{ const on=!!e.target.checked; if(on){ await api.sendF32(0x1001,Number($('#press').value)||15); await api.sendU8(0x1008,Number($('#powerSpin').value)||128); await api.sendU8(0x1004,1);} else { await api.sendU8(0x1004,0);} });
    $('#prR').addEventListener('change', async(e)=>{ const on=!!e.target.checked; if(on){ await api.sendF32(0x1001,Number($('#press').value)||15); await api.sendU8(0x1008,Number($('#powerSpin').value)||128); await api.sendU8(0x1005,1);} else { await api.sendU8(0x1005,0);} });
    $('#tpL').addEventListener('change', async(e)=>{ const on=!!e.target.checked; if(on){ await api.sendF32(0x1002,Number($('#temp').value)||37); await api.sendU8(0x1006,1);} else { await api.sendU8(0x1006,0);} });
    $('#tpR').addEventListener('change', async(e)=>{ const on=!!e.target.checked; if(on){ await api.sendF32(0x1003,Number($('#temp').value)||37); await api.sendU8(0x1007,1);} else { await api.sendU8(0x1007,0);} });
    $('#btnStart').addEventListener('click',()=>{ api.sendU8(0x1004,1); api.sendU8(0x1005,1); api.sendU8(0x1006,1); api.sendU8(0x1007,1); api.sendF32(0x1001,Number($('#press').value)||15); const t=Number($('#temp').value)||37; api.sendF32(0x1002,t); api.sendF32(0x1003,t); api.sendU8(0x1008,Number($('#powerSpin').value)||128); });
  }

  function main(){ wireUI(); refreshPorts(); if(api&&api.onPorts) api.onPorts(populatePorts); try{ initCharts(); }catch{} setInterval(refreshPorts,5000); api.onSerialData(({ch,value})=>pushData(ch,value)); api.onConnectionChanged((on)=>setConnected(on)); setInterval(updateCharts,1000/30); }
  window.addEventListener('DOMContentLoaded', main);

  function openPortMenu(){ const btn=$('#portPicker'); let menu=$('#portMenu'); if(!btn||!menu) return; if(menu.parentElement!==document.body){ menu.remove(); document.body.appendChild(menu);} const rect=btn.getBoundingClientRect(); menu.style.position='fixed'; menu.style.minWidth=Math.max(220,Math.floor(rect.width)).toString()+'px'; menu.style.left=`${Math.round(rect.left)}px`; menu.style.top=`${Math.round(rect.bottom+4)}px`; menu.hidden=false; btn.setAttribute('aria-expanded','true'); }
  function closePortMenu(){ const btn=$('#portPicker'); const menu=$('#portMenu'); if(!btn||!menu) return; menu.hidden=true; btn.setAttribute('aria-expanded','false'); }
  function setSelectedPort(p){ state.selectedPort=p||''; const btn=$('#portPicker'); if(btn) btn.textContent=state.selectedPort||'请选择串口'; }
  const portBtn=document.getElementById('portPicker'); const menuEl=document.getElementById('portMenu'); if(menuEl) menuEl.addEventListener('mousedown',e=>e.stopPropagation()); if(portBtn) portBtn.addEventListener('click', (e)=>{ e.stopPropagation(); const m=document.getElementById('portMenu'); if(!m) return; if(m.hidden) openPortMenu(); else closePortMenu(); }); document.addEventListener('click',()=>closePortMenu());

  // overlays
  const ui={ p:{cursors:[],liveId:'liveP', cursorLabelId:'vc-label-p', cursorIndex:0}, t:{cursors:[],liveId:'liveT', cursorLabelId:'vc-label-t', cursorIndex:0} };
  function ensureOverlays(){ if(!chartP||!chartT) return; if(!ui.p.cursors.length){ ui.p.cursors=[{color:'#22c55e',index:0,series:0},{color:'#eab308',index:0,series:2}]; chartP.setOption({graphic:[{id:ui.p.liveId,type:'text',right:6,top:4,style:{text:'',fill:'#bbb',fontSize:12}}]}); } if(!ui.t.cursors.length){ ui.t.cursors=[{color:'#3b82f6',index:0,series:1},{color:'#ef4444',index:0,series:3}]; chartT.setOption({graphic:[{id:ui.t.liveId,type:'text',right:6,top:4,style:{text:'',fill:'#bbb',fontSize:12}}]}); } }
  function updateCursorGroup(chart,cursor,buf){ const idx=Math.max(0,Math.min(state.max-1,cursor.index|0)); const xPx=chart.convertToPixel({xAxisIndex:0},idx); const yVal=buf[idx]; const yPx=(yVal!=null)? chart.convertToPixel({yAxisIndex:0},yVal):null; const gridTop=10, gridBottom=chart.getHeight()-22; const idLine=`c-line-${cursor.series}`, idHandle=`c-handle-${cursor.series}`, idLabel=`c-label-${cursor.series}`; chart.setOption({graphic:[ {id:idLine,type:'rect',shape:{x:xPx-1,y:gridTop,width:2,height:Math.max(10,gridBottom-gridTop)},style:{fill:cursor.color,opacity:0.85}}, {id:idHandle,type:'circle',x:xPx,y:(yPx??gridTop),shape:{r:6},style:{fill:cursor.color},draggable:true,cursor:'ew-resize',ondrag:function(){ const dataX=Math.round(chart.convertFromPixel({xAxisIndex:0},[this.x,0])[0]); cursor.index=Math.max(0,Math.min(state.max-1,dataX|0)); updateInteractiveOverlays(); }}, {id:idLabel,type:'text',x:xPx+8,y:(yPx??gridTop)-10,style:{text:(yVal!=null?(typeof yVal==='number'? yVal.toFixed(2):String(yVal)):'--'),fill:'#ddd',fontSize:12,textBackgroundColor:'rgba(0,0,0,0.4)',padding:[2,4],borderRadius:3}} ]}); }
  function updateInteractiveOverlays(){ ensureOverlays(); if(chartP){ updateCursorGroup(chartP,ui.p.cursors[0],state.buf[0]); updateCursorGroup(chartP,ui.p.cursors[1],state.buf[2]); const lp=state.buf[0].at(-1), rp=state.buf[2].at(-1); chartP.setOption({graphic:[{id:ui.p.liveId,style:{text:`L:${lp!=null?lp.toFixed(0):'--'}  R:${rp!=null?rp.toFixed(0):'--'}`}}]}); } if(chartT){ updateCursorGroup(chartT,ui.t.cursors[0],state.buf[1]); updateCursorGroup(chartT,ui.t.cursors[1],state.buf[3]); const lt=state.buf[1].at(-1), rt=state.buf[3].at(-1); chartT.setOption({graphic:[{id:ui.t.liveId,style:{text:`L:${lt!=null?lt.toFixed(2):'--'}  R:${rt!=null?rt.toFixed(2):'--'}`}}]}); } }

  // Axis-aware zoom and vertical cursor following mouse
  function setupAxisAwareZoom(chart, gridCfg, key){
    let zoomMode = 'x';
    const setZoomMode = (mode)=>{
      if (zoomMode === mode) return; zoomMode = mode;
      chart.setOption({ dataZoom: [ { id:'zx', zoomOnMouseWheel: (mode==='x') }, { id:'zy', zoomOnMouseWheel: (mode==='y') } ] }, false);
    };
    // init
    chart.setOption({ dataZoom: [ { id:'zx', zoomOnMouseWheel:false }, { id:'zy', zoomOnMouseWheel:false } ] }, false);

    chart.getZr().on('mousemove', (e)=>{
      const x=e.offsetX, y=e.offsetY, w=chart.getWidth(), h=chart.getHeight();
      // Determine if hovering over x-axis ticks area or y-axis ticks area
      const overY = (x <= gridCfg.left + 8); // y-axis area at left
      const overX = (y >= h - gridCfg.bottom - 8); // x-axis area at bottom
      if (overY && !overX) setZoomMode('y'); else if (overX && !overY) setZoomMode('x');
      // no-op here; axisPointer will handle the vertical line
    });
    chart.getZr().on('globalout', ()=>{
      // hide cursor label when mouse leaves chart
      chart.setOption({ graphic: [ { id: ui[key].cursorLabelId, style:{ opacity: 0 } } ]});
    });
  }

  function attachAxisPointerLabels(chart, gridCfg, key){
    chart.on('updateAxisPointer', function (event) {
      const h = chart.getHeight(), w = chart.getWidth();
      if (!event || !event.axesInfo || !event.axesInfo.length) return;
      const info = event.axesInfo[0];
      // Compute pixel X from axis value
      const dataX = Math.max(0, Math.min(state.max-1, Number(info.value) || 0));
      ui[key].cursorIndex = dataX;
      const xPx = chart.convertToPixel({ xAxisIndex:0 }, dataX);
      const gridTop = gridCfg.top, gridBottom = h - gridCfg.bottom;
      const seriesIdx = (key==='p') ? [0,2] : [1,3];
      const vL = state.buf[seriesIdx[0]][dataX]; const vR = state.buf[seriesIdx[1]][dataX];
      const label = (key==='p') ? `L:${vL!=null?Number(vL).toFixed(0):'--'}  R:${vR!=null?Number(vR).toFixed(0):'--'}`
                                : `L:${vL!=null?Number(vL).toFixed(2):'--'}  R:${vR!=null?Number(vR).toFixed(2):'--'}`;
      chart.setOption({ graphic: [ { id: ui[key].cursorLabelId, type:'text', x: xPx+6, y: gridTop+4,
        style:{ text: label, opacity: 1, fill:'#ddd', fontSize:12, textBackgroundColor:'rgba(0,0,0,0.4)', padding:[2,4], borderRadius:3 } } ] }, false);
    });
  }

  // Axis-aware zoom and cursor follow mouse
  function setupAxisAwareZoom(chart){
    let last = 'x';
    const setZoomMode = (mode)=>{
      if (last === mode) return; last = mode;
      chart.setOption({ dataZoom: [ { id: 'zx', zoomOnMouseWheel: mode==='x' }, { id: 'zy', zoomOnMouseWheel: mode==='y' } ] }, false);
    };
    // Assign IDs to dataZoom for updates
    chart.setOption({ dataZoom: [ { id: 'zx' }, { id: 'zy' } ] }, false);
    chart.getZr().on('mousemove', (e)=>{
      const x=e.offsetX, y=e.offsetY, w=chart.getWidth(), h=chart.getHeight();
      const overY = (x <= 40+6); // near y-axis (left margin + tolerance)
      const overX = (y >= h-22-6); // near x-axis (bottom margin + tolerance)
      if (overY && !overX) setZoomMode('y');
      else if (overX && !overY) setZoomMode('x');
      // cursor follows mouse x index
      const dataX = Math.round(chart.convertFromPixel({ xAxisIndex:0 }, [x,0])[0]);
      if (chart === chartP) { if (ui.p.cursors.length){ ui.p.cursors[0].index=dataX; ui.p.cursors[1].index=dataX; } }
      if (chart === chartT) { if (ui.t.cursors.length){ ui.t.cursors[0].index=dataX; ui.t.cursors[1].index=dataX; } }
      updateInteractiveOverlays();
    });
  }
})();
