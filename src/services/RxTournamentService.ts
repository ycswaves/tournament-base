import { MatchUp } from 'models/matchup';
import { ServiceClient } from 'utils/apiClient';
import { Team, TeamFactory } from 'models/team';
import {
  WinnerScoreQueryPayload,
  WinnerScoreResultPayload,
  MatchScoreQueryPayload,
  MatchScoreResultPayload,
  TeamInfoQueryPayload,
  FirstRoundQueryPayload,
  FirstRoundMatchUpResponse
} from 'models/payloads';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

interface FirstRoundDto {
  tournamentId: number;
  matchUps: [
    {
      match: number;
      teamIds: number[];
    }
  ];
}

export class RxTournamentService {
  public static getWinnerScore(
    query: WinnerScoreQueryPayload
  ): Observable<WinnerScoreResultPayload> {
    const { tournamentId, match, teamTable } = query;
    const teamScores = match
      .getTeamIds()
      .map(teamId => `teamScores=${teamTable[teamId].score}`)
      .join('&');

    const uri = `/winner?tournamentId=${tournamentId}&${teamScores}&matchScore=${match.getMatchScore()}`;

    return from(ServiceClient.get(uri)).pipe(
      map((resp: any) => {
        const winnerScore = parseInt(resp.score, 10);
        return {
          winnerScore,
          match
        };
      })
    );
  }

  public static getFirstRound(
    queryPayload: FirstRoundQueryPayload
  ): Observable<FirstRoundMatchUpResponse> {
    const { numOfTeams, teamsPerMatch } = queryPayload;
    const uri = '/tournament';
    const queryStr = `numberOfTeams=${numOfTeams}&teamsPerMatch=${teamsPerMatch}`;

    return from(ServiceClient.post(uri, queryStr)).pipe(
      map((resp: FirstRoundDto) => {
        const matchUps = resp.matchUps.reduce(
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

        return {
          ...matchUps,
          tournamentId: resp.tournamentId
        };
      })
    );
  }

  public static getMatchScore(
    matchScoreQueryPayload: MatchScoreQueryPayload
  ): Observable<MatchScoreResultPayload> {
    const { tournamentId, match } = matchScoreQueryPayload;
    const uri = `/match?tournamentId=${tournamentId}&round=${
      match.roundId
    }&match=${match.id}`;

    return from(ServiceClient.get(uri)).pipe(
      map((resp: any) => ({ match, matchScore: parseInt(resp.score, 10) }))
    ); // TODO: need mapping
  }

  public static getTeamInfo(
    queryPayload: TeamInfoQueryPayload
  ): Observable<Team> {
    const { tournamentId, teamId } = queryPayload;
    const uri = `/team?tournamentId=${tournamentId}&teamId=${teamId}`;

    return from(ServiceClient.get(uri)).pipe(
      map((resp: any) => {
        const { name, score } = resp;
        return TeamFactory.createTeam(teamId, name, score);
      })
    );
  }
}
