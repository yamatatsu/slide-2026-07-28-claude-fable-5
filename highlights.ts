/**
 * 各スライドのハイライトシナリオ定義。
 *
 * - `find`: スナップショット内のテキスト断片（空白正規化後の部分一致）で
 *   ハイライト対象の要素を特定する。最も内側（テキストが最短）の要素が選ばれる。
 * - `note`: ポップオーバーに表示する和訳・解説。
 * - `title`: ポップオーバーの見出し（省略可）。
 *
 * スライド送り（クリック）1回ごとに steps が1つずつ進む。
 * slides.md 側の `clicks:` は steps の数と一致させること。
 */
export interface Step {
  find: string
  note: string
  title?: string
}

export interface PageScenario {
  /** public/ 配下のスナップショットパス */
  src: string
  /** iframe内でレンダリングする仮想ビューポート幅(px) */
  width?: number
  /** 邪魔な固定要素などを隠すCSSセレクタ */
  hide?: string[]
  /** クリック0（ハイライト開始前）の表示位置を決めるテキスト。省略時はページ先頭 */
  start?: string
  steps: Step[]
}

export const registry: Record<string, PageScenario> = {
  // ───────── Claude Fable 5とは（ニュース記事） ─────────
  about: {
    src: '/snapshots/news.html',
    hide: ['header', 'nav'],
    steps: [
      {
        find: 'capabilities exceed those of any model',
        title: '過去最高の能力',
        note: 'Fable 5の能力は、これまで一般提供されたどのモデルをも上回ります。ソフトウェア開発・ナレッジワーク・視覚・科学研究など、ほぼすべてのベンチマークで最高水準（SOTA）です。',
      },
      {
        find: 'Releasing a model this capable comes with risks',
        title: 'セーフガード付きで公開',
        note: 'これほど高性能なモデルの公開にはリスクが伴います。一部のトピックへの質問には、次点のモデル Claude Opus 4.8 が代わりに応答するセーフガードを設けています（発動はセッションの5%未満）。',
      },
    ],
  },

  // ───────── Claude Opus 5とは（ニュース記事 / Fable 5との比較） ─────────
  'opus5-vs-fable': {
    src: '/snapshots/opus5.html',
    hide: ['header', 'nav'],
    // start: 'Claude Opus 5 is available today',
    steps: [
      {
        find: 'comes close to the frontier intelligence of Claude Fable 5 at half the price',
        title: 'Fable 5に迫る知能を半額で',
        note: 'Opus 5は思慮深く先回りするモデルで、Claude Fable 5のフロンティア知能に半分の価格で肉薄します。',
      },
      {
        find: "performs within 0.5% of Fable 5's peak score, but at half the cost per task",
        title: 'ベンチマークでもほぼ互角',
        note: 'CursorBench 3.2のmax effortで、Opus 5はFable 5のピークスコアの0.5%以内に迫りつつ、タスクあたりのコストは半分です。',
      },
      {
        find: "surpassing Fable 5's best result at just over a third of the cost",
        title: 'コンピュータ操作ではFable 5超え',
        note: 'OSWorld 2.0（コンピュータ操作ベンチマーク）では、Fable 5のベスト結果をコスト1/3強で上回っています。',
      },
      {
        find: 'better than Opus 4.8, Sonnet 5, or Fable 5',
        title: 'アライメントは過去最高',
        note: 'Opus 5は自動行動監査で過去最もアラインしたモデルと評価されました。Claude憲法への遵守はOpus 4.8・Sonnet 5・Fable 5のいずれよりも優秀です。',
      },
    ],
  },

  // ───────── Mythos 5との違い（APIドキュメント） ─────────
  'vs-mythos': {
    src: '/snapshots/docs.html',
    start: 'capabilities, API changes, and availability',
    steps: [
      {
        find: 'includes safety classifiers that can decline requests. Claude Mythos 5 does not',
        title: '唯一にして最大の違い',
        note: 'Fable 5は「安全分類器（safety classifiers）」を含み、リクエストを拒否することがあります。Mythos 5にはこの分類器がありません。モデル自体は同一です。',
      },
      {
        find: 'Shares Claude Fable 5',
        title: 'Mythos 5とは',
        note: 'Mythos 5はFable 5と同じ能力を、安全分類器なしで提供するモデル。Project Glasswing経由の限定提供で、Claude Mythos Previewの後継にあたります。',
      },
      {
        find: 'plan for three changes',
        title: 'インテグレーションへの影響',
        note: 'Fable 5を呼び出す場合は3つの変更に備える必要があります: ①拒否レスポンスの処理 ②別のClaudeモデルへのフォールバック ③新しい課金ルール。',
      },
      {
        find: 'share the same specs and pricing',
        title: 'スペックと価格は同一',
        note: '2つのモデルはスペックも価格も共通です。違いは安全分類器の有無だけです。',
      },
      {
        find: 'offered in limited availability to approved customers',
        title: '提供範囲の違い',
        note: 'Fable 5はClaude APIで一般提供（GA）。一方Mythos 5はGAではなく、承認済み顧客のみへの限定提供です。',
      },
    ],
  },

  // ───────── token消費とコスト（製品ページ） ─────────
  cost: {
    src: '/snapshots/fable.html',
    hide: ['header', 'nav'],
    steps: [
      {
        find: '$10 per million input tokens and $50 per million output tokens, with the existing 90%',
        title: '基本価格',
        note: '入力 $10 / 100万トークン、出力 $50 / 100万トークン。プロンプトキャッシュによる入力90%割引も従来どおり適用されます。',
      },
      {
        find: 'US-only inference is available at 1.1x pricing',
        title: '米国内限定推論',
        note: '米国内でのみ推論を行う必要があるワークロード向けに、入出力ともに1.1倍の価格でUS限定推論を利用できます。',
      },
      {
        find: "You won't be charged Fable prices for rerouted requests",
        title: '再ルーティング時の課金',
        note: 'セーフガードによりOpus 4.8へ再ルーティングされたクエリには、Fable 5の価格は課金されません。',
      },
      {
        find: 'Using Fable requires 30-day data retention',
        title: 'データ保持の要件',
        note: 'Fable 5の利用には、安全性モニタリングのための30日間データ保持が必須です（ゼロデータ保持は選択不可）。運用要件として押さえておきましょう。',
      },
    ],
  },
}
