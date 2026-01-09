import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

export default function Home() {
  const { user: oauthUser, loading: oauthLoading, isAuthenticated: oauthAuthenticated, logout: oauthLogout } = useAuth();
  const [, navigate] = useLocation();
  const [simpleAuthUser, setSimpleAuthUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 检查简单认证
  const simpleAuthQuery = trpc.simpleAuth.me.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    if (!oauthLoading && simpleAuthQuery.data !== undefined) {
      setSimpleAuthUser(simpleAuthQuery.data);
      setCheckingAuth(false);
    }
  }, [oauthLoading, simpleAuthQuery.data]);

  // 优先使用简单认证，如果没有则使用OAuth
  const user = simpleAuthUser || oauthUser;
  const loading = checkingAuth || oauthLoading;
  const isAuthenticated = !!simpleAuthUser || oauthAuthenticated;

  // 获取宠物和统计信息
  const { data: pet } = trpc.pet.getPet.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: stats } = trpc.pet.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: onlineCount } = trpc.pet.getOnlinePlayerCount.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const logoutMutation = trpc.simpleAuth.logout.useMutation({
    onSuccess: () => {
      window.location.href = '/login';
    },
  });

  const handleLogout = () => {
    if (simpleAuthUser) {
      logoutMutation.mutate();
    } else {
      oauthLogout();
    }
  };

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
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/login')}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              登录开始游戏
            </Button>
            <Button
              onClick={() => navigate('/register')}
              size="lg"
              variant="outline"
              className="w-full"
            >
              注册新账号
            </Button>
          </div>
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
            <Button variant="outline" size="sm" onClick={handleLogout}>
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
              <Card className="p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate("/lobby")}>
                <div className="text-4xl mb-3">🏛️</div>
                <h3 className="text-xl font-bold mb-2">大厅</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  查看在线玩家，邀请对战，体验回合制战斗
                </p>
                <Button className="w-full" variant="default">
                  进入大厅
                </Button>
              </Card>

              <Card className="p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate("/turn-based-battle")}>
                <div className="text-4xl mb-3">⚔️</div>
                <h3 className="text-xl font-bold mb-2">回合制战斗</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  手动选择技能，体验策略性的回合制对战
                </p>
                <Button className="w-full" variant="default">
                  开始战斗
                </Button>
              </Card>

              <Card className="p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate("/pet-customization")}>
                <div className="text-4xl mb-3">🎨</div>
                <h3 className="text-xl font-bold mb-2">宠物自定义</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  修改宠物名字，上传宠物图片，打造独特的宠物
                </p>
                <Button className="w-full" variant="default">
                  自定义宠物
                </Button>
              </Card>

              <Card className="p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate("/friends")}>
                <div className="text-4xl mb-3">👥</div>
                <h3 className="text-xl font-bold mb-2">好友系统</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  添加好友，邀请好友对战，建立你的社交圈
                </p>
                <Button className="w-full" variant="default">
                  管理好友
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
                选择上方的功能开始你的冒险之旅！在大厅中与其他玩家对战，或者自定义你的宠物。
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
