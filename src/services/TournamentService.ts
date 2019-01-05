import { MatchUp } from 'models/matchup';
import { ServiceClient } from 'utils/apiClient';
import { Team, TeamFactory } from 'models/team';
import { Sandbox } from 'sandbox';
import {
  FIRST_ROUND_RECEIVED,
  RECEIVED_TEAM_INFO,
  RECEIVED_MATCH_SCORE,
  RECEIVED_WINNER_SCORE,
  GET_TEAM_INFO,
  GET_MATCH_SCORE,
  GET_WINNER_SCORE,
  GET_FIRST_ROUND
} from 'events';
import {
  WinnerScoreQueryPayload,
  WinnerScoreResultPayload,
  MatchScoreQueryPayload,
  MatchScoreResultPayload,
  TeamInfoQueryPayload,
  FirstRoundQueryPayload,
  FirstRoundMatchUpResponse
} from 'models/payloads';
import { Module } from 'modules/base';

interface FirstRoundDto {
  tournamentId: number;
  matchUps: [
    {
      match: number;
      teamIds: number[];
    }
  ];
}

export class TournamentService extends Module {
  constructor(private sandbox: Sandbox) {
    super(sandbox);
    this.eventHandlers = {
      [GET_FIRST_ROUND]: this.getFirstRound,
      [GET_TEAM_INFO]: this.getTeamInfo,
      [GET_MATCH_SCORE]: this.getMatchScore,
      [GET_WINNER_SCORE]: this.getWinnerScore
    };
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
      eventName: RECEIVED_WINNER_SCORE,
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
      eventName: RECEIVED_MATCH_SCORE,
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
      eventName: RECEIVED_TEAM_INFO,
      payload: team
    });
  };

  private getFirstRound = async (queryPayload: FirstRoundQueryPayload) => {
    const { numOfTeams, teamsPerMatch } = queryPayload;
    const uri = '/tournament';
    const queryStr = `numberOfTeams=${numOfTeams}&teamsPerMatch=${teamsPerMatch}`;
    const response: FirstRoundDto = await ServiceClient.post(uri, queryStr);
    const matchUps = response.matchUps.reduce(
      (matchUps: { teamIds: number[]; matchUps: MatchUp[] }, next) => {
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
      eventName: FIRST_ROUND_RECEIVED,
      payload: {
        ...matchUps,
        tournamentId: response.tournamentId
      }
    });
  };
}
