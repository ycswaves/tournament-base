import { MatchUp } from './matchup';
import { Team, TeamFactory } from './team';
describe('Match', () => {
  it('should able to check if match is ready to compete', () => {
    const match = new MatchUp(1, 3, {});

    match.setMatchScore(4);
    expect(match.isReadyToCompete()).toBeFalsy();

    match.addTeam(1);
    expect(match.isReadyToCompete()).toBeFalsy();

    match.addTeams([2, 3]);
    expect(match.isReadyToCompete()).toBeTruthy();
  });

  describe('should able to return winner id correctly', () => {
    describe('no tie', () => {
      const team1 = TeamFactory.createTeam(1, 'team 1', 2);
      const team2 = TeamFactory.createTeam(2, 'team 2', 3);
      const match = new MatchUp(1, 2, { 1: team1, 2: team2 });
      match.addTeams([1, 2]).setMatchScore(2);

      it('should return correct winner', () => {
        expect(match.isReadyToCompete()).toBeTruthy();

        // if winner score is 2
        expect(match.getWinnerId(2)).toEqual(1);

        // if winner score is 3
        expect(match.getWinnerId(3)).toEqual(2);
      });
    });

    describe('with a tie', () => {
      const SAME_SCORE = 10;
      const team1 = TeamFactory.createTeam(1, 'team 1', SAME_SCORE);
      const team2 = TeamFactory.createTeam(2, 'team 2', SAME_SCORE);
      const match = new MatchUp(1, 2, { 2: team2, 1: team1 });
      match.addTeams([2, 1]).setMatchScore(2);

      it('should return the team with lower id as winner', () => {
        expect(match.isReadyToCompete()).toBeTruthy();
        expect(match.getWinnerId(SAME_SCORE)).toEqual(1);
      });
    });
  });
});
