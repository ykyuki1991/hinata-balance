# GitHub Pages 公開検証

- Public repository: https://github.com/ykyuki1991/hinata-balance
- Game: https://ykyuki1991.github.io/hinata-balance/
- Branch: main
- Release: v1.1.1
- GitHub PagesのSourceはGitHub Actions。HTTPS強制。

## デプロイ

初回pushのnpm ci・lint・13テスト・buildは成功。Pages未有効によるconfigure-pages失敗を、Source設定後に再実行して解消。

- 初回公開成功: https://github.com/ykyuki1991/hinata-balance/actions/runs/33962321416 （attempt 2）
- v1.1.1のpushによる自動公開成功: https://github.com/ykyuki1991/hinata-balance/actions/runs/33962635476

CLIは未認証のため、リポジトリ作成とPages設定は既存ログイン済みブラウザ、pushはGitHub Desktopの既存認証を使用。新しい認証情報は発行していない。

## 公開URLでの結果

Chromiumの390×844・タッチ環境で3モードの配置・15度回転・スクロール抑制を確認。27画像・JS・CSS・アイコン・manifest・SWに404なし。写真はWebP計約824KB。

公開NORMALを実際のボタン・マウス入力で10人クリア、2090点。次に同順リトライと実際の落下を確認。リロード後は2プレイ・1クリア・最高2090点を保持。生ログはpublic-play-check.json。

同じブラウザを開いたままv1.1.0→v1.1.1を公開。プレイ中は旧版を維持、終了時に自動更新、設定を保持。新版のオフライン起動にも成功。生ログはpublic-update-check.json。

WebKit 26.6のiPhone 13相当表示でも3モード・タッチ回転・ポインター配置・画像・保存・Service Worker登録は成功。WebKitのsetOffline後の再読み込みは内部エラーで未合格。詳しい切り分け結果はwebkit-public-check.json。

## 実機確認の限界

iPhone実機Safari、実際のホーム画面追加、standalone起動は未実施。manifestのstandalone/start_url/scope、apple-touch-icon、safe-areaは確認済み。WebKitのエミュレーションを実機検証とは扱わない。

SafariでゲームURLを開き、共有→ホーム画面に追加するとインストールできる構成。初回はオンラインで開く。ローカル版の記録と公開サイトの記録は別の保存領域。
