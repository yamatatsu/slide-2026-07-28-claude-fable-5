---
theme: default
title: Claude Fable 5について
info: |
  Claude Fable 5 の紹介スライド。
class: text-center
colorSchema: light
drawings:
  persist: false
transition: slide-left
mdc: true
---

# Fable 5 の<br>フォールバックについて

やまたつ

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

1. Fable5のフォールバックについて
1. Fable5でフロントエンドからインフラまで作ってみた
1. いつフォールバックするか

---
layout: center
---

# Fable5のフォールバックについて

---
layout: full
clicks: 2
---

<div class="h-full flex flex-col gap-3 p-6 pb-8">
  <div class="flex items-baseline gap-4">
    <h2 class="!m-0 !text-2xl">Fable 5のフォールバック</h2>
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

### なにか作ってみよう 🤔

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

## できたもの紹介

---
layout: full
---

### できたもの

<SlidevVideo controls autoplay preload="auto">
  <source src="/public/demo.mp4" type="video/mp4" />
</SlidevVideo>

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

---
layout: center
---

Yjsとは

- 共同編集のライブラリ
- 分散システムに向いてる
- JavaScriptで実装されている
- awarenessをサポート
- undo/redoをサポート

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

- claudeのログはjsonl形式でセッションごとに記録される
- フォールバック発生時にはjsonに`"subtype": "model_refusal_fallback"`が現れる
- duckdbで複数jsonlをまとめて探索
- Anthropic公式Skillに`duckdb-skills`がある

---
layout: center
---

# 結果

---
layout: center
---

### 結果

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

### 考察

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

### 😇

---
layout: center
---

### Opus 5でも同じものを実装してみました

---
layout: center
---

### 結果

---
layout: center
---

| 使用モデル | 実装時間 | コスト | 品質 | 
| ---       | ---     | ---   | ---  |
| Fable 5   | 6時間弱  | $600  | ---  |
| Opus 5    | 8.5時間  | $303  | awarenessなし、矢印キーやEnterキーでの操作はサポートされず |
