"use client";

import { parseShots } from "@/utils/course-stats";
import { Shot, TeeShot, ApproachShot, PuttShot } from "@/types/shot";
import { Flag, Target, Circle, Star } from "lucide-react";

interface ShotDetailViewProps {
  shotsDetail: unknown[] | null;
}

const teeResultLabels: Record<string, string> = {
  fairway: "フェアウェイ",
  rough: "ラフ",
  bunker: "バンカー",
  ob: "OB",
  penalty: "ペナルティ",
};

const dirLabels: Record<string, string> = {
  left: "左",
  center: "中央",
  right: "右",
};

const lieLabels: Record<string, string> = {
  fairway: "フェアウェイ",
  "left-rough": "左ラフ",
  "right-rough": "右ラフ",
  "left-bunker": "左バンカー",
  "right-bunker": "右バンカー",
};

const slopeLabels: Record<string, string> = {
  flat: "フラット",
  uphill: "上り",
  downhill: "下り",
  left: "左傾斜",
  right: "右傾斜",
};

function getApproachResultLabel(result: string): string {
  if (result.startsWith("on-")) {
    const dir = result.replace("on-", "");
    const onDirLabels: Record<string, string> = {
      center: "ピン付近",
      front: "手前",
      back: "奥",
      left: "左",
      right: "右",
      "front-left": "手前左",
      "front-right": "手前右",
      "back-left": "奥左",
      "back-right": "奥右",
    };
    return `グリーンON（${onDirLabels[dir] ?? dir}）`;
  }
  if (result.startsWith("miss-")) {
    const dir = result.replace("miss-", "");
    const missDirLabels: Record<string, string> = {
      front: "手前",
      back: "奥",
      left: "左",
      right: "右",
      "front-left": "手前左",
      "front-right": "手前右",
      "back-left": "奥左",
      "back-right": "奥右",
    };
    return `外し（${missDirLabels[dir] ?? dir}）`;
  }
  if (result.startsWith("layup-")) return "レイアップ";
  if (result.startsWith("ob-")) return "OB";
  if (result.startsWith("penalty-")) return "ペナルティ";
  return result;
}

const puttResultLabels: Record<string, string> = {
  in: "カップイン",
  front: "ショート",
  back: "オーバー",
  left: "左",
  right: "右",
  "front-left": "ショート左",
  "front-right": "ショート右",
  "back-left": "オーバー左",
  "back-right": "オーバー右",
};

const puttSlopeLabels: Record<string, string> = {
  flat: "フラット",
  uphill: "上り",
  downhill: "下り",
};

const puttBreakLabels: Record<string, string> = {
  straight: "ストレート",
  slice: "スライス",
  hook: "フック",
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <Star
          key={v}
          className={`w-3 h-3 ${v <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

function getDisplayShotNumber(shots: Shot[], index: number): number {
  let penalties = 0;
  for (let i = 0; i < index; i++) {
    const s = shots[i];
    if (s.type === "tee" && (s.result === "ob" || s.result === "penalty")) {
      penalties++;
    } else if (s.type === "approach") {
      const r = s.result;
      if (r === "ob-left" || r === "ob-right" || r === "penalty-left" || r === "penalty-right") {
        penalties++;
      }
    }
  }
  return index + 1 + penalties;
}

function TeeShotDetail({ shot }: { shot: TeeShot }) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span>
          クラブ: <strong>{shot.club}</strong>
        </span>
        <span>
          結果: <strong>{teeResultLabels[shot.result] ?? shot.result}</strong>
        </span>
        {shot.result !== "ob" && shot.result !== "penalty" && (
          <span>
            方向: <strong>{dirLabels[shot.resultDirection] ?? shot.resultDirection}</strong>
          </span>
        )}
        {shot.distance && (
          <span>
            距離: <strong>{shot.distance}yd</strong>
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <RatingStars rating={shot.rating} />
        {shot.note && <span className="text-xs text-muted-foreground">{shot.note}</span>}
      </div>
    </div>
  );
}

function ApproachShotDetail({ shot }: { shot: ApproachShot }) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span>
          クラブ: <strong>{shot.club}</strong>
        </span>
        <span>
          残り: <strong>{shot.distance}yd</strong>
        </span>
        <span>
          ライ: <strong>{lieLabels[shot.lie] ?? shot.lie}</strong>
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span>
          結果: <strong>{getApproachResultLabel(shot.result)}</strong>
        </span>
        {shot.slope !== "flat" && (
          <span>
            傾斜: <strong>{slopeLabels[shot.slope] ?? shot.slope}</strong>
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <RatingStars rating={shot.rating} />
        {shot.note && <span className="text-xs text-muted-foreground">{shot.note}</span>}
      </div>
    </div>
  );
}

function PuttShotDetail({ shot }: { shot: PuttShot }) {
  const isOkPutt = shot.note === "OK";
  if (isOkPutt) {
    return (
      <div className="text-sm">
        <span className="font-medium text-purple-700">OKパット</span>
      </div>
    );
  }

  return (
    <div className="space-y-1 text-sm">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span>
          距離: <strong>{shot.distance}m</strong>
        </span>
        <span>
          結果: <strong>{puttResultLabels[shot.result] ?? shot.result}</strong>
        </span>
        {shot.slope !== "flat" && (
          <span>
            傾斜: <strong>{puttSlopeLabels[shot.slope] ?? shot.slope}</strong>
          </span>
        )}
        {shot.break !== "straight" && (
          <span>
            曲がり: <strong>{puttBreakLabels[shot.break] ?? shot.break}</strong>
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <RatingStars rating={shot.rating} />
        {shot.note && <span className="text-xs text-muted-foreground">{shot.note}</span>}
      </div>
    </div>
  );
}

export function ShotDetailView({ shotsDetail }: ShotDetailViewProps) {
  const shots = parseShots(shotsDetail);

  if (shots.length === 0) {
    return <div className="text-sm text-muted-foreground py-2">ショット詳細データがありません</div>;
  }

  return (
    <div className="space-y-2">
      {shots.map((shot, index) => {
        const shotNum = getDisplayShotNumber(shots, index);
        const icon =
          shot.type === "tee" ? (
            <Flag className="w-3.5 h-3.5 text-green-600 shrink-0" />
          ) : shot.type === "approach" ? (
            <Target className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          );

        const typeLabel =
          shot.type === "tee" ? "ティー" : shot.type === "approach" ? "ショット" : "パット";

        const borderColor =
          shot.type === "tee"
            ? "border-l-green-400"
            : shot.type === "approach"
              ? "border-l-blue-400"
              : "border-l-purple-400";

        return (
          <div key={index} className={`border-l-2 ${borderColor} pl-3 py-1`}>
            <div className="flex items-center gap-1.5 mb-1">
              {icon}
              <span className="text-xs font-medium text-muted-foreground">
                {shotNum}打目 - {typeLabel}
              </span>
            </div>
            {shot.type === "tee" && <TeeShotDetail shot={shot} />}
            {shot.type === "approach" && <ApproachShotDetail shot={shot} />}
            {shot.type === "putt" && <PuttShotDetail shot={shot} />}
          </div>
        );
      })}
    </div>
  );
}
