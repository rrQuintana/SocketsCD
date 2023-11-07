const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const ROLES = require("../src/const/const");
require('dotenv').config();
const axios = require('axios');

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const api = process.env.API_SERVICE;
const front = process.env.WEB_SERVICE;

const io = new Server(server, {
  cors: {
    origins: '*',
    methods: ['GET', 'POST'],
  },
});


let currentQuestionIndex = 0;
let timer;
let totalTimeRemaining = 0;
let totalTimeRemainingTOTAL = 0;
let questions = [];
let playerResponses = {};
let correctAnswersCount = 0;
let waitingRoomPlayers = {};

io.on("connection", (socket) => {


  socket.on("startGame", async (gameId) => {
    try {


      const game = await axios.get(`${api}/game/getGame/${gameId}`);

      if (!game) {
        throw new Error("No se encontró el juego");
      }

      const { questions: gameQuestions } = game;
      questions = gameQuestions[0].questions;
      const totalQuestions = questions.length;

      totalTimeRemaining = 60;
      totalTimeRemainingTOTAL = totalQuestions * 60;
      const gameQuestion = questions[currentQuestionIndex];
      const { question, hint, options } = gameQuestion;
      const formattedOptions = options.map((option) => ({
        option: option.option,
        answer: option.answer,
      }));

      socket.join(gameId);

      io.emit("gameStarted", {
        question: {
          question,
          hint,
          options: formattedOptions,
        },
        totalTime: totalTimeRemainingTOTAL,
        gameId: gameId,
        total: questions.length,
        index: currentQuestionIndex,
      });

      startTimer();
    } catch (error) {
      console.error(error);
    }
  });

  socket.on("answerQuestion", ({ answer, user, pinGame }) => {
    const correctAnswer = questions[currentQuestionIndex].options.find(
      (option) => option.answer === true
    ).option;

    const isCorrect = answer === correctAnswer;

    if (isCorrect) {
      correctAnswersCount++;
    }

    const playerId = user._id;
    playerResponses[playerId] = {
      user,
      pinGame,
      correctAnswersCount,
      total: questions.length,
    };

    socket.emit("answerResult", { isCorrect });
  });

  socket.on("disconnect", () => {});

  socket.on("gameFinished", () => {
    console.log("bye");

    io.emit("gameSummary", {
      playerResponses,
      correctAnswersCount,
    });

    playerResponses = {};
    correctAnswersCount = 0;
  });

  socket.on(
    "joinWaitingRoom",
    async ({ userId, name, lastName, img, pinGame, rol }) => {
      
      console.log('Welcome: ', name);


      const game =  await axios.get(`${api}/game/getGame/${pinGame}`);

      console.log("Game",game);

      console.log('Ingreso un usaurio', userId);

      if (
        !waitingRoomPlayers[game.owner.toString()] &&
        rol.name !== ROLES.Leader
      ) {
        io.emit("getOut", { userId: userId });
      }

      if (!waitingRoomPlayers[userId]) {
        if (rol.name === ROLES.Leader) {
          waitingRoomPlayers[userId] = {
            socketId: socket.id,
            name,
            lastName,
            img,
            pinGame,
          };
        } else {
          if (waitingRoomPlayers[game.owner.toString()]) {
            waitingRoomPlayers[userId] = {
              socketId: socket.id,
              name,
              lastName,
              img,
              pinGame,
            };
          }
        }
      }

      io.emit("waitingRoomPlayerList", Object.values(waitingRoomPlayers));
    }
  );

  socket.on("leaveWaitingRoom", ({ userId }) => {
    if (waitingRoomPlayers[userId]) {
      delete waitingRoomPlayers[userId];
    }

    console.log("me sali");
    console.log(waitingRoomPlayers);
    io.emit("waitingRoomPlayerList", Object.values(waitingRoomPlayers));
  });
});

function startTimer() {
  if (currentQuestionIndex < questions.length) {
    io.emit("timeRemaining", { timeRemaining: totalTimeRemaining });

    timer = setInterval(() => {
      totalTimeRemaining--;
      io.emit("timeRemaining", { timeRemaining: totalTimeRemaining });

      if (totalTimeRemaining <= 0) {
        clearInterval(timer);
        currentQuestionIndex++;

        if (currentQuestionIndex < questions.length) {
          const gameQuestion = questions[currentQuestionIndex];
          const { question, hint, options } = gameQuestion;
          const formattedOptions = options.map((option) => ({
            option: option.option,
            answer: option.answer,
          }));

          io.emit("nextQuestion", {
            question: {
              question,
              hint,
              options: formattedOptions,
            },
            timeRemaining: totalTimeRemaining,
            total: questions.length,
            index: currentQuestionIndex,
          });
          totalTimeRemaining = 60;
          startTimer();
        } else {
          io.emit("gameFinished");
          io.emit("gameSummary", {
            playerResponses,
            correctAnswersCount,
          });
        }
      }
    }, 1000);
  }
}


server.listen(PORT, () => {
  console.log(`Socket.io server is running on port ${PORT}`);
});
