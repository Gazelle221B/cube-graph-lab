import Cube from '../vendor/cubejs/lib/cube.js';
export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
export const MOVES = FACES.flatMap(face => [face, face + "'", face + '2']);
export const SOLVED = new Cube().asString();
export function parseMoves(text) {
  const moves = text.trim().replaceAll('’', "'").split(/\s+/).filter(Boolean);
  if (moves.length > 100 || moves.some(move => !MOVES.includes(move))) {
    throw new Error("U R F D L B と '・2 を使い、空白で区切って100手以内で入力してください。");
  }
  return moves;
}
export const inverse = move => move.endsWith('2') ? move : move.endsWith("'") ? move[0] : move + "'";
export const apply = (state, moves) => Cube.fromString(state).move(Array.isArray(moves) ? moves.join(' ') : moves).asString();
export function scramble(length, random = Math.random) {
  const result = [];
  while (result.length < length) {
    const move = MOVES[Math.floor(random() * MOVES.length)];
    if (move[0] !== result.at(-1)?.[0]) result.push(move);
  }
  return result;
}
function trace(map, state) {
  const moves = [];
  while (map.get(state).parent !== null) {
    const item = map.get(state);
    moves.push(item.move);
    state = item.parent;
  }
  return moves.reverse();
}
// ponytail: BFS is bounded to depth 6; use the two-phase solver for deeper states.
export function shortestPath(start, onProgress = () => {}) {
  if (start === SOLVED) return { moves: [], visited: 1, layers: [], samples: [], shortest: true };
  const maps = [new Map([[start, { parent: null }]]), new Map([[SOLVED, { parent: null }]])];
  const fronts = [[start], [SOLVED]], layers = [], samples = [];
  const sampled = [new Set([start]), new Set([SOLVED])];
  let visited = 2;
  for (let depth = 1; depth <= 3; depth++) {
    for (let side = 0; side < 2; side++) {
      const next = [];
      let kept = 0;
      for (const state of fronts[side]) {
        for (const move of MOVES) {
          if (move[0] === maps[side].get(state).move?.[0]) continue;
          const child = apply(state, move);
          if (maps[side].has(child)) continue;
          maps[side].set(child, { parent: state, move });
          next.push(child);
          visited++;
          if (kept < 15 && sampled[side].has(state)) {
            samples.push({ side, depth, state: child, parent: state, move });
            sampled[side].add(child);
            kept++;
          }
          if (maps[1 - side].has(child)) {
            const moves = [...trace(maps[0], child), ...trace(maps[1], child).reverse().map(inverse)];
            layers.push({ side, depth, count: next.length, partial: true });
            return { moves, visited, layers, samples, shortest: true };
          }
        }
      }
      fronts[side] = next;
      layers.push({ side, depth, count: next.length });
      onProgress({ visited, layers: [...layers], samples: [...samples] });
    }
  }
  return { moves: null, visited, layers, samples, shortest: false };
}
export function pathStates(start, moves) {
  return moves.reduce((states, move) => [...states, apply(states.at(-1), move)], [start]);
}
