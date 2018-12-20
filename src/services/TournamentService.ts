import { MatchUp } from '../models/matchup';
import { ServiceClient } from '../utils/apiClient';
import { TeamTable, Tournament } from '../models/tournament';
import { Team, TeamFactory } from '../models/team';

interface FirstRoundDto {
  matchUps: [
    {
      match: number;
      teamIds: number[];
    }
  ];
}

export interface FirstRoundMatchUp {
  teamIds: number[];
  matchUps: MatchUp[];
}

export class TournamentService {
  public static async getWinnerScore(
    tournamentId: number,
    match: MatchUp,
    teamTable: TeamTable
  ): Promise<number> {
    const teamScores = match
      .getTeamIds()
      .map(teamId => `teamScores=${teamTable[teamId].score}`)
      .join('&');

    const uri = `/winner?tournamentId=${tournamentId}&${teamScores}&matchScore=${match.getMatchScore()}`;

    const response = await ServiceClient.get(uri);
    return parseInt(response.score, 10);
  }

  public static async getMatchScore(
    tournamentId: number,
    match: MatchUp
  ): Promise<number> {
    const uri = `/match?tournamentId=${tournamentId}&round=${
      match.roundId
    }&match=${match.id}`;

    const response = await ServiceClient.get(uri); // TODO: need mapping
    return parseInt(response.score, 10);
  }

  public static async getTeamInfo(
    tournamentId: number,
    teamId: number
  ): Promise<Team> {
    const uri = `/team?tournamentId=${tournamentId}&teamId=${teamId}`;

    const response = await ServiceClient.get(uri);
    const { name, score } = response;
    return TeamFactory.createTeam(teamId, name, score);
  }

  public static async getFirstRound(
    numOfTeams: number,
    teamsPerMatch: number
  ): Promise<FirstRoundMatchUp> {
    const uri = '/tournament';
    const queryStr = `numberOfTeams=${numOfTeams}&teamsPerMatch=${teamsPerMatch}`;
    const response: FirstRoundDto = await ServiceClient.post(uri, queryStr);
    return response.matchUps.reduce(
      (matchUps: FirstRoundMatchUp, next) => {
        matchUps.teamIds.push(...next.teamIds);
        const newMatch = new MatchUp(0, next.match, teamsPerMatch).addTeams(
          next.teamIds
        );
        matchUps.matchUps.push(newMatch);
        return matchUps;
      },
      { teamIds: [], matchUps: [] }
    );
  }
}
