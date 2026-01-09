import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, UserPlus, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Friends() {
  const [searchQuery, setSearchQuery] = useState('');
  const [friendIdInput, setFriendIdInput] = useState('');

  // 获取好友列表
  const friendsQuery = trpc.friend.getFriends.useQuery();
  const pendingRequestsQuery = trpc.friend.getPendingRequests.useQuery();
  const pendingInvitesQuery = trpc.friend.getPendingInvites.useQuery();

  // 好友操作
  const addFriendMutation = trpc.friend.addFriend.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setFriendIdInput('');
        friendsQuery.refetch();
        pendingRequestsQuery.refetch();
      } else {
        toast.error(data.message);
      }
    },
  });

  const acceptFriendMutation = trpc.friend.acceptFriend.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        friendsQuery.refetch();
        pendingRequestsQuery.refetch();
      } else {
        toast.error(data.message);
      }
    },
  });

  const rejectFriendMutation = trpc.friend.rejectFriend.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        pendingRequestsQuery.refetch();
      } else {
        toast.error(data.message);
      }
    },
  });

  const removeFriendMutation = trpc.friend.removeFriend.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        friendsQuery.refetch();
      } else {
        toast.error(data.message);
      }
    },
  });

  const sendInviteMutation = trpc.friend.sendInvite.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
  });

  const acceptInviteMutation = trpc.friend.acceptInvite.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        pendingInvitesQuery.refetch();
      } else {
        toast.error(data.message);
      }
    },
  });

  const declineInviteMutation = trpc.friend.declineInvite.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        pendingInvitesQuery.refetch();
      } else {
        toast.error(data.message);
      }
    },
  });

  const handleAddFriend = () => {
    const friendId = parseInt(friendIdInput);
    if (isNaN(friendId)) {
      toast.error('请输入有效的玩家ID');
      return;
    }
    addFriendMutation.mutate({ friendId });
  };

  const handleAcceptFriend = (friendId: number) => {
    acceptFriendMutation.mutate({ friendId });
  };

  const handleRejectFriend = (friendId: number) => {
    rejectFriendMutation.mutate({ friendId });
  };

  const handleRemoveFriend = (friendId: number) => {
    if (window.confirm('确定要删除这个好友吗？')) {
      removeFriendMutation.mutate({ friendId });
    }
  };

  const handleSendInvite = (friendId: number) => {
    sendInviteMutation.mutate({ friendId });
  };

  const handleAcceptInvite = (inviteId: number) => {
    // 生成匹配ID
    const matchId = `friend_match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    acceptInviteMutation.mutate({ inviteId, matchId });
  };

  const handleDeclineInvite = (inviteId: number) => {
    declineInviteMutation.mutate({ inviteId });
  };

  const friends = friendsQuery.data?.data || [];
  const pendingRequests = pendingRequestsQuery.data?.data || [];
  const pendingInvites = pendingInvitesQuery.data?.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">好友系统</h1>

        <Tabs defaultValue="friends" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              好友列表 ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              好友请求 ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="invites">
              战斗邀请 ({pendingInvites.length})
            </TabsTrigger>
          </TabsList>

          {/* 好友列表 */}
          <TabsContent value="friends" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">我的好友</h2>
              
              {friends.length === 0 ? (
                <p className="text-gray-500 text-center py-8">还没有好友，去添加一些吧！</p>
              ) : (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{friend.name}</h3>
                        <p className="text-sm text-gray-600">
                          宠物: {friend.petName} (等级 {friend.petLevel})
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSendInvite(friend.id)}
                          disabled={sendInviteMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          邀请对战
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveFriend(friend.id)}
                          disabled={removeFriendMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* 添加好友 */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">添加好友</h2>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="输入玩家ID"
                  value={friendIdInput}
                  onChange={(e) => setFriendIdInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddFriend}
                  disabled={addFriendMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {addFriendMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* 好友请求 */}
          <TabsContent value="requests" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">待处理的好友请求</h2>
              
              {pendingRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">没有待处理的好友请求</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{request.name}</h3>
                        <p className="text-sm text-gray-600">
                          宠物: {request.petName} (等级 {request.petLevel})
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptFriend(request.userId)}
                          disabled={acceptFriendMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectFriend(request.userId)}
                          disabled={rejectFriendMutation.isPending}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* 战斗邀请 */}
          <TabsContent value="invites" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">待处理的战斗邀请</h2>
              
              {pendingInvites.length === 0 ? (
                <p className="text-gray-500 text-center py-8">没有待处理的战斗邀请</p>
              ) : (
                <div className="space-y-3">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition border-l-4 border-blue-600"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{invite.inviterName}</h3>
                        <p className="text-sm text-gray-600">
                          宠物: {invite.petName} (等级 {invite.petLevel})
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          邀请时间: {new Date(invite.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvite(invite.id)}
                          disabled={acceptInviteMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          接受
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeclineInvite(invite.id)}
                          disabled={declineInviteMutation.isPending}
                        >
                          拒绝
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
