export type RoomState = 
  | 'LOBBY' 
  | 'STARTING'          // Đếm ngược 3s trước khi vào trận
  | 'QUESTION_ACTIVE'   // Đang hiện câu hỏi và đếm ngược
  | 'ROUND_RESULT'      // Hiện đáp án đúng & hiệu ứng trừ mạng (5s)
  | 'TIE_BREAK_ALERT'   // Màn hình cảnh báo kích hoạt Tie-Break (4s)
  | 'GAME_OVER';        // Kết thúc, vinh danh người chiến thắng

export type QuestionPoolMode = 'MAIN' | 'TIE_BREAK';

export interface QuestionData {
  id: string;
  content: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
  category: QuestionPoolMode;
  orderIndex: number;
}

export interface PublicQuestion {
  id: string;
  content: string;
  options: string[];
  timeLimit: number;
  category: QuestionPoolMode;
}

export interface Player {
  playerToken: string;  // Định danh duy nhất lưu ở localStorage (chống mất phiên khi F5)
  socketId: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
  lives: number;        // Khởi tạo = 3
  status: 'ALIVE' | 'ELIMINATED';
  score: number;        // Điểm phụ tính theo tốc độ trả lời đúng
  currentAnswerIndex: number | null; // Đáp án đã chọn ở câu hiện tại
  answerTimeMs: number | null;       // Thời gian trả lời câu hiện tại
  eliminatedAtRound: number | null;  // Vòng bị loại để xếp hạng
  isBot?: boolean;      // Đánh dấu người chơi máy (để test tính năng)
}

export interface PublicPlayer {
  playerToken: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
  lives: number;
  status: 'ALIVE' | 'ELIMINATED';
  score: number;
  hasAnswered: boolean;
  eliminatedAtRound: number | null;
  isBot?: boolean;      // Đánh dấu người chơi máy
}

export interface Room {
  roomId: string;
  quizSetId: string;
  quizTitle: string;
  state: RoomState;
  poolMode: QuestionPoolMode;
  initialPlayerCount: number; // Số người chơi lúc bấm Start Game
  roundNumber: number;
  mainQuestions: QuestionData[];
  tieBreakQuestions: QuestionData[];
  currentQuestionIndex: number;
  currentQuestion: QuestionData | null;
  questionStartTime: number;
  timerInterval: NodeJS.Timeout | null;
  botTimers?: NodeJS.Timeout[]; // Timers trả lời của bot
  players: Map<string, Player>; // Key là playerToken
  winner: Player | null;
  tieBreakReason?: 'ALL_DIED_REVIVE' | 'TOP_3_SURVIVORS' | 'MAIN_QUESTIONS_EXHAUSTED' | null;
}

export interface PublicRoomState {
  roomId: string;
  quizSetId: string;
  quizTitle: string;
  state: RoomState;
  poolMode: QuestionPoolMode;
  initialPlayerCount: number;
  roundNumber: number;
  currentQuestion: PublicQuestion | null;
  currentQuestionIndex: number;
  totalMainQuestions: number;
  totalTieBreakQuestions: number;
  players: PublicPlayer[];
  winner: PublicPlayer | null;
  tieBreakReason?: 'ALL_DIED_REVIVE' | 'TOP_3_SURVIVORS' | 'MAIN_QUESTIONS_EXHAUSTED' | null;
  timeRemaining?: number;
}
