import { Tournament } from './models/tournament';
import { Sandbox } from 'sandbox';
import {
  TOURNAMENT_START,
  GET_TEAM_INFO,
  GET_MATCH_SCORE,
  GET_WINNER_SCORE
} from 'events';
import { TournamentService } from 'services/TournamentService';

const sandbox = new Sandbox();
const t = new Tournament(0, 2, 64, sandbox);
sandbox.register(TOURNAMENT_START, TournamentService.getFirstRound(sandbox));
sandbox.register(GET_TEAM_INFO, TournamentService.getTeamInfo(sandbox));
sandbox.register(GET_MATCH_SCORE, TournamentService.getMatchScore(sandbox));
sandbox.register(GET_WINNER_SCORE, TournamentService.getWinnerScore(sandbox));

t.start();
