# 承認防衛線 — 未処理、接近中。

公開: https://ykyuki1991.github.io/hinata-balance/shonin-defense/

v3は全方向アリーナシューティング。完全架空の申請が四方から迫る。POWER EGGに着想を得た非公式作品で、実在UI・ロゴ・社員・データは使用しない。

## 操作

- 電話: フィールドを押した位置からドラッグして全方向移動。離すと停止。近くの見通せる敵を自動照準・自動射撃。
- PC: WASD / 矢印キー、またはマウスでドラッグ。
- 差戻し: ボタン / Space。移動方向へ短い無敵移動＋近くへの反撃と弾の否認。移動していない場合は照準方向。
- 停止: Ⅱ / P / Escape。非表示・フォーカスを失うと自動停止。
- 音: 明示的な音ON操作で開始。合成BGM・SE、外部音源なし。

受付ホール・回覧機関室・月末決裁室、各4遭遇＋ボス。決裁印を拾うと強化。中間で装備選択。再挑戦は同じ配置。通常/繁忙日の記録、クリア数、実績を端末に保存。旧版記録は消さず別キーで保持。

## 構成

`public/shonin-defense/`の静的ES modules。`engine.js`が固定ステップのシミュレーション、`render.js`が描画、`game.js`が入力とUI、`audio.js`がWeb Audio。ワールド480×600、DPR上限2、敵24/弾70/粒子180/予告3の上限。

親VitePWAのプリキャッシュ対象からゲームを除外し、モジュールは版番号で更新。既存URLを維持する。診断は`?qa=1`で読み取り専用`gameSnapshot()`を公開し、通常URLには出さない。

## 検証

- `npm test`, `npm run lint`, `VITE_BASE_PATH=/hinata-balance/ npm run build`
- `node scripts/shonin-sim.mjs`: 2モード×4移動方針×6シード
- `SCENARIO=desktop ENGINES=chromium node scripts/shonin-browser-check.mjs`: 全行程、失敗、リトライ、記録
- `SCENARIO=iphone ENGINES=chromium ...`: ネイティブタッチドラッグと同時差戻し
- `SCENARIO=iphone ENGINES=webkit ...`: WebKit入力・描画
- `node scripts/shonin-layout-check.mjs`: PC、小型、縦横、回転
- `node scripts/shonin-performance-check.mjs`: 実時計の描画時間
- `node scripts/shonin-public-check.mjs`: 公開ファイル一致、親PWAとの共存、診断非表示
- `node scripts/shonin-cache-check.mjs`: 旧版閲覧後の同じURLへの更新

公開検証は`GAME_URL=https://ykyuki1991.github.io/hinata-balance/shonin-defense/`を指定。WebKitブラウザが必要。詳細な根拠・解釈・実機検証の限界は[再設計記録](shonin-v3-design.md)、走行ログは`shonin-v3-*.json`。
