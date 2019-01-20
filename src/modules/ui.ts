import { Sandbox } from 'sandbox';
import { RxTournamentService } from '../services/RxTournamentService';
import {
  FirstRoundMatchUpResponse,
  MatchScoreResultPayload,
  WinnerScoreResultPayload
} from 'models/payloads';
import { fromEvent, from, Observable, merge, of } from 'rxjs';
import {
  map,
  switchMap,
  take,
  mergeMap,
  flatMap,
  mergeAll,
  first,
  filter,
  scan
} from 'rxjs/operators';
import { MatchUp } from 'models/matchup';
import { Team } from 'models/team';
import { Tournament } from 'models/tournament';

enum TournamentInfoName {
  TEAM_INFO = 'TEAM_INFO',
  MATCH_SCORE = 'MATCH_SCORE'
}

interface TournamentInfo {
  name: TournamentInfoName;
  content: Team | MatchScoreResultPayload;
}

export class Ui {
  private startBtn!: HTMLElement | null;
  private teamsPerMatchField!: HTMLInputElement;
  private numberOfTeamsField!: HTMLInputElement;

  constructor(private sb: Sandbox) {}

  public init() {
    this.startBtn = document.getElementById('start');
    this.teamsPerMatchField = document.getElementById(
      'teamsPerMatch'
    ) as HTMLInputElement;
    this.numberOfTeamsField = document.getElementById(
      'numberOfTeams'
    ) as HTMLInputElement;

    let tournament: Tournament;
    const firstRounds = fromEvent(this.startBtn!, 'click').pipe(
      // take(1),
      switchMap(() => {
        const numOfTeams = parseInt(this.numberOfTeamsField.value, 10);
        const teamsPerMatch = parseInt(this.teamsPerMatchField.value, 10);

        return RxTournamentService.getFirstRound({ numOfTeams, teamsPerMatch });
      }),
      flatMap(
        (firstRound: FirstRoundMatchUpResponse): Observable<TournamentInfo> => {
          const { tournamentId } = firstRound;
          tournament = new Tournament(tournamentId);
          return merge(
            this.teamInfos(firstRound, tournamentId),
            this.firstRoundMatchups(firstRound, tournamentId)
          );
        }
      ),
      map(
        (resp: TournamentInfo): Tournament => {
          switch (resp.name) {
            case TournamentInfoName.TEAM_INFO:
              tournament.addTeamInfo(resp.content as Team);
              break;

            case TournamentInfoName.MATCH_SCORE:
              const {
                matchScore,
                match
              } = resp.content as MatchScoreResultPayload;
              match.setMatchScore(matchScore);
              tournament.addMatch(match);
              break;

            default:
              break;
          }
          return tournament;
        }
      ),
      flatMap((tournament: Tournament) => {
        return from(tournament.getMatches()).pipe(
          filter((m: MatchUp) => {
            return (
              !m.winnerId && m.checkMatchReadiness(tournament.getTeamTable())
            );
          }),
          flatMap((m: MatchUp) => {
            console.log('each', m);
            return RxTournamentService.getWinnerScore({
              tournamentId: tournament.id,
              match: m,
              teamTable: tournament.getTeamTable()
            });
          }),
          map((m: WinnerScoreResultPayload) => {
            const isLast = tournament.isLastMatch(m.match);
            if (!isLast) {
              const newMatch = new MatchUp(
                m.match.roundId + 1,
                Math.floor(m.match.id / m.match.getTeamIds().length),
                m.match.getTeamIds().length
              );
              tournament.addMatch(newMatch);
            }
            return {
              isLast,
              match: m.match.setWinnerId(
                m.winnerScore,
                tournament.getTeamTable()
              )
            };
          })
        );
      })
    );

    firstRounds.subscribe({
      next: t => {
        console.log(t);
      }
    });
  }

  private teamInfos = (
    firstRound: FirstRoundMatchUpResponse,
    tournamentId: number
  ) =>
    from(firstRound.teamIds).pipe(
      map((teamId: number) =>
        RxTournamentService.getTeamInfo({
          tournamentId,
          teamId
        })
      ),
      mergeAll(),
      map((team: Team) => ({
        name: TournamentInfoName.TEAM_INFO,
        content: team
      }))
    );

  private firstRoundMatchups = (
    firstRound: FirstRoundMatchUpResponse,
    tournamentId: number
  ) =>
    from(firstRound.matchUps).pipe(
      map((match: MatchUp) =>
        RxTournamentService.getMatchScore({ tournamentId, match })
      ),
      mergeAll(),
      map((matchScore: MatchScoreResultPayload) => ({
        name: TournamentInfoName.MATCH_SCORE,
        content: matchScore
      }))
    );
}
