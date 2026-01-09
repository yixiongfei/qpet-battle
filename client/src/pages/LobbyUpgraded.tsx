import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Swords, UserPlus, Clock } from "lucide-react";

interface OnlinePlayer {
  userId: number;
  userName: string;
  petName: string;
  petLevel: number;
  petImageUrl: string | null;
  status: string;
  lastSeenAt: Date;
}

interface BattleInvite {
  id: number;
  inviterId: number;
  inviterName: string;
  inviterPetName: string;
  inviterPetLevel: number;
  expiresAt: Date;
}

export default function LobbyUpgraded() {
  const [location, setLocation] = useLocation();
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [pendingInvites, setPendingInvites] = useState<BattleInvite[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<OnlinePlayer | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // 获取在线玩家列表
  const getPlayersQuery = trpc.lobby.getOnlinePlayersList.useQuery(
    { limit: 20 },
    { enabled: true }
  );

  // 获取待处理邀请
  const getInvitesQuery = trpc.lobby.getPendingInvites.useQuery(
    undefined,
    { enabled: true }
  );

  // 更新玩家状态
  const updateStatusMutation = trpc.lobby.updateStatus.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("状态已更新");
      }
    },
  });

  // 发送对战邀请
  const sendInviteMutation = trpc.lobby.sendBattleInvite.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("邀请已发送，等待对方接受...");
        setShowInviteDialog(false);
        setSelectedPlayer(null);
        // 60秒后如果没有接受，自动与AI对战
        setTimeout(() => {
          toast.info("邀请已过期，自动匹配AI对手");
        }, 60000);
      } else {
        toast.error(data.message || "邀请发送失败");
      }
    },
  });

  // 接受邀请
  const acceptInviteMutation = trpc.lobby.acceptInvite.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("已接受邀请，进入战斗");
        // 跳转到战斗页面
        setLocation(`/turn-based-battle?battleId=${data.battleId}`);
      } else {
        toast.error(data.message || "接受邀请失败");
      }
    },
  });

  // 拒绝邀请
  const declineInviteMutation = trpc.lobby.declineInvite.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.info("已拒绝邀请");
        // 刷新邀请列表
        getInvitesQuery.refetch();
      } else {
        toast.error(data.message || "拒绝邀请失败");
      }
    },
  });

  // 初始化时更新玩家状态为在线
  useEffect(() => {
    updateStatusMutation.mutate({ status: "idle" });
  }, []);

  // 加载在线玩家列表
  useEffect(() => {
    if (getPlayersQuery.data?.success) {
      setOnlinePlayers(getPlayersQuery.data.players || []);
    }
  }, [getPlayersQuery.data]);

  // 加载待处理邀请
  useEffect(() => {
    if (getInvitesQuery.data?.success) {
      setPendingInvites(getInvitesQuery.data.invites || []);
    }
  }, [getInvitesQuery.data]);

  const handleInvitePlayer = (player: OnlinePlayer) => {
    setSelectedPlayer(player);
    setShowInviteDialog(true);
  };

  const confirmInvite = () => {
    if (selectedPlayer) {
      sendInviteMutation.mutate({ inviteeId: selectedPlayer.userId });
    }
  };

  const handleAcceptInvite = (invite: BattleInvite) => {
    // 生成战斗ID
    const battleId = `battle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    acceptInviteMutation.mutate({ inviteId: invite.id, battleId });
  };

  const handleDeclineInvite = (inviteId: number) => {
    declineInviteMutation.mutate({ inviteId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Q宠大乐斗 - 大厅</h1>
          <p className="text-purple-200">选择对手，开始你的战斗之旅</p>
        </div>

        {/* 待处理邀请部分 */}
        {pendingInvites.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              待处理邀请 ({pendingInvites.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingInvites.map((invite) => (
                <Card
                  key={invite.id}
                  className="bg-yellow-900/30 border-yellow-500/50 p-4"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-yellow-200">
                      {invite.inviterName}
                    </h3>
                    <p className="text-yellow-100">
                      宠物: {invite.inviterPetName} (Lv.{invite.inviterPetLevel})
                    </p>
                    <p className="text-sm text-yellow-300 mt-2">
                      邀请有效期: {Math.max(0, Math.round((new Date(invite.expiresAt).getTime() - Date.now()) / 1000))}秒
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAcceptInvite(invite)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={acceptInviteMutation.isPending}
                    >
                      接受
                    </Button>
                    <Button
                      onClick={() => handleDeclineInvite(invite.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      disabled={declineInviteMutation.isPending}
                    >
                      拒绝
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 在线玩家列表 */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" />
            在线玩家 ({onlinePlayers.length})
          </h2>

          {isLoadingPlayers ? (
            <div className="text-center py-8">
              <p className="text-purple-200">加载中...</p>
            </div>
          ) : onlinePlayers.length === 0 ? (
            <Card className="bg-purple-900/50 border-purple-500/50 p-8 text-center">
              <p className="text-purple-200 text-lg">暂无在线玩家</p>
              <p className="text-purple-300 mt-2">请稍后再试</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {onlinePlayers.map((player) => (
                <Card
                  key={player.userId}
                  className="bg-blue-900/30 border-blue-500/50 p-4 hover:bg-blue-900/50 transition-colors"
                >
                  <div className="mb-4">
                    {/* 玩家头像/宠物图片 */}
                    {player.petImageUrl && (
                      <img
                        src={player.petImageUrl}
                        alt={player.petName}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}

                    {/* 玩家信息 */}
                    <h3 className="text-lg font-bold text-blue-100">
                      {player.userName}
                    </h3>
                    <p className="text-blue-200">
                      宠物: {player.petName}
                    </p>
                    <p className="text-sm text-blue-300">
                      等级: {player.petLevel}
                    </p>

                    {/* 玩家状态 */}
                    <div className="mt-2 inline-block">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          player.status === "idle"
                            ? "bg-green-600/50 text-green-200"
                            : player.status === "matching"
                            ? "bg-yellow-600/50 text-yellow-200"
                            : "bg-red-600/50 text-red-200"
                        }`}
                      >
                        {player.status === "idle"
                          ? "空闲"
                          : player.status === "matching"
                          ? "匹配中"
                          : "战斗中"}
                      </span>
                    </div>
                  </div>

                  {/* 邀请按钮 */}
                  {player.status === "idle" && (
                    <Button
                      onClick={() => handleInvitePlayer(player)}
                      className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
                      disabled={sendInviteMutation.isPending}
                    >
                      <Swords className="w-4 h-4" />
                      邀请对战
                    </Button>
                  )}

                  {player.status !== "idle" && (
                    <Button disabled className="w-full opacity-50">
                      {player.status === "matching" ? "匹配中..." : "战斗中"}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 邀请确认对话框 */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="bg-gray-900 border-purple-500">
            <DialogHeader>
              <DialogTitle className="text-white">确认邀请</DialogTitle>
            </DialogHeader>
            {selectedPlayer && (
              <div className="space-y-4">
                <p className="text-gray-300">
                  确定要邀请 <span className="font-bold text-purple-300">{selectedPlayer.userName}</span> 进行对战吗？
                </p>
                <p className="text-sm text-gray-400">
                  对方有60秒的时间来接受或拒绝邀请。如果超时，将自动与AI对手进行对战。
                </p>
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => setShowInviteDialog(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={confirmInvite}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={sendInviteMutation.isPending}
                  >
                    {sendInviteMutation.isPending ? "发送中..." : "确认邀请"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 快速操作按钮 */}
        <div className="mt-8 flex gap-4 justify-center">
          <Button
            onClick={() => setLocation("/")}
            className="bg-gray-700 hover:bg-gray-600"
          >
            返回首页
          </Button>
          <Button
            onClick={() => getPlayersQuery.refetch()}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={getPlayersQuery.isLoading}
          >
            刷新列表
          </Button>
        </div>
      </div>
    </div>
  );
}
