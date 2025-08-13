const socket = io();

const username = prompt("Enter your name");
socket.emit("joinGame", username);

socket.on("updateGame", game => {
  const discardDiv = document.getElementById("discard");
  const handDiv = document.getElementById("hand");

  discardDiv.innerHTML = "";
  handDiv.innerHTML = "";

  const topCard = game.discardPile[game.discardPile.length - 1];
  discardDiv.innerHTML = `<div class="card ${topCard.color}">${topCard.value}</div>`;

  const myHand = game.players[socket.id]?.hand || [];
  myHand.forEach((card, index) => {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card", card.color);
    cardDiv.innerText = card.value;
    cardDiv.onclick = () => socket.emit("playCard", index);
    handDiv.appendChild(cardDiv);
  });
});

document.getElementById("drawBtn").onclick = () => {
  socket.emit("drawCard");
};
