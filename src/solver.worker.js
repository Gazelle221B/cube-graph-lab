import Cube from '../vendor/cubejs/lib/solve.js';
import { shortestPath, SOLVED, apply } from './cube.js';
let initialized = false;
self.onmessage = ({ data: { state, mode } }) => {
  try {
    let result;
    if (mode === 'bfs') result = shortestPath(state, progress => self.postMessage({ type: 'progress', ...progress }));
    else {
      self.postMessage({ type: 'status', message: initialized ? '二段階探索で経路を探しています…' : '探索用の表を準備しています。初回は数秒かかります…' });
      if (!initialized) { Cube.initSolver(); initialized = true; }
      const solution = Cube.fromString(state).solve();
      result = { moves: solution.trim().split(/\s+/).filter(Boolean), shortest: false, visited: null, samples: [], layers: [] };
    }
    if (result.moves && apply(state, result.moves) !== SOLVED) throw new Error('解の検証に失敗しました。');
    self.postMessage({ type: 'result', ...result });
  } catch (error) { self.postMessage({ type: 'error', message: error.message }); }
};
