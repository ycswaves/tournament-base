import { TeamTable } from './tournament';

export type CompeteHandler = () => Promise<void>;
export class MatchUp {
  // private winnerId!: number;
  private teamIds: number[] = [];
  private matchScore!: number;
  private notifyTournament!: CompeteHandler;
  private teamLookupTable!: TeamTable;

  constructor(
    readonly roundId: number,
    readonly id: number,
    private teamsPerMatch: number
  ) {}

  public onReadyToCompete(teamTable: TeamTable, handler: CompeteHandler) {
    this.notifyTournament = handler;
    this.teamLookupTable = teamTable;
  }

  public addTeam(teamId: number): this {
    return this.addTeams([teamId]);
  }

  public addTeams(teamIds: number[]): this {
    this.teamIds = this.teamIds.concat(teamIds);
    console.log('add teams', teamIds);
    this.checkMatchReadiness();
    return this;
  }

  public setMatchScore(matchScore: number): this {
    this.matchScore = matchScore;
    console.log('set match score', this);
    this.checkMatchReadiness();
    return this;
  }

  public getTeamIds(): number[] {
    return this.teamIds;
  }

  public getMatchScore(): number | null {
    return this.matchScore;
  }

  public checkMatchReadiness(): void {
    if (this.matchScore === undefined) {
      return;
    }

    if (this.teamIds.length < this.teamsPerMatch) {
      return;
    } else {
      const allTeamInfoAvailable: boolean = this.teamIds.reduce(
        (teamsReady: boolean, teamId: number) =>
          !!this.teamLookupTable[teamId] && teamsReady,
        true
      );

      if (!allTeamInfoAvailable) {
        return;
      }
    }

    this.notifyTournament();
  }

  public getWinnerId(winnerScore: number): number {
    // if (this.winnerId !== undefined) {
    //   return this.winnerId;
    // }

    const winnerId = this.teamIds
      .sort((teamId1, teamId2) => teamId1 - teamId2)
      .find((teamId: number) => {
        const team = this.teamLookupTable[teamId];
        return team.score === winnerScore;
      });

    if (winnerId === undefined) {
      throw new Error('no matching winner score');
    }

    // this.winnerId = winnerId;
    return winnerId;
  }

  public hashCode() {
    return `round-${this.roundId}:match-${this.id}`;
  }
}
