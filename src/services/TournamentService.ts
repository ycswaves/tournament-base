import { MatchUp } from 'models/matchup';
import { ServiceClient } from 'utils/apiClient';
import { TeamTable } from 'models/tournament';
import { Team, TeamFactory } from 'models/team';
import { Sandbox } from 'sandbox';
import {
  FIRST_ROUND_RECEIVED,
  RECEIVED_TEAM_INFO,
  RECEIVED_MATCH_SCORE,
  RECEIVED_WINNER_SCORE,
  TOURNAMENT_START,
  GET_TEAM_INFO,
  GET_MATCH_SCORE,
  GET_WINNER_SCORE
} from 'events';

interface FirstRoundDto {
  matchUps: [
    {
      match: number;
      teamIds: number[];
    }
  ];
}

export interface FirstRoundMatchUpResponse {
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

export class TournamentService {
  constructor(private sandbox: Sandbox) {
    this.sandbox.register(TOURNAMENT_START, this.getFirstRound);
    this.sandbox.register(GET_TEAM_INFO, this.getTeamInfo);
    this.sandbox.register(GET_MATCH_SCORE, this.getMatchScore);
    this.sandbox.register(GET_WINNER_SCORE, this.getWinnerScore);
  }

  private getWinnerScore = async (query: WinnerScoreQueryPayload) => {
    const { tournamentId, match, teamTable } = query;
    const teamScores = match
      .getTeamIds()
      .map(teamId => `teamScores=${teamTable[teamId].score}`)
      .join('&');

    const uri = `/winner?tournamentId=${tournamentId}&${teamScores}&matchScore=${match.getMatchScore()}`;

    const response = await ServiceClient.get(uri);
    const winnerScore = parseInt(response.score, 10);
    this.sandbox.notify<WinnerScoreResultPayload>({
      evetName: RECEIVED_WINNER_SCORE,
      payload: {
        winnerScore,
        match
      }
    });
  };

  private getMatchScore = async (
    matchScoreQueryPayload: MatchScoreQueryPayload
  ) => {
    const { tournamentId, match } = matchScoreQueryPayload;
    const uri = `/match?tournamentId=${tournamentId}&round=${
      match.roundId
    }&match=${match.id}`;

    const response = await ServiceClient.get(uri); // TODO: need mapping
    const matchScore = parseInt(response.score, 10);
    this.sandbox.notify<MatchScoreResultPayload>({
      evetName: RECEIVED_MATCH_SCORE,
      payload: { match, matchScore }
    });
  };

  private getTeamInfo = async (queryPayload: TeamInfoQueryPayload) => {
    const { tournamentId, teamId } = queryPayload;
    const uri = `/team?tournamentId=${tournamentId}&teamId=${teamId}`;

    const response = await ServiceClient.get(uri);
    const { name, score } = response;
    const team = TeamFactory.createTeam(teamId, name, score);
    this.sandbox.notify<Team>({
      evetName: RECEIVED_TEAM_INFO,
      payload: team
    });
  };

  private getFirstRound = async (queryPayload: FirstRoundQueryPayload) => {
    const { numOfTeams, teamsPerMatch } = queryPayload;
    const uri = '/tournament';
    const queryStr = `numberOfTeams=${numOfTeams}&teamsPerMatch=${teamsPerMatch}`;
    const response: FirstRoundDto = await ServiceClient.post(uri, queryStr);
    const matchUps = response.matchUps.reduce(
      (matchUps: FirstRoundMatchUpResponse, next) => {
        matchUps.teamIds.push(...next.teamIds);
        const newMatch = new MatchUp(0, next.match, teamsPerMatch).addTeams(
          next.teamIds
        );
        matchUps.matchUps.push(newMatch);
        return matchUps;
      },
      { teamIds: [], matchUps: [] }
    );

    this.sandbox.notify<FirstRoundMatchUpResponse>({
      evetName: FIRST_ROUND_RECEIVED,
      payload: matchUps
    });
  };
}
