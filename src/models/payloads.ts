import { MatchUp } from './matchup';
import { TeamTable } from 'modules/tournament';

export interface FirstRoundMatchUpResponse {
  tournamentId: number;
  teamIds: number[];
  matchUps: MatchUp[];
}

export interface FirstRoundQueryPayload {
  numOfTeams: number;
  teamsPerMatch: number;
}

export interface TeamInfoQueryPayload {
  tournamentId: number;
  teamId: number;
}

export interface MatchScoreQueryPayload {
  tournamentId: number;
  match: MatchUp;
}

export interface MatchScoreResultPayload {
  matchScore: number;
  match: MatchUp;
}

export interface WinnerScoreQueryPayload {
  tournamentId: number;
  match: MatchUp;
  teamTable: TeamTable;
}

export interface WinnerScoreResultPayload {
  winnerScore: number;
  match: MatchUp;
}

export interface TournameSpecPayload {
  numOfTeams: number;
  teamsPerMatch: number;
}
