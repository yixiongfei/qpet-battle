<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold text-primary drop-shadow-md">Q宠大乐斗</h1>
      <div class="text-muted-foreground">Level {{ player.level }}</div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 角色卡片 -->
      <div class="pop-card p-6 flex flex-col items-center">
        <div class="relative w-48 h-48 mb-4">
          <div class="absolute inset-0 bg-accent rounded-full opacity-20 animate-pulse"></div>
          <img src="/images/penguin_hero.png" alt="Hero" class="w-full h-full object-contain relative z-10 drop-shadow-xl" />
        </div>
        <h2 class="text-2xl font-bold mb-2">{{ player.name }}</h2>
        
        <div class="w-full space-y-3 mt-4">
          <div class="flex justify-between items-center">
            <span class="font-bold text-muted-foreground">HP</span>
            <div class="flex-1 mx-3 h-4 bg-muted rounded-full overflow-hidden border border-border">
              <div class="h-full bg-red-500" :style="{ width: `${(player.hp / player.maxHp) * 100}%` }"></div>
            </div>
            <span class="font-mono">{{ player.hp }}/{{ player.maxHp }}</span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="font-bold text-muted-foreground">EXP</span>
            <div class="flex-1 mx-3 h-4 bg-muted rounded-full overflow-hidden border border-border">
              <div class="h-full bg-yellow-400" :style="{ width: `${(player.exp / player.maxExp) * 100}%` }"></div>
            </div>
            <span class="font-mono">{{ player.exp }}/{{ player.maxExp }}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 w-full mt-6">
          <div class="bg-muted/50 p-3 rounded-lg text-center border border-border">
            <div class="text-sm text-muted-foreground">力量</div>
            <div class="text-xl font-bold">{{ player.strength }}</div>
          </div>
          <div class="bg-muted/50 p-3 rounded-lg text-center border border-border">
            <div class="text-sm text-muted-foreground">敏捷</div>
            <div class="text-xl font-bold">{{ player.agility }}</div>
          </div>
        </div>
      </div>

      <!-- 装备与背包 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 当前装备 -->
        <div class="pop-card p-6">
          <h3 class="text-xl font-bold mb-4 flex items-center">
            <span class="w-2 h-6 bg-primary mr-3 rounded-full"></span>
            当前装备
          </h3>
          <div v-if="player.weapon" class="flex items-center gap-4 bg-accent/20 p-4 rounded-xl border border-border">
            <img :src="player.weapon.icon" class="w-16 h-16 object-contain bg-white rounded-lg border-2 border-foreground p-1" />
            <div>
              <h4 class="text-lg font-bold">{{ player.weapon.name }}</h4>
              <p class="text-sm text-muted-foreground">{{ player.weapon.description }}</p>
              <div class="mt-1 text-primary font-bold">攻击力 +{{ player.weapon.damage }}</div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
            暂无装备，请从背包中选择
          </div>
        </div>

        <!-- 背包 -->
        <div class="pop-card p-6">
          <h3 class="text-xl font-bold mb-4 flex items-center">
            <span class="w-2 h-6 bg-secondary mr-3 rounded-full"></span>
            背包
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div 
              v-for="item in player.inventory" 
              :key="item.id"
              class="group relative bg-background border-2 border-border rounded-xl p-3 hover:border-primary cursor-pointer transition-all hover:-translate-y-1"
              @click="gameStore.equipWeapon(item.id)"
            >
              <img :src="item.icon" class="w-full aspect-square object-contain mb-2" />
              <div class="text-center font-bold text-sm">{{ item.name }}</div>
              <div class="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full" v-if="player.weapon?.id === item.id"></div>
            </div>
          </div>
        </div>

        <!-- 战斗入口 -->
        <div class="flex justify-end mt-8">
          <button @click="router.push('/battle')" class="pop-button text-xl px-12 py-4 bg-gradient-to-r from-primary to-red-500 hover:from-primary/90 hover:to-red-600 text-white shadow-lg transform hover:scale-105 transition-all">
            寻找对手
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/game'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const router = useRouter()
const gameStore = useGameStore()
const { player } = storeToRefs(gameStore)
</script>
