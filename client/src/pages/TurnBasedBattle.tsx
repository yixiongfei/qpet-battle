import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Zap, Shield, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { RACE_CONFIG } from '@shared/raceSystem';
import type { BattleState } from '../../../server/turnBasedBattle';

interface Skill {
  id: number;
  name: string;
  description: string | null;
  damage: number;
  mpCost: number;
  cooldown: number;
  mpRestore: number;
  requiredLevel?: number;
  requiredEvolution?: number;
  icon: string;
  createdAt?: Date;
}

interface PetInfo {
  id: number;
  name: string;
  race: 'human' | 'beast' | 'hybrid';
  level: number;
  imageUrl?: string | null;
}

export default function TurnBasedBattle() {
  const [location, setLocation] = useLocation();
  const [battleId, setBattleId] = useState<string | null>(null);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [playerSkills, setPlayerSkills] = useState<Skill[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<number | null>(null);
  const [playerPetInfo, setPlayerPetInfo] = useState<PetInfo | null>(null);
  const [opponentPetInfo, setOpponentPetInfo] = useState<PetInfo | null>(null);

  // 获取可用技能
  const getSkillsQuery = trpc.turnBasedBattle.getAvailableSkills.useQuery(
    { petId: 1 }, // 这里应该从路由参数获取
    { enabled: !!battleId }
  );

  // 获取玩家宠物信息
  const playerPetQuery = trpc.petCustomization.getPetInfo.useQuery(
    { petId: 1 },
    { enabled: !!battleId }
  );

  // 获取对手宠物信息
  const opponentPetQuery = trpc.petCustomization.getPetInfo.useQuery(
    { petId: 2 },
    { enabled: !!battleId }
  );

  // 初始化战斗
  const initBattleMutation = trpc.turnBasedBattle.initBattle.useMutation({
    onSuccess: (data) => {
      if (data.success && data.battleState) {
        setBattleId(data.battleId);
        setBattleState(data.battleState);
        toast.success('战斗开始！');
      } else {
        toast.error(data.message);
      }
    },
  });

  // 执行玩家动作
  const playerActionMutation = trpc.turnBasedBattle.playerAction.useMutation({
    onSuccess: (data) => {
      if (data.success && data.battleState) {
        setBattleState(data.battleState);
        if (data.isFinished) {
          toast.success(
            data.battleState.winner === 1 ? '您赢了！' : '您输了！'
          );
        }
      } else {
        toast.error(data.message);
      }
      setIsExecuting(false);
    },
    onError: () => {
      setIsExecuting(false);
    },
  });

  // 放弃战斗
  const surrenderMutation = trpc.turnBasedBattle.surrenderBattle.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.info('您已放弃战斗');
        setLocation('/');
      } else {
        toast.error(data.message);
      }
    },
  });

  // 初始化战斗
  useEffect(() => {
    if (!battleId) {
      initBattleMutation.mutate({
        playerPetId: 1,
        opponentPetId: 2,
      });
    }
  }, []);

  // 加载技能
  useEffect(() => {
    if (getSkillsQuery.data?.success) {
      setPlayerSkills(getSkillsQuery.data.skills);
    }
  }, [getSkillsQuery.data]);

  // 加载宠物信息
  useEffect(() => {
    if (playerPetQuery.data?.data) {
      setPlayerPetInfo(playerPetQuery.data.data as PetInfo);
    }
  }, [playerPetQuery.data]);

  useEffect(() => {
    if (opponentPetQuery.data?.data) {
      setOpponentPetInfo(opponentPetQuery.data.data as PetInfo);
    }
  }, [opponentPetQuery.data]);

  const handleSkillClick = (skillId: number) => {
    if (!battleId || isExecuting) return;
    setIsExecuting(true);
    playerActionMutation.mutate({
      battleId,
      actionType: 'skill',
      skillId,
    });
  };

  const handleDefend = () => {
    if (!battleId || isExecuting) return;
    setIsExecuting(true);
    playerActionMutation.mutate({
      battleId,
      actionType: 'defend',
    });
  };

  const handleSurrender = () => {
    if (!battleId) return;
    surrenderMutation.mutate({ battleId });
  };

  if (!battleState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const playerHpPercent = (battleState.playerPetHp / 100) * 100;
  const playerMpPercent = (battleState.playerPetMp / battleState.playerPetMaxMp) * 100;
  const opponentHpPercent = (battleState.opponentPetHp / 100) * 100;
  const opponentMpPercent = (battleState.opponentPetMp / battleState.opponentPetMaxMp) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">回合制战斗</h1>

        {/* 战斗场景 */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-2 gap-8 mb-6">
            {/* 玩家宠物 */}
            <div className="text-center">
              <div className="mb-2">
                <h2 className="text-xl font-bold">{playerPetInfo?.name || '宠物'}</h2>
                {playerPetInfo && (
                  <p className="text-sm text-gray-600">
                    {RACE_CONFIG[playerPetInfo.race]?.name} | Lv.{playerPetInfo.level}
                  </p>
                )}
              </div>
              <div className="bg-blue-100 rounded-lg p-4 mb-4 min-h-48 flex items-center justify-center overflow-hidden">
                {playerPetInfo?.imageUrl ? (
                  <img
                    src={playerPetInfo.imageUrl}
                    alt={playerPetInfo.name}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="text-6xl">🐧</div>
                )}
              </div>

              {/* 血量条 */}
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold">血量</span>
                  <span className="text-sm text-gray-600">
                    {Math.max(0, battleState.playerPetHp)}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-red-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, playerHpPercent)}%` }}
                  />
                </div>
              </div>

              {/* 蓝量条 */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold">蓝量</span>
                  <span className="text-sm text-gray-600">
                    {Math.max(0, battleState.playerPetMp)}/{battleState.playerPetMaxMp}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, playerMpPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 对手宠物 */}
            <div className="text-center">
              <div className="mb-2">
                <h2 className="text-xl font-bold">{opponentPetInfo?.name || '对手宠物'}</h2>
                {opponentPetInfo && (
                  <p className="text-sm text-gray-600">
                    {RACE_CONFIG[opponentPetInfo.race]?.name} | Lv.{opponentPetInfo.level}
                  </p>
                )}
              </div>
              <div className="bg-purple-100 rounded-lg p-4 mb-4 min-h-48 flex items-center justify-center overflow-hidden">
                {opponentPetInfo?.imageUrl ? (
                  <img
                    src={opponentPetInfo.imageUrl}
                    alt={opponentPetInfo.name}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="text-6xl">🐢</div>
                )}
              </div>

              {/* 血量条 */}
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold">血量</span>
                  <span className="text-sm text-gray-600">
                    {Math.max(0, battleState.opponentPetHp)}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-red-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, opponentHpPercent)}%` }}
                  />
                </div>
              </div>

              {/* 蓝量条 */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold">蓝量</span>
                  <span className="text-sm text-gray-600">
                    {Math.max(0, battleState.opponentPetMp)}/{battleState.opponentPetMaxMp}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, opponentMpPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 回合数 */}
          <div className="text-center mb-4 text-lg font-bold text-gray-700">
            第 {battleState.currentRound} 回合
          </div>
        </Card>

        {/* 战斗日志 */}
        <Card className="p-4 mb-6 bg-gray-50 max-h-40 overflow-y-auto">
          <h3 className="font-bold mb-2">战斗日志</h3>
          <div className="space-y-1 text-sm">
            {battleState.battleLog.slice(-5).map((log, index) => (
              <p key={index} className="text-gray-700">
                {log}
              </p>
            ))}
          </div>
        </Card>

        {/* 技能选择 */}
        {!battleState.isFinished && (
          <Card className="p-6">
            <h3 className="font-bold mb-4">选择行动</h3>

            {/* 技能按钮 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {playerSkills.map((skill) => {
                const cooldown =
                  battleState.playerSkillCooldowns[skill.id] || 0;
                const canUse =
                  battleState.playerPetMp >= skill.mpCost && cooldown === 0;

                return (
                  <button
                    key={skill.id}
                    onClick={() => handleSkillClick(skill.id)}
                    disabled={!canUse || isExecuting}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      canUse
                        ? 'border-blue-400 bg-blue-50 hover:bg-blue-100 cursor-pointer'
                        : 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{skill.icon}</div>
                    <div className="font-semibold text-sm">{skill.name}</div>
                    <div className="text-xs text-gray-600">
                      消耗: {skill.mpCost} 蓝
                    </div>
                    {cooldown > 0 && (
                      <div className="text-xs text-red-600">
                        冷却: {cooldown}回合
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 防守和投降按钮 */}
            <div className="flex gap-3">
              <Button
                onClick={handleDefend}
                disabled={isExecuting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Shield className="w-4 h-4 mr-2" />
                防守
              </Button>
              <Button
                onClick={handleSurrender}
                disabled={isExecuting}
                variant="outline"
                className="flex-1"
              >
                投降
              </Button>
            </div>
          </Card>
        )}

        {/* 战斗结束 */}
        {battleState.isFinished && (
          <Card className="p-6 text-center bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300">
            <h2 className="text-2xl font-bold mb-4">
              {battleState.winner === 1 ? '🎉 您赢了！' : '😢 您输了！'}
            </h2>
            <p className="text-gray-700 mb-6">
              {battleState.winner === 1
                ? '恭喜您赢得了这场战斗！'
                : '再接再厉，下次一定会赢！'}
            </p>
            <Button
              onClick={() => setLocation('/')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              返回大厅
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
