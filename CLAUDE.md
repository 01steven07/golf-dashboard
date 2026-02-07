# Project Context: Golf Club Score Management App

## 1. プロジェクト概要

大学ゴルフ部（部員約50名）向けのスコア管理・分析アプリケーション。
従来Googleスプレッドシートで行っていた複雑なスコア管理とランキング集計をWebアプリ化し、入力の手間削減と分析の高度化を目指す。

- **目的:** 部内の競争活性化、個人の弱点分析、管理コストの削減。
- **ターゲット:** 部員（モバイル利用メイン）および管理者。
- **開発方針:** AI (Claude Code) との親和性を最優先し、開発速度と保守性を重視する。MVP開発。

## 2. 技術スタック (Tech Stack)

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **UI Components:** Shadcn/ui (Radix UI base), Lucide React (Icons)
- **Charts:** Recharts (レーダーチャート、折れ線グラフ用)
- **Backend / DB:** Supabase (PostgreSQL, Authは簡易利用, Storage)
- **AI / OCR:** Google Gemini 3.0 Flash (スコアカード画像解析、アドバイス生成)
- **Infrastructure:** Vercel (Hosting)
- **Local Env:** Dockerは使用しない。Node.jsローカル実行 + Cloud DB接続。

## 3. データベース設計 (Schema Design)

Supabase (PostgreSQL) を使用。

### Tables

1.  **members**
    - `id` (UUID, PK)
    - `name` (String, 表示名)
    - `grade` (Integer, 学年)
    - `pin_code` (String, 簡易認証用4桁)
    - `role` (Enum: 'admin', 'member')

2.  **courses**
    - `id` (UUID, PK)
    - `name` (String, コース名)
    - `pref` (String, 都道府県 - optional)

3.  **rounds**
    - `id` (UUID, PK)
    - `member_id` (FK -> members.id)
    - `course_id` (FK -> courses.id)
    - `date` (Date, ラウンド日)
    - `tee_color` (String: Blue, White, Red, etc.)
    - `weather` (String, 天候 - optional)
    - `image_url` (String, Supabase StorageのURL)

4.  **scores** (1ラウンド18レコード、またはJSONBで保持検討だが、分析重視のため正規化推奨)
    - `id` (UUID, PK)
    - `round_id` (FK -> rounds.id)
    - `hole_number` (1-18)
    - `par` (3, 4, 5)
    - `score` (Integer)
    - `putts` (Integer)
    - `fairway_keep` (Boolean)
    - `ob` (Integer, OB数)
    - `bunker` (Integer, バンカー数)
    - `penalty` (Integer, ペナルティ数)

## 4. 主要機能要件

### A. 認証 (Auth)

- メールアドレス認証などの厳密なAuthは**実装しない**。
- **セルフ登録**: `/register`で部員が自分で名前・学年・PINを登録可能。
- **ログイン**: `/login`で部員リストから選択し、PINコード（4〜8桁）を入力。
- **セキュリティ**: PINはbcryptでハッシュ化してDB保存。認証はAPI経由で行い、ハッシュをクライアントに露出しない。
- 認証後の `member` 情報をLocalStorageに保存して永続化する。

### B. スコア入力 (Input via OCR)

1.  ユーザーがスコアカード画像（写真またはスクショ）をアップロード。
2.  **Gemini 3.0 Flash API** に画像を送信し、構造化データ（JSON）としてレスポンスを受け取る。
3.  フロントエンドで解析結果を表示し、ユーザーが修正・確認して保存。
4.  コース名がマスタにない場合、新規登録フローを挟む。

### C. 総合ランキング (Dashboard)

- **集計ロジック:** 各部員の **「直近5ラウンド」** のデータを対象に集計する（これが最重要ルール）。
- サイドバー/タブ切り替えで以下のランキングを表示：
  - **GROSS:** 平均スコア
  - **PUTT:** 平均パット数
  - **GIR:** パーオン率 (Par On / 18)
  - **KEEP:** フェアウェイキープ率
  - **BIRDIE:** 平均バーディー数
  - **SCRAMBLE:** リカバリー率（パーオンしなかったがパー以上で上がった率）

### D. マイページ分析 (My Stats)

- **レーダーチャート:** 部内平均を偏差値50とし、各スタッツ（Score, Putt, GIR, Keep, Scramble）の能力値を可視化。
- **ホール別分析:** Par3, 4, 5ごとの平均スコア。
- **AIコーチ:** Gemini APIを使用し、最近のスタッツデータを元にアドバイス文章を生成して表示。

## 5. UI/UX ガイドライン

- **Layout:**
  - PC: 左サイドバー固定。
  - Mobile: ハンバーガーメニュー or 下部ナビゲーション。
- **Theme:** ゴルフらしい清潔感のあるデザイン（Green, Whiteベース）。Shadcn/uiのデフォルトをベースにカスタマイズ。
- **Response:** モバイルファースト。入力作業はスマホで行われることを前提とする。

## 6. 開発コマンド

```bash
npm run dev          # 開発サーバー起動 (Turbopack)
npm run build        # プロダクションビルド
npm run lint         # ESLint実行
npm run format       # Prettier実行 (自動修正)
npm run format:check # Prettierチェック (CI用)
```

## 7. 開発ワークフロー

1.  **Git:** 必須。機能単位でこまめにコミットする。
2.  **Lint:** ESLint, Prettierの設定に従う。型定義（TypeScript）は厳格に守る（`any` 禁止）。
3.  **Deployment:** VercelへのPushによる自動デプロイ。

## 8. Claudeへの特記事項

- コードを生成する際は、必ずファイルパスを明記すること。
- 複雑なロジック（ランキング計算など）は、フロントエンドではなく `utils` 関数またはAPI Routeに切り出すこと。
- SupabaseのRLS（Row Level Security）は、簡易認証のため当初は無効(OFF)または全開放で進める（MVP段階）。
- 型定義は `src/types/database.ts` に集約。Supabaseクライアントは `src/lib/supabase.ts`。
- DBスキーマのSQLは `supabase/migration.sql` に記載。
