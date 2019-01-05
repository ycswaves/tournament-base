import { Sandbox } from 'sandbox';
import { Tournament } from './tournament';
import {
  TOURNAMENT_START,
  FIRST_ROUND_RECEIVED,
  GET_TEAM_INFO,
  GET_MATCH_SCORE,
  GET_FIRST_ROUND
} from '../events';
import { MatchUp } from 'models/matchup';
import {
  FirstRoundQueryPayload,
  FirstRoundMatchUpResponse,
  TournameSpecPayload
} from 'models/payloads';

describe('Tournament', () => {
  describe('#start', () => {
    const sb = new Sandbox();
    new Tournament(sb).init();
    const stub = jest.fn();
    sb.register(GET_FIRST_ROUND, stub);
    sb.notify<TournameSpecPayload>({
      eventName: TOURNAMENT_START,
      payload: {
        numOfTeams: 4,
        teamsPerMatch: 2
      }
    });

    it('should notify subscribers about the start', () => {
      const expected: FirstRoundQueryPayload = {
        numOfTeams: 4,
        teamsPerMatch: 2
      };
      expect(stub).toBeCalledWith(expect.objectContaining(expected));
    });
  });

  describe('upon received first round matchups', () => {
    const sb = new Sandbox();
    new Tournament(sb).init();
    const fakeMatchups: FirstRoundMatchUpResponse = {
      teamIds: [2, 3, 4, 5],
      matchUps: [
        new MatchUp(0, 1, 2).addTeams([2, 5]),
        new MatchUp(0, 1, 2).addTeams([3, 4])
      ],
      tournamentId: 0
    };

    const getTeamHandler = jest.fn();
    const getMatchScoreHandler = jest.fn();

    sb.register(GET_TEAM_INFO, getTeamHandler);
    sb.register(GET_MATCH_SCORE, getMatchScoreHandler);

    sb.notify({
      eventName: FIRST_ROUND_RECEIVED,
      payload: fakeMatchups
    });

    it('should start getting team info', () => {
      expect(getTeamHandler).toBeCalledTimes(4);
    });

    it('should start getting match score', () => {
      expect(getMatchScoreHandler).toBeCalledTimes(2);
    });
  });
});
