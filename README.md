# CUBE / GRAPH

グラフ理論で3×3ルービックキューブを解く、日本語のインタラクティブ教材。

## ローカル実行

```sh
npm ci
npm run dev
npm test
npm run build
```

- 18種類の面回転（HTM、180°も1手）を辺、54面シールの配置を頂点とする。
- 双方向BFSは6手以内の最短経路を探索。見つからない場合も「解なし」とは扱わない。
- 深い問題はcubejsのKociemba二段階探索で解く。最短性は保証しない。
- Web Workerで探索し、途中キャンセルに対応。グラフは実探索の発見木の抜粋と解の経路。
- キューブの全6面、手順入力、スクランブル、ステップ再生、状態頂点の選択に対応。

## 公開

GitHub Actionsでテスト・ビルド後、GitHub Pagesへデプロイ。Viteの相対baseによりプロジェクトPagesに対応。

数学: [Cube group](https://en.wikipedia.org/wiki/Rubik%27s_Cube_group)、[God’s number](https://www.cube20.org/)、[Two-phase algorithm](https://kociemba.org/math/imptwophase.htm)。
実装依存: [cubejs](https://github.com/ldez/cubejs)（MIT）、[Vite](https://vite.dev/)（MIT）。
