import { FACES } from './cube.js';
const COLORS = { U: '#f1f3eb', R: '#ed6a5c', F: '#63cda0', D: '#f2cd62', L: '#f49b55', B: '#679ee7' };
const faces = {
  U: (c, r) => [c, 1.5, r], R: (c, r) => [1.5, -r, -c],
  F: (c, r) => [c, -r, 1.5], D: (c, r) => [c, -1.5, -r],
  L: (c, r) => [-1.5, -r, c], B: (c, r) => [-c, -r, -1.5],
};
const normals = { U:[0,1,0],R:[1,0,0],F:[0,0,1],D:[0,-1,0],L:[-1,0,0],B:[0,0,-1] };
export function drawCube(svg, state, back, letters) {
  const turn = ([x,y,z]) => back ? [-z,-y,-x] : [x,y,z];
  const project = point => { const [x,y,z] = turn(point); return [240 + (x-z)*.866*49, 160 + ((x+z)*.5-y)*49]; };
  let content = '<title>現在のキューブ。色の文字は完成時の所属面を示します。</title>';
  for (const [face, position] of Object.entries(faces)) {
    if (turn(normals[face]).reduce((a,b)=>a+b,0) <= 0) continue;
    for (let row=0; row<3; row++) for (let col=0; col<3; col++) {
      const x=col-1, y=row-1, inset=.045;
      const points = [[x-.5+inset,y-.5+inset],[x+.5-inset,y-.5+inset],[x+.5-inset,y+.5-inset],[x-.5+inset,y+.5-inset]].map(([c,r])=>project(position(c,r)));
      const color = state[FACES.indexOf(face)*9+row*3+col];
      const center = project(position(x,y));
      content += `<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="${COLORS[color]}" stroke="#101924" stroke-width="2.2" stroke-linejoin="round"/>`;
      if (letters) content += `<text x="${center[0]}" y="${center[1]+4}" text-anchor="middle" fill="#15202e" font-size="12" font-weight="650">${color}</text>`;
    }
  }
  svg.innerHTML = content;
}
export function drawGraph(svg, data, states, current, start, solved) {
  let content = '<title>双方向探索の発見木の抜粋と解法の経路</title>';
  const points = new Map([[`0:${start}`, [35,140]], [`1:${solved}`, [565,140]]]);
  const counts = {};
  for (const node of data.samples || []) {
    const key = `${node.side}:${node.depth}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  const indexes = {};
  for (const node of data.samples || []) {
    const key = `${node.side}:${node.depth}`, i = indexes[key] || 0;
    indexes[key] = i+1;
    const x = node.side ? 565-node.depth*64 : 35+node.depth*64;
    const y = 40 + (i+1)*175/(counts[key]+1);
    const parent = points.get(`${node.side}:${node.parent}`);
    points.set(`${node.side}:${node.state}`, [x,y]);
    if (parent) content += `<path d="M${parent} L${x},${y}" class="tree-edge side-${node.side}"/>`;
    content += `<circle cx="${x}" cy="${y}" r="3.2" class="tree-node side-${node.side}"><title>${node.depth}層目・${node.move}</title></circle>`;
  }
  content += '<circle cx="35" cy="140" r="10" class="root-start"/><circle cx="565" cy="140" r="10" class="root-goal"/><text x="35" y="170" class="root-label">開始</text><text x="565" y="170" class="root-label">完成</text>';
  if (!data.samples?.length && !states.length) content += '<path d="M65 140H250 M350 140H535" class="pending-edge"/><text x="300" y="147" class="pending-label">探索前</text>';
  if (states.length) {
    content += '<text x="300" y="225" class="root-label">解の経路 · 頂点を選んで状態を見る</text>';
    if (states.length>1) content += '<path d="M35 265H565" class="solution-edge"/>';
    states.forEach((state,i) => {
      const x=states.length===1?300:35+i*530/(states.length-1);
      content += `<g class="path-node" role="button" tabindex="0" data-step="${i}" aria-label="${i}手目の状態を見る"><circle cx="${x}" cy="265" r="${i===current?10:6}" class="${i===current?'current-node':'solution-node'}"/><text x="${x}" y="291" class="root-label">${i}</text></g>`;
    });
  }
  svg.innerHTML = content;
}
