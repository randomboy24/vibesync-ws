import express from "express";
import cors from "cors";
import { WebSocket, WebSocketServer } from "ws";
import { PrismaClient } from "@prisma/client";
import cluster from "cluster";
import os from "os";
import axios from "axios";
import { createClient } from "redis";
import { PubsubManager } from "./pubSubManager";

async function main() {
  const app = express();
  app.use(cors());

  const pubSubManager = PubsubManager.getInstance();
  const prisma = new PrismaClient();

  if (cluster.isPrimary) {
    const ncpus = os.cpus().length;
    for (let i = 0; i < ncpus; i++) {
      cluster.fork();
    }
    cluster.on("exit", () => {
      cluster.fork();
    });
    return;
  }
  const httpServer = app.listen(8080, () => {
    console.log("listening on port 8080 ");
  });

  const ws = new WebSocketServer({ server: httpServer });

  pubSubManager.subscribe({ channel: "channel", ws: ws });

  ws.on("connection", (socket) => {
    console.log("connected");

    socket.on("message", async (data) => {
      const parsedData = JSON.parse(String(data));

      switch (parsedData.type) {
        case "active":
          try {
            const songId = parsedData.songId;
            const song = await prisma.songs.update({
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
          } catch (err) {
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

            await prisma.songs.update({
              where: {
                songId: prevSongId,
              },
              data: {
                active: false,
              },
            });

            const activeSong = await prisma.songs.update({
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
          } catch (err) {
            console.log("something went wrong with nextSong type");
            console.log(err);
          }
          break;
        case "deleteUpvote":
          try {
            const deletedSong = await prisma.upvotes.deleteMany({
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
          } catch (err) {
            console.log("something went wrong with the deleteUpvote type");
            console.log(err);
          }
          break;
        case "deleteOneUpvote":
          try {
            const song = await prisma.upvotes.delete({
              where: {
                UserId_SongId: {
                  SongId: parsedData.songId,
                  UserId: parsedData.userId,
                },
              },
            });

            const upvoteCount = await prisma.upvotes.count({
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
          } catch (err) {
            console.log("something went wrong with deleteOneUpvote type");
            console.log(err);
          }
          break;
        case "addSong":
          try {
            const response = await axios.get(
              `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${parsedData.url}&key=${process.env.YOUTUBE_APIKEY}`
            );
            console.log("title is \n");

            const name = response.data.items[0].snippet.title;
            console.log(parsedData.spaceId + parsedData.url + name);
            const song = await prisma.songs.create({
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
            } catch (err) {
              console.log(err);
            }
          } catch (err) {
            console.log("something went wrong with addSong message");
          }
          break;

        case "castUpvote":
          try {
            const { userId } = parsedData;
            const { songId } = parsedData;
            const { spaceId } = parsedData;
            console.log(userId + spaceId + songId);
            const upvotes = await prisma.upvotes.create({
              data: {
                SongId: songId,
                UserId: userId,
                SpaceId: spaceId,
              },
            });

            const upvoteCount = await prisma.upvotes.count({
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
          } catch (err) {
            console.log(err);
            socket.send("something went wrong");
          }
          break;
        default:
          console.log("unknown type " + parsedData.type);
      }
    });
  });
}

main();
