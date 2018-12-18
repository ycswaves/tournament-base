import { Team } from './team';

export class MatchUp {
  private teamIds: number[] = [];
  private matchScore: number | null = null;

  constructor(
    readonly match: number,
    readonly teamsPerMatch: number,
    readonly teamLookupTable: { [teamId: number]: Team }
  ) {}

  public addTeam(teamId: number): this {
    this.teamIds.push(teamId);
    return this;
  }

  public addTeams(teamIds: number[]): this {
    this.teamIds = this.teamIds.concat(teamIds);
    return this;
  }

  public setMatchScore(matchScore: number): this {
    this.matchScore = matchScore;
    return this;
  }

  public isReadyToCompete(): boolean {
    return this.teamIds.length >= this.teamsPerMatch && !!this.matchScore;
  }

  public getWinnerId(winnerScore: number): number {
    const winnerId = this.teamIds
      .sort((teamId1, teamId2) => teamId1 - teamId2)
      .find((teamId: number) => {
        const team = this.teamLookupTable[teamId];
        return team.score === winnerScore;
      });

    if (!winnerId) {
      throw new Error('no matching winner score');
    }

    return winnerId;
  }
}
