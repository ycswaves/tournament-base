import { Sandbox } from 'sandbox';
import { TournamentService } from 'services/TournamentService';
import { Ui } from 'modules/ui';

const sandbox = new Sandbox();
const u = new Ui(sandbox);
new TournamentService(sandbox).init();

document.addEventListener('DOMContentLoaded', () => {
  u.init();
});
