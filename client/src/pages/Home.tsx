import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  // 获取宠物和统计信息
  const { data: pet } = trpc.pet.getPet.useQuery();
  const { data: stats } = trpc.pet.getStats.useQuery();
  const { data: onlineCount } = trpc.pet.getOnlinePlayerCount.useQuery();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🐧</div>
          <p className="text-lg text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-6">🐧</div>
          <h1 className="text-3xl font-bold mb-4 text-primary">Q宠大乐斗</h1>
          <p className="text-muted-foreground mb-8">
            养成你的宠物，与全球玩家对战，成为最强的宠物训练师！
          </p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            登录开始游戏
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Q宠大乐斗</h1>
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">{onlineCount || 0}</div>
              <div className="text-sm text-muted-foreground">在线玩家</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              退出登录
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 宠物卡片 */}
          <Card className="lg:col-span-1 p-6">
            <div className="text-center">
              <div className="text-7xl mb-4">
                {pet?.evolution === 0 && "🐧"}
                {pet?.evolution === 1 && "🦅"}
                {pet?.evolution === 2 && "🐉"}
              </div>
              <h2 className="text-2xl font-bold mb-2">{pet?.name}</h2>
              <div className="text-sm text-muted-foreground mb-6">
                等级 {pet?.level} | 进化阶段 {pet?.evolution === 0 ? "初始" : pet?.evolution === 1 ? "第一" : "最终"}
              </div>

              {/* 属性条 */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium">生命值</span>
                    <span className="text-xs font-bold text-red-600">
                      {pet?.hp}/{pet?.maxHp}
                    </span>
                  </div>
                  <Progress value={((pet?.hp || 0) / (pet?.maxHp || 100)) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium">经验值</span>
                    <span className="text-xs font-bold text-blue-600">
                      {pet?.exp}/{pet?.maxExp}
                    </span>
                  </div>
                  <Progress value={((pet?.exp || 0) / (pet?.maxExp || 100)) * 100} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-orange-50 p-2 rounded">
                    <div className="text-xs text-muted-foreground">力量</div>
                    <div className="font-bold text-orange-600">{pet?.strength}</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-xs text-muted-foreground">敏捷</div>
                    <div className="font-bold text-green-600">{pet?.agility}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 功能菜单 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 主要功能 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate("/multiplayer-battle")}>
                <div className="text-4xl mb-3">⚔️</div>
                <h3 className="text-xl font-bold mb-2">多人对战</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  与全球玩家实时对战，赚取金币和经验
                </p>
                <Button className="w-full" variant="default">
                  开始对战
                </Button>
              </Card>

              <Card className="p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate("/pet-evolution")}>
                <div className="text-4xl mb-3">✨</div>
                <h3 className="text-xl font-bold mb-2">宠物进化</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  升级宠物，学习新技能，解锁更强形态
                </p>
                <Button className="w-full" variant="default">
                  查看进化
                </Button>
              </Card>
            </div>

            {/* 统计信息 */}
            {stats && (
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">你的成就</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalBattles}</div>
                    <div className="text-xs text-muted-foreground mt-1">总战斗数</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.totalWins}</div>
                    <div className="text-xs text-muted-foreground mt-1">胜场数</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.currentWinStreak}</div>
                    <div className="text-xs text-muted-foreground mt-1">当前连胜</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.totalGoldEarned}</div>
                    <div className="text-xs text-muted-foreground mt-1">总金币</div>
                  </div>
                </div>
              </Card>
            )}

            {/* 欢迎信息 */}
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
              <h3 className="text-lg font-bold mb-2">欢迎回来，{user?.name}！</h3>
              <p className="text-sm text-muted-foreground">
                准备好与其他玩家对战了吗？选择上方的功能开始你的冒险之旅！
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
