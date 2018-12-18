export interface Team {
  teamId: number;
  name: string;
  score: number;
}

export const TeamFactory = {
  createTeam: (teamId: number, name: string, score: number): Team => ({
    teamId,
    name,
    score
  })
};
