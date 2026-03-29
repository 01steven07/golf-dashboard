import { describe, it, expect } from "vitest";
import {
  calculateRadarData,
  calculateExtendedRadarData,
  calculateHoleScoreTrend,
  calculateHoleAnalysis,
} from "./stats";
import { MemberStats } from "@/types/database";

// ======================================
// ヘルパー
// ======================================

function makeMemberStats(overrides: Partial<MemberStats> = {}): MemberStats {
  return {
    member_id: "m1",
    member_name: "テスト",
    round_count: 1,
    avg_score: 80,
    avg_putts: 36,
    gir_rate: 50,
    fairway_keep_rate: 50,
    avg_birdies: 1,
    scramble_rate: 30,
    par3_avg: 3.5,
    par4_avg: 4.5,
    par5_avg: 5.5,
    bounce_back_rate: 30,
    bogey_avoidance: 70,
    double_bogey_avoidance: 85,
    putts_per_gir: 1.8,
    three_putt_avoidance: 90,
    one_putt_rate: 20,
    gir_from_fairway: 60,
    gir_from_rough: 30,
    sand_save_rate: null,
    avg_driving_distance: null,
    putt_make_1m: null,
    putt_make_1_2m: null,
    putt_make_2_5m: null,
    putt_make_5_10m: null,
    putt_make_10m_plus: null,
    gir_dist_100: null,
    gir_dist_100_125: null,
    gir_dist_125_150: null,
    gir_dist_150_175: null,
    gir_dist_175_200: null,
    gir_dist_200_plus: null,
    ...overrides,
  };
}

// ======================================
// I. 偏差値計算（calculateRadarData経由でテスト）
// ======================================
describe("偏差値計算", () => {
  it("I-1: 平均値と同じ → 偏差値50", () => {
    const myStats = makeMemberStats({
      avg_score: 80,
      avg_putts: 36,
      gir_rate: 50,
      fairway_keep_rate: 50,
      scramble_rate: 30,
    });
    const allStats = [myStats]; // 1人 → stdDev=0 → 偏差値50
    const radar = calculateRadarData(myStats, allStats);
    for (const item of radar) {
      expect(item.value).toBeCloseTo(50);
    }
  });

  it("I-2: 極端な値 → 偏差値は20〜80にクランプ", () => {
    const avg = makeMemberStats({ avg_score: 80, gir_rate: 50 });
    const outlier = makeMemberStats({
      member_id: "m2",
      avg_score: 200, // 超悪い
      gir_rate: 0,
    });
    const allStats = [avg, outlier];
    const radar = calculateRadarData(outlier, allStats);
    for (const item of radar) {
      expect(item.value).toBeGreaterThanOrEqual(20);
      expect(item.value).toBeLessThanOrEqual(80);
    }
  });

  it("I-3: stdDev=0（全員同じ値）→ 全カテゴリ偏差値50", () => {
    const s1 = makeMemberStats({ member_id: "m1" });
    const s2 = makeMemberStats({ member_id: "m2" });
    const s3 = makeMemberStats({ member_id: "m3" });
    const allStats = [s1, s2, s3];
    const radar = calculateRadarData(s1, allStats);
    for (const item of radar) {
      expect(item.value).toBeCloseTo(50);
    }
  });
});

// ======================================
// J. calculateRadarData
// ======================================
describe("calculateRadarData", () => {
  it("J-1: 5カテゴリを返す", () => {
    const myStats = makeMemberStats();
    const radar = calculateRadarData(myStats, [myStats]);
    expect(radar).toHaveLength(5);
    expect(radar.map((r) => r.category)).toEqual([
      "スコア",
      "パット",
      "パーオン",
      "FWキープ",
      "リカバリー",
    ]);
  });

  it("J-2: inverse - スコアが低い方が偏差値高い", () => {
    const good = makeMemberStats({ member_id: "m1", avg_score: 72 });
    const bad = makeMemberStats({ member_id: "m2", avg_score: 90 });
    const allStats = [good, bad];

    const goodRadar = calculateRadarData(good, allStats);
    const badRadar = calculateRadarData(bad, allStats);

    // スコアカテゴリ: 低い方（good）が偏差値高い
    const goodScore = goodRadar.find((r) => r.category === "スコア")!;
    const badScore = badRadar.find((r) => r.category === "スコア")!;
    expect(goodScore.value).toBeGreaterThan(badScore.value);
  });

  it("J-3: fullMarkは全て80", () => {
    const radar = calculateRadarData(makeMemberStats(), [makeMemberStats()]);
    for (const item of radar) {
      expect(item.fullMark).toBe(80);
    }
  });
});

// ======================================
// J'. calculateExtendedRadarData
// ======================================
describe("calculateExtendedRadarData", () => {
  it("J'-1: 5カテゴリを返す", () => {
    const myStats = makeMemberStats();
    const radar = calculateExtendedRadarData(myStats, [myStats]);
    expect(radar).toHaveLength(5);
    expect(radar.map((r) => r.category)).toEqual([
      "ボギー回避",
      "バウンスバック",
      "GIR時パット",
      "1パット率",
      "3パット回避",
    ]);
  });

  it("J'-2: GIR時パットはinverse（低い方が高偏差値）", () => {
    const good = makeMemberStats({ member_id: "m1", putts_per_gir: 1.5 });
    const bad = makeMemberStats({ member_id: "m2", putts_per_gir: 2.2 });
    const allStats = [good, bad];

    const goodRadar = calculateExtendedRadarData(good, allStats);
    const badRadar = calculateExtendedRadarData(bad, allStats);

    const goodVal = goodRadar.find((r) => r.category === "GIR時パット")!;
    const badVal = badRadar.find((r) => r.category === "GIR時パット")!;
    expect(goodVal.value).toBeGreaterThan(badVal.value);
  });
});

// ======================================
// K. calculateHoleScoreTrend
// ======================================
describe("calculateHoleScoreTrend", () => {
  it("K-1: 各ホールの平均オーバーパーが正しい", () => {
    const scores = [
      { hole_number: 1, par: 4, score: 5 }, // +1
      { hole_number: 1, par: 4, score: 3 }, // -1
      { hole_number: 2, par: 3, score: 4 }, // +1
    ];
    const trend = calculateHoleScoreTrend(scores);
    expect(trend[0].hole).toBe(1);
    expect(trend[0].avgOverPar).toBeCloseTo(0); // (+1-1)/2 = 0
    expect(trend[0].count).toBe(2);
    expect(trend[1].hole).toBe(2);
    expect(trend[1].avgOverPar).toBeCloseTo(1); // +1/1
    expect(trend[1].count).toBe(1);
  });

  it("K-2: 空データ → 全ホール avgOverPar=0, count=0", () => {
    const trend = calculateHoleScoreTrend([]);
    expect(trend).toHaveLength(18);
    for (const t of trend) {
      expect(t.avgOverPar).toBe(0);
      expect(t.count).toBe(0);
    }
  });

  it("K-3: ホール番号が範囲外（0, 19等）→ 無視される", () => {
    const scores = [
      { hole_number: 0, par: 4, score: 5 },
      { hole_number: 19, par: 4, score: 5 },
      { hole_number: 1, par: 4, score: 5 },
    ];
    const trend = calculateHoleScoreTrend(scores);
    expect(trend[0].count).toBe(1); // hole 1 only
    // hole 0, 19 は無視される
    const totalCount = trend.reduce((sum, t) => sum + t.count, 0);
    expect(totalCount).toBe(1);
  });
});

// ======================================
// L. calculateHoleAnalysis
// ======================================
describe("calculateHoleAnalysis", () => {
  it("L-1: Par3/4/5別の平均スコアが正しい", () => {
    const scores = [
      { par: 3, score: 3 },
      { par: 3, score: 4 },
      { par: 4, score: 5 },
      { par: 4, score: 4 },
      { par: 5, score: 6 },
    ];
    const analysis = calculateHoleAnalysis(scores);
    expect(analysis).toHaveLength(3);

    const par3 = analysis.find((a) => a.parType === "Par 3")!;
    expect(par3.avgScore).toBeCloseTo(3.5);
    expect(par3.avgOverPar).toBeCloseTo(0.5);
    expect(par3.count).toBe(2);

    const par4 = analysis.find((a) => a.parType === "Par 4")!;
    expect(par4.avgScore).toBeCloseTo(4.5);
    expect(par4.avgOverPar).toBeCloseTo(0.5);
    expect(par4.count).toBe(2);

    const par5 = analysis.find((a) => a.parType === "Par 5")!;
    expect(par5.avgScore).toBeCloseTo(6.0);
    expect(par5.avgOverPar).toBeCloseTo(1.0);
    expect(par5.count).toBe(1);
  });

  it("L-2: 空データ → avgScore=0, count=0", () => {
    const analysis = calculateHoleAnalysis([]);
    expect(analysis).toHaveLength(3);
    for (const a of analysis) {
      expect(a.avgScore).toBe(0);
      expect(a.avgOverPar).toBe(0);
      expect(a.count).toBe(0);
    }
  });
});
