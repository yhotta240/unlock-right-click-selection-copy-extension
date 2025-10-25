# Chrome Extension Starter Kit

これは，TypeScript と webpack を使用して Chrome 拡張機能を開発するためのスターターキットです．

## 特徴

- **TypeScript 対応**: 静的型付けにより，開発効率とコードの品質を向上させます．
- **webpack 導入済み**: TypeScript ファイルを JavaScript にコンパイルし，ファイルをバンドルします．
- **基本的なファイル構成**: 開発をすぐに開始できるよう，必要なファイルが揃っています．

## 必要条件

- [Node.js](https://nodejs.org/) (v18.x 以上を推奨)
- [npm](https://www.npmjs.com/) または [yarn](https://yarnpkg.com/)

## 依存関係のインストールとビルド手順

1.  **リポジトリをクローン**:

    ```bash
    git clone https://github.com/yhotamos/chrome-extension-starter-kit
    cd chrome-extension-starter-kit
    ```

2.  **依存関係をインストール**:

    ```bash
    npm install
    ```

3.  **ビルド**:
    以下のコマンドを実行すると，`src`ディレクトリのファイルがコンパイルされ，`dist`ディレクトリに成果物が出力されます．
    ```bash
    npm run build
    ```
    開発中は，ファイルの変更を監視して自動でビルドする watch モードが便利です．
    ```bash
    npm run watch
    ```

## 開発ガイド

### ロジックを書く場所

拡張機能のコア処理は `src/` ディレクトリに記述します．

- `src/background.ts`
  バックグラウンドで常駐し，イベント処理や状態管理を行います．
- `src/content.ts`
  Web ページに挿入され，DOM 操作やページとのやり取りを行います．
- `src/popup.ts`
  ポップアップ（`popup.html`）に関連する処理を記述します．
- `src/components/`
  UI コンポーネントや共通処理をまとめる場所です．

### 設定・UI を編集するファイル

- **マニフェストファイル**
  `public/manifest.json`
  拡張機能の名前，バージョン，権限（permissions），アイコンなどを定義します．

- **ポップアップの UI**

  - `public/popup.html` : ポップアップの HTML 構造を記述します．
  - `public/popup.css` : ポップアップのスタイルを定義します．
  - UI 開発については [Bootstrap](https://getbootstrap.com/) を利用しています．必要に応じて追加，変更してください．

- **アイコン**
  `public/icons/` にアイコンファイルを配置します．
  使用サイズを揃え，`manifest.json` で参照してください．

## 開発の流れ（例）

1. `src/` に処理を追加・修正します．
2. `public/manifest.json` を編集して拡張機能の設定を変更します．
3. `npm run build` を実行して `dist/` ディレクトリを生成します．
4. Chrome の「拡張機能」ページ（`chrome://extensions/`）を開き，右上の「デベロッパーモード」をオンにします．
5. 「パッケージ化されていない拡張機能を読み込む」をクリックし，`dist/` ディレクトリを選択します．
6. Chrome 上で拡張機能の動作を確認します．

> **補足**: コードを修正した場合は，再度 `npm run build` を実行し，拡張機能管理ページのリロードボタンを押して更新してください．
> `npm run watch` を実行している場合は，修正時に自動でビルドされます．
Chengelogをポップアップに反映させる