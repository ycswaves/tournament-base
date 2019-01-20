import { MatchUp } from '../models/matchup';
import { Team } from '../models/team';
export interface TeamTable {
  [id: number]: Team;
}

export interface MatchTable {
  [hashCode: string]: MatchUp;
}

export class Tournament {
  private teamTable: TeamTable = {};
  private matchTable: MatchTable = {};
  private teamPerMatch!: number;
  private teamsCount!: number;
  private numOfRounds!: number;

  constructor(readonly id: number) {}

  public addTeamInfo(team: Team): void {
    this.teamTable[team.id] = team;
  }

  public addMatch(match: MatchUp): void {
    this.matchTable[match.hashCode()] = match;
  }

  public updateMatch(match: MatchUp): this {
    this.addMatch(match);
    return this;
  }

  public getMatches() {
    return Object.values(this.matchTable);
  }

  public getTeamTable(): TeamTable {
    return this.teamTable;
  }

  public isLastMatch(match: MatchUp): boolean {
    return match.roundId === this.numOfRounds - 1;
  }
}
