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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ws_1 = require("ws");
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const prisma = new client_1.PrismaClient();
const httpServer = app.listen(8080, () => {
    console.log("listening on port 8080");
});
const ws = new ws_1.WebSocketServer({ server: httpServer });
ws.on("connection", (socket) => {
    console.log("connected");
    socket.send("you are connected to a websocket server");
    socket.on("message", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const dataInObjectFormat = JSON.parse(String(data));
        const userRecord = yield prisma.spaces.findFirst({
            select: {
                userId: true
            },
            where: {
                spacesId: dataInObjectFormat.spaceId
            }
        });
        const songRecord = yield prisma.songs.findFirst({
            where: {
                url: dataInObjectFormat.url
            },
            select: {
                songId: true
            }
        });
        const userId = userRecord === null || userRecord === void 0 ? void 0 : userRecord.userId;
        const songId = songRecord === null || songRecord === void 0 ? void 0 : songRecord.songId;
        console.log(userId);
        const upvotes = yield prisma.upvotes.create({
            data: {
                SongId: songId,
                UserId: userId,
                SpaceId: dataInObjectFormat.spaceId
            }
        });
        console.log(upvotes);
        console.log(dataInObjectFormat);
        ws.clients.forEach((client) => {
            if (client.readyState == ws_1.WebSocket.OPEN) {
                const dataInString = String(data);
                client.send("message :- " + dataInString);
            }
        });
    }));
});
// app.get('/',async (req,res) => {  
//   const users = await prisma.user.findMany({
//     where:{}
//   })
//   console.log(users)
//   res.send("hello from the server")
// })
// app.listen(3000,() => {
//   console.log("sever is listening on port 3000..")
// })
