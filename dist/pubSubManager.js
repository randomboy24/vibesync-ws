"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PubsubManager = void 0;
const redis_1 = require("redis");
const ws_1 = require("ws");
class PubsubManager {
    constructor() {
        this.publisher = (0, redis_1.createClient)();
        this.subscriber = (0, redis_1.createClient)();
        this.publisher.connect();
        this.subscriber.connect();
    }
    static getInstance() {
        if (!PubsubManager.instance) {
            this.instance = new PubsubManager();
        }
        return PubsubManager.instance;
    }
    publish(_a) {
        return __awaiter(this, arguments, void 0, function* ({ channel = "channel", message, }) {
            yield this.publisher.publish(channel || "channel", message);
        });
    }
    subscribe(_a) {
        return __awaiter(this, arguments, void 0, function* ({ channel = "channel", ws, }) {
            yield this.subscriber.subscribe(channel, (message) => {
                ws.clients.forEach((client) => {
                    if (client.readyState == ws_1.WebSocket.OPEN) {
                        client.send(message);
                    }
                });
            });
        });
    }
}
exports.PubsubManager = PubsubManager;
