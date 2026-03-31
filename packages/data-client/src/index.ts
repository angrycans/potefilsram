import type { DashboardSchema } from "@marslife/shared-schema";

export type ApiClientOptions = {
  baseUrl: string;
};

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async fetchDashboard(): Promise<DashboardSchema> {
    const response = await fetch(`${this.options.baseUrl}/dashboard`);
    if (!response.ok) {
      throw new Error(`Failed to load dashboard: ${response.status}`);
    }
    return (await response.json()) as DashboardSchema;
  }
}

export type SocketEventHandler<T> = (event: T) => void;

export class WebSocketClient<TEvent> {
  private socket?: WebSocket;

  connect(url: string, onEvent: SocketEventHandler<TEvent>) {
    this.socket = new WebSocket(url);
    this.socket.onmessage = (message) => {
      onEvent(JSON.parse(message.data) as TEvent);
    };
  }

  disconnect() {
    this.socket?.close();
    this.socket = undefined;
  }
}
