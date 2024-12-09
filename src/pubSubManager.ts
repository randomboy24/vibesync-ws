import { create } from "domain";
import { createClient, RedisClientType } from "redis";
import { WebSocket, WebSocketServer } from "ws";

export class PubsubManager {
  private static instance: PubsubManager;
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private constructor() {
    this.publisher = createClient();
    this.subscriber = createClient();
    this.publisher.connect();
    this.subscriber.connect();
  }

  public static getInstance() {
    if (!PubsubManager.instance) {
      this.instance = new PubsubManager();
    }
    return PubsubManager.instance;
  }

  public async publish({
    channel = "channel",
    message,
  }: {
    channel?: string;
    message: string;
  }) {
    await this.publisher.publish(channel || "channel", message);
  }

  public async subscribe({
    channel = "channel",
    ws,
  }: {
    channel: string;
    ws: WebSocketServer;
  }) {
    await this.subscriber.subscribe(channel, (message) => {
      ws.clients.forEach((client) => {
        if (client.readyState == WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  }
}
