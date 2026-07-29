import {
  PlayerJob,
  type PlayerJob as PlayerJobType,
} from "../data/catalog";

export const PLAYER_SHEET_BY_JOB: Record<PlayerJobType, string> = {
  [PlayerJob.Beginner]: "player",
  [PlayerJob.Rogue]: "playerRogue",
  [PlayerJob.Assassin]: "playerAssassin",
  [PlayerJob.Hermit]: "playerHermit",
  [PlayerJob.Hokage]: "playerHokage",
};
