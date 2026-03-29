import { Score } from "@/types/database";

/** 1ラウンド分の詳細スタッツ */
export interface SingleRoundStats {
  totalScore: number;
  totalPar: number;
  overPar: number;
  totalPutts: number;
  fairwayKeepRate: number;
  girRate: number;
  scrambleRate: number;
  obCount: number;
  birdieCount: number;
  parCount: number;
  bogeyCount: number;
  doubleBogeyPlusCount: number;
  par3Avg: number;
  par4Avg: number;
  par5Avg: number;
  bounceBackRate: number;
  bogeyAvoidance: number;
  doubleBogeyAvoidance: number;
  puttsPerGir: number;
  threePuttAvoidance: number;
  onePuttRate: number;
  girFromFairway: number;
  girFromRough: number;
}

/**
 * 1ラウンド分のスコアから詳細スタッツを算出
 */
export function calculateSingleRoundStats(scores: Score[]): SingleRoundStats {
  const sorted = [...scores].sort((a, b) => a.hole_number - b.hole_number);
  const totalHoles = sorted.length;

  let totalScore = 0;
  let totalPar = 0;
  let totalPutts = 0;
  let obCount = 0;
  let girCount = 0;
  let fairwayKeepCount = 0;
  let fairwayHoles = 0;
  let scrambleOpportunities = 0;
  let scrambleSuccess = 0;
  let birdieCount = 0;
  let parCount = 0;
  let bogeyCount = 0;
  let doubleBogeyPlusCount = 0;
  let par3Total = 0,
    par3Count = 0;
  let par4Total = 0,
    par4Count = 0;
  let par5Total = 0,
    par5Count = 0;
  let bogeyOrWorseCount = 0;
  let doubleBogeyOrWorseCount = 0;
  let puttsOnGir = 0;
  let girHolesForPutts = 0;
  let threePuttCount = 0;
  let onePuttCount = 0;
  let bounceBackOpportunities = 0;
  let bounceBackSuccess = 0;
  let girFromFwCount = 0;
  let fwApproachHoles = 0;
  let girFromRoughCount = 0;
  let roughApproachHoles = 0;

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    totalScore += s.score;
    totalPar += s.par;
    totalPutts += s.putts;
    obCount += s.ob;

    const diff = s.score - s.par;
    if (diff < 0) birdieCount++;
    else if (diff === 0) parCount++;
    else if (diff === 1) bogeyCount++;
    else doubleBogeyPlusCount++;

    const strokesBeforePutt = s.score - s.putts;
    const isGir = strokesBeforePutt <= s.par - 2;
    if (isGir) girCount++;

    if (s.par >= 4) {
      fairwayHoles++;
      if (s.fairway_result === "keep") fairwayKeepCount++;
    }

    if (!isGir) {
      scrambleOpportunities++;
      if (s.score <= s.par) scrambleSuccess++;
    }

    if (s.par === 3) {
      par3Total += s.score;
      par3Count++;
    } else if (s.par === 4) {
      par4Total += s.score;
      par4Count++;
    } else if (s.par === 5) {
      par5Total += s.score;
      par5Count++;
    }

    if (diff >= 1) bogeyOrWorseCount++;
    if (diff >= 2) doubleBogeyOrWorseCount++;

    if (isGir) {
      puttsOnGir += s.putts;
      girHolesForPutts++;
    }
    if (s.putts >= 3) threePuttCount++;
    if (s.putts === 1) onePuttCount++;

    if (s.par >= 4) {
      if (s.fairway_result === "keep") {
        fwApproachHoles++;
        if (isGir) girFromFwCount++;
      } else if (s.fairway_result === "left" || s.fairway_result === "right") {
        roughApproachHoles++;
        if (isGir) girFromRoughCount++;
      }
    }

    if (i > 0) {
      const prev = sorted[i - 1];
      if (prev.score - prev.par >= 1) {
        bounceBackOpportunities++;
        if (diff <= 0) bounceBackSuccess++;
      }
    }
  }

  return {
    totalScore,
    totalPar,
    overPar: totalScore - totalPar,
    totalPutts,
    fairwayKeepRate: fairwayHoles > 0 ? (fairwayKeepCount / fairwayHoles) * 100 : 0,
    girRate: totalHoles > 0 ? (girCount / totalHoles) * 100 : 0,
    scrambleRate: scrambleOpportunities > 0 ? (scrambleSuccess / scrambleOpportunities) * 100 : 0,
    obCount,
    birdieCount,
    parCount,
    bogeyCount,
    doubleBogeyPlusCount,
    par3Avg: par3Count > 0 ? par3Total / par3Count : 0,
    par4Avg: par4Count > 0 ? par4Total / par4Count : 0,
    par5Avg: par5Count > 0 ? par5Total / par5Count : 0,
    bounceBackRate:
      bounceBackOpportunities > 0 ? (bounceBackSuccess / bounceBackOpportunities) * 100 : 0,
    bogeyAvoidance: totalHoles > 0 ? ((totalHoles - bogeyOrWorseCount) / totalHoles) * 100 : 0,
    doubleBogeyAvoidance:
      totalHoles > 0 ? ((totalHoles - doubleBogeyOrWorseCount) / totalHoles) * 100 : 0,
    puttsPerGir: girHolesForPutts > 0 ? puttsOnGir / girHolesForPutts : 0,
    threePuttAvoidance: totalHoles > 0 ? ((totalHoles - threePuttCount) / totalHoles) * 100 : 0,
    onePuttRate: totalHoles > 0 ? (onePuttCount / totalHoles) * 100 : 0,
    girFromFairway: fwApproachHoles > 0 ? (girFromFwCount / fwApproachHoles) * 100 : 0,
    girFromRough: roughApproachHoles > 0 ? (girFromRoughCount / roughApproachHoles) * 100 : 0,
  };
}
