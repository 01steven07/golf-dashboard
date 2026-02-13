export interface ScoreInput {
  hole_number: number;
  par: number;
  score: number;
  putts: number;
  ob: number;
  bunker: number;
  penalty: number;
  distance?: number | null;
}

export interface ValidationError {
  hole_number: number;
  field: string;
  message: string;
}

/**
 * スコアデータのバリデーション。
 * エラーがあれば配列で返す。空配列 = OK。
 */
export function validateScores(scores: ScoreInput[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // ホール数チェック
  if (scores.length !== 9 && scores.length !== 18) {
    errors.push({
      hole_number: 0,
      field: "holes",
      message: `ホール数が不正です（${scores.length}ホール）`,
    });
  }

  for (const s of scores) {
    const n = s.hole_number;

    // パー範囲
    if (s.par < 3 || s.par > 6) {
      errors.push({
        hole_number: n,
        field: "par",
        message: `ホール${n}: パーは3〜6で入力してください`,
      });
    }

    // スコア > 0
    if (s.score < 1) {
      errors.push({
        hole_number: n,
        field: "score",
        message: `ホール${n}: スコアは1以上必要です`,
      });
    }

    // スコア上限
    if (s.score > 20) {
      errors.push({
        hole_number: n,
        field: "score",
        message: `ホール${n}: スコア(${s.score})が異常に高いです`,
      });
    }

    // パット >= 0
    if (s.putts < 0) {
      errors.push({
        hole_number: n,
        field: "putts",
        message: `ホール${n}: パット数は0以上必要です`,
      });
    }

    // パット <= スコア
    if (s.putts > s.score) {
      errors.push({
        hole_number: n,
        field: "putts",
        message: `ホール${n}: パット数(${s.putts})がスコア(${s.score})を超えています`,
      });
    }

    // OB >= 0
    if (s.ob < 0) {
      errors.push({
        hole_number: n,
        field: "ob",
        message: `ホール${n}: OB数は0以上必要です`,
      });
    }

    // バンカー >= 0
    if (s.bunker < 0) {
      errors.push({
        hole_number: n,
        field: "bunker",
        message: `ホール${n}: バンカー数は0以上必要です`,
      });
    }

    // ペナルティ >= 0
    if (s.penalty < 0) {
      errors.push({
        hole_number: n,
        field: "penalty",
        message: `ホール${n}: ペナルティ数は0以上必要です`,
      });
    }

    // 距離の範囲チェック
    if (s.distance != null && (s.distance < 1 || s.distance > 700)) {
      errors.push({
        hole_number: n,
        field: "distance",
        message: `ホール${n}: 距離は1〜700ydの範囲で入力してください`,
      });
    }
  }

  return errors;
}
