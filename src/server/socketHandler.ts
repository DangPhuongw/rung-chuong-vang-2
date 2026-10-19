import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { roomStore } from './roomStore';
import { startGame, submitAnswer, resetRoom } from './gameEngine';
import { Player, QuestionData } from '../types/game';

const prisma = new PrismaClient();

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const AVATARS = [
  '🦊', '🦁', '🐯', '🐼', '🐨', '🐸', '🐙', '🦄',
  '🦅', '🐺', '🦉', '🐲', '⚡', '🔥', '🚀', '💎'
];

function getRandomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    // 1. CREATE ROOM
    socket.on(
      'create_room',
      async (
        data: { quizSetId: string; nickname: string; playerToken: string },
        callback: (res: { success: boolean; roomId?: string; error?: string }) => void
      ) => {
        try {
          const { quizSetId, nickname, playerToken } = data;
          if (!quizSetId || !nickname || !playerToken) {
            return callback({ success: false, error: 'Thiếu thông tin tạo phòng!' });
          }

          // Fetch quiz set and its questions from Prisma
          const quizSet = await prisma.quizSet.findUnique({
            where: { id: quizSetId },
            include: { questions: { orderBy: { orderIndex: 'asc' } } },
          });

          if (!quizSet) {
            return callback({ success: false, error: 'Không tìm thấy bộ câu hỏi!' });
          }

          const mainQuestions: QuestionData[] = [];
          const tieBreakQuestions: QuestionData[] = [];

          for (const q of quizSet.questions) {
            let options: string[] = [];
            try {
              options = JSON.parse(q.options);
            } catch {
              options = ['A', 'B', 'C', 'D'];
            }

            const qData: QuestionData = {
              id: q.id,
              content: q.content,
              options,
              correctIndex: q.correctIndex,
              timeLimit: q.timeLimit || 15,
              category: q.category as 'MAIN' | 'TIE_BREAK',
              orderIndex: q.orderIndex,
            };

            if (q.category === 'TIE_BREAK') {
              tieBreakQuestions.push(qData);
            } else {
              mainQuestions.push(qData);
            }
          }

          if (mainQuestions.length < 3) {
            return callback({
              success: false,
              error: 'Bộ câu hỏi phải có ít nhất 3 câu hỏi chính!',
            });
          }

          let roomId = generateRoomId();
          while (roomStore.getRoom(roomId)) {
            roomId = generateRoomId();
          }

          const hostPlayer: Player = {
            playerToken,
            socketId: socket.id,
            nickname: nickname.trim(),
            avatar: getRandomAvatar(),
            isHost: true,
            lives: 3,
            status: 'ALIVE',
            score: 0,
            currentAnswerIndex: null,
            answerTimeMs: null,
            eliminatedAtRound: null,
          };

          const room = roomStore.createRoom(
            roomId,
            quizSet.id,
            quizSet.title,
            mainQuestions,
            tieBreakQuestions,
            hostPlayer
          );

          socket.join(roomId);
          callback({ success: true, roomId });

          io.to(roomId).emit('room_state_sync', roomStore.toPublicRoomState(room));
        } catch (err: any) {
          console.error('Error creating room:', err);
          callback({ success: false, error: err.message || 'Lỗi tạo phòng!' });
        }
      }
    );

    // 2. JOIN ROOM
    socket.on(
      'join_room',
      (
        data: { roomId: string; nickname: string; playerToken: string },
        callback: (res: { success: boolean; roomState?: any; error?: string }) => void
      ) => {
        try {
          const { roomId, nickname, playerToken } = data;
          if (!roomId || !playerToken) {
            return callback({ success: false, error: 'Thiếu thông tin vào phòng!' });
          }

          const cleanRoomId = roomId.trim().toUpperCase();
          const room = roomStore.getRoom(cleanRoomId);

          if (!room) {
            return callback({ success: false, error: 'Không tìm thấy phòng chơi này!' });
          }

          let player = room.players.get(playerToken);

          if (player) {
            // Reconnecting player
            player.socketId = socket.id;
            if (nickname && nickname.trim()) {
              player.nickname = nickname.trim();
            }
          } else {
            // New participant
            const cleanNick = (nickname || 'Chiến binh').trim();
            const isSpectator = room.state !== 'LOBBY';

            player = {
              playerToken,
              socketId: socket.id,
              nickname: cleanNick,
              avatar: getRandomAvatar(),
              isHost: room.players.size === 0,
              lives: isSpectator ? 0 : 3,
              status: isSpectator ? 'ELIMINATED' : 'ALIVE',
              score: 0,
              currentAnswerIndex: null,
              answerTimeMs: null,
              eliminatedAtRound: isSpectator ? room.roundNumber : null,
            };

            room.players.set(playerToken, player);
          }

          socket.join(cleanRoomId);

          const publicState = roomStore.toPublicRoomState(room);
          callback({ success: true, roomState: publicState });

          io.to(cleanRoomId).emit('room_state_sync', publicState);
        } catch (err: any) {
          console.error('Error joining room:', err);
          callback({ success: false, error: err.message || 'Lỗi khi vào phòng!' });
        }
      }
    );

    // 3. START GAME
    socket.on(
      'start_game',
      (data: { roomId: string; playerToken: string }, callback?: (res: { success: boolean; error?: string }) => void) => {
        const { roomId, playerToken } = data;
        const room = roomStore.getRoom(roomId);
        if (!room) {
          callback?.({ success: false, error: 'Phòng không tồn tại!' });
          return;
        }

        const player = room.players.get(playerToken);
        if (!player || !player.isHost) {
          callback?.({ success: false, error: 'Chỉ có chủ phòng mới được bắt đầu!' });
          return;
        }

        const result = startGame(room, io);
        callback?.(result);
      }
    );

    // 4. SUBMIT ANSWER
    socket.on('submit_answer', (data: { roomId: string; playerToken: string; answerIndex: number }) => {
      const { roomId, playerToken, answerIndex } = data;
      const room = roomStore.getRoom(roomId);
      if (!room) return;

      submitAnswer(room, playerToken, answerIndex, io);
    });

    // 5. RESET ROOM
    socket.on('reset_room', (data: { roomId: string; playerToken: string }) => {
      const { roomId, playerToken } = data;
      const room = roomStore.getRoom(roomId);
      if (!room) return;

      resetRoom(room, playerToken, io);
    });

    // 6. DISCONNECT
    socket.on('disconnect', () => {
      const found = roomStore.findRoomBySocketId(socket.id);
      if (found) {
        const { room, player } = found;
        // In LOBBY, if a player leaves we can remove them if they don't reconnect
        // If in game, keep them alive or let timeout handle it so F5 works seamlessly
        if (room.state === 'LOBBY') {
          // If host leaves in lobby, migrate host
          if (player.isHost) {
            room.players.delete(player.playerToken);
            const remaining = Array.from(room.players.values());
            if (remaining.length > 0) {
              remaining[0].isHost = true;
            } else {
              roomStore.removeRoom(room.roomId);
              return;
            }
          }
          io.to(room.roomId).emit('room_state_sync', roomStore.toPublicRoomState(room));
        }
      }
    });
  });
}
