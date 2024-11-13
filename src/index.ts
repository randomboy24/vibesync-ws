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
  socket.send("you are connected to a websocket server")

  socket.on("message",async (data) => {
    const dataInObjectFormat = JSON.parse(String(data))
      const userRecord = await prisma.spaces.findFirst({
        select:{
          userId:true
        },
        where:{
          spacesId:dataInObjectFormat.spaceId
        }
      })
      
      const songRecord= await prisma.songs.findFirst({
        where:{
          url:dataInObjectFormat.url
        },
        select:{
          songId:true
        }
      })
      
      const userId = userRecord?.userId;
      const songId = songRecord?.songId;

      console.log(userId)

      const upvotes = await prisma.upvotes.create({
        data:{
          SongId:songId as string,
          UserId:"79653ee5-f4fd-42af-a420-ba4c4d93bdd8",
          SpaceId:dataInObjectFormat.spaceId
        }
      })
    
      console.log(upvotes)

    console.log(dataInObjectFormat);
    ws.clients.forEach((client) => {
      if(client.readyState == WebSocket.OPEN){
      const dataInString = String(data)
      client.send("message :- "+dataInString)
      }
    })
  })
})

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