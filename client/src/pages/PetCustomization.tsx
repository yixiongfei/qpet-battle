import React, { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface PetInfo {
  id: number;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  strength: number;
  agility: number;
  evolution: number;
  imageUrl?: string;
}

export default function PetCustomization() {
  const [petId, setPetId] = useState<number | null>(null);
  const [petInfo, setPetInfo] = useState<PetInfo | null>(null);
  const [newName, setNewName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取宠物信息
  const getPetInfoMutation = trpc.petCustomization.getPetInfo.useQuery(
    { petId: petId || 0 },
    { enabled: !!petId }
  );

  // 修改宠物名字
  const renameMutation = trpc.petCustomization.renamePet.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setIsEditingName(false);
        setNewName('');
        if (petInfo) {
          setPetInfo({ ...petInfo, name: newName });
        }
      } else {
        toast.error(data.message);
      }
    },
  });

  // 上传图片
  const uploadImageMutation = trpc.petCustomization.uploadImage.useMutation({
    onSuccess: (data) => {
      if (data.success && 'imageUrl' in data) {
        toast.success(data.message);
        if (petInfo && 'imageUrl' in data) {
          setPetInfo({ ...petInfo, imageUrl: data.imageUrl });
        }
      } else {
        toast.error(data.message);
      }
    },
  });

  const handleRenamePet = () => {
    if (!petId || !newName.trim()) {
      toast.error('请输入新的宠物名字');
      return;
    }
    renameMutation.mutate({ petId, newName });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !petId) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件类型
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('只支持JPG和PNG格式的图片');
      return;
    }

    // 验证文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        const base64Data = base64String.split(',')[1]; // 移除data:image/jpeg;base64,前缀
        uploadImageMutation.mutate({
          petId,
          imageData: base64Data,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('图片上传失败');
    }
  };

  if (!petId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">宠物自定义</h1>
          <Card className="p-6">
            <p className="text-gray-600 mb-4">请输入宠物ID来开始自定义</p>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="输入宠物ID"
                onChange={(e) => setPetId(parseInt(e.target.value) || null)}
                className="flex-1"
              />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (getPetInfoMutation.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const pet = getPetInfoMutation.data?.data || petInfo;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">宠物自定义</h1>

        {/* 宠物头像和基本信息 */}
        <Card className="p-6 mb-6">
          <div className="flex gap-6">
            {/* 宠物头像 */}
            <div className="flex-shrink-0">
              {pet?.imageUrl ? (
                <img
                  src={pet.imageUrl}
                  alt={pet.name}
                  className="w-48 h-48 rounded-lg object-cover border-4 border-blue-200"
                />
              ) : (
                <div className="w-48 h-48 rounded-lg bg-gray-200 flex items-center justify-center border-4 border-blue-200">
                  <span className="text-gray-400 text-center">
                    点击上传宠物图片
                  </span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2"
                disabled={uploadImageMutation.isPending}
              >
                {uploadImageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                上传图片
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* 宠物信息 */}
            <div className="flex-1">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold">{pet?.name}</h2>
                  {!isEditingName && (
                    <button
                      onClick={() => {
                        setIsEditingName(true);
                        setNewName(pet?.name || '');
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {isEditingName && (
                  <div className="flex gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="输入新名字"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleRenamePet}
                      disabled={renameMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {renameMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        '保存'
                      )}
                    </Button>
                    <Button
                      onClick={() => setIsEditingName(false)}
                      variant="outline"
                    >
                      取消
                    </Button>
                  </div>
                )}
              </div>

              {/* 属性信息 */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">等级</p>
                    <p className="text-xl font-bold text-blue-600">{pet?.level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">进化阶段</p>
                    <p className="text-xl font-bold text-purple-600">
                      {pet?.evolution}
                    </p>
                  </div>
                </div>

                {/* 血量条 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold">血量</span>
                    <span className="text-sm text-gray-600">
                      {pet?.hp}/{pet?.maxHp}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${((pet?.hp || 0) / (pet?.maxHp || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 蓝量条 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold">蓝量</span>
                    <span className="text-sm text-gray-600">
                      {pet?.mp}/{pet?.maxMp}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${((pet?.mp || 0) / (pet?.maxMp || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 属性 */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-gray-600">力量</p>
                    <p className="text-lg font-bold text-red-600">
                      {pet?.strength}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">敏捷</p>
                    <p className="text-lg font-bold text-yellow-600">
                      {pet?.agility}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 图片上传说明 */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">上传说明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ 支持 JPG 和 PNG 格式</li>
            <li>✓ 图片将自动裁剪为 256x256 像素</li>
            <li>✓ 文件大小限制为 5MB</li>
            <li>✓ 建议上传正方形图片以获得最佳效果</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
