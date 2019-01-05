import { Sandbox } from 'sandbox';

export class Module {
  protected eventHandlers!: { [key: string]: (payload: any) => void };

  constructor(protected sb: Sandbox) {}

  public init(): this {
    Object.entries(this.eventHandlers).forEach(([eventName, handler]) => {
      this.sb.register(eventName, handler);
    });

    return this;
  }

  public destroy() {
    Object.entries(this.eventHandlers).forEach(([eventName, handler]) => {
      this.sb.unregister(eventName, handler);
    });
  }
}
