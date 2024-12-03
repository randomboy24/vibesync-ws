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
    console.log("listening on port 8080 ");
});
const ws = new ws_1.WebSocketServer({ server: httpServer });
ws.on("connection", (socket) => {
    console.log("connected");
    socket.on("message", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const parsedData = JSON.parse(String(data));
        console.log(parsedData.type);
        if (parsedData.type === "active") {
            const songId = parsedData.songId;
            const song = yield prisma.songs.update({
                where: {
                    songId: songId
                },
                data: {
                    active: true
                }
            });
            console.log(song);
            ws.clients.forEach((client) => {
                if (client.readyState == ws_1.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "active",
                        url: song.url,
                        songId: song.songId
                    }));
                }
            });
            return;
        }
        if (parsedData.type === "nextSong") {
            console.log("enter into nextSong");
            const prevSongId = parsedData.prevSongId;
            const newSongId = parsedData.newSongId;
            console.log("aiogirogiaowgioarhgioasigorehgiohaiogERO");
            console.log(prevSongId + "   " + newSongId);
            yield prisma.songs.update({
                where: {
                    songId: prevSongId
                },
                data: {
                    active: false
                }
            });
            const activeSong = yield prisma.songs.update({
                where: {
                    songId: newSongId
                },
                data: {
                    active: true
                }
            });
            // console.log(activeSong.songId)
            ws.clients.forEach((client) => {
                try {
                    if (client.readyState == ws_1.WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "nextSong",
                            url: activeSong.url,
                            songId: activeSong.songId
                        }));
                    }
                }
                catch (err) {
                    console.log("Error occured in type nextSong ");
                }
            });
            return;
        }
        if (parsedData.type === "deleteUpvote") {
            const deletedSong = yield prisma.upvotes.deleteMany({
                where: {
                    SongId: parsedData.songId
                }
            });
            ws.clients.forEach((client) => {
                if (client.readyState == ws_1.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "deleteUpvote",
                        songId: parsedData.songId
                    }));
                }
            });
            return;
        }
        if (parsedData.type === "deleteOneUpvote") {
            const song = yield prisma.upvotes.delete({
                where: {
                    UserId_SongId: {
                        SongId: parsedData.songId,
                        UserId: parsedData.userId,
                    },
                },
            });
            const upvoteCount = yield prisma.upvotes.count({
                where: {
                    SongId: parsedData.songId
                }
            });
            console.log("boom");
            console.log(song);
            ws.clients.forEach((client) => {
                if (client.readyState == ws_1.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "deleteOneUpvote",
                        songId: song.SongId,
                        userId: song.UserId,
                        upvoteCount: upvoteCount
                    }));
                }
            });
            return;
        }
        const dataInObjectFormat = JSON.parse(String(data));
        const userId = dataInObjectFormat.userId;
        const songId = dataInObjectFormat.songId;
        const spaceId = dataInObjectFormat.spaceId;
        try {
            // const upvoteFound = await prisma.upvotes.findUnique({
            //   where:{
            //     UserId_SongId:{
            //       SongId:songId,
            //       UserId:userId
            //     },
            //     SpaceId:spaceId
            //   }
            // })
            const upvotes = yield prisma.upvotes.create({
                data: {
                    SongId: songId,
                    UserId: userId,
                    SpaceId: dataInObjectFormat.spaceId
                }
            });
            const upvoteCount = yield prisma.upvotes.count({
                where: {
                    SongId: songId
                }
            });
            console.log(upvotes);
            console.log(dataInObjectFormat);
            console.log({
                songId: upvotes.SongId,
                upvoteCount: upvoteCount
            });
            ws.clients.forEach((client) => {
                if (client.readyState == ws_1.WebSocket.OPEN) {
                    // const dataInString = String(data)
                    client.send(JSON.stringify({
                        userId: userId,
                        songId: upvotes.SongId,
                        upvoteCount: upvoteCount
                    }));
                }
            });
        }
        catch (err) {
            console.log(err);
            socket.send("something went wrong");
        }
    }));
});
