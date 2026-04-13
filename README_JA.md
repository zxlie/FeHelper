# FeHelper - フロントエンドヘルパー

<div align="center">

![FeHelper Logo](https://user-images.githubusercontent.com/865735/75407628-7399c580-594e-11ea-8ef2-00adf39d61a8.jpg)

**30+ の開発者向けツール | Chrome / Edge / Firefox ブラウザ拡張機能**

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/pkgccpejnmalmdinmhkkfafefagiiiad?label=Chrome&logo=googlechrome&color=3b82f6&style=for-the-badge)](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/pkgccpejnmalmdinmhkkfafefagiiiad?label=Users&logo=googlechrome&color=3b82f6&style=for-the-badge)](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad)
[![GitHub Stars](https://img.shields.io/github/stars/zxlie/FeHelper?style=for-the-badge&color=8b5cf6&logo=github)](https://github.com/zxlie/FeHelper)
[![開発履歴](https://img.shields.io/badge/since-2012-f59e0b?style=for-the-badge&logo=calendar&logoColor=white)](https://github.com/zxlie/FeHelper)
[![CI](https://img.shields.io/github/actions/workflow/status/zxlie/FeHelper/ci.yml?style=for-the-badge&label=CI&logo=githubactions&logoColor=white)](https://github.com/zxlie/FeHelper/actions)

**[中文](README.md) | [English](README_EN.md) | [한국어](README_KO.md)**

[公式サイト](https://fehelper.com) · [オンラインドキュメント](https://fehelper.com/docs.html) · [問題の報告](https://github.com/zxlie/FeHelper/issues)

</div>

---

## 機能一覧

### JSON 処理
| 機能 | 説明 |
|------|------|
| JSON フォーマット | 自動/手動フォーマット、シンタックスハイライト、折りたたみ/展開、ノードパス、BigInt で精度を損なわない |
| JSON 比較 | 2 つの JSON の構造化された差分比較、差分をハイライト |
| JSON を Excel に | JSON データをワンクリックで Excel 表に変換 |

### エンコード/デコード
| 機能 | 説明 |
|------|------|
| Unicode | 中国語 ↔ `\uXXXX` の相互変換 |
| URL / UTF-8 / UTF-16 | `%XX` / `\xXX` のエンコード/デコード |
| Base64 | エンコードとデコード |
| Hex | 文字列 ↔ 16 進数 |
| MD5 / SHA1 | ハッシュ計算 |
| Gzip | CompressionStream API による圧縮/解凍 |
| JWT | Header + Payload + Sign のデコード |
| Cookie | JSON 形式に整形 |
| HTML エンティティ | 通常/深いエンコードとデコード |
| 文字列エスケープ | `\n` `\t` `\"` などのエスケープ/アンエスケープ |

### 開発・デバッグ
| 機能 | 説明 |
|------|------|
| コード整形 | JavaScript / CSS / HTML / XML / SQL のコードフォーマット |
| コード圧縮 | HTML / JS / CSS の圧縮 |
| 正規表現 | リアルタイムでのマッチと置換テスト |
| 簡易 Postman | GET / POST / HEAD の API デバッグ |
| WebSocket | WebSocket 接続テストとメッセージ解析 |
| ユーザースクリプト | ページへのスクリプト注入 |

### 変換ツール
| 機能 | 説明 |
|------|------|
| タイムスタンプ変換 | Unix ↔ 日付の相互変換、複数タイムゾーンの世界時計、Windows FILETIME の相互変換 |
| 基数変換 | 2/4/8/10/16 進数の相互変換、BigInt による超大整数の精度を損なわない変換 |
| 色変換 | HEX / RGB / HSL / HSV の相互変換、透明度に対応 |

### 画像と生成
| 機能 | 説明 |
|------|------|
| QR コード | 生成（ロゴ・色・サイズのオプション）とスキャンによるデコード |
| バーコード | Code128 / Code39 / EAN-13 / EAN-8 / UPC / ITF-14 |
| UUID / ID ジェネレーター | UUID v4、スノーフレーク ID（生成 + 解析）、NanoID |
| 画像 Base64 | 画像 ↔ Base64 の相互エンコード |
| ウェブページのスクリーンショット | 表示領域 / 全ページのスクロールキャプチャ |
| カラーピッカー | 任意の要素から色値を取得 |
| SVG 変換 | SVG ↔ PNG など形式の変換 |

### その他のツール
| 機能 | 説明 |
|------|------|
| AI アシスタント | コード最適化、設計案、資料検索 |
| Mock データ | 氏名、携帯電話、身分証、住所などのテストデータ生成 |
| ランダムパスワード | 長さ・文字種のカスタマイズ |
| メモ・付箋 | カテゴリ別の管理、インポート/エクスポート |
| Markdown 変換 | HTML → Markdown、PDF ダウンロード |
| ポスター作成 | 複数テンプレートのポスターデザイン |
| チャート作成 | 複数のチャート種類、データ可視化 |
| ページパフォーマンス | ページ読み込み時間の分析 |

---

## 最近の更新

### v2026.04 の主な改善

**新機能**
- バーコード生成（Code128 / EAN-13 / UPC など 6 形式）
- UUID v4 / スノーフレーク ID / NanoID ジェネレーター（新規ツールページ）
- Windows FILETIME ↔ 日付の相互変換
- 文字列エスケープ/アンエスケープのエンコード/デコード
- 基数変換の BigInt 対応（超大整数を精度を損なわずに）

**セキュリティ強化**
- プロジェクト全体で evalCore の動的実行を安全な方式に置き換え
- Toast / innerHTML における XSS 注入の修正
- Content Script の注入ロジックの最適化（誤用していた API を `insertCSS` に置き換え）
- `_codeBeautify` の fileType ホワイトリスト検証

**コア修正**
- JSON BigInt の精度を損なわない処理（純関数モジュール `json-utils.js`）
- Service Worker のスリープ問題（`setTimeout` を `chrome.alarms` に置き換え）
- Content Script を `document_idle` + `all_frames: false` に変更し、Google Meet などのサイトでのクラッシュを修正
- タイムスタンプ `0` の検証修正
- コード整形における `let`/`const` 構文の互換性

**エンジニアリング**
- 単体テスト：Vitest + 79 テストケース
- CI/CD：GitHub Actions による自動テスト
- ESLint によるコード規約
- 無効な依存関係・デッドコードの整理
- Babel の target を Chrome 58 → 100 に変更

---

## インストール

### ブラウザストア（推奨）

| ブラウザ | インストール先 |
|--------|----------|
| Chrome | [Chrome Web Store](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad) |
| Edge | [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/fehelper%E5%89%8D%E7%AB%AF%E5%8A%A9%E6%89%8B/pkgccpejnmalmdinmhkkfafefagiiiad) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/fehelper-%E5%89%8D%E7%AB%AF%E5%8A%A9%E6%89%8B/) |

### ソースからインストール

```bash
git clone https://github.com/zxlie/FeHelper.git
cd FeHelper
npm install
npm test        # テストを実行
```

`chrome://extensions/` を開く → デベロッパーモードを有効にする → パッケージ化されていない拡張機能を読み込む → `apps` ディレクトリを選択します。

### オフラインインストール

[Chrome-Stats](https://chrome-stats.com/d/pkgccpejnmalmdinmhkkfafefagiiiad) から CRX または ZIP をダウンロードし、`chrome://extensions/` ページにドラッグ＆ドロップしてインストールします。

---

## 開発

```bash
npm install          # 依存関係のインストール
npm test             # Vitest 単体テストを実行
npm run test:watch   # テストのウォッチモード
npm run test:coverage # カバレッジレポート
npx eslint apps/     # コード規約チェック
```

### プロジェクト構成

```
FeHelper/
├── apps/                    # 拡張機能のソース
│   ├── manifest.json        # Chrome Extension MV3 マニフェスト
│   ├── background/          # Service Worker
│   ├── popup/               # ポップアップパネル
│   ├── options/             # 設定ページ + ツールマーケット
│   ├── json-format/         # JSON フォーマット
│   ├── en-decode/           # エンコード/デコード
│   ├── timestamp/           # タイムスタンプ
│   ├── trans-radix/         # 基数変換
│   ├── qr-code/             # QR コード + バーコード
│   ├── uuid-gen/            # UUID / スノーフレーク ID
│   ├── code-beautify/       # コード整形
│   └── ...                  # その他のツール
├── test/                    # Vitest 単体テスト
├── .github/workflows/       # CI/CD
├── vitest.config.js
├── eslint.config.js
└── package.json
```

### コントリビューション

1. 本リポジトリを Fork する
2. ブランチを作成：`git checkout -b feature/your-feature`
3. 変更をコミット：`git commit -m 'Add some feature'`
4. プッシュ：`git push origin feature/your-feature`
5. Pull Request を作成する

---

## 連絡先

- 公式サイト：[fehelper.com](https://fehelper.com)
- メール：xianliezhao@foxmail.com
- WeChat：398824681
- フィードバック：[GitHub Issues](https://github.com/zxlie/FeHelper/issues)

## ライセンス

[MIT License](LICENSE)

---

<div align="center">

**FeHelper がお役に立ったら、Star をお願いします！**

[![Star History Chart](https://api.star-history.com/svg?repos=zxlie/FeHelper&type=Date)](https://star-history.com/#zxlie/FeHelper&Date)

</div>
