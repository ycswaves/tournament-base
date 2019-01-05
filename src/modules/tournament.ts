import { MatchUp, CompeteHandler } from '../models/matchup';
import { MathUtil } from '../utils/math';
import { Sandbox } from 'sandbox';
import { Team } from '../models/team';
import {
  GET_FIRST_ROUND,
  FIRST_ROUND_RECEIVED,
  GET_TEAM_INFO,
  RECEIVED_TEAM_INFO,
  RECEIVED_MATCH_SCORE,
  GET_MATCH_SCORE,
  GET_WINNER_SCORE,
  RECEIVED_WINNER_SCORE,
  TOURNAMENT_START
} from '../events';
import {
  FirstRoundQueryPayload,
  FirstRoundMatchUpResponse,
  TeamInfoQueryPayload,
  MatchScoreQueryPayload,
  MatchScoreResultPayload,
  WinnerScoreQueryPayload,
  WinnerScoreResultPayload,
  TournameSpecPayload
} from 'models/payloads';
import { Module } from './base';

export interface TeamTable {
  [id: number]: Team;
}

export interface MatchTable {
  [hashCode: string]: MatchUp;
}

enum State {
  STOPPED,
  STARTED,
  PAUSED
}

export class Tournament extends Module {
  private id!: number;
  private teamTable: TeamTable = {};
  private matchTable: MatchTable = {};
  private teamPerMatch!: number;
  private teamsCount!: number;
  private numOfRounds!: number;
  private state: State = State.STOPPED;

  constructor(private sandbox: Sandbox) {
    super(sandbox);
    this.eventHandlers = {
      [TOURNAMENT_START]: this.start,
      [FIRST_ROUND_RECEIVED]: this.onFirstRoundReceived,
      [RECEIVED_TEAM_INFO]: this.onTeamInfoReceived,
      [RECEIVED_MATCH_SCORE]: this.onMatchScoreReceived,
      [RECEIVED_WINNER_SCORE]: this.onWinnerScoreReceived
    };
  }

  private start = (tournamentSpec: TournameSpecPayload): void => {
    if (this.state === State.STARTED) {
      console.log('already started');
      return;
    }

    this.state = State.STARTED;

    this.teamPerMatch = tournamentSpec.teamsPerMatch;
    this.teamsCount = tournamentSpec.numOfTeams;
    this.numOfRounds = MathUtil.getBaseLog(this.teamPerMatch, this.teamsCount);

    this.sandbox.notify<FirstRoundQueryPayload>({
      eventName: GET_FIRST_ROUND,
      payload: {
        teamsPerMatch: this.teamPerMatch,
        numOfTeams: this.teamsCount
      }
    });
  };

  private onFirstRoundReceived = (firstRound: FirstRoundMatchUpResponse) => {
    const { teamIds, matchUps, tournamentId } = firstRound;
    this.id = tournamentId;
    teamIds.forEach(id => this.addTeamInfo(id));
    matchUps.forEach(match => this.addMatch(match));
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

    if (this.isLastMatch(match)) {
      // show winnder
      this.onFinalWinner(winnerId);
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

  private onFinalWinner(winnerId: number) {
    console.log(`final winner is ${winnerId}`);
    this.reset();
  }

  private reset() {
    this.teamTable = {};
    this.matchTable = {};
    this.state = State.STOPPED;
  }
}
