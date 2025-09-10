const gameContainer = document.getElementById("game-container");
const movesCount = document.getElementById("moves-count");
const timeValue = document.getElementById("time");
const startButton = document.getElementById("start-game");
const stopButton = document.getElementById("stop-game");
const resultModal = document.getElementById("result-modal");
const resultMessage = document.getElementById("result-message");
const playAgainButton = document.getElementById("play-again");

let cards;
let interval;
let firstCard = false;
let secondCard = false;

const items = [
  { name: "bee", image: "🐝" },
  { name: "crocodile", image: "🐊" },
  { name: "macaw", image: "🦜" },
  { name: "gorilla", image: "🦍" },
  { name: "tiger", image: "🐅" },
  { name: "monkey", image: "🐒" },
  { name: "lion", image: "🦁" },
  { name: "cow", image: "🐄" },
];

let seconds = 0, minutes = 0;
let moves = 0, winCount = 0;

const timeGenerator = () => {
  seconds += 1;
  if (seconds >= 60) {
    minutes += 1;
    seconds = 0;
  }
  let secondsValue = seconds < 10 ? `0${seconds}` : seconds;
  let minutesValue = minutes < 10 ? `0${minutes}` : minutes;
  timeValue.innerHTML = `${minutesValue}:${secondsValue}`;
};

const movesCounter = () => {
  moves += 1;
  movesCount.innerHTML = moves;
};

const generateRandom = (size = 4) => {
  let tempArray = [...items];
  let cardValues = [];
  size = (size * size) / 2;
  for (let i = 0; i < size; i++) {
    const randomIndex = Math.floor(Math.random() * tempArray.length);
    cardValues.push(tempArray[randomIndex]);
    tempArray.splice(randomIndex, 1);
  }
  return cardValues;
};

const matrixGenerator = (cardValues, size = 4) => {
  gameContainer.innerHTML = "";
  cardValues = [...cardValues, ...cardValues];
  cardValues.sort(() => Math.random() - 0.5);
  for (let i = 0; i < size * size; i++) {
    gameContainer.innerHTML += `
     <div class="card-container" data-card-value="${cardValues[i].name}">
        <div class="card-before">?</div>
        <div class="card-after">${cardValues[i].image}</div>
     </div>
    `;
  }
  
  cards = document.querySelectorAll(".card-container");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      if (!card.classList.contains("matched") && !card.classList.contains("flipped")) {
        card.classList.add("flipped");
        if (!firstCard) {
          firstCard = card;
        } else {
          movesCounter();
          secondCard = card;
          if (firstCard.dataset.cardValue === secondCard.dataset.cardValue) {
            firstCard.classList.add("matched");
            secondCard.classList.add("matched");
            firstCard = false;
            winCount += 1;
            if (winCount === Math.floor(cardValues.length / 2)) {
                clearInterval(interval);
                resultMessage.innerHTML = `<h2>You Won!</h2><p>Moves: ${moves}</p><p>Time: ${minutes}:${seconds}</p>`;
                resultModal.style.display = "flex";
            }
          } else {
            let [tempFirst, tempSecond] = [firstCard, secondCard];
            firstCard = false;
            secondCard = false;
            setTimeout(() => {
              tempFirst.classList.remove("flipped");
              tempSecond.classList.remove("flipped");
            }, 900);
          }
        }
      }
    });
  });
};


const initializer = () => {
  winCount = 0;
  moves = 0;
  seconds = 0;
  minutes = 0;
  movesCount.innerHTML = moves;
  timeValue.innerHTML = "00:00";
  
  clearInterval(interval);
  interval = setInterval(timeGenerator, 1000);
  
  let cardValues = generateRandom();
  matrixGenerator(cardValues);

  startButton.style.display = 'none';
  stopButton.style.display = 'inline-block';
  resultModal.style.display = 'none';
};

startButton.addEventListener("click", initializer);
stopButton.addEventListener("click", () => {
    clearInterval(interval);
    startButton.style.display = 'inline-block';
    stopButton.style.display = 'none';
});
playAgainButton.addEventListener('click', initializer);
