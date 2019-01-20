import { TeamTable } from './tournament';

export type CompeteHandler = () => void;
export class MatchUp {
  public winnerId!: number;
  private teamIds: number[] = [];
  private matchScore!: number;

  constructor(
    readonly roundId: number,
    readonly id: number,
    private teamsPerMatch: number
  ) {}

  public addTeam(teamId: number): this {
    return this.addTeams([teamId]);
  }

  public addTeams(teamIds: number[]): this {
    this.teamIds = this.teamIds.concat(teamIds);
    return this;
  }

  public setMatchScore(matchScore: number): this {
    this.matchScore = matchScore;
    return this;
  }

  public getTeamIds(): number[] {
    return this.teamIds;
  }

  public getMatchScore(): number | null {
    return this.matchScore;
  }

  public checkMatchReadiness(teamLookupTable: TeamTable): boolean {
    if (this.matchScore === undefined) {
      return false;
    }

    if (this.teamIds.length < this.teamsPerMatch) {
      return false;
    } else {
      const allTeamInfoAvailable: boolean = this.teamIds.reduce(
        (teamsReady: boolean, teamId: number) =>
          !!teamLookupTable[teamId] && teamsReady,
        true
      );

      if (!allTeamInfoAvailable) {
        return false;
      }
    }

    return true;
  }

  public setWinnerId(winnerScore: number, teamLookupTable: TeamTable): this {
    const winnerId = this.teamIds
      .sort((teamId1, teamId2) => teamId1 - teamId2)
      .find((teamId: number) => {
        const team = teamLookupTable[teamId];
        return team.score === winnerScore;
      });

    if (winnerId === undefined) {
      throw new Error('no matching winner score');
    }

    this.winnerId = winnerId;
    return this;
  }

  public hashCode() {
    return `round-${this.roundId}:match-${this.id}`;
  }
}
