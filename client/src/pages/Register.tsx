import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Register() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const registerMutation = trpc.simpleAuth.register.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success('注册成功！正在跳转...');
        // 刷新页面以加载用户信息
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    },
    onError: (error) => {
      toast.error(error.message || '注册失败');
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password || !confirmPassword) {
      toast.error('请填写所有必填项');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      toast.error('用户名长度应在3-20个字符之间');
      return;
    }

    if (password.length < 6) {
      toast.error('密码长度至少为6个字符');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    registerMutation.mutate({
      username,
      password,
      name: name || username,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Q宠大乐斗</h1>
          <p className="text-gray-600">创建新账号</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">
              用户名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="3-20个字符"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoComplete="username"
            />
            <p className="text-xs text-gray-500">用户名将作为你的玩家ID</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">昵称（可选）</Label>
            <Input
              id="name"
              type="text"
              placeholder="显示名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              密码 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="至少6个字符"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              确认密码 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                注册中...
              </>
            ) : (
              '注册'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            已有账号？{' '}
            <button
              onClick={() => setLocation('/login')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              立即登录
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
