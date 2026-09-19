import test from 'node:test';
import assert from 'node:assert/strict';
import Cube from '../vendor/cubejs/lib/solve.js';
import { SOLVED, MOVES, apply, inverse, parseMoves, shortestPath, pathStates } from '../src/cube.js';
test('cube moves, parser, exact shortest paths, deeper-state bound and two-phase solve', () => {
  for (const move of MOVES) {
    assert.equal(apply(SOLVED, [move, inverse(move)]), SOLVED);
    assert.equal(apply(SOLVED, Array(4).fill(move)), SOLVED);
    assert.equal(shortestPath(apply(SOLVED, move)).moves.length, 1);
  }
  assert.notEqual(apply(SOLVED, 'R U'), apply(SOLVED, 'U R'));
  assert.deepEqual(parseMoves('  R U’ F2 '), ['R', "U'", 'F2']);
  assert.throws(() => parseMoves('R<script>'));
  assert.throws(() => parseMoves('R'.repeat(101)));
  assert.equal(shortestPath(SOLVED).moves.length, 0);
  // Independent one-sided breadth-first distances through depth 2.
  const distances = new Map([[SOLVED, 0]]);
  for (const [state, depth] of distances) {
    if (depth === 2) continue;
    for (const move of MOVES) {
      const next = apply(state, move);
      if (!distances.has(next)) distances.set(next, depth + 1);
    }
  }
  for (const [state, distance] of distances) assert.equal(shortestPath(state).moves.length, distance);
  for (const sequence of ['R U F', 'R U F L', 'R U F L D', 'R U F L D B']) {
    const state = apply(SOLVED, sequence), result = shortestPath(state);
    assert.equal(apply(state, result.moves), SOLVED);
    assert.equal(result.moves.length, sequence.split(' ').length);
    assert.equal(pathStates(state, result.moves).at(-1), SOLVED);
    for (const edge of result.samples) assert.equal(apply(edge.parent, edge.move), edge.state);
  }
  const deep = apply(SOLVED, 'R U F2 L D B R2 U2 F D2 L2 B2 R F U L2 D B U2 R');
  assert.equal(shortestPath(deep).moves, null);
  Cube.initSolver();
  assert.equal(apply(deep, Cube.fromString(deep).solve()), SOLVED);
});
