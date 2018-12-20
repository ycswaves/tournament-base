import { MatchUp } from './matchup';
import { TeamFactory } from './team';
describe('Match', () => {
  it('should notify subscriber if match is ready to compete', () => {
    const team1 = TeamFactory.createTeam(1, 'team 1', 2);
    const team2 = TeamFactory.createTeam(2, 'team 2', 3);
    const teamTable = { 1: team1, 2: team2 };
    const match = new MatchUp(0, 1, 2);
    const subscriber = jest.fn();
    match.onReadyToCompete(teamTable, subscriber);

    match.addTeam(team1.id);
    expect(subscriber).not.toBeCalled();

    match.addTeam(team2.id);
    expect(subscriber).not.toBeCalled();

    match.setMatchScore(123123);
    expect(subscriber).toBeCalled();
  });

  describe('should able to return winner id correctly', () => {
    describe('no tie', () => {
      const team1 = TeamFactory.createTeam(1, 'team 1', 2);
      const team2 = TeamFactory.createTeam(2, 'team 2', 3);
      const teamTable = { 1: team1, 2: team2 };
      const match = new MatchUp(0, 1, 2);
      match.onReadyToCompete(teamTable, jest.fn());
      match.addTeams([team1.id, team2.id]).setMatchScore(2);

      it('should return correct winner', () => {
        // if winner score is 2
        expect(match.getWinnerId(team1.score)).toEqual(team1.id);

        // if winner score is 3
        expect(match.getWinnerId(team2.score)).toEqual(team2.id);
      });
    });

    describe('with a tie', () => {
      const SAME_SCORE = 10;
      const team1 = TeamFactory.createTeam(1, 'team 1', SAME_SCORE);
      const team2 = TeamFactory.createTeam(2, 'team 2', SAME_SCORE);
      const teamTable = { 2: team2, 1: team1 };
      const match = new MatchUp(0, 1, 2);
      match.onReadyToCompete(teamTable, jest.fn());
      match.addTeams([team2.id, team1.id]).setMatchScore(12313);

      it('should return the team with lower id as winner', () => {
        expect(match.getWinnerId(SAME_SCORE)).toEqual(team1.id);
      });
    });
  });
});
