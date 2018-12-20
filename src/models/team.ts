export interface Team {
  id: number;
  name: string;
  score: number;
}

export const TeamFactory = {
  createTeam: (teamId: number, name: string, score: number): Team => ({
    id: teamId,
    name,
    score
  })
};
