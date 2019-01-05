import { Sandbox } from 'sandbox';
import { TOURNAMENT_START } from 'events';
import { TournameSpecPayload } from 'models/payloads';

export class Ui {
  private startBtn!: HTMLElement | null;
  private teamsPerMatchField!: HTMLInputElement;
  private numberOfTeamsField!: HTMLInputElement;

  constructor(private sb: Sandbox) {}

  public init() {
    this.startBtn = document.getElementById('start');
    this.teamsPerMatchField = document.getElementById(
      'teamsPerMatch'
    ) as HTMLInputElement;
    this.numberOfTeamsField = document.getElementById(
      'numberOfTeams'
    ) as HTMLInputElement;

    this.startBtn!.addEventListener('click', this.startTournament);
  }

  private startTournament = () => {
    this.sb.notify<TournameSpecPayload>({
      eventName: TOURNAMENT_START,
      payload: {
        numOfTeams: parseInt(this.numberOfTeamsField.value, 10),
        teamsPerMatch: parseInt(this.teamsPerMatchField.value, 10)
      }
    });
  };
}
