import { Tournament } from './modules/tournament';
import { Sandbox } from 'sandbox';
import { TournamentService } from 'services/TournamentService';
import { Ui } from 'modules/ui';

const sandbox = new Sandbox();
const u = new Ui(sandbox);
new Tournament(sandbox).init();
new TournamentService(sandbox).init();

document.addEventListener('DOMContentLoaded', () => {
  u.init();
});
