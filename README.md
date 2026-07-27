# Claude Fable 5について

[Slidev](https://sli.dev/) 製のスライド。公式サイトのスナップショットをスライド内に表示し、
スライド送りに合わせて該当箇所をハイライト + 和訳ポップオーバーで解説するギミック付き。

## 使い方

```sh
bun install
bun run dev   # http://localhost:3030
```

→ / Space でハイライトが次々と進み、← で戻る。

## 仕組み

- `public/snapshots/*.html` — 公式ページのスナップショット。`<script>` を除去した静的HTML。
  CSS・フォント・画像は `*_assets/` に同梱（フォントはCORSの都合でホットリンク不可。
  画像はsrcsetから表示に十分な解像度を1つ選んで保存）。
- `components/WebHighlight.vue` — スナップショットを同一オリジンのiframeで表示し、
  クリック数（`$clicks`）に応じて対象要素のハイライト・ポップオーバー挿入・スクロールを行う。
  iframeは現在スライドの前後1枚だけマウントしてメモリを節約。
- `highlights.ts` — ハイライトシナリオ定義。`find`（ページ内テキストの部分一致）で対象を特定し、
  `note` の和訳をポップオーバー表示する。**steps数を変えたら slides.md の `clicks:` も合わせること。**

## コンテンツの編集

1. `highlights.ts` の該当シナリオに step を追加・編集（`find` はスナップショット内の
   一意なテキスト断片にする。空白・引用符の揺れは正規化される）
2. steps 数が変わったら `slides.md` の対応スライドの `clicks:` を更新

## スナップショットの再取得

```sh
bun run snapshot <url> <name>
# 例
bun run snapshot https://www.anthropic.com/news/claude-fable-5-mythos-5 news
```

## 全ステップの一括スクリーンショット（確認用）

```sh
bun run dev &        # devサーバを起動した状態で
bun scripts/capture.ts   # tmp/captures/ に出力
```
