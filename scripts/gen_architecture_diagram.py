"""
AppSync Events と Yjs によるリアルタイム同期構成図を
Python diagrams (AWS公式アイコン) で生成する。

出力: public/appsync_events_yjs_sync_architecture.png
"""

from diagrams import Diagram, Cluster, Edge
from diagrams.aws.mobile import Appsync
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb
from diagrams.aws.general import Client

graph_attr = {
    "fontname": "Hiragino Sans, sans-serif",
    "bgcolor": "transparent",
    "pad": "0.5",
    "nodesep": "0.7",
    "ranksep": "0.9",
    "splines": "spline",
    "labelloc": "t",
    "fontsize": "18",
    "compound": "true",
}

CLIENTS_LABEL = "Clients (ブラウザアプリ)"

node_attr = {
    "fontname": "Hiragino Sans, sans-serif",
    "fontsize": "13",
}

edge_attr = {
    "fontname": "Hiragino Sans, sans-serif",
    "fontsize": "11",
    "color": "#89877f",
}

with Diagram(
    "AppSync Events と Yjs によるリアルタイム同期構成",
    filename="public/appsync_events_yjs_sync_architecture",
    outformat="png",
    show=False,
    direction="LR",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    with Cluster(CLIENTS_LABEL):
        clients = [
            Client("Client A"),
            Client("Client B"),
            Client("Client C"),
        ]
    clients_cluster_name = "cluster_" + CLIENTS_LABEL

    appsync = Appsync("AppSync Events\n(WebSocket pub/sub)")

    onpublish_lambda = Lambda("onPublish Lambda\n(AppSyncトリガー)")

    # update log と snapshot を保持する単一テーブル
    table = Dynamodb("DynamoDB (単一テーブル)\nupdate log + snapshot")

    compact_lambda = Lambda("圧縮Lambda\n(バウンス起動・Yjs実行)")

    # ブラウザから直接呼ばれる Lambda HTTP endpoint (AppSyncとは無関係)
    sync_lambda = Lambda("同期Lambda\n(Lambda HTTP endpoint)")

    # クライアント群 -> AppSync (WebSocket接続でpublish)
    # クラスタ境界から1本にまとめる (ltail でクリップ)
    clients[2] >> Edge(label="WebSocket", ltail=clients_cluster_name) >> appsync

    # AppSync -> onPublish Lambda -> DynamoDB
    appsync >> Edge(label="トリガー") >> onpublish_lambda
    onpublish_lambda >> Edge(label="update log 書き込み") >> table

    # DynamoDB -> 圧縮Lambda -> DynamoDB (同一テーブルに snapshot 書き込み)
    table >> Edge(label="バウンス起動") >> compact_lambda
    compact_lambda >> Edge(label="snapshot 書き込み") >> table

    # 同期Lambda は DynamoDB を読み込む
    sync_lambda >> Edge(label="snapshot + delta 読込") >> table

    # ブラウザ群 <-> 同期Lambda (HTTP endpoint 呼び出し・返却)
    # クラスタ境界から1本にまとめる (ltail でクリップ)
    clients[0] >> Edge(
        label="HTTP / snapshot + delta",
        color="#534ab7",
        style="bold",
        dir="both",
        ltail=clients_cluster_name,
    ) >> sync_lambda
