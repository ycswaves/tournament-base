export interface Event<T> {
  evetName: string;
  payload?: T;
}

interface ObserverMapping {
  [eventName: string]: Map<EventHandler, EventHandler>;
}

export type EventHandler = (eventPayload: any) => void | Promise<void>;

export class Sandbox {
  private observerMapping: ObserverMapping = {};

  public notify<T>(event: Event<T>): void {
    this.observerMapping[event.evetName].forEach(handler => {
      handler(event.payload);
    });
  }

  public register(eventName: string, handler: EventHandler) {
    if (!(this.observerMapping[eventName] instanceof Map)) {
      this.observerMapping[eventName] = new Map();
    }
    this.observerMapping[eventName].set(handler, handler);
  }

  public unregister(eventName: string, handler: EventHandler) {
    this.observerMapping[eventName].delete(handler);
  }
}
