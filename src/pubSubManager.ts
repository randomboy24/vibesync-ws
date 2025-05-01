import { create } from "domain";
import { createClient, RedisClientType } from "redis";
import { WebSocket, WebSocketServer } from "ws";
import { socketIdToSocket, spaceIdToSocketIds } from ".";

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
    console.log("Channel name = " + channel);
    await this.publisher.publish(channel, message);
  }

  public async subscribe({ channel = "channel" }: { channel: string }) {
    await this.subscriber.subscribe(channel, (message) => {
      console.log("message to send to fronted " + message);
      const socketIds = spaceIdToSocketIds.get(channel);
      if (!socketIds) {
        return;
      }
      for (const socketId of socketIds) {
        //@ts-ignore
        console.log("message to send to fronted " + message);
        const socket = socketIdToSocket.get(socketId);
        if (socket && socket.readyState == socket.OPEN) {
          socket.send(message);
        }
      }
    });
  }
}
