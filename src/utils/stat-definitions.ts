/** スタッツのグループ定義 */
export type StatGroup = "core" | "scoring" | "putting" | "shot" | "putt_distance" | "gir_distance";

export interface StatGroupDef {
  key: StatGroup;
  label: string;
  description: string;
}

export const STAT_GROUPS: StatGroupDef[] = [
  { key: "core", label: "コア", description: "基本スタッツ" },
  { key: "scoring", label: "スコアリング", description: "スコア関連の詳細分析" },
  { key: "putting", label: "パッティング", description: "パット関連の詳細分析" },
  { key: "shot", label: "ショット", description: "ショット関連の詳細分析" },
  { key: "putt_distance", label: "パット距離別", description: "距離別カップイン率" },
  { key: "gir_distance", label: "パーオン距離別", description: "距離別パーオン率" },
];

/** フォーマット種別 */
export type StatFormat = "score" | "strokes" | "percent" | "count";

/** スタッツ定義 */
export interface StatDefinition {
  key: string;
  label: string;
  description: string;
  group: StatGroup;
  format: StatFormat;
  /** 低い方がよいスタッツ（スコア、パット数など） */
  lowerIsBetter: boolean;
  /** 詳細入力データが必要（グレーアウト対象） */
  requiresDetail: boolean;
  /** ランキングページでタブ表示するか */
  rankable: boolean;
}

export const STAT_DEFINITIONS: StatDefinition[] = [
  // Group A: コアスタッツ
  {
    key: "gross",
    label: "GROSS",
    description: "平均スコア",
    group: "core",
    format: "score",
    lowerIsBetter: true,
    requiresDetail: false,
    rankable: true,
  },
  {
    key: "putt",
    label: "PUTT",
    description: "平均パット数",
    group: "core",
    format: "strokes",
    lowerIsBetter: true,
    requiresDetail: false,
    rankable: true,
  },
  {
    key: "gir",
    label: "パーオン",
    description: "パーオン率",
    group: "core",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: false,
    rankable: true,
  },
  {
    key: "keep",
    label: "FW KEEP",
    description: "フェアウェイキープ率",
    group: "core",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: false,
    rankable: true,
  },
  {
    key: "birdie",
    label: "BIRDIE",
    description: "平均バーディー数",
    group: "core",
    format: "count",
    lowerIsBetter: false,
    requiresDetail: false,
    rankable: true,
  },
  {
    key: "scramble",
    label: "SCRAMBLE",
    description: "リカバリー率（パーオンしなかったがパー以上で上がった率）",
    group: "core",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: false,
    rankable: true,
  },

  // Group B: スコアリング
  {
    key: "par3_avg",
    label: "Par3平均",
    description: "Par3ホールの平均スコア",
    group: "scoring",
    format: "score",
    lowerIsBetter: true,
    requiresDetail: false,
    rankable: true,
  },
  {
    key: "par4_avg",
    label: "Par4平均",
    description: "Par4ホールの平均スコア",
    group: "scoring",
    format: "score",
    lowerIsBetter: true,
    requiresDetail: false,
    rankable: true,
  },
  {
    key: "par5_avg",
    label: "Par5平均",
    description: "Par5ホールの平均スコア",
    group: "scoring",
    format: "score",
    lowerIsBetter: true,
    requiresDetail: false,
    rankable: true,
  },
  {
    key: "bounce_back",
    label: "バウンスバック率",
    description: "ボギー以上の次ホールでパー以下を取れた率",
    group: "scoring",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: false,
    rankable: true,
  },
  {
    key: "bogey_avoidance",
    label: "ボギー回避率",
    description: "ボギー以下を叩かなかった割合",
    group: "scoring",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: false,
    rankable: true,
  },
  {
    key: "double_bogey_avoidance",
    label: "ダボ回避率",
    description: "ダブルボギー以下を叩かなかった割合",
    group: "scoring",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: false,
    rankable: false,
  },

  // Group C: パッティング
  {
    key: "putts_per_gir",
    label: "パーオン時パット",
    description: "パーオンホールでの平均パット数",
    group: "putting",
    format: "strokes",
    lowerIsBetter: true,
    requiresDetail: false,
    rankable: true,
  },
  {
    key: "three_putt_avoidance",
    label: "3パット回避率",
    description: "3パット以上にならなかった割合",
    group: "putting",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: false,
    rankable: true,
  },
  {
    key: "one_putt_rate",
    label: "1パット率",
    description: "1パットで沈めた割合",
    group: "putting",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: false,
    rankable: true,
  },

  // Group D: ショット
  {
    key: "gir_from_fairway",
    label: "パーオン率(FW)",
    description: "フェアウェイからのパーオン率",
    group: "shot",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: false,
    rankable: true,
  },
  {
    key: "gir_from_rough",
    label: "パーオン率(ラフ)",
    description: "ラフからのパーオン率",
    group: "shot",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: false,
    rankable: true,
  },
  {
    key: "sand_save",
    label: "サンドセーブ率",
    description: "グリーン周りバンカーからパー以上の率",
    group: "shot",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: true,
    rankable: true,
  },
  {
    key: "driving_distance",
    label: "平均飛距離",
    description: "Par4でのティーショット推定飛距離",
    group: "shot",
    format: "score",
    lowerIsBetter: false,
    requiresDetail: true,
    rankable: true,
  },

  // Group E: パット距離別
  {
    key: "putt_make_1m",
    label: "~1m",
    description: "1m以内のカップイン率",
    group: "putt_distance",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: true,
    rankable: true,
  },
  {
    key: "putt_make_1_2m",
    label: "1-2m",
    description: "1-2mのカップイン率",
    group: "putt_distance",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: true,
    rankable: true,
  },
  {
    key: "putt_make_2_5m",
    label: "2-5m",
    description: "2-5mのカップイン率",
    group: "putt_distance",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: true,
    rankable: true,
  },
  {
    key: "putt_make_5_10m",
    label: "5-10m",
    description: "5-10mのカップイン率",
    group: "putt_distance",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: true,
    rankable: true,
  },
  {
    key: "putt_make_10m_plus",
    label: "10m+",
    description: "10m以上のカップイン率",
    group: "putt_distance",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: true,
    rankable: true,
  },

  // Group F: パーオン距離別
  {
    key: "gir_dist_100",
    label: "~100yd",
    description: "100yd以内からのパーオン率",
    group: "gir_distance",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: true,
    rankable: true,
  },
  {
    key: "gir_dist_100_125",
    label: "100-125yd",
    description: "100-125ydからのパーオン率",
    group: "gir_distance",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: true,
    rankable: true,
  },
  {
    key: "gir_dist_125_150",
    label: "125-150yd",
    description: "125-150ydからのパーオン率",
    group: "gir_distance",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: true,
    rankable: true,
  },
  {
    key: "gir_dist_150_175",
    label: "150-175yd",
    description: "150-175ydからのパーオン率",
    group: "gir_distance",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: true,
    rankable: true,
  },
  {
    key: "gir_dist_175_200",
    label: "175-200yd",
    description: "175-200ydからのパーオン率",
    group: "gir_distance",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: true,
    rankable: true,
  },
  {
    key: "gir_dist_200_plus",
    label: "200yd+",
    description: "200yd以上からのパーオン率",
    group: "gir_distance",
    format: "percent",
    lowerIsBetter: false,
    requiresDetail: true,
    rankable: true,
  },
];

/** キーからスタッツ定義を取得 */
export function getStatDefinition(key: string): StatDefinition | undefined {
  return STAT_DEFINITIONS.find((d) => d.key === key);
}

/** グループに属するスタッツ定義を取得 */
export function getStatsByGroup(group: StatGroup): StatDefinition[] {
  return STAT_DEFINITIONS.filter((d) => d.group === group);
}

/** ランキング可能なスタッツ定義を取得 */
export function getRankableStats(): StatDefinition[] {
  return STAT_DEFINITIONS.filter((d) => d.rankable);
}

/** ランキング可能なスタッツをグループ別に取得 */
export function getRankableStatsByGroup(): { group: StatGroupDef; stats: StatDefinition[] }[] {
  return STAT_GROUPS.map((group) => ({
    group,
    stats: STAT_DEFINITIONS.filter((d) => d.group === group.key && d.rankable),
  })).filter((g) => g.stats.length > 0);
}

/** 値をフォーマットして表示文字列にする */
export function formatStatValue(value: number | null | undefined, format: StatFormat): string {
  if (value === null || value === undefined || isNaN(value)) return "-";

  switch (format) {
    case "score":
      return value.toFixed(1);
    case "strokes":
      return value.toFixed(1);
    case "percent":
      return `${value.toFixed(1)}%`;
    case "count":
      return value.toFixed(2);
  }
}
