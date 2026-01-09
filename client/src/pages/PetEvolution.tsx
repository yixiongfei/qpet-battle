import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";

export default function PetEvolution() {
  const [, navigate] = useLocation();
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);
  const [showEvolutionAnimation, setShowEvolutionAnimation] = useState(false);

  // 获取宠物信息
  const { data: pet, isLoading: petLoading } = trpc.pet.getPet.useQuery();

  // 获取所有技能
  const { data: allSkills = [] } = trpc.pet.getSkills.useQuery();

  // 获取宠物已学习的技能
  const { data: petSkills = [], refetch: refetchPetSkills } = trpc.pet.getPetSkills.useQuery(
    { petId: pet?.id || 0 },
    { enabled: !!pet?.id }
  );

  // 学习技能
  const learnSkillMutation = trpc.pet.learnSkill.useMutation({
    onSuccess: () => {
      refetchPetSkills();
      setSelectedSkillId(null);
    },
  });

  // 更新宠物信息
  const updatePetMutation = trpc.pet.updatePet.useMutation();

  if (petLoading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  if (!pet) {
    return <div className="text-center py-8">宠物信息加载失败</div>;
  }

  // 获取可学习的技能
  const learnableSkills = allSkills.filter((skill) => {
    const alreadyLearned = petSkills.some((ps) => ps.id === skill.id);
    const meetsLevel = pet.level >= skill.requiredLevel;
    const meetsEvolution = pet.evolution >= skill.requiredEvolution;
    return !alreadyLearned && meetsLevel && meetsEvolution;
  });

  // 获取进化所需的经验
  const evolutionThresholds = [100, 500, 1000];
  const nextEvolutionExp = evolutionThresholds[pet.evolution] || 9999;
  const evolutionProgress = (pet.exp / nextEvolutionExp) * 100;

  // 处理进化
  const handleEvolution = async () => {
    if (pet.evolution < 2 && pet.exp >= nextEvolutionExp) {
      setShowEvolutionAnimation(true);
      setTimeout(() => {
        updatePetMutation.mutate({
          petId: pet.id,
          evolution: pet.evolution + 1,
          exp: 0,
        });
        setShowEvolutionAnimation(false);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 头部导航 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">宠物进化系统</h1>
          <Button variant="outline" onClick={() => navigate("/", { replace: true })}>
            返回大厅
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 宠物信息卡片 */}
          <Card className="lg:col-span-1 p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {pet.evolution === 0 && "🐧"}
                {pet.evolution === 1 && "🦅"}
                {pet.evolution === 2 && "🐉"}
              </div>
              <h2 className="text-2xl font-bold mb-2">{pet.name}</h2>
              <div className="text-sm text-muted-foreground mb-4">
                进化阶段: {pet.evolution === 0 ? "初始" : pet.evolution === 1 ? "第一阶段" : "最终"}
              </div>

              {/* 属性显示 */}
              <div className="space-y-3 text-left">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">等级</span>
                    <span className="text-sm font-bold text-primary">{pet.level}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">生命值</span>
                    <span className="text-sm font-bold text-red-600">
                      {pet.hp}/{pet.maxHp}
                    </span>
                  </div>
                  <Progress value={(pet.hp / pet.maxHp) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">力量</span>
                    <span className="text-sm font-bold text-orange-600">{pet.strength}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">敏捷</span>
                    <span className="text-sm font-bold text-green-600">{pet.agility}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 进化系统 */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-xl font-bold mb-6">进化系统</h3>

            {/* 进化进度 */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="font-medium">进化进度</span>
                <span className="text-sm text-muted-foreground">
                  {pet.exp}/{nextEvolutionExp}
                </span>
              </div>
              <Progress value={evolutionProgress} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {pet.evolution < 2
                  ? `再获得 ${nextEvolutionExp - pet.exp} 经验即可进化`
                  : "已达到最高进化阶段"}
              </p>
            </div>

            {/* 进化按钮 */}
            {pet.evolution < 2 && pet.exp >= nextEvolutionExp ? (
              <Button
                onClick={handleEvolution}
                disabled={showEvolutionAnimation}
                className="w-full mb-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                size="lg"
              >
                {showEvolutionAnimation ? "进化中..." : "立即进化"}
              </Button>
            ) : (
              <Button disabled className="w-full mb-6" size="lg">
                进化条件不满足
              </Button>
            )}

            {/* 进化效果说明 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-bold mb-3">进化效果</h4>
              <div className="space-y-2 text-sm">
                {pet.evolution === 0 && (
                  <>
                    <p>✓ 力量 +5</p>
                    <p>✓ 敏捷 +3</p>
                    <p>✓ 解锁新技能</p>
                  </>
                )}
                {pet.evolution === 1 && (
                  <>
                    <p>✓ 力量 +10</p>
                    <p>✓ 敏捷 +5</p>
                    <p>✓ 解锁终极技能</p>
                  </>
                )}
                {pet.evolution === 2 && (
                  <p className="text-center text-purple-600 font-bold">已达最高进化！</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* 技能系统 */}
        <Card className="mt-6 p-6">
          <h3 className="text-xl font-bold mb-6">技能系统</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 已学习的技能 */}
            <div>
              <h4 className="font-bold mb-4">已学习的技能 ({petSkills.length})</h4>
              <div className="space-y-3">
                {petSkills.length === 0 ? (
                  <p className="text-muted-foreground text-sm">暂无技能，学习新技能吧！</p>
                ) : (
                  petSkills.map((skill) => (
                    <div key={skill.id} className="bg-green-50 p-3 rounded-lg border-2 border-green-300">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold">
                            {skill.icon} {skill.name}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{skill.description}</p>
                          <div className="text-xs text-green-600 font-bold mt-2">
                            伤害: {skill.damage} | 冷却: {skill.cooldown}s
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 可学习的技能 */}
            <div>
              <h4 className="font-bold mb-4">可学习的技能 ({learnableSkills.length})</h4>
              <div className="space-y-3">
                {learnableSkills.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {pet.level < 5
                      ? "升级到5级以解锁更多技能"
                      : pet.evolution === 0
                      ? "进化后可解锁更多技能"
                      : "所有技能已学习"}
                  </p>
                ) : (
                  learnableSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="bg-blue-50 p-3 rounded-lg border-2 border-blue-300 cursor-pointer hover:bg-blue-100 transition"
                      onClick={() => setSelectedSkillId(skill.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold">
                            {skill.icon} {skill.name}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{skill.description}</p>
                          <div className="text-xs text-blue-600 font-bold mt-2">
                            伤害: {skill.damage} | 冷却: {skill.cooldown}s
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            learnSkillMutation.mutate({
                              petId: pet.id,
                              skillId: skill.id,
                            });
                          }}
                          disabled={learnSkillMutation.isPending}
                        >
                          学习
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
