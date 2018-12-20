import { TournamentService } from '../services/TournamentService';
import { MathUtil } from '../utils/math';
import { MatchUp, CompeteHandler } from './matchup';
import { Team } from './team';

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
    private teamsCount: number
  ) {
    this.numOfRounds = MathUtil.getBaseLog(teamPerMatch, teamsCount);
  }

  public async addTeamInfo(teamId: number): Promise<void> {
    const team = await TournamentService.getTeamInfo(this.id, teamId);
    this.teamTable[team.id] = team;
    Object.values(this.matchTable)
      .filter(match => match.getTeamIds().includes(teamId))
      .forEach(match => {
        match.checkMatchReadiness();
      });
  }

  public async addMatch(match: MatchUp): Promise<void> {
    this.matchTable[match.hashCode()] = match;

    match.onReadyToCompete(this.teamTable, this.createCompeteHandler(match));
    const matchScore = await TournamentService.getMatchScore(this.id, match);
    match.setMatchScore(matchScore);
  }

  public async start(): Promise<void> {
    const { teamIds, matchUps } = await TournamentService.getFirstRound(
      this.teamsCount,
      this.teamPerMatch
    );
    teamIds.forEach(id => this.addTeamInfo(id));
    matchUps.forEach(match => this.addMatch(match));
  }

  private createCompeteHandler(match: MatchUp): CompeteHandler {
    return async (): Promise<void> => {
      const winnerScore = await TournamentService.getWinnerScore(
        this.id,
        match,
        this.teamTable
      );

      const winnerId = match.getWinnerId(winnerScore);

      console.log(`${match.hashCode()} winner is: `, winnerId);
      // delete this.matchTable[match.hashCode()];
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
  }

  private isLastMatch(match: MatchUp): boolean {
    return match.roundId === this.numOfRounds - 1;
  }
}
