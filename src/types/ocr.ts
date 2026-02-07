import { FairwayResult } from "./database";

export interface OcrScoreData {
  hole_number: number;
  par: 3 | 4 | 5;
  score: number;
  putts: number;
  fairway_result: FairwayResult;
  ob: number;
  bunker: number;
  penalty: number;
}

export interface OcrResult {
  course_name: string;
  date: string;
  tee_color: string;
  scores: OcrScoreData[];
}
