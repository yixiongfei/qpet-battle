/**
 * WebSocket 消息类型定义
 */

export type WSMessageType = 
  | 'PLAYER_JOIN'
  | 'PLAYER_LEAVE'
  | 'SEARCH_MATCH'
  | 'MATCH_FOUND'
  | 'BATTLE_START'
  | 'BATTLE_ACTION'
  | 'BATTLE_END'
  | 'ONLINE_PLAYERS'
  | 'ERROR'
  | 'HEARTBEAT';

export interface WSMessage<T = any> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}

/**
 * 玩家加入消息
 */
export interface PlayerJoinPayload {
  userId: number;
  petId: number;
  petName: string;
  level: number;
  hp: number;
  maxHp: number;
}

/**
 * 玩家离开消息
 */
export interface PlayerLeavePayload {
  userId: number;
}

/**
 * 搜索匹配消息
 */
export interface SearchMatchPayload {
  userId: number;
  petId: number;
  level: number;
}

/**
 * 匹配找到消息
 */
export interface MatchFoundPayload {
  matchId: string;
  opponent: {
    userId: number;
    petId: number;
    petName: string;
    level: number;
    hp: number;
    maxHp: number;
  };
}

/**
 * 战斗开始消息
 */
export interface BattleStartPayload {
  matchId: string;
  player1: {
    userId: number;
    petId: number;
    petName: string;
    level: number;
    hp: number;
    maxHp: number;
  };
  player2: {
    userId: number;
    petId: number;
    petName: string;
    level: number;
    hp: number;
    maxHp: number;
  };
}

/**
 * 战斗行动消息
 */
export interface BattleActionPayload {
  matchId: string;
  actorId: number;
  actionType: 'ATTACK' | 'SKILL' | 'DEFEND' | 'HEAL';
  skillId?: number;
  damage?: number;
  isCritical?: boolean;
  isDodge?: boolean;
}

/**
 * 战斗结束消息
 */
export interface BattleEndPayload {
  matchId: string;
  winnerId: number;
  loserId: number;
  goldEarned: number;
  expEarned: number;
  battleLog: BattleLogEntry[];
}

/**
 * 战斗日志条目
 */
export interface BattleLogEntry {
  round: number;
  actorId: number;
  action: string;
  damage?: number;
  isCritical?: boolean;
  isDodge?: boolean;
  remainingHp: number;
}

/**
 * 在线玩家列表消息
 */
export interface OnlinePlayersPayload {
  count: number;
  players: Array<{
    userId: number;
    petName: string;
    level: number;
    status: 'idle' | 'searching' | 'battling';
  }>;
}

/**
 * 错误消息
 */
export interface ErrorPayload {
  code: string;
  message: string;
}

/**
 * 心跳消息
 */
export interface HeartbeatPayload {
  timestamp: number;
}
