import React, { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { RACE_CONFIG } from '@shared/raceSystem';
import type { WSMessage, BattleActionPayload, BattleEndPayload } from '@shared/websocket';

interface BattleLogEntry {
  round: number;
  actorId: number;
  action: string;
  damage?: number;
  isCritical?: boolean;
  isDodge?: boolean;
  remainingHp: number;
}

export default function RealtimeBattle() {
  const { user } = useAuth();
  const petQuery = trpc.pet.getPet.useQuery();
  const [isSearching, setIsSearching] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<any>(null);
  const [battleStarted, setBattleStarted] = useState(false);
  const [playerHp, setPlayerHp] = useState(0);
  const [opponentHp, setOpponentHp] = useState(0);
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [playerPetInfo, setPlayerPetInfo] = useState<any>(null);
  const [opponentPetInfo, setOpponentPetInfo] = useState<any>(null);

  // 获取玩家宠物信息
  const playerPetInfoQuery = trpc.petCustomization.getPetInfo.useQuery(
    { petId: petQuery.data?.id || 0 },
    { enabled: !!petQuery.data?.id }
  );

  // 同步玩家宠物信息
  useEffect(() => {
    if (playerPetInfoQuery.data?.data) {
      setPlayerPetInfo(playerPetInfoQuery.data.data);
    }
  }, [playerPetInfoQuery.data]);

  const { isConnected, connect, send } = useWebSocket({
    onMessage: (message: WSMessage) => {
      handleWSMessage(message);
    },
    onConnect: () => {
      console.log('[Battle] Connected to WebSocket');
      if (user && petQuery.data) {
        // 通知服务器玩家加入
        send('PLAYER_JOIN', {
          userId: user.id,
          petId: petQuery.data.id,
          petName: petQuery.data.name,
          level: petQuery.data.level,
          hp: petQuery.data.hp,
          maxHp: petQuery.data.maxHp,
        });
      }
    },
  });

  const handleWSMessage = (message: WSMessage) => {
    switch (message.type) {
      case 'ONLINE_PLAYERS':
        setOnlineCount(message.payload.count);
        break;
      case 'MATCH_FOUND':
        setOpponent(message.payload.opponent);
        setMatchId(message.payload.matchId);
        break;
      case 'BATTLE_START':
        setBattleStarted(true);
        setPlayerHp(message.payload.player1.hp);
        setOpponentHp(message.payload.player2.hp);
        setBattleLog([]);
        break;
      case 'BATTLE_ACTION':
        handleBattleAction(message.payload);
        break;
      case 'BATTLE_END':
        handleBattleEnd(message.payload);
        break;
      case 'ERROR':
        console.error('[Battle] Error:', message.payload.message);
        break;
    }
  };

  const handleBattleAction = (payload: BattleActionPayload) => {
    const isPlayerAction = payload.actorId === user?.id;
    
    // 更新HP
    if (isPlayerAction) {
      setOpponentHp(Math.max(0, opponentHp - (payload.damage || 0)));
    } else {
      setPlayerHp(Math.max(0, playerHp - (payload.damage || 0)));
    }

    // 添加到战斗日志
    const logEntry: BattleLogEntry = {
      round: battleLog.length,
      actorId: payload.actorId,
      action: payload.actionType,
      damage: payload.damage,
      isCritical: payload.isCritical,
      isDodge: payload.isDodge,
      remainingHp: isPlayerAction ? opponentHp : playerHp,
    };
    setBattleLog(prev => [...prev, logEntry]);
  };

  const handleBattleEnd = (payload: BattleEndPayload) => {
    const isWin = payload.winnerId === user?.id;
    alert(isWin ? '你赢了！' : '你输了！');
    resetBattle();
  };

  const resetBattle = () => {
    setMatchId(null);
    setOpponent(null);
    setBattleStarted(false);
    setPlayerHp(0);
    setOpponentHp(0);
    setBattleLog([]);
    setIsSearching(false);
  };

  const handleSearchMatch = () => {
    if (!user || !petQuery.data) return;
    
    setIsSearching(true);
    send('SEARCH_MATCH', {
      userId: user.id,
      petId: petQuery.data.id,
      level: petQuery.data.level,
    });
  };

  const handleAttack = () => {
    if (!matchId || !user) return;
    
    const damage = Math.floor(Math.random() * 20) + 10;
    const isCritical = Math.random() < 0.2;
    const actualDamage = isCritical ? damage * 1.5 : damage;

    send('BATTLE_ACTION', {
      matchId,
      actorId: user.id,
      actionType: 'ATTACK',
      damage: Math.floor(actualDamage),
      isCritical,
      isDodge: false,
    });
  };

  useEffect(() => {
    if (!isConnected && user && petQuery.data) {
      connect();
    }
  }, [isConnected, user, petQuery.data, connect]);

  if (petQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const pet = petQuery.data;
  if (!pet) return <div>Failed to load pet</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 在线玩家统计 */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">实时对战</h1>
          <p className="text-lg text-gray-600">
            当前在线玩家: <span className="font-bold text-purple-600">{onlineCount}</span>
          </p>
        </div>

        {!battleStarted ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 玩家信息 */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">你的宠物</h2>
              <div className="text-center mb-4">
                {playerPetInfo?.imageUrl ? (
                  <img
                    src={playerPetInfo.imageUrl}
                    alt={pet.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="text-4xl mb-2">🐧</div>
                )}
                <h3 className="text-2xl font-bold">{pet.name}</h3>
                {playerPetInfo && playerPetInfo.race && (
                  <p className="text-gray-600">{RACE_CONFIG[playerPetInfo.race as 'human' | 'beast' | 'hybrid']?.name} | 等级 {pet.level}</p>
                )}
              </div>
              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-sm text-gray-600">生命值</p>
                  <Progress value={(pet.hp / pet.maxHp) * 100} className="h-2" />
                  <p className="text-sm">{pet.hp} / {pet.maxHp}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">经验值</p>
                  <Progress value={(pet.exp / 100) * 100} className="h-2" />
                  <p className="text-sm">{pet.exp} / 100</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-red-50 p-2 rounded">
                  <p className="text-gray-600">力量</p>
                  <p className="font-bold text-lg">{pet.strength}</p>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-gray-600">敏捷</p>
                  <p className="font-bold text-lg">{pet.agility}</p>
                </div>
              </div>
            </Card>

            {/* 对战控制 */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold mb-4">开始对战</h2>
                {isSearching ? (
                  <div className="text-center py-8">
                    <Loader2 className="animate-spin mx-auto mb-2" />
                    <p className="text-gray-600">正在寻找对手...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      点击下方按钮开始搜索对手，与其他玩家进行实时对战。
                    </p>
                    <div className="bg-blue-50 p-4 rounded">
                      <p className="text-sm text-gray-600">匹配说明</p>
                      <ul className="text-sm text-gray-700 mt-2 space-y-1">
                        <li>• 系统会为你匹配相近等级的对手</li>
                        <li>• 胜利可获得金币和经验</li>
                        <li>• 战斗过程中可以使用技能</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={handleSearchMatch}
                disabled={isSearching}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg"
              >
                {isSearching ? '搜索中...' : '开始搜索'}
              </Button>
            </Card>
          </div>
        ) : (
          /* 战斗界面 */
          <div className="space-y-6">
            {/* 战斗区域 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 玩家 */}
              <Card className="p-6 text-center">
                <h3 className="text-xl font-bold mb-4">{pet.name}</h3>
                {playerPetInfo?.imageUrl ? (
                  <img
                    src={playerPetInfo.imageUrl}
                    alt={pet.name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="text-5xl mb-4">🐧</div>
                )}
                {playerPetInfo && playerPetInfo.race && (
                  <p className="text-sm text-gray-600 mb-2">{RACE_CONFIG[playerPetInfo.race as 'human' | 'beast' | 'hybrid']?.name}</p>
                )}
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">生命值</p>
                    <Progress value={(playerHp / pet.maxHp) * 100} className="h-3" />
                    <p className="text-lg font-bold">{playerHp} / {pet.maxHp}</p>
                  </div>
                </div>
              </Card>

              {/* 对手 */}
              <Card className="p-6 text-center">
                <h3 className="text-xl font-bold mb-4">{opponent?.petName}</h3>
                {opponent?.petImageUrl ? (
                  <img
                    src={opponent.petImageUrl}
                    alt={opponent?.petName}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="text-5xl mb-4">🐧</div>
                )}
                {opponent && (
                  <p className="text-sm text-gray-600 mb-2">等级 {opponent.level}</p>
                )}
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">生命值</p>
                    <Progress value={(opponentHp / opponent?.maxHp) * 100} className="h-3" />
                    <p className="text-lg font-bold">{opponentHp} / {opponent?.maxHp}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* 战斗日志 */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">战斗日志</h3>
              <div className="bg-gray-50 p-4 rounded h-48 overflow-y-auto space-y-2">
                {battleLog.length === 0 ? (
                  <p className="text-gray-500">战斗开始...</p>
                ) : (
                  battleLog.map((entry, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-bold">第 {entry.round} 回合:</span>
                      <span className="ml-2">
                        {entry.action} 
                        {entry.damage && `伤害 ${entry.damage}`}
                        {entry.isCritical && ' (暴击!)'}
                        {entry.isDodge && ' (闪避!)'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <Button
                onClick={handleAttack}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 text-lg"
              >
                普通攻击
              </Button>
              <Button
                onClick={() => alert('技能功能开发中')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
              >
                使用技能
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
