# ひなたバランス

個人利用専用・非公式のローカルブラウザゲーム。外部へ公開・配布していません。

## 起動

このMacでは `start.command` をダブルクリック。起動中は http://127.0.0.1:4173 を開きます。既に開いている画面は再読み込みしてください。ターミナルを閉じるとサーバーは停止します。

Node.js 22以降の通常環境:

```sh
npm install
npm run build
npm run preview
```

開発は `npm run dev`。更新後は `npm run build` でPWA版にも反映します。

## ゲームの改善

実ブラウザで4ラウンドの評価・修正・再プレイを実施しました。詳細・厳しい10項目評価・検証の限界は `docs/game-design-review.md` に記載しています。

- 全身写真の形は維持。薄い凸輪郭で当たり判定を可視化。
- スマホは左右回転ボタンで15度ずつ回転してからドラッグ。PCは同じボタン、または矢印で移動・Q/Eで回転・Enter/Spaceで落下。
- 他のピースに重なっている位置では落とさず、修正を促します。上へ瞬間移動させません。
- 中央固定Constraintの動的シーソーを維持。衝撃の減衰と支点荷重の変化を滑らかにしました。
- 最終安定区間からPERFECT/GOOD/DANGERと得点。人数・配置精度・クリア時間で総合スコアを計算します。
- 落下したメンバーと方向、揺れのタイムアウトを区別して表示。
- リトライは同じ順番。モード選択から始めると新しい順番。最高得点・既存の人数記録・設定は同じlocalStorageに保持。

|モード|人数|板幅|支点のばね|摩擦倍率|安定確認|
|---|---:|---:|---:|---:|---:|
|NORMAL|10|328|0.60|1.00|0.65秒|
|HARD|15|292|0.34|0.94|0.85秒|
|ALL MEMBERS|27|328|0.54|1.00|0.80秒|

全員が台につながり、移動と回転が収まった時間を数えます。支点は接触荷重でも強くなり、±24度で回転制限。難易度のためのランダムな揺れは加えていません。

## 操作

回転で姿勢を選び、上のピースをドラッグして離すと落下します。まずは低く広い足場を作り、傾きメーターを見て重さを左右へ分けてください。1人置くたびに短い配置評価が出ます。高く積むとカメラが上へ追従します。

左右・下に完全に落下、または12秒揺れが収まらなければ終了です。モード選択への確認画面では物理とタイマーが停止します。

## 画像の出典と更新

- `scripts/photo-sources.json`: 最終採用した公式写真URL、記事ページ、記事名、元画像パス
- `scripts/photo-picks.json`: 候補一覧で目視選定した番号
- `scripts/photo-masks.json`: 背景の残りを除く補助マスク
- `scripts/member-report.json`: 加工結果、寸法、切り出し範囲、頂点数
- `.cache/blog-photos/`: 公開ブログの元写真、候補情報（Git対象外）
- `.cache/photo-cutouts/`: 確認済み透過写真と確認用一覧（Git対象外）
- `public/assets/members/`: ゲーム用WebP（Git対象外）

通常の起動では画像の再取得は不要です。画像を再加工する場合:

```sh
.cache/photo-env/bin/python scripts/prepareBlogPhotos.py
npm run members:update
npm run build
```

Python環境には `rembg[cpu]` とPillowを使用します。初回だけ公開のisnet-general-useモデルを取得し、`.cache/rembg/` に保存します。写真は外部サービスに送信しません。

`npm run members:discover` は公開ブログの候補一覧を作成します。既定では各メンバー64枚まで、`PHOTO_LIMIT=160` で増やせます。選定後、頭・手・靴が欠けていないか元写真と透過写真を目視確認してください。`members:update` は選定済み写真から現在の27人のデータを再生成するもので、名簿の自動更新は行いません。旧 `fullbody-*` ファイルは前回の商品画像の履歴です。

ログイン・購入・会員限定ページの取得は行いません。

## 主な変更ファイル

- `src/game/seesaw.ts`: 動的台座・支点・ばね・減衰・回転制限
- `src/game/engine.ts`: 接触・安定判定、物理ピース、支点描画、傾きとガイド
- `src/main.tsx`: 傾き表示と操作説明
- `src/data/members.ts`: 全身ピースの生成データ
- `scripts/updateMembersData.ts` / `scripts/discoverBlogPhotos.ts` / `scripts/prepareBlogPhotos.py`: 画像取得・加工・候補探索
- `tests/seesaw.test.ts` / `scripts/browser-check.mjs`: シーソー物理とブラウザ検証

## 検証

```sh
npm test
npm run test:browser
```

ブラウザ検証には5173でdev、4173でpreviewが必要です。ChromeはMacの標準インストール先を使用。別の場所は `CHROME_PATH` で指定できます。

確認した内容:

- 型チェック・production build・物理/採点/旧記録の移行/画像比率の単体テスト
- NORMAL/HARDの複数回プレイ、ALL MEMBERSの実プレイ
- マウス・タッチ・回転ボタン・Q/E、重なった位置での落下拒否
- スマホ相当表示、画面比率、リトライの表示位置と2秒以内の開始
- 左右荷重とモードによる傾き差、写真と回転後の当たり判定の一致
- 落下・スコア・記録保存とリロード後の維持・同順番リトライ
- PWA manifest、service worker、画像と回転UIを含むオフライン起動

`node scripts/playtest.mjs review --rotate --all` で6ゲームの入力付き実プレイを再実行します。`node scripts/retry-learning.mjs` は同じ順番をリトライし、置き方の改善を比較します。`node scripts/shape-audit.mjs` は27人×5角度の高速物理試験です。測定ログとスクリーンショットは `.cache/playtests/` に保存します。

NORMALは実写真10人のクリアを複数回確認しています。HARD/ALLの全員クリアは、最終人数・保存経路を小さな矩形のテスト用形状で別途検証するもので、実写真15/27人でのクリアを確認したという意味ではありません。外部ユーザーやiPhone実機による評価は未実施です。

`?debug=true` でFPS・body数・速度・角速度・輪郭・重心を表示します。

## 制約

- 当たり判定は凸輪郭に簡略化しているため、袖と身体・曲げた脚の間には物理的なくぼみがありません。
- 細部の背景・鏡・持ち物が一部残ります。元写真の自然な体形と全身を優先しています。
- iPhone実機Safariの確認は未実施です。safe-area・縦画面・タッチ操作を実装し、Chromeでスマホ相当表示を検証しました。
- iPhoneからMacのlocalhostへは直接接続できません。iPhoneへのPWAインストールには、端末が到達できる信頼済みHTTPSのローカル配信が別途必要です。外部公開はしていません。
- 初回オンライン読み込み後、同じURLでオフライン起動できます。localhostと127.0.0.1は異なる保存領域なので、記録を共有する場合はURLを統一してください。
- 振動は対応ブラウザのみ。記録はブラウザデータ削除で消えることがあります。
