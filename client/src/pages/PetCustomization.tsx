import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { RACE_CONFIG } from '@shared/raceSystem';

interface PetInfo {
  id: number;
  name: string;
  race: 'human' | 'beast' | 'hybrid';
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  strength: number;
  agility: number;
  evolution: number;
  imageUrl?: string | null;
}

export default function PetCustomization() {
  const [petId, setPetId] = useState<number | null>(null);
  const [petInfo, setPetInfo] = useState<PetInfo | null>(null);
  const [newName, setNewName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取宠物信息
  const getPetInfoQuery = trpc.petCustomization.getPetInfo.useQuery(
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
        if (petInfo) {
          setPetInfo({ ...petInfo, imageUrl: data.imageUrl });
        }
      } else {
        toast.error(data.message);
      }
    },
  });

  // 同步查询结果到本地状态
  useEffect(() => {
    if (getPetInfoQuery.data?.data) {
      setPetInfo(getPetInfoQuery.data.data);
    }
  }, [getPetInfoQuery.data]);

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

  if (getPetInfoQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const pet = petInfo;
  const raceConfig = pet ? RACE_CONFIG[pet.race] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">宠物自定义</h1>

        {/* 宠物头像和基本信息 */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 宠物头像 */}
            <div className="flex flex-col items-center">
              {pet?.imageUrl ? (
                <img
                  src={pet.imageUrl}
                  alt={pet.name}
                  className="w-48 h-48 rounded-lg object-cover border-4 border-blue-200 mb-4"
                />
              ) : (
                <div className="w-48 h-48 rounded-lg bg-gray-200 flex items-center justify-center border-4 border-blue-200 mb-4">
                  <span className="text-gray-400 text-center text-sm">
                    点击上传宠物图片
                  </span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2"
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
            <div className="md:col-span-2">
              {/* 宠物名字 */}
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
                      placeholder="输入新的宠物名字"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleRenamePet}
                      disabled={renameMutation.isPending}
                      size="sm"
                    >
                      {renameMutation.isPending ? '保存中...' : '保存'}
                    </Button>
                    <Button
                      onClick={() => setIsEditingName(false)}
                      variant="outline"
                      size="sm"
                    >
                      取消
                    </Button>
                  </div>
                )}
              </div>

              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">等级</div>
                  <div className="text-2xl font-bold text-blue-600">{pet?.level}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">种族</div>
                  <div className="text-lg font-bold text-purple-600">{raceConfig?.name}</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">进化阶段</div>
                  <div className="text-2xl font-bold text-orange-600">{pet?.evolution}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">种族特性</div>
                  <div className="text-xs font-bold text-green-600">{raceConfig?.description}</div>
                </div>
              </div>

              {/* 属性条 */}
              <div className="space-y-3">
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
                    <span className="text-xs font-medium">蓝量</span>
                    <span className="text-xs font-bold text-blue-600">
                      {pet?.mp}/{pet?.maxMp}
                    </span>
                  </div>
                  <Progress value={((pet?.mp || 0) / (pet?.maxMp || 100)) * 100} className="h-2" />
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
          </div>
        </Card>

        {/* 种族信息 */}
        {raceConfig && (
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">种族信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">特点</p>
                <p className="text-sm">{raceConfig.description}</p>
              </div>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">基础血量：</span>
                  <span className="font-bold">{raceConfig.hpBase} + {raceConfig.hpPerLevel}/级</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">基础蓝量：</span>
                  <span className="font-bold">{raceConfig.mpBase} + {raceConfig.mpPerLevel}/级</span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
