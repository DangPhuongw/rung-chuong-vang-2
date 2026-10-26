import { Server } from 'socket.io';
import { Room, QuestionData } from '../types/game';
import { roomStore } from './roomStore';

export function getTieBreakMessage(reason: string): string {
  switch (reason) {
    case 'ALL_DIED_REVIVE':
      return '⚡ CỨU SINH ĐẶC BIỆT! Tất cả đều gục ngã cùng lúc! Hồi sinh 1 mạng và bước vào loạt đấu TIE-BREAK!';
    case 'TOP_3_SURVIVORS':
      return '🔥 CẢNH BÁO TOP 3! Chỉ còn những chiến binh cuối cùng! Kích hoạt bộ câu hỏi TIE-BREAK!';
    case 'MAIN_QUESTIONS_EXHAUSTED':
      return '⚔️ BẤT PHÂN THẮNG BẠI! Đã hết câu hỏi chính! Bước vào loạt đấu súng TIE-BREAK!';
    default:
      return '🔥 KÍCH HOẠT VÒNG TIE-BREAK SINH TỬ!';
  }
}

function clearBotTimers(room: Room): void {
  if (room.botTimers && room.botTimers.length > 0) {
    room.botTimers.forEach((t) => clearTimeout(t));
    room.botTimers = [];
  }
}

function scheduleBotAnswers(room: Room, question: QuestionData, io: Server): void {
  clearBotTimers(room);
  room.botTimers = [];

  const aliveBots = Array.from(room.players.values()).filter(
    (p) => p.isBot && p.status === 'ALIVE'
  );

  if (aliveBots.length === 0) return;

  for (const bot of aliveBots) {
    // Random delay between 1.5s and Math.min(question.timeLimit - 1.5, 7.0)s
    const maxDelaySec = Math.max(2.5, Math.min(question.timeLimit - 1.5, 7.0));
    const delayMs = Math.floor(1500 + Math.random() * (maxDelaySec * 1000 - 1500));

    // Bot accuracy: ~70% correct, ~30% incorrect so bots lose lives across rounds
    const isCorrect = Math.random() < 0.7;
    let chosenAnswer = question.correctIndex;
    if (!isCorrect) {
      const wrongIndices = [0, 1, 2, 3].filter((i) => i !== question.correctIndex);
      chosenAnswer = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
    }

    const timer = setTimeout(() => {
      if (room.state === 'QUESTION_ACTIVE' && room.currentQuestion?.id === question.id) {
        submitAnswer(room, bot.playerToken, chosenAnswer, io);
      }
    }, delayMs);

    room.botTimers.push(timer);
  }
}

export function startGame(room: Room, io: Server): { success: boolean; error?: string } {
  if (room.players.size < 1) {
    return { success: false, error: 'Cần ít nhất 1 người chơi để bắt đầu trận đấu!' };
  }

  if (room.state !== 'LOBBY' && room.state !== 'GAME_OVER') {
    return { success: false, error: 'Phòng đang trong trận đấu!' };
  }

  // Clear previous timer & bot timers
  if (room.timerInterval) {
    clearTimeout(room.timerInterval);
    room.timerInterval = null;
  }
  clearBotTimers(room);

  room.initialPlayerCount = room.players.size;
  room.roundNumber = 0;
  room.currentQuestionIndex = 0;
  room.poolMode = 'MAIN';
  room.winner = null;
  room.tieBreakReason = null;
  room.state = 'STARTING';

  for (const player of room.players.values()) {
    player.lives = 3;
    player.status = 'ALIVE';
    player.score = 0;
    player.currentAnswerIndex = null;
    player.answerTimeMs = null;
    player.eliminatedAtRound = null;
  }

  io.to(room.roomId).emit('game_countdown', { seconds: 3 });
  io.to(room.roomId).emit('room_state_sync', roomStore.toPublicRoomState(room));

  room.timerInterval = setTimeout(() => {
    room.roundNumber = 1;
    startQuestion(room, io);
  }, 3000);

  return { success: true };
}

export function startQuestion(room: Room, io: Server): void {
  if (room.timerInterval) {
    clearTimeout(room.timerInterval);
    room.timerInterval = null;
  }

  const pool = room.poolMode === 'MAIN' ? room.mainQuestions : room.tieBreakQuestions;
  if (!pool || room.currentQuestionIndex >= pool.length) {
    evaluateRound(room, io);
    return;
  }

  const question = pool[room.currentQuestionIndex];
  room.currentQuestion = question;
  room.state = 'QUESTION_ACTIVE';
  room.questionStartTime = Date.now();

  // Reset answer states
  for (const player of room.players.values()) {
    player.currentAnswerIndex = null;
    player.answerTimeMs = null;
  }

  const alivePlayers = Array.from(room.players.values()).filter((p) => p.status === 'ALIVE');

  // Anti-cheat: NEVER send correctIndex to clients!
  io.to(room.roomId).emit('new_question', {
    roundNumber: room.roundNumber,
    poolMode: room.poolMode,
    question: {
      id: question.id,
      content: question.content,
      options: question.options,
      timeLimit: question.timeLimit,
      category: question.category,
    },
    aliveCount: alivePlayers.length,
    totalPlayers: room.players.size,
  });

  io.to(room.roomId).emit('room_state_sync', roomStore.toPublicRoomState(room));

  // Auto evaluate when time is up
  room.timerInterval = setTimeout(() => {
    evaluateRound(room, io);
  }, question.timeLimit * 1000);

  // Auto schedule answers for alive test bots
  scheduleBotAnswers(room, question, io);
}

export function submitAnswer(
  room: Room,
  playerToken: string,
  answerIndex: number,
  io: Server
): boolean {
  if (room.state !== 'QUESTION_ACTIVE' || !room.currentQuestion) {
    return false;
  }

  const player = room.players.get(playerToken);
  if (!player || player.status !== 'ALIVE' || player.currentAnswerIndex !== null) {
    return false;
  }

  player.currentAnswerIndex = answerIndex;
  player.answerTimeMs = Date.now() - room.questionStartTime;

  // Notify clients that this player answered (without revealing the answer)
  io.to(room.roomId).emit('player_answered', { playerToken });
  io.to(room.roomId).emit('room_state_sync', roomStore.toPublicRoomState(room));

  // Check if all ALIVE players have submitted their answers
  const alivePlayers = Array.from(room.players.values()).filter((p) => p.status === 'ALIVE');
  const allAnswered = alivePlayers.every((p) => p.currentAnswerIndex !== null);

  if (allAnswered) {
    if (room.timerInterval) {
      clearTimeout(room.timerInterval);
      room.timerInterval = null;
    }
    evaluateRound(room, io);
  }

  return true;
}

export function evaluateRound(room: Room, io: Server): void {
  if (room.timerInterval) {
    clearTimeout(room.timerInterval);
    room.timerInterval = null;
  }
  clearBotTimers(room);

  const currentQ = room.currentQuestion;
  if (!currentQ) return;

  const correctIndex = currentQ.correctIndex;
  const aliveAtStart = Array.from(room.players.values()).filter((p) => p.status === 'ALIVE');

  // STEP 1: Calculate score & deduct lives
  for (const player of aliveAtStart) {
    if (player.currentAnswerIndex === correctIndex) {
      const timeSpent = player.answerTimeMs || 0;
      const speedScore = Math.max(
        100,
        Math.round(1000 * (1 - timeSpent / (currentQ.timeLimit * 1000)))
      );
      player.score += speedScore;
    } else {
      player.lives = Math.max(0, player.lives - 1);
    }
  }

  let triggerReason: 'ALL_DIED_REVIVE' | 'TOP_3_SURVIVORS' | 'MAIN_QUESTIONS_EXHAUSTED' | null = null;
  const eliminatedTokens: string[] = [];
  const revivedTokens: string[] = [];

  // STEP 2: Check Tie-Break 1: All died in this round
  const survivorsAfterStep1 = aliveAtStart.filter((p) => p.lives > 0);
  if (survivorsAfterStep1.length === 0) {
    // REVIVE all who just fell to 0 lives in this round
    for (const player of aliveAtStart) {
      player.lives = 1;
      player.status = 'ALIVE';
      revivedTokens.push(player.playerToken);
    }
    if (room.poolMode === 'MAIN') {
      room.poolMode = 'TIE_BREAK';
      room.currentQuestionIndex = 0;
      triggerReason = 'ALL_DIED_REVIVE';
    }
  } else {
    // Normal elimination
    for (const player of aliveAtStart) {
      if (player.lives <= 0) {
        player.status = 'ELIMINATED';
        player.eliminatedAtRound = room.roundNumber;
        eliminatedTokens.push(player.playerToken);
      }
    }
  }

  const currentAlive = Array.from(room.players.values()).filter((p) => p.status === 'ALIVE');

  // STEP 3: Check Single Winner
  if (currentAlive.length === 1 && room.initialPlayerCount > 1) {
    room.winner = currentAlive[0];
    room.state = 'ROUND_RESULT';
    io.to(room.roomId).emit('round_result', {
      correctIndex,
      eliminatedTokens,
      revivedTokens,
      players: roomStore.toPublicRoomState(room).players,
    });
    io.to(room.roomId).emit('room_state_sync', roomStore.toPublicRoomState(room));

    room.timerInterval = setTimeout(() => {
      finishGame(room, io);
    }, 4000);
    return;
  }

  if (currentAlive.length === 0) {
    // If somehow 0 alive, pick highest score from aliveAtStart
    aliveAtStart.sort((a, b) => b.score - a.score);
    room.winner = aliveAtStart[0] || null;
    room.state = 'ROUND_RESULT';
    io.to(room.roomId).emit('round_result', {
      correctIndex,
      eliminatedTokens,
      revivedTokens,
      players: roomStore.toPublicRoomState(room).players,
    });
    io.to(room.roomId).emit('room_state_sync', roomStore.toPublicRoomState(room));

    room.timerInterval = setTimeout(() => {
      finishGame(room, io);
    }, 4000);
    return;
  }

  // STEP 4: Check Tie-Break 2: <= 3 survivors remaining
  if (!triggerReason && room.poolMode === 'MAIN' && currentAlive.length <= 3 && currentAlive.length > 1) {
    if (room.initialPlayerCount > 3) {
      room.poolMode = 'TIE_BREAK';
      room.currentQuestionIndex = 0;
      triggerReason = 'TOP_3_SURVIVORS';
    } else {
      // Room started with <= 3 players
      const someoneLostLife = currentAlive.some((p) => p.lives < 3) || currentAlive.length < room.initialPlayerCount;
      if (someoneLostLife) {
        room.poolMode = 'TIE_BREAK';
        room.currentQuestionIndex = 0;
        triggerReason = 'TOP_3_SURVIVORS';
      }
    }
  }

  // STEP 5: Check Tie-Break 3: Main questions exhausted
  if (!triggerReason && room.poolMode === 'MAIN' && currentAlive.length > 1 && room.currentQuestionIndex + 1 >= room.mainQuestions.length) {
    room.poolMode = 'TIE_BREAK';
    room.currentQuestionIndex = 0;
    triggerReason = 'MAIN_QUESTIONS_EXHAUSTED';
  }

  // STEP 6: Edge Case: Tie Break questions exhausted
  if (room.poolMode === 'TIE_BREAK' && currentAlive.length > 1 && room.currentQuestionIndex + 1 >= room.tieBreakQuestions.length) {
    currentAlive.sort((a, b) => b.lives - a.lives || b.score - a.score);
    room.winner = currentAlive[0];
    room.state = 'ROUND_RESULT';
    io.to(room.roomId).emit('round_result', {
      correctIndex,
      eliminatedTokens,
      revivedTokens,
      players: roomStore.toPublicRoomState(room).players,
    });
    io.to(room.roomId).emit('room_state_sync', roomStore.toPublicRoomState(room));

    room.timerInterval = setTimeout(() => {
      finishGame(room, io);
    }, 4000);
    return;
  }

  // STEP 7: Emit round result and transition
  room.state = 'ROUND_RESULT';
  io.to(room.roomId).emit('round_result', {
    correctIndex,
    eliminatedTokens,
    revivedTokens,
    players: roomStore.toPublicRoomState(room).players,
  });
  io.to(room.roomId).emit('room_state_sync', roomStore.toPublicRoomState(room));

  // 5 seconds pause for result effects
  room.timerInterval = setTimeout(() => {
    if (triggerReason) {
      room.state = 'TIE_BREAK_ALERT';
      room.tieBreakReason = triggerReason;
      io.to(room.roomId).emit('tie_break_activated', {
        reason: triggerReason,
        message: getTieBreakMessage(triggerReason),
      });
      io.to(room.roomId).emit('room_state_sync', roomStore.toPublicRoomState(room));

      // 4 seconds dramatic alert pause
      room.timerInterval = setTimeout(() => {
        room.roundNumber += 1;
        startQuestion(room, io);
      }, 4000);
    } else {
      room.currentQuestionIndex += 1;
      room.roundNumber += 1;
      startQuestion(room, io);
    }
  }, 5000);
}

export function finishGame(room: Room, io: Server): void {
  if (room.timerInterval) {
    clearTimeout(room.timerInterval);
    room.timerInterval = null;
  }

  room.state = 'GAME_OVER';

  const allPlayers = Array.from(room.players.values()).sort((a, b) => {
    if (a.status === 'ALIVE' && b.status !== 'ALIVE') return -1;
    if (a.status !== 'ALIVE' && b.status === 'ALIVE') return 1;
    if (a.eliminatedAtRound && b.eliminatedAtRound && a.eliminatedAtRound !== b.eliminatedAtRound) {
      return b.eliminatedAtRound - a.eliminatedAtRound;
    }
    if (a.lives !== b.lives) return b.lives - a.lives;
    return b.score - a.score;
  });

  const leaderboard = allPlayers.map((p) => roomStore.toPublicPlayer(p));
  const winner = room.winner ? roomStore.toPublicPlayer(room.winner) : leaderboard[0] || null;

  io.to(room.roomId).emit('game_over', {
    winner,
    leaderboard,
  });
  io.to(room.roomId).emit('room_state_sync', roomStore.toPublicRoomState(room));
}

export function resetRoom(room: Room, playerToken: string, io: Server): boolean {
  const player = room.players.get(playerToken);
  if (!player || !player.isHost) {
    return false;
  }

  if (room.timerInterval) {
    clearTimeout(room.timerInterval);
    room.timerInterval = null;
  }
  clearBotTimers(room);

  room.state = 'LOBBY';
  room.roundNumber = 0;
  room.currentQuestionIndex = 0;
  room.poolMode = 'MAIN';
  room.currentQuestion = null;
  room.winner = null;
  room.tieBreakReason = null;

  for (const p of room.players.values()) {
    p.lives = 3;
    p.status = 'ALIVE';
    p.score = 0;
    p.currentAnswerIndex = null;
    p.answerTimeMs = null;
    p.eliminatedAtRound = null;
  }

  io.to(room.roomId).emit('room_state_sync', roomStore.toPublicRoomState(room));
  return true;
}
