import { Room, PublicRoomState, PublicPlayer, Player, QuestionData } from '../types/game';

const AVATARS = [
  'char_burger',
  'char_unicorn',
  'char_dino',
  'char_cat',
  'char_robot',
  'char_fox',
  'char_panda',
  'char_owl',
  'char_alien',
  'char_bear',
];

export function getRandomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

const BOT_NAMES = [
  'Bot Alpha 🤖',
  'Bot Trí Tuệ 🧠',
  'Bot Siêu Tốc ⚡',
  'Bot Cú Vọ 🦉',
  'Bot Khủng Long 🦖',
  'Bot Mèo Con 🐱',
  'Bot Tinh Anh ⭐',
  'Bot Giáo Sư 🎓',
  'Bot Bách Khoa 📚',
  'Bot Hạt Nhân ⚛️',
  'Bot Gấu Bự 🐻',
  'Bot Vô Địch 🏆',
  'Bot Bất Bại 🛡️',
  'Bot Cao Thủ 🎯',
  'Bot Tương Lai 🚀',
  'Bot Thần Đồng ✨',
  'Bot Chiến Thần ⚔️',
  'Bot Sao Băng 🌠',
  'Bot Tia Chớp ⚡',
  'Bot Bất Tử 💎',
];

function getRandomBotName(room: Room): string {
  const existingNames = new Set(Array.from(room.players.values()).map((p) => p.nickname));
  const available = BOT_NAMES.filter((name) => !existingNames.has(name));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  return `Bot #${room.players.size + 1} 🤖`;
}

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

  addBots(room: Room, count: number = 1): number {
    if (room.state !== 'LOBBY') return 0;
    const num = Math.min(Math.max(1, count), 20);
    let added = 0;
    for (let i = 0; i < num; i++) {
      if (room.players.size >= 300) break;
      const botId = 'bot_' + Math.random().toString(36).substring(2, 9);
      const botName = getRandomBotName(room);
      const botPlayer: Player = {
        playerToken: botId,
        socketId: botId,
        nickname: botName,
        avatar: getRandomAvatar(),
        isHost: false,
        isBot: true,
        lives: 3,
        status: 'ALIVE',
        score: 0,
        currentAnswerIndex: null,
        answerTimeMs: null,
        eliminatedAtRound: null,
      };
      room.players.set(botId, botPlayer);
      added++;
    }
    return added;
  }

  removeBot(room: Room, botToken: string): boolean {
    if (room.state !== 'LOBBY') return false;
    const bot = room.players.get(botToken);
    if (bot && bot.isBot) {
      return room.players.delete(botToken);
    }
    return false;
  }

  clearBots(room: Room): void {
    if (room.state !== 'LOBBY') return;
    for (const [token, p] of room.players.entries()) {
      if (p.isBot) {
        room.players.delete(token);
      }
    }
  }

  updatePlayerProfile(
    room: Room,
    playerToken: string,
    data: { nickname?: string; avatar?: string }
  ): boolean {
    const player = room.players.get(playerToken);
    if (!player) return false;
    if (data.nickname && data.nickname.trim()) {
      player.nickname = data.nickname.trim().slice(0, 24);
    }
    if (data.avatar) {
      player.avatar = data.avatar;
    }
    return true;
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
      isBot: player.isBot || false,
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
