import { Room, PublicRoomState, PublicPlayer, Player, QuestionData } from '../types/game';

class RoomStore {
  private rooms: Map<string, Room> = new Map();

  createRoom(
    roomId: string,
    quizSetId: string,
    quizTitle: string,
    mainQuestions: QuestionData[],
    tieBreakQuestions: QuestionData[],
    hostPlayer: Player
  ): Room {
    const room: Room = {
      roomId,
      quizSetId,
      quizTitle,
      state: 'LOBBY',
      poolMode: 'MAIN',
      initialPlayerCount: 1,
      roundNumber: 0,
      mainQuestions,
      tieBreakQuestions,
      currentQuestionIndex: 0,
      currentQuestion: null,
      questionStartTime: 0,
      timerInterval: null,
      players: new Map([[hostPlayer.playerToken, hostPlayer]]),
      winner: null,
      tieBreakReason: null,
    };
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  removeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room?.timerInterval) {
      clearInterval(room.timerInterval);
    }
    this.rooms.delete(roomId);
  }

  findRoomByPlayerToken(playerToken: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.has(playerToken)) {
        return room;
      }
    }
    return undefined;
  }

  findRoomBySocketId(socketId: string): { room: Room; player: Player } | undefined {
    for (const room of this.rooms.values()) {
      for (const player of room.players.values()) {
        if (player.socketId === socketId) {
          return { room, player };
        }
      }
    }
    return undefined;
  }

  toPublicPlayer(player: Player): PublicPlayer {
    return {
      playerToken: player.playerToken,
      nickname: player.nickname,
      avatar: player.avatar,
      isHost: player.isHost,
      lives: player.lives,
      status: player.status,
      score: player.score,
      hasAnswered: player.currentAnswerIndex !== null,
      eliminatedAtRound: player.eliminatedAtRound,
    };
  }

  toPublicRoomState(room: Room): PublicRoomState {
    const players: PublicPlayer[] = Array.from(room.players.values()).map((p) =>
      this.toPublicPlayer(p)
    );

    return {
      roomId: room.roomId,
      quizSetId: room.quizSetId,
      quizTitle: room.quizTitle,
      state: room.state,
      poolMode: room.poolMode,
      initialPlayerCount: room.initialPlayerCount,
      roundNumber: room.roundNumber,
      currentQuestion: room.currentQuestion
        ? {
            id: room.currentQuestion.id,
            content: room.currentQuestion.content,
            options: room.currentQuestion.options,
            timeLimit: room.currentQuestion.timeLimit,
            category: room.currentQuestion.category,
          }
        : null,
      currentQuestionIndex: room.currentQuestionIndex,
      totalMainQuestions: room.mainQuestions.length,
      totalTieBreakQuestions: room.tieBreakQuestions.length,
      players,
      winner: room.winner ? this.toPublicPlayer(room.winner) : null,
      tieBreakReason: room.tieBreakReason || null,
    };
  }
}

export const roomStore = new RoomStore();
