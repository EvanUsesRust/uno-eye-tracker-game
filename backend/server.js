import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(__dirname, "../frontend")));

let players = {};
let deck = [];
let discardPile = [];
let currentPlayer = null;

// Create a simple Uno-like deck
function createDeck() {
  const colors = ["red", "yellow", "green", "blue"];
  const values = ["0","1","2","3","4","5","6","7","8","9","skip","reverse","+2"];
  let newDeck = [];

  colors.forEach(color => {
    values.forEach(value => {
      newDeck.push({ color, value });
      if (value !== "0") newDeck.push({ color, value });
    });
  });
  return shuffle(newDeck);
}

// Fisher-Yates shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

io.on("connection", socket => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("joinGame", username => {
    players[socket.id] = { username, hand: [], id: socket.id };
    if (Object.keys(players).length === 1) {
      deck = createDeck();
      discardPile = [deck.pop()];
      currentPlayer = socket.id;
    }
    for (let i = 0; i < 7; i++) {
      players[socket.id].hand.push(deck.pop());
    }
    io.emit("updateGame", { players, discardPile, currentPlayer });
  });

  socket.on("playCard", cardIndex => {
    if (socket.id !== currentPlayer) return;
    let player = players[socket.id];
    let card = player.hand[cardIndex];
    let topCard = discardPile[discardPile.length - 1];

    if (card.color === topCard.color || card.value === topCard.value) {
      player.hand.splice(cardIndex, 1);
      discardPile.push(card);
      nextTurn();
    }
    io.emit("updateGame", { players, discardPile, currentPlayer });
  });

  socket.on("drawCard", () => {
    if (socket.id !== currentPlayer) return;
    let player = players[socket.id];
    player.hand.push(deck.pop());
    nextTurn();
    io.emit("updateGame", { players, discardPile, currentPlayer });
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit("updateGame", { players, discardPile, currentPlayer });
  });
});

function nextTurn() {
  let ids = Object.keys(players);
  let currentIndex = ids.indexOf(currentPlayer);
  currentPlayer = ids[(currentIndex + 1) % ids.length];
}

httpServer.listen(3000, () => {
  console.log("Server running on port 3000");
});
