# pteraroron

## 概要

puppeteer-coreを使用してYoutubeLiveのアーカイブのライブチャットを取得する。  
WindowsかつChromeがインストール済みでなければ動かない。

```sh
# tsのコンパイル
tsc
# dist/index.jsの実行
node dist/index.js
```

## メッセージの抽出

```sh
node dist/extract-message.js
```

上記のコマンドで`./video`ディレクトリに格納されたライブチャットの情報を`./message`ディレクトリに出力します。  
出力されたファイルは単純なテキスト形式のデータになっているので自然言語処理などがしやすい形になっています。