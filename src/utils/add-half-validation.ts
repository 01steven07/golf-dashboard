/**
 * 追加ハーフのスコアバリデーション（POST API用）
 */

export interface AddHalfScoreInput {
  par: number;
  score: number;
  putts: number;
  fairway_result: string;
  ob: number;
  bunker: number;
  penalty: number;
  distance?: number | null;
}

export interface AddHalfValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 追加ハーフの入力値をバリデーションする
 * @param scores 追加するスコアの配列
 * @param currentMaxHole 現在の最大ホール番号
 * @param courseLabel コースラベル（OUT/IN）
 */
export function validateAddHalfInput(
  scores: AddHalfScoreInput[],
  currentMaxHole: number,
  courseLabel: string
): AddHalfValidationResult {
  if (!Array.isArray(scores) || scores.length === 0) {
    return { valid: false, error: "スコアデータは必須です" };
  }

  if (!courseLabel || !["OUT", "IN"].includes(courseLabel)) {
    return { valid: false, error: "コースラベル（OUT/IN）は必須です" };
  }

  if (currentMaxHole + scores.length > 36) {
    return {
      valid: false,
      error: `ホール数の上限（36）を超えます。現在${currentMaxHole}ホール、追加${scores.length}ホール`,
    };
  }

  for (let i = 0; i < scores.length; i++) {
    const s = scores[i];
    const holeNumber = currentMaxHole + i + 1;

    if (typeof s.par !== "number" || s.par < 3 || s.par > 6) {
      return {
        valid: false,
        error: `ホール${holeNumber}: Parは3〜6で指定してください`,
      };
    }
    if (typeof s.score !== "number" || s.score < 1 || s.score > 20) {
      return {
        valid: false,
        error: `ホール${holeNumber}: スコアは1〜20で指定してください`,
      };
    }
    if (typeof s.putts !== "number" || s.putts < 0 || s.putts > 10) {
      return {
        valid: false,
        error: `ホール${holeNumber}: パット数は0〜10で指定してください`,
      };
    }
    if (s.putts > s.score) {
      return {
        valid: false,
        error: `ホール${holeNumber}: パット数はスコア以下にしてください`,
      };
    }
    if (!["keep", "left", "right"].includes(s.fairway_result)) {
      return {
        valid: false,
        error: `ホール${holeNumber}: 無効なフェアウェイ結果です`,
      };
    }
    if (typeof s.ob !== "number" || s.ob < 0) {
      return { valid: false, error: `ホール${holeNumber}: OB数は0以上です` };
    }
    if (typeof s.bunker !== "number" || s.bunker < 0) {
      return {
        valid: false,
        error: `ホール${holeNumber}: バンカー数は0以上です`,
      };
    }
    if (typeof s.penalty !== "number" || s.penalty < 0) {
      return {
        valid: false,
        error: `ホール${holeNumber}: ペナルティ数は0以上です`,
      };
    }
  }

  return { valid: true };
}

/**
 * バリデーション済みスコアからDBレコードを生成する
 */
export function buildScoreRecords(
  scores: AddHalfScoreInput[],
  roundId: string,
  currentMaxHole: number
) {
  return scores.map((s, i) => ({
    round_id: roundId,
    hole_number: currentMaxHole + i + 1,
    par: s.par,
    score: s.score,
    putts: s.putts,
    fairway_result: s.fairway_result,
    ob: s.ob,
    bunker: s.bunker,
    penalty: s.penalty,
    distance: s.distance ?? null,
  }));
}
