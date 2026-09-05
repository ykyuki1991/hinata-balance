# 承認防衛線 — 未処理、接近中。

公開URL: https://ykyuki1991.github.io/hinata-balance/shonin-defense/

最大75秒のオフィス・シューティング。POWER EGGの業務用語を着想源にした非公式の独立ゲームです。画面、ロゴ、実在社員、社内規則、実データは使っていません。素材はすべてCSS/Canvasで描画し、外部フォントや素材配信への依存はありません。

## 操作

- 指のスライド、マウス、← → / A Dで移動。ショットは自動。
- 「一括否認」またはSpaceで画面内の申請を処理。15件処理すると再充填。
- Ⅱ / P / Escapeで一時停止。タブ移動時も自動停止。
- 音は初期OFF。ヘッダーからONにできます。

## ルール

3ライフ。申請が防衛ラインに到達、または月末締めの弾に当たると1ライフ減少。被弾後1.5秒は無敵。いつもの申請は100点、至急は150点、差戻し案件は250点。差戻し案件は一度上へ戻り、再申請として速く降下します。2.7秒以内の連続処理でコンボ、8件ごとに倍率が上昇、最大5倍。10件処理ごとにコーヒーが出現し、取ると7秒間3方向ショット。

52秒でボス「月末締め」が登場。65発で撃破、一括否認は14ダメージ。ボスを倒せば業務完了、ライフ切れか75秒経過で未処理持ち越し。ベストスコアと音の設定のみ端末に保存。外部への記録送信なし。保存できない環境でもプレイ可能。

## 構成と公開

`public/shonin-defense/` の静的HTML/CSS/JavaScriptを既存Viteビルドがそのまま配信。既存ゲームのURLと実装は維持しています。`vite.config.ts` のService Worker navigation fallbackから本ゲームを除外し、既存アプリの画面に吸い込まれることを防いでいます。

GitHub Actionsはmainへのpushでlint、全単体テスト、ビルド、Pagesデプロイを実行。開発サーバーで直接開くときだけ `/shonin-defense/index.html` を使用します（Vite devのディレクトリURLは既存アプリへフォールバックするため）。Pages公開では `/shonin-defense/` で開けます。

## テスト

`npm test` でゲームルールを含む20テスト。`npm run lint` と `npm run build`。ブラウザ検証は `GAME_URL=https://ykyuki1991.github.io/hinata-balance/shonin-defense/ node scripts/shonin-browser-check.mjs`。PlaywrightのWebKitと標準Chromeが必要です。`PLAYWRIGHT_BROWSERS_PATH` でインストール場所を指定できます。

ブラウザ検証は実装状態を書き換えず、公開UIの入力とアニメーション時間の進行で実行します。`?qa=1` は読み取り専用のスナップショット関数だけを公開。通常URLには診断関数を出しません。

iPhone端末の実機テストと、iPhoneサイズ・タッチ・WebKitのエミュレーションテストは区別します。実機は未使用です。ブラウザ検証結果は `docs/shonin-browser-check.json`。

## 公開後の確認（2026-09-05）

GitHub Pagesの[デプロイ #4](https://github.com/ykyuki1991/hinata-balance/actions/runs/33967391621) が成功。公開URLはHTTP 200、HTML/CSS/JS/SVGの全5ファイルが検証済みローカルソースと一致しました。

公開URLでChromeとWebKit、デスクトップ・iPhone相当・小型スマホ・横画面の開始、移動、一括否認、一時停止、自然なゲームオーバー、リトライを検証。Chromeは実タッチイベントによるドラッグ、WebKitはタッチによる移動先指定を使用しています。iPhone実機は使用していません。

タッチ入力で月末締めを撃破し、66件処理・42,950点でクリア。再読み込み後の自己ベスト保持も確認。小型iPhone相当の320×568でも、iPhone横向き相当の750×342でも、横はみ出し・操作ボタンの画面外配置はありません。既存ゲームのService Workerが有効なブラウザからも新ゲームへ移動できます。

詳細: `docs/shonin-browser-check.json`、`docs/shonin-clear-check.json`、`docs/shonin-public-check.json`。公開ファイルの照合とレイアウト確認は `node scripts/shonin-public-check.mjs` で再実行できます。
