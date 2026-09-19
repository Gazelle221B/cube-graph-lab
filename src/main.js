import './style.css';
import { FACES, SOLVED, apply, scramble, parseMoves, pathStates } from './cube.js';
import { drawCube, drawGraph } from './render.js';
const $ = id => document.getElementById(id);
let state = SOLVED, origin = state, history = [], back = false, worker, busy = false;
let result = { samples: [] }, states = [], step = 0, timer = null;
const moveLabels = { U:'上',R:'右',F:'前',D:'下',L:'左',B:'後ろ' };
$('moves').innerHTML = FACES.map(face=>`<div><span>${moveLabels[face]}</span>${[face,face+"'",face+'2'].map(move=>`<button data-move="${move}" aria-label="${moveLabels[face]}面 ${move.endsWith('2')?'180度':move.endsWith("'")?'反時計回り':'時計回り'}">${move.replace("'",'′')}</button>`).join('')}</div>`).join('');
function stop() { clearTimeout(timer); timer=null; $('play').textContent='自動再生'; }
function render() {
  drawCube($('cube'), state, back, $('letters').checked);
  $('cube-status').textContent = state===SOLVED ? '完成！' : states.length ? `${step}手目の状態` : 'シャッフル済み';
  $('cube-status').classList.toggle('solved',state===SOLVED);
  $('scramble-text').textContent=history.length ? history.join(' ') : '— 完成状態';
  drawGraph($('graph'),result,states,step,origin,SOLVED);
  $('step-count').textContent=`${step} / ${result.moves?.length || 0} 手`;
  $('prev').disabled = step===0;
  $('next').disabled = step>=states.length-1;
  $('play').disabled = states.length<=1;
  document.querySelectorAll('[data-path-step]').forEach(button=>{
    const active=Number(button.dataset.pathStep)===step;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
}
function setBusy(value) {
  busy=value;
  $('solve').hidden=value; $('cancel').hidden=!value;
  document.querySelectorAll('#moves button,#shuffle,#reset,#depth,#sequence-form button,#sequence,#mode,[data-experiment]').forEach(el=>el.disabled=value);
}
function clearSolution() {
  stop(); states=[]; result={samples:[]}; step=0; origin=state;
  $('result').hidden=true;
  $('search-status').textContent='現在の状態から、完成までの経路を探します。';
  $('graph-caption').textContent='両端から探索を広げ、出会う場所を探します。';
}
function change(next, moves) {
  if (busy) return;
  state=next; history=moves; clearSolution(); render();
}
function shuffleCube() {
  const moves=scramble(Number($('depth').value));
  $('mode').value=moves.length>6?'two-phase':'bfs';
  change(apply(SOLVED,moves),moves);
}
$('shuffle').onclick=shuffleCube;
$('reset').onclick=()=>change(SOLVED,[]);
$('moves').onclick=event=>{
  const move=event.target.closest('[data-move]')?.dataset.move;
  if (move && !busy) change(apply(state,move),[...history,...(states.length?result.moves.slice(0,step):[]),move]);
};
$('sequence-form').onsubmit=event=>{
  event.preventDefault(); if (busy) return;
  try { const moves=parseMoves($('sequence').value); if(!moves.length) throw new Error('手順を入力してください。');
    change(apply(state,moves),[...history,...(states.length?result.moves.slice(0,step):[]),...moves]); $('input-error').textContent='';
  } catch(error) { $('input-error').textContent=error.message; }
};
for (const [id,value] of [['view-front',false],['view-back',true]]) $(id).onclick=()=>{
  back=value;
  $('view-front').setAttribute('aria-pressed',String(!back)); $('view-back').setAttribute('aria-pressed',String(back));
  $('view-front').classList.toggle('selected',!back); $('view-back').classList.toggle('selected',back); render();
};
$('letters').onchange=render;
function finish(data) {
  setBusy(false); result=data;
  if (!data.moves) {
    $('search-status').textContent='6手以内には経路が見つかりませんでした。「二段階探索」に切り替えると、さらに深い問題を解けます。';
    $('graph-caption').textContent=`${data.visited.toLocaleString()} 頂点を登録（両側の合計）。図は発見木の抜粋です。`;
    render(); return;
  }
  states=pathStates(origin,data.moves); step=0; state=origin;
  $('result').hidden=false;
  $('result-title').textContent=data.moves.length===0?'すでに完成しています':`${data.moves.length}手の${data.shortest?'最短経路':'解法'}を発見`;
  $('visited').textContent=data.visited ? `${data.visited.toLocaleString()} 頂点を登録` : '二段階探索';
  $('search-status').textContent=data.shortest?'最短性を保証する探索結果です。1手ずつ、経路をたどってみよう。':'二段階探索の結果です。解ける経路ですが、最短とは限りません。';
  $('graph-caption').textContent=data.shortest?'上段：実際に発見した辺の抜粋。下段：完成までの経路。':'二段階探索で求めた解の経路を表示しています。探索木は省略しています。';
  $('path').innerHTML=['開始',...data.moves].map((move,i)=>`<button data-path-step="${i}" aria-label="${i}手目 ${move}" aria-pressed="false">${move.replace("'",'′')}</button>`).join('');
  render();
}
$('solve').onclick=()=>{
  if (states.length) history=[...history,...result.moves.slice(0,step)];
  clearSolution(); render(); setBusy(true);
  $('search-status').textContent='開始と完成から、交互に探索しています…';
  try {
    if (!worker) {
      worker=new Worker(new URL('./solver.worker.js',import.meta.url),{type:'module'});
      worker.onmessage=({data})=>{
        if(data.type==='progress') { result=data; $('search-status').textContent=`${data.visited.toLocaleString()} 頂点を登録。${data.layers.at(-1).depth}層目を探索中…`; render(); }
        else if(data.type==='status') $('search-status').textContent=data.message;
        else if(data.type==='result') finish(data);
        else { setBusy(false); $('search-status').textContent=`探索できませんでした：${data.message}`; }
      };
      worker.onerror=()=>{ setBusy(false); worker.terminate(); worker=null; $('search-status').textContent='探索の読み込みに失敗しました。再度お試しください。'; };
    }
    worker.postMessage({state:origin,mode:$('mode').value});
  } catch(error) { setBusy(false); $('search-status').textContent=`探索を開始できませんでした：${error.message}`; }
};
$('cancel').onclick=()=>{ worker?.terminate(); worker=null; setBusy(false); clearSolution(); $('search-status').textContent='探索を中止しました。キューブの状態は保持しています。'; render(); };
function seek(index) { if(!states.length || busy) return; step=Math.max(0,Math.min(states.length-1,index)); state=states[step]; render(); }
$('prev').onclick=()=>{stop();seek(step-1);}; $('next').onclick=()=>{stop();seek(step+1);};
$('path').onclick=event=>{const button=event.target.closest('[data-path-step]');if(button){stop();seek(Number(button.dataset.pathStep));}};
function graphSeek(event) {const node=event.target.closest('[data-step]');if(node){if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;event.preventDefault();stop();seek(Number(node.dataset.step));}}
$('graph').onclick=graphSeek; $('graph').onkeydown=graphSeek;
function tick() {seek(step+1);if(step<states.length-1)timer=setTimeout(tick,Number($('speed').value));else stop();}
$('play').onclick=()=>{if(timer){stop();return;}if(step===states.length-1)seek(0);$('play').textContent='一時停止';timer=setTimeout(tick,Number($('speed').value));};
document.querySelectorAll('[data-experiment]').forEach(button=>button.onclick=()=>{
  const sequence=button.dataset.experiment;change(apply(SOLVED,sequence),sequence.split(' '));
  $('experiment-result').textContent=`${sequence.replace(' ',' → ')} を完成状態から適用しました。R U と U R は異なる状態に到着します。これが回転の「非可換性」です。`;
  $('lab').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
});
shuffleCube();
