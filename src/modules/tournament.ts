import { MatchUp, CompeteHandler } from '../models/matchup';
import { MathUtil } from '../utils/math';
import { Sandbox } from 'sandbox';
import { Team } from '../models/team';
import {
  FirstRoundMatchUpResponse,
  FirstRoundQueryPayload,
  MatchScoreResultPayload,
  MatchScoreQueryPayload,
  TeamInfoQueryPayload,
  WinnerScoreQueryPayload,
  WinnerScoreResultPayload
} from '../services/TournamentService';
import {
  TOURNAMENT_START,
  FIRST_ROUND_RECEIVED,
  GET_TEAM_INFO,
  RECEIVED_TEAM_INFO,
  RECEIVED_MATCH_SCORE,
  GET_MATCH_SCORE,
  GET_WINNER_SCORE,
  RECEIVED_WINNER_SCORE
} from '../events';

export interface TeamTable {
  [id: number]: Team;
}

export interface MatchTable {
  [hashCode: string]: MatchUp;
}

export class Tournament {
  private numOfRounds: number = -1;
  private teamTable: TeamTable = {};
  private matchTable: MatchTable = {};

  constructor(
    private id: number,
    private teamPerMatch: number,
    private teamsCount: number,
    private sandbox: Sandbox
  ) {
    this.numOfRounds = MathUtil.getBaseLog(teamPerMatch, teamsCount);
    sandbox.register(FIRST_ROUND_RECEIVED, this.onFirstRoundReceived);
    sandbox.register(RECEIVED_TEAM_INFO, this.onTeamInfoReceived);
    sandbox.register(RECEIVED_MATCH_SCORE, this.onMatchScoreReceived);
    sandbox.register(RECEIVED_WINNER_SCORE, this.onWinnerScoreReceived);
  }

  public start(): void {
    this.sandbox.notify<FirstRoundQueryPayload>({
      eventName: TOURNAMENT_START,
      payload: {
        teamsPerMatch: this.teamPerMatch,
        numOfTeams: this.teamsCount
      }
    });
  }

  private onFirstRoundReceived = (firstRound: FirstRoundMatchUpResponse) => {
    const { teamIds, matchUps } = firstRound;
    teamIds.forEach(id => this.addTeamInfo(id));
    matchUps.forEach(match => this.addMatch(match));
    this.sandbox.unregister(FIRST_ROUND_RECEIVED, this.onFirstRoundReceived);
  };

  private addTeamInfo(teamId: number): void {
    this.sandbox.notify<TeamInfoQueryPayload>({
      eventName: GET_TEAM_INFO,
      payload: {
        tournamentId: this.id,
        teamId
      }
    });
  }

  private onTeamInfoReceived = (team: Team) => {
    this.teamTable[team.id] = team;
    Object.values(this.matchTable)
      .filter(match => match.getTeamIds().includes(team.id))
      .forEach(match => {
        match.checkMatchReadiness();
      });
  };

  private addMatch(match: MatchUp): void {
    this.matchTable[match.hashCode()] = match;
    match.onReadyToCompete(this.teamTable, this.createCompeteHandler(match));
    this.sandbox.notify<MatchScoreQueryPayload>({
      eventName: GET_MATCH_SCORE,
      payload: {
        match,
        tournamentId: this.id
      }
    });
  }

  private onMatchScoreReceived = (matchScoreRes: MatchScoreResultPayload) => {
    const { match, matchScore } = matchScoreRes;
    this.matchTable[match.hashCode()].setMatchScore(matchScore);
  };

  private getWinnerScore(match: MatchUp) {
    this.sandbox.notify<WinnerScoreQueryPayload>({
      eventName: GET_WINNER_SCORE,
      payload: {
        teamTable: this.teamTable,
        tournamentId: this.id,
        match
      }
    });
  }

  private onWinnerScoreReceived = (winnerResult: WinnerScoreResultPayload) => {
    const { winnerScore, match } = winnerResult;
    const winnerId = match.getWinnerId(winnerScore);

    // console.log(`${match.hashCode()} winner is: `, winnerId);
    if (this.isLastMatch(match)) {
      // show winnder
      console.log(`final winner is ${winnerId}`);
      return;
    }

    // winner qualify to next match
    const newMatch = new MatchUp(
      match.roundId + 1,
      Math.floor(match.id / this.teamPerMatch),
      this.teamPerMatch
    );

    if (this.matchTable[newMatch.hashCode()]) {
      this.matchTable[newMatch.hashCode()].addTeam(winnerId);
    } else {
      // newly added match, match score is not yet set
      newMatch.addTeam(winnerId);
      this.addMatch(newMatch);
    }
  };

  private createCompeteHandler(match: MatchUp): CompeteHandler {
    return (): void => this.getWinnerScore(match);
  }

  private isLastMatch(match: MatchUp): boolean {
    return match.roundId === this.numOfRounds - 1;
  }
}
