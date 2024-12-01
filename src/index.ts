import express from "express"
import cors from "cors"
import { WebSocket, WebSocketServer } from "ws";
import { PrismaClient } from "@prisma/client";

const app = express();  
app.use(cors())

const prisma = new PrismaClient();

const httpServer = app.listen(8080,() => {
  console.log("listening on port 8080")
})

const ws = new WebSocketServer({server:httpServer})

ws.on("connection",(socket) => {
  console.log("connected")

  socket.on("message",async (data) => {

    const parsedData = JSON.parse(String(data))

    console.log(parsedData.type)
    if(parsedData.type === "active"){
      const songId = parsedData.songId  
      const song = await prisma.songs.update({
          where:{
            songId:songId
          },  
          data:{
            active:true
          }
      })

      console.log(song)

      ws.clients.forEach((client) => {
        if(client.readyState == WebSocket.OPEN){
          client.send(JSON.stringify({  
            type:"active",  
            url:song.url,
            songId:song.songId
          }))
        }
      })
      return;
    }

    if(parsedData.type === "inactive"){
      console.log("enter into inactive")
      const prevSongId = parsedData.prevSongId;
      const newSongId = parsedData.newSongId;
      console.log("aiogirogiaowgioarhgioaigorehgiohaiogERO")
      console.log(prevSongId+ "   "+newSongId)

      await prisma.songs.update({
          where:{
            songId:prevSongId
          },
          data:{
            active:false
          }
        })

      const activeSong = await prisma.songs.update({
        where:{
          songId:newSongId  
        },
        data:{
          active:true
        }
      })

      // console.log(activeSong.songId)

      ws.clients.forEach((client) => {
        try {  
          if(client.readyState == WebSocket.OPEN){
            client.send(JSON.stringify({
              type:"inactive",
              url:activeSong.url,
              songId:activeSong.songId
            }))
          }
        }catch(err){
          console.log("Error occured in type inactive ")
        }
      })
      return;
    }

    if(parsedData.type === "deleteUpvote"){
      const deletedSong = await prisma.upvotes.deleteMany({
        where:{
          SongId:parsedData.songId
        }
      })

      ws.clients.forEach((client) => {
        if(client.readyState == WebSocket.OPEN){
          client.send(JSON.stringify({
            type:"deleteUpvote",
            songId:parsedData.songId  
          }))
        }
      })
      return;
    }


    
    const dataInObjectFormat = JSON.parse(String(data))
    const userId:string = dataInObjectFormat.userId;
    const songId:string = dataInObjectFormat.songId;
    const spaceId:string = dataInObjectFormat.spaceId

    try{

      // const upvoteFound = await prisma.upvotes.findUnique({
      //   where:{
      //     UserId_SongId:{
      //       SongId:songId,
      //       UserId:userId
      //     },
      //     SpaceId:spaceId
      //   }
      // })
      const upvotes = await prisma.upvotes.create({
        data:{
          SongId:songId,
          UserId:userId,
          SpaceId:dataInObjectFormat.spaceId
        }
      })
      

      const upvoteCount = await prisma.upvotes.count({
        where:{
          SongId:songId
        }
      })
      
      console.log(upvotes)
      
      console.log(dataInObjectFormat);
      console.log({
        songId:upvotes.SongId,
        upvoteCount:upvoteCount
      })
      ws.clients.forEach((client) => {
        if(client.readyState == WebSocket.OPEN){
          // const dataInString = String(data)
          client.send(JSON.stringify({
            songId:upvotes.SongId,
            upvoteCount:upvoteCount
          }))
        }
      })
    }catch(err){
      console.log(err)
      socket.send("something went wrong")
    }
  })
})
