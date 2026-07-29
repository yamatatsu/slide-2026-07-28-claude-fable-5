---
theme: default
title: Claude Fable 5について
favicon: https://yamatatsu.github.io/slide-2023-03-13-devio-day-one/yamatatsu.png
info: |
  Claude Fable 5 の紹介スライド。
class: text-center
colorSchema: light
drawings:
  persist: false
transition: slide-left
mdc: true
---

## Fable 5 のフォールバックについて

2026-07-30 / やまたつ
#### Claude Code セミナー ~ Claude Fable 5編 ~

---
layout: center
---

自己紹介

<img src="/public/やまたつ.jpg" width=200 />

---
layout: center
---

<img src="/public/aws-cdk.png" width=400 />

---
layout: center
---

### 簡単な目次

<br>

1. Fable 5 のフォールバックについて
1. Fable 5 でフロントエンドからインフラまで作ってみた
1. いつフォールバックするか

---
layout: center
---

# Fable 5 のフォールバックについて

---
layout: full
clicks: 2
---

<div class="h-full flex flex-col gap-3 p-6 pb-8">
  <div class="flex items-baseline gap-4">
    <h2 class="!m-0 !text-2xl">Fable 5について</h2>
    <span class="text-xs op50 font-mono">anthropic.com/news/claude-fable-5-mythos-5</span>
  </div>
  <WebHighlight name="about" class="flex-1 min-h-0" />
</div>

---
layout: center
---

## どれくらいフォールバックするんだろう？ 🤔

---
layout: center
---

### なにか作ってみよう 💡

---
layout: center
---

### なにか作ってみよう

以下を含むもの

- インフラ(IaC)
- バックエンド
- フロントエンド
- デプロイ
- テスト

---
layout: center
---

## できたもの紹介（デモ）

---
layout: full
---

### できたもの

<SlidevVideo controls autoplay preload="auto">
  <source src="/public/demo.mp4" type="video/mp4" />
</SlidevVideo>

---
layout: center
---

何を作ったのか

- Googleスプレッドシート的な何か
- CRDT（共同編集アルゴリズム）
- サーバーレス

<!--
---
layout: full
---

## Yjsとは

<br>
<v-clicks>
  <span>共同編集におけるデータコンフリクトを解決するためのライブラリです。</span>
  <span>CRDT(Conflict-free Replicated Data Type)というデータ構造を用いて、データの整合性を保証します。</span>
  <span>
    Google Docsなどで使われているOT(Operational Transformation)は編集操作を順番に適用していくことでデータの整合性を保証するため、順序を保証する中央サーバーが必要になります。一方CRDTは編集操作を順番に適用することなく、結果整合的にデータの整合性を保証します。そのため順序を保証する中央サーバーが不要で、分散システムに適した手法です。またOTに比べて複雑なデータ構造を管理することに向いていると言われています。
  </span>
  <span>
    YjsはJavaScriptで実装されたCRDTライブラリで、ブラウザ上で動作する共同編集サービスを構築するためのライブラリです。各ユーザーはupdate（更新）と呼ばれる冪等性、可換性、結合性を備えたバイナリデータをお互いに送信し合うことで、たとえ同時に編集されたとしてもデータの整合性を保証することができます。updateは冪等なので通信上で輻輳があってもデータが破損せず、可換性と結合性をもつのでデータ転送が一部で遅延しても、最終的に同じupdateを手に入れたノードたちはすべて同じ状態に収束します。
  </span>
  <span>
    awarenessと呼ばれるユーザー同士の位置情報を送信し合う仕組みも提供されているため、優れたユーザー体験での共同編集サービスを提供することができます。
  </span>
  <span>
    共同編集で必須なundo/redo機能もサポートされており、加えてWebRTC, WebSocketなどのプロトコル、IndexedDB, LevelDBなどのストレージ、React, Vueなどのフレームワーク、monaco, CodeMirrorなどのエディターなど、さまざまな技術との組み合わせに対応しています。
  </span>
</v-clicks>
-->

<!--
---
layout: center
---

Yjsとは

- 共同編集のライブラリ
- 分散システムに向いてる
- JavaScriptで実装されている
- awarenessをサポート
- undo/redoをサポート
-->

---
layout: full
---

## 構成

<img src="/public/appsync_events_yjs_sync_architecture.png" width="80%">

- Cognito（認証）
- 認可（ドキュメントに招待する方式）

---
layout: center
---

### 作ったものの説明終わり

---
layout: center
---

## 結果説明の前に

フォールバックが発生したことはどうやって調べるの？

---
layout: center
---

- Claude Codeのログはjsonl形式でセッションごとに記録される
- フォールバック発生時にはjsonに`"subtype": "model_refusal_fallback"`が現れる
- duckdbで複数jsonlをまとめて探索
- Anthropic公式Skillに`duckdb-skills`がある

---
layout: center
---

```jsonl {lines:true}
{"parentUuid":"xxx","isSidechain":false,"promptId":"xxx","type":"user","message":...}
{"parentUuid":"xxx","isSidechain":false,"attachment":{"type":"deferred_tools_delta",...}
{"parentUuid":"xxx","isSidechain":false,"attachment":{"type":"agent_listing_delta",...}
{"parentUuid":"xxx","isSidechain":false,"attachment":{"type":"mcp_instructions_delta",...}
{"parentUuid":"xxx","isSidechain":false,"attachment":{"type":"skill_listing",...}
{"parentUuid":"xxx","isSidechain":false,"message":{"model":"claude-opus-5",...}
{"parentUuid":"xxx","isSidechain":false,"message":{"model":"claude-opus-5",...}
{"parentUuid":"xxx","isSidechain":false,"attachment":{"type":"hook_success",...}
{"parentUuid":"xxx","isSidechain":false,"type":"system","subtype":"stop_hook_summary",...}
{"parentUuid":"xxx","isSidechain":false,"type":"system","subtype":"turn_duration",...}
{"type":"file-history-snapshot","messageId":"xxx","snapshot":{"messageId":"xxx",...}
{"parentUuid":"xxx","isSidechain":false,"promptId":"xxx","type":"user","message":...}
{"parentUuid":"xxx","isSidechain":false,"type":"system","subtype":"model_refusal_fallback",...}
```

---
layout: center
---

<div class="jsonl-wrap">

```jsonl {all|5|6|10-11}{lines:true}
{
  "parentUuid": "xxx",
  "isSidechain": false,
  "type": "system",
  "subtype": "model_refusal_fallback",
  "content": "Fable 5's safeguards flagged this message. Our intentionally broad safeguards allow us to deliver more capabilities faster, but can sometimes flag legitimate coding, cybersecurity, and biology tasks. Switched to Opus 5. Send feedback with /feedback or learn more: https://support.claude.com/en/articles/15363606",
  "level": "warning",
  "trigger": "refusal",
  "direction": "retry",
  "originalModel": "claude-fable-5",
  "fallbackModel": "claude-opus-5",
  "apiRefusalCategory": "cyber",
  "apiRefusalExplanation": null,
  "isMeta": false,
  "timestamp": "2026-07-29T11:53:33.949Z",
  "userType": "external",
  "entrypoint": "cli",
  "version": "2.1.220",
  "gitBranch": "main"
}
```

</div>

<style>
.jsonl-wrap {
  width: 900px;
  max-width: 100%;
  margin: 0 auto;
}
.jsonl-wrap .slidev-code,
.jsonl-wrap pre,
.jsonl-wrap code {
  white-space: pre-wrap !important;
  overflow-wrap: anywhere;
  word-break: break-all;
}
.jsonl-wrap .slidev-code {
  font-size: 0.5rem;
  line-height: 1.4;
}
</style>

---
layout: center
---

# 結果

---
layout: center
---

# 結果

- Agentの実行時間: 6時間弱
- コスト: $600
- フォールバック: なし

---
layout: center
---

## フォールバック: なし

---
layout: center
---

# フォールバック

---
layout: center
---

# なし

---
layout: center
---

# えっ？？🙃

---
layout: center
---

| **アクション**                                | **回数** |
| ----------------------------------------- | ------: |
| ファイル作成・編集                        | 412     |
| git commit / push                         | 19      |
| ブラウザ操作(Chrome MCP)                  | 21      |
| `cdk deploy`(実デプロイ)              | 5   |
| AWS を叩く統合テスト     | 12      |
| AWS CLI 実行(log調査やDynamoDBのデータ確認)| 8       |

---
layout: center
---

# 🙃

---
layout: center
---

# 考察 🙃

- グリーンフィールドだとセーフガードが余計な情報に引っ張られずに判定できる？
- ブラウンフィールドで過去にセキュリティチェックとかをやっていいると、それがコンテキスト載って引っかかってしまう？
- 7月初期に比べてセーフガードが改善されている？

---
layout: center
---

### 調査完了

---
layout: center
---

### と思ったら。。。

---
layout: center
---

<img src="/public/opus-5.png" width="500">

---
layout: center
---

# 😇

---
layout: full
clicks: 4
---

<div class="h-full flex flex-col gap-3 p-6 pb-8">
  <div class="flex items-baseline gap-4">
    <h2 class="!m-0 !text-2xl">Opus 5とFable 5</h2>
    <span class="text-xs op50 font-mono">anthropic.com/news/claude-opus-5</span>
  </div>
  <WebHighlight name="opus5-vs-fable" class="flex-1 min-h-0" />
</div>

---
layout: center
---

### Opus 5でも同じものを実装してみました

---
layout: center
---

## 進め方を合わせた

<br>

1. v3 設計ドキュメント作成
1. v3 実装 → デプロイ
1. v4 検証用フロントエンド実装
1. v5 設計
1. v5 実装 → デプロイ

---
layout: center
---

### できあがったものがこちら（デモ）

---
layout: center
---

# 結果

---
layout: center
---

|                      | Fable 5 | Opus 5 |
| -------------------- | ------: | -----: |
|実装時間|6時間弱|8.5時間|
|コスト|$600|$303|


---
layout: center
---

|                      | Fable 5 | Opus 5 |
| -------------------- | ------: | -----: |
| 手打ち指示           | 45      | 29     |
| 出力トークン         | 2.72 M  | 2.76 M |
| キャッシュ読込       | 240 M   | 660 M  |
| tool_use             | 1,054   | 1,667  |

<!--
総出力トークンはほぼ同じ(差1%)なのに、キャッシュ読込は Opus 5 が 2.7 倍でした。同じ量を書くために読み返す量が大きく違います。
差が最大なのは「v4フロントエンド実装」で、tool_use が 68 vs 310(4.6倍)、キャッシュ読込が 8.97M vs 103M(11.5倍)です。
-->

---
layout: center
---

**1指示あたりの API ターン数(中央値)**

| 粒度         | Fable 5 | Opus 5 |
| ------------ | ------: | -----: |
| 大タスク   | 30.5    | 68.0   |
| 小作業     | 6.5     | 27.0   |
| 質問・相談 | 2.5     | 11.0   |
| 継続       | 10.0    | 94.0   |
| 全体         | 6.0     | 25.0   |

<!--
**4粒度すべてで方向が一致し、逆転が1つもありません。** Phase 1 で「指示回数差は C1(学習効果)と不可分」と保留した点について、粒度を揃えても自走量の差は残ることが確認できました。完全な統制ではありませんが、粒度差だけでは説明できない差があります。差が最小なのは L(2.2×)で、**Opus 5 は小さい依頼や質問に対しても大きく動く**傾向が目立ちます。

**最も鮮明だったのは並列ツール発行率で、34.4% vs 8.5%。** Opus 5 はほぼ常に1ターン1ツール(1.09 件/ターン)で進みます。一方、連続実行チェーンの長さは両者ほぼ同じ(中央値2)でした。**違うのはチェーンの長さではなく本数**です。

-->

---
layout: center
---

**行動特性**

- **Write / Edit が 1.11 vs 0.67。** Write の絶対数はほぼ同じ(219 vs 222)なのに Edit は Opus 5 が 1.7 倍。Fable 5 は全体書き出し寄り、Opus 5 は部分編集の積み重ね。
- **編集対象領域の配分には差がほぼない** — 「どこを編集したか」ではなく「どう編集したか」に差が出ています。

---
layout: center
---

## 感想

Fable 5 使い放題の世界線に生まれ変わりたい 😇

---
layout: center
---

Opus 5 にお願いしてみた。

> 「転生したら Fable 5 が使い放題だったのでとりあえず無双してみた」  
> ってタイトルのラノベの書き出し3行を考えて

---
layout: center
---

> 目が覚めると、俺の手元には無限のトークンがあった。  
> 「制限なし、レート上限なし……つまり、この世界で最強ってことだよな?」  
> ——ただ一つ、誰も教えてくれなかった。この力には「安全装置」が付いているということを。

---
layout: center
---

# おわります！

---
layout: center
---

# ご清聴ありがとうございました 🙇🏻