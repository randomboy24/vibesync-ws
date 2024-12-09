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
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
const axios_1 = __importDefault(require("axios"));
const pubSubManager_1 = require("./pubSubManager");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        app.use((0, cors_1.default)());
        const pubSubManager = pubSubManager_1.PubsubManager.getInstance();
        const prisma = new client_1.PrismaClient();
        if (cluster_1.default.isPrimary) {
            const ncpus = os_1.default.cpus().length;
            for (let i = 0; i < ncpus; i++) {
                cluster_1.default.fork();
            }
            cluster_1.default.on("exit", () => {
                cluster_1.default.fork();
            });
            return;
        }
        const httpServer = app.listen(8080, () => {
            console.log("listening on port 8080 ");
        });
        const ws = new ws_1.WebSocketServer({ server: httpServer });
        pubSubManager.subscribe({ channel: "channel", ws: ws });
        ws.on("connection", (socket) => {
            console.log("connected");
            socket.on("message", (data) => __awaiter(this, void 0, void 0, function* () {
                const parsedData = JSON.parse(String(data));
                switch (parsedData.type) {
                    case "active":
                        try {
                            const songId = parsedData.songId;
                            const song = yield prisma.songs.update({
                                where: {
                                    songId: songId,
                                },
                                data: {
                                    active: true,
                                },
                            });
                            pubSubManager.publish({
                                message: JSON.stringify({
                                    type: "active",
                                    url: song.url,
                                    songId: song.songId,
                                }),
                            });
                            return;
                        }
                        catch (err) {
                            console.log("something went wrong in active type");
                            console.log(err);
                        }
                        break;
                    case "nextSong":
                        try {
                            console.log("enter into nextSong");
                            const prevSongId = parsedData.prevSongId;
                            const newSongId = parsedData.newSongId;
                            console.log("aiogirogiaowgioarhgioasigorehgiohaiogERO");
                            console.log(prevSongId + "   " + newSongId);
                            yield prisma.songs.update({
                                where: {
                                    songId: prevSongId,
                                },
                                data: {
                                    active: false,
                                },
                            });
                            const activeSong = yield prisma.songs.update({
                                where: {
                                    songId: newSongId,
                                },
                                data: {
                                    active: true,
                                },
                            });
                            pubSubManager.publish({
                                message: JSON.stringify({
                                    type: "nextSong",
                                    url: activeSong.url,
                                    songId: activeSong.songId,
                                }),
                            });
                            return;
                        }
                        catch (err) {
                            console.log("something went wrong with nextSong type");
                            console.log(err);
                        }
                        break;
                    case "deleteUpvote":
                        try {
                            const deletedSong = yield prisma.upvotes.deleteMany({
                                where: {
                                    SongId: parsedData.songId,
                                },
                            });
                            pubSubManager.publish({
                                message: JSON.stringify({
                                    type: "deleteUpvote",
                                    songId: parsedData.songId,
                                }),
                            });
                            return;
                        }
                        catch (err) {
                            console.log("something went wrong with the deleteUpvote type");
                            console.log(err);
                        }
                        break;
                    case "deleteOneUpvote":
                        try {
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
                                    SongId: parsedData.songId,
                                },
                            });
                            console.log("boom");
                            console.log(song);
                            pubSubManager.publish({
                                message: JSON.stringify({
                                    type: "deleteOneUpvote",
                                    songId: song.SongId,
                                    userId: song.UserId,
                                    upvoteCount: upvoteCount,
                                }),
                            });
                            return;
                        }
                        catch (err) {
                            console.log("something went wrong with deleteOneUpvote type");
                            console.log(err);
                        }
                        break;
                    case "addSong":
                        try {
                            const response = yield axios_1.default.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${parsedData.url}&key=${process.env.YOUTUBE_APIKEY}`);
                            console.log("title is \n");
                            const name = response.data.items[0].snippet.title;
                            console.log(parsedData.spaceId + parsedData.url + name);
                            const song = yield prisma.songs.create({
                                data: {
                                    spaceId: parsedData.spaceId,
                                    url: parsedData.url,
                                    name: name,
                                    active: false,
                                },
                            });
                            console.log(song);
                            try {
                                pubSubManager.publish({
                                    message: JSON.stringify({
                                        type: "addSong",
                                        songId: song.songId,
                                        name: song.name,
                                        url: song.url,
                                    }),
                                });
                                return;
                            }
                            catch (err) {
                                console.log(err);
                                return;
                            }
                        }
                        catch (err) {
                            console.log("something went wrong with addSong message");
                            return;
                        }
                        break;
                    case "castUpvote":
                        try {
                            const { userId } = parsedData;
                            const { songId } = parsedData;
                            const { spaceId } = parsedData;
                            console.log(userId + spaceId + songId);
                            const upvotes = yield prisma.upvotes.create({
                                data: {
                                    SongId: songId,
                                    UserId: userId,
                                    SpaceId: spaceId,
                                },
                            });
                            const upvoteCount = yield prisma.upvotes.count({
                                where: {
                                    SongId: songId,
                                },
                            });
                            pubSubManager.publish({
                                message: JSON.stringify({
                                    userId: userId,
                                    type: "castUpvote",
                                    songId: upvotes.SongId,
                                    upvoteCount: upvoteCount,
                                }),
                            });
                        }
                        catch (err) {
                            console.log(err);
                            socket.send("something went wrong");
                        }
                        break;
                    default:
                        console.log("unknown type " + parsedData.type);
                }
            }));
        });
    });
}
main();
