import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import type {
  WSMessage,
  WSMessageType,
  PlayerJoinPayload,
  SearchMatchPayload,
  BattleActionPayload,
  BattleEndPayload,
  OnlinePlayersPayload,
} from '../shared/websocket';

/**
 * WebSocket 连接管理
 */
interface ClientConnection {
  ws: WebSocket;
  userId: number;
  petId: number;
  petName: string;
  level: number;
  hp: number;
  maxHp: number;
  status: 'idle' | 'searching' | 'battling';
  matchId?: string;
}

/**
 * 战斗会话管理
 */
interface BattleSession {
  matchId: string;
  player1Id: number;
  player2Id: number;
  player1Hp: number;
  player2Hp: number;
  currentTurn: number;
  battleLog: Array<{
    round: number;
    actorId: number;
    action: string;
    damage?: number;
    isCritical?: boolean;
    isDodge?: boolean;
    remainingHp: number;
  }>;
}

/**
 * WebSocket 服务器管理器
 */
export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<number, ClientConnection> = new Map();
  private matchQueue: number[] = [];
  private battles: Map<string, BattleSession> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWSS();
    this.startHeartbeat();
  }

  /**
   * 设置 WebSocket 服务器
   */
  private setupWSS() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] New connection');

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as WSMessage;
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('[WebSocket] Message parse error:', error);
          this.sendError(ws, 'PARSE_ERROR', 'Failed to parse message');
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error: Error) => {
        console.error('[WebSocket] Connection error:', error);
      });
    });
  }

  /**
   * 处理消息
   */
  private handleMessage(ws: WebSocket, message: WSMessage) {
    switch (message.type) {
      case 'PLAYER_JOIN':
        this.handlePlayerJoin(ws, message.payload as PlayerJoinPayload);
        break;
      case 'SEARCH_MATCH':
        this.handleSearchMatch(ws, message.payload as SearchMatchPayload);
        break;
      case 'BATTLE_ACTION':
        this.handleBattleAction(ws, message.payload as BattleActionPayload);
        break;
      case 'HEARTBEAT':
        this.sendMessage(ws, 'HEARTBEAT', { timestamp: Date.now() });
        break;
      default:
        this.sendError(ws, 'UNKNOWN_TYPE', `Unknown message type: ${message.type}`);
    }
  }

  /**
   * 处理玩家加入
   */
  private handlePlayerJoin(ws: WebSocket, payload: PlayerJoinPayload) {
    const client: ClientConnection = {
      ws,
      userId: payload.userId,
      petId: payload.petId,
      petName: payload.petName,
      level: payload.level,
      hp: payload.hp,
      maxHp: payload.maxHp,
      status: 'idle',
    };

    this.clients.set(payload.userId, client);
    console.log(`[WebSocket] Player ${payload.userId} joined`);

    // 广播在线玩家数量
    this.broadcastOnlineCount();
  }

  /**
   * 处理玩家离开
   */
  private handleDisconnect(ws: WebSocket) {
    let disconnectedUserId: number | null = null;

    for (const [userId, client] of Array.from(this.clients.entries())) {
      if (client.ws === ws) {
        disconnectedUserId = userId;
        this.clients.delete(userId);
        break;
      }
    }

    if (disconnectedUserId !== null) {
      // 从匹配队列中移除
      this.matchQueue = this.matchQueue.filter(id => id !== disconnectedUserId);

      // 如果在战斗中，结束战斗
      if (this.battles.size > 0) {
        for (const [matchId, battle] of Array.from(this.battles.entries())) {
          if (battle.player1Id === disconnectedUserId || battle.player2Id === disconnectedUserId) {
            this.battles.delete(matchId);
            const opponentId = battle.player1Id === disconnectedUserId ? battle.player2Id : battle.player1Id;
            const opponent = this.clients.get(opponentId);
            if (opponent) {
              opponent.status = 'idle';
              this.sendMessage(opponent.ws, 'BATTLE_END', {
                matchId,
                winnerId: opponentId,
                loserId: disconnectedUserId,
                goldEarned: 100,
                expEarned: 50,
                battleLog: battle.battleLog,
              });
            }
          }
        }
      }

      console.log(`[WebSocket] Player ${disconnectedUserId} disconnected`);
      this.broadcastOnlineCount();
    }
  }

  /**
   * 处理搜索匹配
   */
  private handleSearchMatch(ws: WebSocket, payload: SearchMatchPayload) {
    const client = this.clients.get(payload.userId);
    if (!client) return;

    client.status = 'searching';
    this.matchQueue.push(payload.userId);

    console.log(`[WebSocket] Player ${payload.userId} searching for match. Queue: ${this.matchQueue.length}`);

    // 尝试匹配
    this.tryMatchPlayers();
  }

  /**
   * 尝试匹配玩家
   */
  private tryMatchPlayers() {
    while (this.matchQueue.length >= 2) {
      const player1Id = this.matchQueue.shift()!;
      const player2Id = this.matchQueue.shift()!;

      const player1 = this.clients.get(player1Id);
      const player2 = this.clients.get(player2Id);

      if (!player1 || !player2) continue;

      const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 更新玩家状态
      player1.status = 'battling';
      player1.matchId = matchId;
      player2.status = 'battling';
      player2.matchId = matchId;

      // 创建战斗会话
      const battle: BattleSession = {
        matchId,
        player1Id,
        player2Id,
        player1Hp: player1.hp,
        player2Hp: player2.hp,
        currentTurn: 0,
        battleLog: [],
      };
      this.battles.set(matchId, battle);

      // 通知两个玩家
      this.sendMessage(player1.ws, 'MATCH_FOUND', {
        matchId,
        opponent: {
          userId: player2.userId,
          petId: player2.petId,
          petName: player2.petName,
          level: player2.level,
          hp: player2.hp,
          maxHp: player2.maxHp,
        },
      });

      this.sendMessage(player2.ws, 'MATCH_FOUND', {
        matchId,
        opponent: {
          userId: player1.userId,
          petId: player1.petId,
          petName: player1.petName,
          level: player1.level,
          hp: player1.hp,
          maxHp: player1.maxHp,
        },
      });

      // 发送战斗开始消息
      setTimeout(() => {
        this.sendMessage(player1.ws, 'BATTLE_START', {
          matchId,
          player1: {
            userId: player1.userId,
            petId: player1.petId,
            petName: player1.petName,
            level: player1.level,
            hp: player1.hp,
            maxHp: player1.maxHp,
          },
          player2: {
            userId: player2.userId,
            petId: player2.petId,
            petName: player2.petName,
            level: player2.level,
            hp: player2.hp,
            maxHp: player2.maxHp,
          },
        });

        this.sendMessage(player2.ws, 'BATTLE_START', {
          matchId,
          player1: {
            userId: player1.userId,
            petId: player1.petId,
            petName: player1.petName,
            level: player1.level,
            hp: player1.hp,
            maxHp: player1.maxHp,
          },
          player2: {
            userId: player2.userId,
            petId: player2.petId,
            petName: player2.petName,
            level: player2.level,
            hp: player2.hp,
            maxHp: player2.maxHp,
          },
        });
      }, 1000);

      console.log(`[WebSocket] Match found: ${player1Id} vs ${player2Id}`);
    }
  }

  /**
   * 处理战斗行动
   */
  private handleBattleAction(ws: WebSocket, payload: BattleActionPayload) {
    const battle = this.battles.get(payload.matchId);
    if (!battle) return;

    const isPlayer1 = battle.player1Id === payload.actorId;
    const damage = payload.damage || 0;
    const isCritical = payload.isCritical || false;
    const isDodge = payload.isDodge || false;

    // 更新HP
    if (isPlayer1) {
      battle.player2Hp = Math.max(0, battle.player2Hp - damage);
    } else {
      battle.player1Hp = Math.max(0, battle.player1Hp - damage);
    }

    // 记录战斗日志
    const logEntry = {
      round: battle.currentTurn,
      actorId: payload.actorId,
      action: payload.actionType,
      damage,
      isCritical,
      isDodge,
      remainingHp: isPlayer1 ? battle.player2Hp : battle.player1Hp,
    };
    battle.battleLog.push(logEntry);

    // 广播战斗行动给两个玩家
    const player1 = this.clients.get(battle.player1Id);
    const player2 = this.clients.get(battle.player2Id);

    if (player1) {
      this.sendMessage(player1.ws, 'BATTLE_ACTION', payload);
    }
    if (player2) {
      this.sendMessage(player2.ws, 'BATTLE_ACTION', payload);
    }

    // 检查战斗是否结束
    if (battle.player1Hp <= 0 || battle.player2Hp <= 0) {
      this.endBattle(battle);
    }

    battle.currentTurn++;
  }

  /**
   * 结束战斗
   */
  private endBattle(battle: BattleSession) {
    const winnerId = battle.player1Hp > 0 ? battle.player1Id : battle.player2Id;
    const loserId = battle.player1Hp > 0 ? battle.player2Id : battle.player1Id;

    const player1 = this.clients.get(battle.player1Id);
    const player2 = this.clients.get(battle.player2Id);

    const endPayload: BattleEndPayload = {
      matchId: battle.matchId,
      winnerId,
      loserId,
      goldEarned: 100,
      expEarned: 50,
      battleLog: battle.battleLog,
    };

    if (player1) {
      player1.status = 'idle';
      this.sendMessage(player1.ws, 'BATTLE_END', endPayload);
    }
    if (player2) {
      player2.status = 'idle';
      this.sendMessage(player2.ws, 'BATTLE_END', endPayload);
    }

    this.battles.delete(battle.matchId);
    console.log(`[WebSocket] Battle ${battle.matchId} ended. Winner: ${winnerId}`);
  }

  /**
   * 广播在线玩家数量
   */
  private broadcastOnlineCount() {
    const onlineCount = this.clients.size;
    const players = Array.from(this.clients.values()).map(client => ({
      userId: client.userId,
      petName: client.petName,
      level: client.level,
      status: client.status,
    }));

    const payload: OnlinePlayersPayload = {
      count: onlineCount,
      players,
    };

    this.wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendMessage(client, 'ONLINE_PLAYERS', payload);
      }
    });
  }

  /**
   * 发送消息
   */
  private sendMessage(ws: WebSocket, type: WSMessageType, payload: any) {
    const message: WSMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };
    ws.send(JSON.stringify(message));
  }

  /**
   * 发送错误消息
   */
  private sendError(ws: WebSocket, code: string, message: string) {
    this.sendMessage(ws, 'ERROR', { code, message });
  }

  /**
   * 启动心跳
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.ping();
        }
      });
    }, 30000); // 每30秒发送一次心跳
  }

  /**
   * 停止心跳
   */
  public stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  /**
   * 获取在线玩家数量
   */
  public getOnlineCount(): number {
    return this.clients.size;
  }
}
