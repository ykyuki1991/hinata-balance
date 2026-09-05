# ひなたバランス

全身写真を積む非公式ファンゲーム。写真の権利は各権利者に帰属します。

**[ゲームを開く](https://ykyuki1991.github.io/hinata-balance/)** — iPhoneのSafariからも利用できます。

## 起動

Node.js 22以降で `npm ci` → `npm run dev`。本番版は `npm run build` → `npm run preview`。このMacでは `start.command` も使用できます。

ドラッグして離して配置。左右ボタンまたはQ/Eで15度回転。PCは矢印で移動、Enter/Spaceでも配置できます。再挑戦は同じメンバー順です。

|モード|人数|板幅|支点ばね|摩擦倍率|安定確認|
|---|---:|---:|---:|---:|---:|
|NORMAL|10|288|0.60|1.00|0.80秒|
|HARD|15|256|0.34|0.94|0.85秒|
|ALL MEMBERS|27|304|0.54|1.00|0.80秒|

中央固定Constraintの動的シーソー。人数に応じた急な妨害はありません。左右荷重、接触、回転、安定区間を計算します。水平でも端へ大きくはみ出す配置はPERFECTになりません。

## 改善と検証

今回の追加3ラウンドは [docs/strategy-review.md](docs/strategy-review.md)。8順×4戦略のログは `docs/strategy-final.json`、実操作は `docs/live-strategy-results.json`。前回の履歴は `docs/game-design-review.md`。

`npm test` / `npm run lint` / `npm run build`。`npm run test:browser` は5173のdevと4173のルート版previewを使用。Chromeの標準Macインストールが必要です。

`?debug=true` のconsoleに `[hinata-play]` JSONログを出します。playID、モード、順番、人数、メンバー、配置角度、X座標、傾斜、評価、スコア、落下理由、クリア、時間を記録。外部送信しません。

## Pages / iPhone / PWA

`.github/workflows/deploy.yml` はmainへのpushでnpm ci / lint / test / buildを行い、GitHub公式Pages Actionsで公開します。Settings → Pages → SourceをGitHub Actionsに設定します。

公開用ビルド: `VITE_BASE_PATH=/hinata-balance/ npm run build`。ルート版は環境変数なし。画像、アイコン、manifest、SWは同じbaseに対応します。

公開相当検証: `VITE_BASE_PATH=/hinata-balance/ npm run preview -- --port 4174` と `GAME_URL=http://127.0.0.1:4174/hinata-balance/ node scripts/pages-check.mjs`。公開後はGAME_URLを実URLに置換して再検証します。ローカル合格を公開URL合格とは扱いません。

Safariで上記URLを開き、共有→ホーム画面に追加。standalone / portrait / safe-area対応。公開HTTPS上でスマホ相当のタッチ操作とオフライン起動を確認済みです。iPhone実機での確認は未実施です。

画像は480px高のWebP、内容ハッシュ付きファイル名。Workboxが変更ファイルと旧キャッシュを管理。起動・復帰・オンライン復帰・60秒ごとにSW更新を確認。ゲーム中は切替を延期し、終了またはホームへ戻ると反映します。記録はlocalStorageに保持。SETTINGSにバージョン表示。

## 画像と再加工

27人分のWebPを `public/assets/members/` に同梱。起動時の再取得は不要です。出典と加工情報は `scripts/photo-sources.json` / `scripts/member-report.json`。公開公式ブログのみで、ログイン・課金・会員限定素材の取得は行いません。

Pillow・rembg[cpu]を入れた環境で `scripts/prepareBlogPhotos.py`、続いて `npm run members:update`。元写真・透過中間画像・モデルは `.cache/` に保存しGit対象外。全員の全身を目視確認してから再生成します。

## 制約

- 凸輪郭に簡略化するため袖・脚の間のくぼみはありません。
- NEXTの有利さは小標本で一定ではなく、外部プレイヤー検証が必要です。
- 実写真の全員クリアはNORMALで確認。HARD/ALLは途中までの実操作と、小矩形fixtureによる最終人数・保存処理テストを分けています。
- 公開HTTPSでは27画像・3モードのタッチ操作・保存・オフラインPWAを検証。iPhone実機での操作とホーム画面追加は未確認。
- 記録はブラウザごと。localhostの記録は公開先へ自動移行しません。ブラウザデータ削除で消える場合があります。

## 追加ゲーム: 承認防衛線

**[承認防衛線 — 未処理、接近中。を遊ぶ](https://ykyuki1991.github.io/hinata-balance/shonin-defense/)** — 全方向から迫る申請を、移動と差戻しで切り抜けるアリーナシューティング。指一本の移動・自動照準・近距離承認・決裁印の回収で、約2〜3分に判断を凝縮。仕様は [docs/shonin-defense.md](docs/shonin-defense.md)、調査と再設計の理由は [docs/shonin-v3-design.md](docs/shonin-v3-design.md)。既存のひなたバランスとは独立しています。
