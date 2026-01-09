<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 顶部导航 -->
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold text-primary">成就与排行榜</h1>
      <button @click="router.push('/')" class="pop-button px-4 py-2 bg-muted text-muted-foreground hover:bg-muted/80">
        返回大厅
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 左侧：成就系统 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 成就总览卡片 -->
        <div class="pop-card p-6 bg-gradient-to-r from-purple-50 to-pink-50">
          <h2 class="text-2xl font-bold mb-4 flex items-center">
            <span class="text-3xl mr-3">🏆</span>
            成就总览
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-lg border-2 border-purple-300 text-center">
              <div class="text-3xl font-bold text-primary">{{ achievementsStore.unlockedAchievements.length }}</div>
              <div class="text-sm text-muted-foreground">已解锁</div>
            </div>
            <div class="bg-white p-4 rounded-lg border-2 border-purple-300 text-center">
              <div class="text-3xl font-bold text-secondary">{{ achievementsStore.allAchievements.length }}</div>
              <div class="text-sm text-muted-foreground">总成就数</div>
            </div>
            <div class="bg-white p-4 rounded-lg border-2 border-purple-300 text-center">
              <div class="text-3xl font-bold text-yellow-500">{{ achievementsStore.achievementProgress }}%</div>
              <div class="text-sm text-muted-foreground">完成度</div>
            </div>
            <div class="bg-white p-4 rounded-lg border-2 border-purple-300 text-center">
              <div class="text-3xl font-bold text-blue-500">{{ achievementsStore.playerStats.maxWinStreak }}</div>
              <div class="text-sm text-muted-foreground">最高连胜</div>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="mt-6">
            <div class="flex justify-between mb-2">
              <span class="font-bold">成就进度</span>
              <span class="text-sm text-muted-foreground">
                {{ achievementsStore.unlockedAchievements.length }} / {{ achievementsStore.allAchievements.length }}
              </span>
            </div>
            <div class="h-4 bg-muted rounded-full overflow-hidden border-2 border-foreground">
              <div 
                class="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                :style="{ width: `${achievementsStore.achievementProgress}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 成就列表 -->
        <div class="pop-card p-6">
          <h2 class="text-2xl font-bold mb-6 flex items-center">
            <span class="w-2 h-6 bg-primary mr-3 rounded-full"></span>
            成就列表
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              v-for="achievement in achievementsStore.allAchievements"
              :key="achievement.id"
              class="pop-card p-4 transition-all"
              :class="{
                'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300': achievement.unlocked,
                'bg-gray-100 opacity-60': !achievement.unlocked
              }"
            >
              <div class="flex items-start gap-4">
                <div class="text-5xl">{{ achievement.icon }}</div>
                <div class="flex-1">
                  <h3 class="font-bold text-lg">{{ achievement.name }}</h3>
                  <p class="text-sm text-muted-foreground mb-2">{{ achievement.description }}</p>
                  <div v-if="achievement.unlocked" class="text-xs text-green-600 font-bold flex items-center gap-1">
                    <span>✓</span> 已解锁
                  </div>
                  <div v-else class="text-xs text-gray-500">未解锁</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：排行榜 -->
      <div class="space-y-6">
        <div class="pop-card p-6">
          <h2 class="text-2xl font-bold mb-6 flex items-center">
            <span class="text-3xl mr-2">📊</span>
            排行榜
          </h2>

          <div class="space-y-3">
            <div 
              v-for="(entry, index) in achievementsStore.leaderboard"
              :key="index"
              class="pop-card p-4 flex items-center gap-4 bg-gradient-to-r"
              :class="{
                'from-yellow-100 to-orange-100 border-yellow-400': entry.rank === 1,
                'from-gray-100 to-gray-200 border-gray-400': entry.rank === 2,
                'from-orange-100 to-red-100 border-orange-400': entry.rank === 3,
                'from-blue-50 to-blue-100 border-blue-300': entry.rank > 3
              }"
            >
              <div class="text-3xl font-black w-10 text-center">
                <span v-if="entry.rank === 1">🥇</span>
                <span v-else-if="entry.rank === 2">🥈</span>
                <span v-else-if="entry.rank === 3">🥉</span>
                <span v-else>#{{ entry.rank }}</span>
              </div>
              <div class="flex-1">
                <div class="font-bold">{{ entry.name }}</div>
                <div class="text-xs text-muted-foreground">
                  连胜: {{ entry.maxWinStreak }} | 金币: {{ entry.totalGold }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 个人统计 -->
        <div class="pop-card p-6">
          <h2 class="text-2xl font-bold mb-4 flex items-center">
            <span class="text-3xl mr-2">📈</span>
            个人统计
          </h2>

          <div class="space-y-3 text-sm">
            <div class="flex justify-between p-2 bg-muted/50 rounded-lg">
              <span class="font-bold">总战斗数</span>
              <span class="text-primary font-bold">{{ achievementsStore.playerStats.totalBattles }}</span>
            </div>
            <div class="flex justify-between p-2 bg-muted/50 rounded-lg">
              <span class="font-bold">胜场数</span>
              <span class="text-green-600 font-bold">{{ achievementsStore.playerStats.totalWins }}</span>
            </div>
            <div class="flex justify-between p-2 bg-muted/50 rounded-lg">
              <span class="font-bold">当前连胜</span>
              <span class="text-yellow-600 font-bold">{{ achievementsStore.playerStats.currentWinStreak }}</span>
            </div>
            <div class="flex justify-between p-2 bg-muted/50 rounded-lg">
              <span class="font-bold">最高连胜</span>
              <span class="text-red-600 font-bold">{{ achievementsStore.playerStats.maxWinStreak }}</span>
            </div>
            <div class="flex justify-between p-2 bg-muted/50 rounded-lg">
              <span class="font-bold">总金币数</span>
              <span class="text-yellow-500 font-bold">{{ achievementsStore.playerStats.totalGoldEarned }}</span>
            </div>
            <div class="flex justify-between p-2 bg-muted/50 rounded-lg">
              <span class="font-bold">总经验值</span>
              <span class="text-blue-600 font-bold">{{ achievementsStore.playerStats.totalExpEarned }}</span>
            </div>
            <div class="flex justify-between p-2 bg-muted/50 rounded-lg">
              <span class="font-bold">药水使用</span>
              <span class="text-red-500 font-bold">{{ achievementsStore.playerStats.totalPotionsUsed }}</span>
            </div>
            <div class="flex justify-between p-2 bg-muted/50 rounded-lg">
              <span class="font-bold">武器收集</span>
              <span class="text-purple-600 font-bold">{{ achievementsStore.playerStats.weaponsCollected }}/4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAchievementsStore } from '@/stores/achievements'

const router = useRouter()
const achievementsStore = useAchievementsStore()
</script>
