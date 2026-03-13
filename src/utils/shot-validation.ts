import { Shot, HoleData } from "@/types/shot";

/** カップイン済みか（パットの result が "in" のショットがあるか） */
export function isCupIn(shots: Shot[]): boolean {
  return shots.some((s) => s.type === "putt" && s.result === "in");
}

/** グリーンオン状態か（直前のアプローチが on-* か、Par3ティーの fairway=ON 相当） */
export function isOnGreen(shots: Shot[], par: number): boolean {
  if (shots.length === 0) return false;

  // 最後のショットから遡って状態を判定
  for (let i = shots.length - 1; i >= 0; i--) {
    const shot = shots[i];

    // パットがあれば（外しても）グリーン上扱い
    if (shot.type === "putt") return true;

    // アプローチの結果で判定
    if (shot.type === "approach") {
      return shot.result.startsWith("on-");
    }

    // Par3のティーショットで fairway の場合はグリーンオン扱い
    if (shot.type === "tee" && par === 3 && shot.result === "fairway") {
      return true;
    }

    // ティーショット（Par3 fairway 以外）はグリーン外
    if (shot.type === "tee") return false;
  }

  return false;
}

/**
 * ショット追加時の警告メッセージを返す（問題なければ null）
 * カップイン済みの場合はボタン非表示なのでここでは判定しない
 */
export function getShotAddWarning(
  shots: Shot[],
  par: number,
  addType: "tee" | "approach" | "putt"
): string | null {
  // グリーンオン中にパット以外を追加しようとした場合
  if (addType !== "putt" && isOnGreen(shots, par)) {
    return "グリーンオン後です。ショットを追加しますか？";
  }
  return null;
}

/** ホール移動時の警告メッセージを返す（問題なければ空配列） */
export function getHoleWarnings(hole: HoleData): string[] {
  const warnings: string[] = [];

  if (hole.shots.length === 0) {
    warnings.push("ショットが入力されていません");
  } else if (!isCupIn(hole.shots)) {
    warnings.push("カップインが記録されていません");
  }

  return warnings;
}
