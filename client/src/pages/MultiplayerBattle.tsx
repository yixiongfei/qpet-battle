import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";

export default function MultiplayerBattle() {
  const [, navigate] = useLocation();
  const [isMatching, setIsMatching] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [opponent, setOpponent] = useState<any>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [playerHp, setPlayerHp] = useState(100);
  const [opponentHp, setOpponentHp] = useState(100);
  const [battleActive, setBattleActive] = useState(false);

  // 获取宠物和统计信息
  const { data: pet } = trpc.pet.getPet.useQuery();
  const { data: stats } = trpc.pet.getStats.useQuery();
  const { data: onlineCount } = trpc.pet.getOnlinePlayerCount.useQuery();

  // 获取随机对手
  // const getOpponentMutation = trpc.pet.getRandomOpponent.useMutation();

  // 开始匹配
  const startMatchingMutation = trpc.pet.startMatching.useMutation({
    onSuccess: (data) => {
      if (data.success && data.opponent) {
        setMatchFound(true);
        setOpponent(data.opponent);
        setPlayerHp(pet?.maxHp || 100);
        setOpponentHp(100);
        setBattleLog(["对手已找到！准备开始战斗..."]);
        setBattleActive(true);
        // 自动开始战斗
        setTimeout(() => {
          startAutoBattle();
        }, 2000);
      } else {
        setBattleLog((prev) => [...prev, "暂无对手，请稍后再试"]);
        setIsMatching(false);
      }
    },
  });

  // 结束战斗
  const endBattleMutation = trpc.pet.endBattle.useMutation({
    onSuccess: () => {
      setBattleActive(false);
    },
  });

  // 处理匹配
  const handleStartMatching = async () => {
    if (!pet) return;
    setIsMatching(true);
    setBattleLog(["正在匹配对手..."]);
    startMatchingMutation.mutate({
      petId: pet.id,
      level: pet.level,
    });
  };

  // 自动战斗逻辑
  const startAutoBattle = () => {
    let playerCurrentHp = playerHp;
    let opponentCurrentHp = opponentHp;
    let round = 1;

    const battleInterval = setInterval(() => {
      const playerDamage = Math.floor(Math.random() * 20) + 10;
      const opponentDamage = Math.floor(Math.random() * 20) + 10;

      opponentCurrentHp -= playerDamage;
      playerCurrentHp -= opponentDamage;

      setPlayerHp(Math.max(0, playerCurrentHp));
      setOpponentHp(Math.max(0, opponentCurrentHp));

      setBattleLog((prev) => [
        ...prev,
        `[第${round}回合] 你造成了${playerDamage}点伤害`,
        `[第${round}回合] 对手造成了${opponentDamage}点伤害`,
      ]);

      if (playerCurrentHp <= 0 || opponentCurrentHp <= 0) {
        clearInterval(battleInterval);
        const isWin = opponentCurrentHp <= 0;
        const goldEarned = isWin ? 100 : 20;
        const expEarned = isWin ? 50 : 10;

        setBattleLog((prev) => [
          ...prev,
          isWin ? "🎉 战斗胜利！" : "😢 战斗失败...",
          `获得金币: ${goldEarned}`,
          `获得经验: ${expEarned}`,
        ]);

        // 更新战斗统计
        if (pet) {
          endBattleMutation.mutate({
            petId: pet.id,
            level: pet.level,
            isWin,
            goldEarned,
            expEarned,
          });
        }

        setBattleActive(false);
      }

      round++;
    }, 2000);
  };

  // 返回大厅
  const handleBackToHall = () => {
    setIsMatching(false);
    setMatchFound(false);
    setOpponent(null);
    setBattleLog([]);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">多人对战</h1>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-600">{onlineCount}</div>
            <div className="text-sm text-muted-foreground">在线玩家</div>
          </div>
        </div>

        {!matchFound ? (
          // 匹配界面
          <Card className="p-8 text-center">
            <div className="mb-8">
              <div className="text-6xl mb-4">
                {pet?.evolution === 0 && "🐧"}
                {pet?.evolution === 1 && "🦅"}
                {pet?.evolution === 2 && "🐉"}
              </div>
              <h2 className="text-2xl font-bold mb-2">{pet?.name}</h2>
              <p className="text-muted-foreground">等级 {pet?.level}</p>
            </div>

            {isMatching ? (
              <div className="space-y-4">
                <div className="text-lg font-bold text-orange-600">正在匹配对手...</div>
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleStartMatching}
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                开始匹配对战
              </Button>
            )}

            <Button variant="outline" className="mt-4 w-full" onClick={handleBackToHall}>
              返回大厅
            </Button>
          </Card>
        ) : (
          // 战斗界面
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 玩家信息 */}
            <Card className="p-6">
              <div className="text-center">
                <div className="text-5xl mb-4">
                  {pet?.evolution === 0 && "🐧"}
                  {pet?.evolution === 1 && "🦅"}
                  {pet?.evolution === 2 && "🐉"}
                </div>
                <h3 className="font-bold text-lg mb-4">{pet?.name}</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">生命值</span>
                      <span className="text-sm font-bold">{playerHp}/{pet?.maxHp}</span>
                    </div>
                    <Progress value={(playerHp / (pet?.maxHp || 100)) * 100} className="h-3" />
                  </div>
                  <div className="text-sm">
                    <div>力量: {pet?.strength}</div>
                    <div>敏捷: {pet?.agility}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 战斗日志 */}
            <Card className="p-6 lg:col-span-1">
              <h3 className="font-bold mb-4">战斗日志</h3>
              <div className="bg-gray-50 p-4 rounded-lg h-80 overflow-y-auto space-y-2 text-sm">
                {battleLog.length === 0 ? (
                  <p className="text-muted-foreground">等待战斗开始...</p>
                ) : (
                  battleLog.map((log, idx) => (
                    <div key={idx} className="text-gray-700">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* 对手信息 */}
            <Card className="p-6">
              <div className="text-center">
                <div className="text-5xl mb-4">
                  {opponent?.level < 10 && "🐧"}
                  {opponent?.level >= 10 && opponent?.level < 20 && "🦅"}
                  {opponent?.level >= 20 && "🐉"}
                </div>
                <h3 className="font-bold text-lg mb-4">对手</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">生命值</span>
                      <span className="text-sm font-bold">{opponentHp}/100</span>
                    </div>
                    <Progress value={opponentHp} className="h-3" />
                  </div>
                  <div className="text-sm">
                    <div>等级: {opponent?.level}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 统计信息 */}
        {stats && (
          <Card className="mt-6 p-6">
            <h3 className="font-bold mb-4">你的统计</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-primary">{stats.totalBattles}</div>
                <div className="text-sm text-muted-foreground">总战斗数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.totalWins}</div>
                <div className="text-sm text-muted-foreground">胜场数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.currentWinStreak}</div>
                <div className="text-sm text-muted-foreground">当前连胜</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.totalGoldEarned}</div>
                <div className="text-sm text-muted-foreground">总金币</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
