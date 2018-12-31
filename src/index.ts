import { Tournament } from './modules/tournament';
import { Sandbox } from 'sandbox';
import { TournamentService } from 'services/TournamentService';

const sandbox = new Sandbox();
const t = new Tournament(0, 2, 64, sandbox);
const s = new TournamentService(sandbox);
t.start();
