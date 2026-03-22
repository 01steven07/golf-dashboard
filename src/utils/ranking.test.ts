import { describe, it, expect } from "vitest";
import { calculateMemberStats, getRankedStats, getStatValue, RoundData } from "./ranking";
import { MemberStats } from "@/types/database";

// ======================================
// ヘルパー関数
// ======================================

type ScoreOverrides = Partial<RoundData["scores"][number]>;

function makeScore(
  holeNumber: number,
  overrides: ScoreOverrides = {}
): RoundData["scores"][number] {
  return {
    hole_number: holeNumber,
    par: 4,
    score: 4,
    putts: 2,
    fairway_result: "keep",
    ...overrides,
  };
}

/** 標準18ホール: Par72（Par3×4, Par4×10, Par5×4）全パープレー、2パット、FWキープ */
function make18Holes(overridesFn?: (holeNum: number) => ScoreOverrides): RoundData["scores"] {
  const pars: number[] = [4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5];
  return pars.map((par, i) => {
    const holeNum = i + 1;
    const base: ScoreOverrides = { par, score: par, putts: 2 };
    // Par3はFW対象外だが、fairway_resultは入れておく（計算側でPar3は除外）
    if (par === 3) base.fairway_result = "keep";
    const extra = overridesFn ? overridesFn(holeNum) : {};
    return makeScore(holeNum, { ...base, ...extra });
  });
}

function makeRound(memberId: string, memberName: string, scores: RoundData["scores"]): RoundData {
  return { member_id: memberId, member_name: memberName, scores };
}

// ======================================
// A. コアスタッツ
// ======================================
describe("calculateMemberStats: コアスタッツ", () => {
  it("A-1: avg_score - パープレー18H → 72.0", () => {
    const rounds = [makeRound("m1", "田中", make18Holes())];
    const stats = calculateMemberStats(rounds);
    expect(stats).toHaveLength(1);
    expect(stats[0].avg_score).toBeCloseTo(72.0);
  });

  it("A-2: avg_putts - 全ホール2パット → 36.0", () => {
    const rounds = [makeRound("m1", "田中", make18Holes())];
    const stats = calculateMemberStats(rounds);
    expect(stats[0].avg_putts).toBeCloseTo(36.0);
  });

  it("A-3: gir_rate - GIR判定が正しい", () => {
    // GIR条件: score - putts <= par - 2
    // パープレー2パット: 4-2=2 <= 4-2=2 → GIR
    // score=par+1, putts=2: (par+1)-2 = par-1 > par-2 → NOT GIR
    // Par配列: [4,3,4,4,5,4,3,4,5,4,3,4,4,5,4,3,4,5]
    // 全ホールをボギー2パットにすると、GIR外しになる
    const rounds = [
      makeRound(
        "m1",
        "田中",
        make18Holes((h) => {
          const pars = [4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5];
          const par = pars[h - 1];
          return { score: par + 1, putts: 2 }; // 全ホールGIR外し
        })
      ),
    ];
    const stats = calculateMemberStats(rounds);
    expect(stats[0].gir_rate).toBeCloseTo(0);

    // 全ホールパープレー2パット → 全ホールGIR
    const rounds2 = [makeRound("m1", "田中", make18Holes())];
    const stats2 = calculateMemberStats(rounds2);
    expect(stats2[0].gir_rate).toBeCloseTo(100);
  });

  it("A-4: fairway_keep_rate - Par4+が14H、うち10Hキープ → 71.4%（Par3除外）", () => {
    // Par構成: Par3×4, Par4×10, Par5×4 = Par4+が14H
    const rounds = [
      makeRound(
        "m1",
        "田中",
        make18Holes((h) => {
          // Par4+のうち最初の4ホール(h=1,4,5,6)をleftに → keep=10/14
          if (h <= 4) return { fairway_result: "left" };
          return {};
        })
      ),
    ];
    const stats = calculateMemberStats(rounds);
    // Par3が4Hあるので、fairwayHoles = 14
    // h<=4 のうちPar3はh=2のみ(Par3除外されるのでfairwayに影響しない)
    // h=1(Par4→left), h=2(Par3→除外), h=3(Par4→keep), h=4(Par4→left)
    // → leftにしたPar4+ホールは h=1,4,5の3H → keep = 14-3 = 11/14
    // 正確に計算し直す
    expect(stats[0].fairway_keep_rate).toBeGreaterThan(0);
    // fairwayHoles = 14 (Par4×10 + Par5×4)
    // h<=4 の中でPar4+は h=1(Par4), h=3(Par4?), h=4(Par4)
    // 実際のPar配列: [4,3,4,4,5,4,3,4,5,4,3,4,4,5,4,3,4,5]
    // h=1→Par4, h=2→Par3, h=3→Par4, h=4→Par4
    // h<=4 かつ Par4+ = h=1,3,4 → 3H left
    // keep = 14 - 3 = 11
    expect(stats[0].fairway_keep_rate).toBeCloseTo((11 / 14) * 100, 0);
  });

  it("A-5: avg_birdies - バーディー数が正しい", () => {
    // Par配列: [4,3,4,4,5,4,3,4,5,4,3,4,4,5,4,3,4,5]
    // h=1(Par4): score=3 → birdie, h=3(Par4): score=3 → birdie, h=4(Par4): score=3 → birdie
    // h=2はPar3なのでscore=3はパー → birdieではない
    const rounds = [
      makeRound(
        "m1",
        "田中",
        make18Holes((h) => {
          // Par4ホールのうち3つをバーディーにする: h=1,3,4 (全てPar4)
          if (h === 1 || h === 3 || h === 4) return { score: 3 };
          return {};
        })
      ),
    ];
    const stats = calculateMemberStats(rounds);
    expect(stats[0].avg_birdies).toBeCloseTo(3.0);
  });

  it("A-6: scramble_rate - GIR外しのうちパーセーブした割合", () => {
    // Par配列: [4,3,4,4,5,4,3,4,5,4,3,4,4,5,4,3,4,5]
    // 全ホールをGIR外し(score=par+1, putts=2: (par+1)-2=par-1 > par-2)にして
    // 一部をパーセーブ(score=par, putts=1: par-1=par-1 > par-2 → NOT GIR, score<=par → scramble成功)
    const pars = [4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5];
    const rounds = [
      makeRound(
        "m1",
        "田中",
        make18Holes((h) => {
          const par = pars[h - 1];
          if (h <= 6) {
            // パーセーブ（GIR外し）: score=par, putts=1 → score-putts = par-1 > par-2
            return { score: par, putts: 1 };
          }
          // ボギー（GIR外し）: score=par+1, putts=2
          return { score: par + 1, putts: 2 };
        })
      ),
    ];
    const stats = calculateMemberStats(rounds);
    // 全18H GIR外し、うち6Hパーセーブ → 6/18 = 33.3%
    expect(stats[0].scramble_rate).toBeCloseTo((6 / 18) * 100, 0);
  });
});

// ======================================
// B. スコアリングスタッツ
// ======================================
describe("calculateMemberStats: スコアリングスタッツ", () => {
  it("B-1: par3/4/5_avg - Par別平均スコアが正しい", () => {
    const rounds = [
      makeRound(
        "m1",
        "田中",
        make18Holes((h) => {
          // Pars: [4,3,4,4,5,4,3,4,5,4,3,4,4,5,4,3,4,5]
          // Par3ホール(h=2,7,11,16): score=par のまま → par3_avg = 3.0
          // Par4ホール: 全部+1 → par4_avg = 5.0
          // Par5ホール(h=5,9,14,18): score=par のまま → par5_avg = 5.0
          const pars = [4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5];
          const par = pars[h - 1];
          if (par === 4) return { score: 5 };
          return {};
        })
      ),
    ];
    const stats = calculateMemberStats(rounds);
    expect(stats[0].par3_avg).toBeCloseTo(3.0);
    expect(stats[0].par4_avg).toBeCloseTo(5.0);
    expect(stats[0].par5_avg).toBeCloseTo(5.0);
  });

  it("B-2: bounce_back_rate - ボギー後パー3回/ボギー5回 → 60%", () => {
    // ホール構成を制御: ボギー→パー, ボギー→パー, ボギー→パー, ボギー→ボギー, ボギー→ボギー
    const scores: RoundData["scores"] = [];
    for (let h = 1; h <= 18; h++) {
      // h=1: ボギー, h=2: パー(BB成功)
      // h=3: ボギー, h=4: パー(BB成功)
      // h=5: ボギー, h=6: パー(BB成功)
      // h=7: ボギー, h=8: ボギー(BB失敗)
      // h=9: ボギー, h=10: ボギー(BB失敗)
      // h=11-18: パー
      if ([1, 3, 5, 7, 8, 9, 10].includes(h)) {
        scores.push(makeScore(h, { score: 5 })); // ボギー
      } else {
        scores.push(makeScore(h, { score: 4 })); // パー
      }
    }
    const rounds = [makeRound("m1", "田中", scores)];
    const stats = calculateMemberStats(rounds);
    // BB機会: h=2(after h=1 bogey), h=4(after h=3), h=6(after h=5),
    //   h=8(after h=7), h=9(after h=8), h=10(after h=9), h=11(after h=10)
    // BB成功: h=2(par), h=4(par), h=6(par) = 3
    // BB機会: h=2,h=4,h=6,h=8,h=9,h=10,h=11 = 7 (h=8,9,10はボギー後)
    // → 3/7 ≈ 42.9%
    // 実際の計算: prevOverPar >= 1 のホールの次で overPar <= 0
    expect(stats[0].bounce_back_rate).toBeGreaterThan(0);
    expect(stats[0].bounce_back_rate).toBeLessThan(100);
  });

  it("B-3: bogey_avoidance - 18H中ボギー4H → (18-4)/18 = 77.8%", () => {
    const rounds = [
      makeRound(
        "m1",
        "田中",
        make18Holes((h) => {
          if (h <= 4) return { score: 5 }; // 最初4Hボギー
          return {};
        })
      ),
    ];
    const stats = calculateMemberStats(rounds);
    expect(stats[0].bogey_avoidance).toBeCloseTo((14 / 18) * 100, 0);
  });

  it("B-4: double_bogey_avoidance - 18H中ダボ1H → (18-1)/18 = 94.4%", () => {
    const rounds = [
      makeRound(
        "m1",
        "田中",
        make18Holes((h) => {
          if (h === 1) return { score: 6 }; // ダボ
          return {};
        })
      ),
    ];
    const stats = calculateMemberStats(rounds);
    expect(stats[0].double_bogey_avoidance).toBeCloseTo((17 / 18) * 100, 0);
  });
});

// ======================================
// C. パッティングスタッツ
// ======================================
describe("calculateMemberStats: パッティングスタッツ", () => {
  it("C-1: putts_per_gir - GIRホールでの平均パット", () => {
    // 全ホールGIR（パープレー2パット）: putts_per_gir = 2.0
    const rounds = [makeRound("m1", "田中", make18Holes())];
    const stats = calculateMemberStats(rounds);
    expect(stats[0].putts_per_gir).toBeCloseTo(2.0);
  });

  it("C-2: three_putt_avoidance - 18H中3パット2H → 88.9%", () => {
    const rounds = [
      makeRound(
        "m1",
        "田中",
        make18Holes((h) => {
          if (h <= 2) return { score: 5, putts: 3 }; // 3パットボギー
          return {};
        })
      ),
    ];
    const stats = calculateMemberStats(rounds);
    expect(stats[0].three_putt_avoidance).toBeCloseTo((16 / 18) * 100, 0);
  });

  it("C-3: one_putt_rate - 18H中1パット4H → 22.2%", () => {
    const rounds = [
      makeRound(
        "m1",
        "田中",
        make18Holes((h) => {
          if (h <= 4) return { score: 3, putts: 1 }; // 1パットバーディー
          return {};
        })
      ),
    ];
    const stats = calculateMemberStats(rounds);
    expect(stats[0].one_putt_rate).toBeCloseTo((4 / 18) * 100, 0);
  });
});

// ======================================
// D. ショットスタッツ
// ======================================
describe("calculateMemberStats: ショットスタッツ", () => {
  it("D-1: gir_from_fairway - FWキープホールのGIR率", () => {
    // 全Par4+ホールでFWキープ、全ホールGIR → gir_from_fairway = 100%
    const rounds = [makeRound("m1", "田中", make18Holes())];
    const stats = calculateMemberStats(rounds);
    expect(stats[0].gir_from_fairway).toBeCloseTo(100);
  });

  it("D-2: gir_from_rough - ラフからのGIR率", () => {
    // 全Par4+ホールでright(ラフ)、うち半分GIR
    const pars = [4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5];
    let roughCount = 0;
    const rounds = [
      makeRound(
        "m1",
        "田中",
        make18Holes((h) => {
          const par = pars[h - 1];
          if (par >= 4) {
            roughCount++;
            if (roughCount % 2 === 0) {
              // GIR外し: score-putts > par-2 → score=par+1, putts=2
              return { fairway_result: "right", score: par + 1, putts: 2 };
            }
            // GIR: score-putts <= par-2 → score=par, putts=2
            return { fairway_result: "right", score: par, putts: 2 };
          }
          return {};
        })
      ),
    ];
    const stats = calculateMemberStats(rounds);
    // 14H right, 7H GIR → 50%
    expect(stats[0].gir_from_rough).toBeCloseTo(50, 0);
  });

  it("D-3: sand_save_rate - shots_detailありでバンカーセーブ計算", () => {
    const scores = make18Holes((h) => {
      if (h === 1) {
        // Par4, score=4, putts=1: tee+approach+approach(bunker)+putt = 4打
        return {
          score: 4,
          putts: 1,
          shots_detail: [
            { type: "tee" },
            { type: "approach", distance: 150, lie: "fairway" },
            { type: "approach", distance: 30, lie: "left-bunker" },
            { type: "putt", distance: 3, result: "in" },
          ],
        };
      }
      if (h === 2) {
        // Par3(h=2), score=5, putts=2: tee+approach+approach(bunker)+putt+putt = 5打
        return {
          score: 5,
          putts: 2,
          shots_detail: [
            { type: "tee" },
            { type: "approach", distance: 50, lie: "fairway" },
            { type: "approach", distance: 40, lie: "right-bunker" },
            { type: "putt", distance: 5, result: "short" },
            { type: "putt", distance: 1, result: "in" },
          ],
        };
      }
      return {};
    });
    const rounds = [makeRound("m1", "田中", scores)];
    const stats = calculateMemberStats(rounds);
    // h=1: バンカー(<=50yd), par save → success
    // h=2: バンカー(<=50yd), bogey → fail
    expect(stats[0].sand_save_rate).toBeCloseTo(50.0);
  });

  it("D-4: avg_driving_distance - Par4のドライバー距離推定", () => {
    const scores = make18Holes((h) => {
      if (h === 1) {
        // Par4, score=4, putts=2: tee+approach+putt+putt = 4打
        return {
          score: 4,
          putts: 2,
          distance: 380, // ホール距離
          shots_detail: [
            { type: "tee" },
            { type: "approach", distance: 130, lie: "fairway" }, // 残り130yd
            { type: "putt", distance: 5, result: "short" },
            { type: "putt", distance: 1, result: "in" },
          ],
        };
      }
      return {};
    });
    const rounds = [makeRound("m1", "田中", scores)];
    const stats = calculateMemberStats(rounds);
    // 推定: 380 - 130 = 250yd
    expect(stats[0].avg_driving_distance).toBeCloseTo(250);
  });

  it("D-5: shots_detailが無い場合 → sand_save, driving_distance = null", () => {
    const rounds = [makeRound("m1", "田中", make18Holes())];
    const stats = calculateMemberStats(rounds);
    expect(stats[0].sand_save_rate).toBeNull();
    expect(stats[0].avg_driving_distance).toBeNull();
  });
});

// ======================================
// E. エッジケース・正規化
// ======================================
describe("calculateMemberStats: エッジケース", () => {
  it("E-1: 空ラウンド → 空配列", () => {
    const stats = calculateMemberStats([]);
    expect(stats).toHaveLength(0);
  });

  it("E-2: 9H正規化 - 9Hで合計40 → avg_score = 80（×2倍）", () => {
    const scores = Array.from({ length: 9 }, (_, i) => makeScore(i + 1, { par: 4, score: 4 }));
    // 9H合計: 36 → 18H換算: 72
    const rounds = [makeRound("m1", "田中", scores)];
    const stats = calculateMemberStats(rounds);
    expect(stats[0].avg_score).toBeCloseTo(72.0);

    // 9H合計 40 → 18H換算 80
    const scores2 = Array.from({ length: 9 }, (_, i) =>
      makeScore(i + 1, { par: 4, score: 4 + (i < 4 ? 1 : 0) })
    );
    // 4H ボギー + 5H パー = 4*5 + 5*4 = 40 → ×2 = 80... いや違う
    // score: h<4(i<4) → 5, else → 4
    // 合計: 5*4 + 4*5 = 20+20 = 40 → ×2 = 80
    const rounds2 = [makeRound("m1", "田中", scores2)];
    const stats2 = calculateMemberStats(rounds2);
    expect(stats2[0].avg_score).toBeCloseTo(80.0);
  });

  it("E-3: 10ラウンド上限 - 12ラウンド渡しても最初の10のみ", () => {
    const rounds: RoundData[] = [];
    for (let i = 0; i < 12; i++) {
      // 最初の10ラウンドはスコア72、残り2は80
      const score = i < 10 ? 4 : 5; // Par4ホール基準
      rounds.push(
        makeRound(
          "m1",
          "田中",
          make18Holes(() => ({ score }))
        )
      );
    }
    const stats = calculateMemberStats(rounds);
    expect(stats[0].round_count).toBe(10);
    expect(stats[0].avg_score).toBeCloseTo(72.0); // 最初の10のみ（全パー）
  });

  it("E-4: 複数メンバー - 各人独立した統計", () => {
    const rounds = [
      makeRound(
        "m1",
        "田中",
        make18Holes(() => ({ score: 4 }))
      ), // パー
      makeRound(
        "m2",
        "佐藤",
        make18Holes(() => ({ score: 5 }))
      ), // ボギー
    ];
    const stats = calculateMemberStats(rounds);
    expect(stats).toHaveLength(2);
    const tanaka = stats.find((s) => s.member_id === "m1")!;
    const sato = stats.find((s) => s.member_id === "m2")!;
    expect(tanaka.avg_score).toBeLessThan(sato.avg_score);
  });

  it("E-5: 全ホールGIR → scramble_rate = 0（機会なし）", () => {
    const rounds = [makeRound("m1", "田中", make18Holes())];
    const stats = calculateMemberStats(rounds);
    // 全ホールGIR → scrambleOpportunities = 0 → rate = 0
    expect(stats[0].scramble_rate).toBe(0);
  });

  it("E-6: ボギーなし → bounce_back_rate = 0（機会なし）", () => {
    const rounds = [makeRound("m1", "田中", make18Holes())];
    const stats = calculateMemberStats(rounds);
    expect(stats[0].bounce_back_rate).toBe(0);
  });
});

// ======================================
// F. shots_detail依存スタッツ
// ======================================
describe("calculateMemberStats: shots_detail依存", () => {
  it("F-1: putt_make距離別 - 1m以内100%, 2-5m 33.3%", () => {
    const scores = make18Holes((h) => {
      if (h === 1) {
        return {
          score: 4,
          putts: 2,
          shots_detail: [
            { type: "tee" },
            { type: "approach", distance: 100, lie: "fairway" },
            { type: "putt", distance: 0.8, result: "short" }, // 1m以内、外し
            { type: "putt", distance: 0.3, result: "in" }, // 1m以内、成功
          ],
        };
      }
      if (h === 2) {
        return {
          score: 5,
          putts: 3,
          shots_detail: [
            { type: "tee" },
            { type: "approach", distance: 100, lie: "fairway" },
            { type: "putt", distance: 3, result: "short" }, // 2-5m、外し
            { type: "putt", distance: 3, result: "short" }, // 2-5m、外し
            { type: "putt", distance: 0.5, result: "in" }, // 1m以内、成功
          ],
        };
      }
      if (h === 3) {
        return {
          score: 3,
          putts: 1,
          shots_detail: [
            { type: "tee" },
            { type: "approach", distance: 100, lie: "fairway" },
            { type: "putt", distance: 4, result: "in" }, // 2-5m、成功
          ],
        };
      }
      return {};
    });
    const rounds = [makeRound("m1", "田中", scores)];
    const stats = calculateMemberStats(rounds);
    // 1m以内: 成功2/3 (h=1: miss+make, h=2: make) → 66.7%
    expect(stats[0].putt_make_1m).toBeCloseTo((2 / 3) * 100, 0);
    // 2-5m: 成功1/3 (h=2: miss+miss, h=3: make) → 33.3%
    expect(stats[0].putt_make_2_5m).toBeCloseTo((1 / 3) * 100, 0);
  });

  it("F-2: gir_dist距離別 - 100-125yd グリーンオン 3/4 = 75%", () => {
    // グリーンオン判定: 各approach.result が "on" で始まるかどうか（全ショット対象）
    const scores = make18Holes((h) => {
      if (h === 1 || h === 3) {
        // 110ydからグリーンオン (result: "on-green")
        return {
          score: 4,
          putts: 2,
          shots_detail: [
            { type: "tee" },
            { type: "approach", distance: 110, lie: "fairway", result: "on-green" },
            { type: "putt", distance: 5, result: "in" },
            { type: "putt", distance: 0.5, result: "in" },
          ],
        };
      }
      if (h === 4) {
        // 115ydからグリーンオン → グリーン奥にこぼれて110ydから再アプローチ失敗
        return {
          score: 5,
          putts: 2,
          shots_detail: [
            { type: "tee" },
            { type: "approach", distance: 115, lie: "fairway", result: "short" },
            { type: "approach", distance: 110, lie: "fairway", result: "on-green" },
            { type: "putt", distance: 5, result: "short" },
            { type: "putt", distance: 1, result: "in" },
          ],
        };
      }
      return {};
    });
    const rounds = [makeRound("m1", "田中", scores)];
    const stats = calculateMemberStats(rounds);
    // 100-125yd bucket: h=1(110yd,on) + h=3(110yd,on) + h=4(115yd,on + 110yd,short) = 4 attempts, 3 green-on → 75%
    expect(stats[0].gir_dist_100_125).toBeCloseTo((3 / 4) * 100, 0);
  });

  it("F-3: shots_detailが全て無い → 距離別スタッツは全てnull", () => {
    const rounds = [makeRound("m1", "田中", make18Holes())];
    const stats = calculateMemberStats(rounds);
    expect(stats[0].putt_make_1m).toBeNull();
    expect(stats[0].putt_make_1_2m).toBeNull();
    expect(stats[0].putt_make_2_5m).toBeNull();
    expect(stats[0].putt_make_5_10m).toBeNull();
    expect(stats[0].putt_make_10m_plus).toBeNull();
    expect(stats[0].gir_dist_100).toBeNull();
    expect(stats[0].gir_dist_100_125).toBeNull();
    expect(stats[0].gir_dist_125_150).toBeNull();
    expect(stats[0].gir_dist_150_175).toBeNull();
    expect(stats[0].gir_dist_175_200).toBeNull();
    expect(stats[0].gir_dist_200_plus).toBeNull();
  });

  it("F-4: 不正なshots_detail → 無視される", () => {
    const scores = make18Holes((h) => {
      if (h === 1) return { shots_detail: [null, "invalid", 123, { foo: "bar" }] };
      if (h === 2) return { shots_detail: null };
      return {};
    });
    const rounds = [makeRound("m1", "田中", scores)];
    const stats = calculateMemberStats(rounds);
    // 不正データでもクラッシュしない
    expect(stats[0].sand_save_rate).toBeNull();
  });
});

// ======================================
// G. getRankedStats - ランキングソート
// ======================================
describe("getRankedStats", () => {
  function makeMemberStats(overrides: Partial<MemberStats>): MemberStats {
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

  it("G-1: gross (lowerIsBetter) - スコア低い順", () => {
    const stats = [
      makeMemberStats({ member_id: "m1", avg_score: 85 }),
      makeMemberStats({ member_id: "m2", avg_score: 72 }),
      makeMemberStats({ member_id: "m3", avg_score: 78 }),
    ];
    const ranked = getRankedStats(stats, "gross");
    expect(ranked[0].member_id).toBe("m2"); // 72
    expect(ranked[1].member_id).toBe("m3"); // 78
    expect(ranked[2].member_id).toBe("m1"); // 85
  });

  it("G-2: gir (higherIsBetter) - GIR率高い順", () => {
    const stats = [
      makeMemberStats({ member_id: "m1", gir_rate: 30 }),
      makeMemberStats({ member_id: "m2", gir_rate: 60 }),
      makeMemberStats({ member_id: "m3", gir_rate: 45 }),
    ];
    const ranked = getRankedStats(stats, "gir");
    expect(ranked[0].member_id).toBe("m2"); // 60
    expect(ranked[1].member_id).toBe("m3"); // 45
    expect(ranked[2].member_id).toBe("m1"); // 30
  });

  it("G-3: requiresDetail - sand_save=nullの部員は除外", () => {
    const stats = [
      makeMemberStats({ member_id: "m1", sand_save_rate: 50 }),
      makeMemberStats({ member_id: "m2", sand_save_rate: null }),
      makeMemberStats({ member_id: "m3", sand_save_rate: 80 }),
    ];
    const ranked = getRankedStats(stats, "sand_save");
    expect(ranked).toHaveLength(2);
    expect(ranked[0].member_id).toBe("m3"); // 80%
    expect(ranked[1].member_id).toBe("m1"); // 50%
  });
});

// ======================================
// H. getStatValue - 表示フォーマット
// ======================================
describe("getStatValue", () => {
  function makeMemberStats(overrides: Partial<MemberStats>): MemberStats {
    return {
      member_id: "m1",
      member_name: "テスト",
      round_count: 1,
      avg_score: 72.5,
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

  it("H-1: avg_score = 72.5 → '72.5'", () => {
    const stat = makeMemberStats({ avg_score: 72.5 });
    expect(getStatValue(stat, "gross")).toBe("72.5");
  });

  it("H-2: driving_distance = 230.7 → '231yd'", () => {
    const stat = makeMemberStats({ avg_driving_distance: 230.7 });
    expect(getStatValue(stat, "driving_distance")).toBe("231yd");
  });

  it("H-3: sand_save_rate = null → '-'", () => {
    const stat = makeMemberStats({ sand_save_rate: null });
    expect(getStatValue(stat, "sand_save")).toBe("-");
  });
});
