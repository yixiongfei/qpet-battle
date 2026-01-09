<template>
  <div class="container mx-auto px-4 py-8 h-screen flex flex-col">
    <!-- 战斗场景背景 -->
    <div class="flex-1 relative bg-card rounded-xl overflow-hidden shadow-2xl border-4 border-foreground">
      <div class="absolute inset-0 bg-[url('/images/battle_bg.png')] bg-cover bg-center opacity-50"></div>
      
      <!-- 战斗HUD -->
      <div class="absolute inset-0 p-6 flex flex-col justify-between z-10">
        <!-- 顶部血条区域 -->
        <div class="flex justify-between items-start">
          <!-- 玩家信息 -->
          <div class="flex items-center gap-4 bg-background/80 p-3 rounded-xl border-2 border-foreground shadow-lg backdrop-blur-sm">
            <img src="/images/penguin_hero.png" class="w-16 h-16 rounded-full border-2 border-primary bg-white" />
            <div class="w-48">
              <div class="flex justify-between mb-1">
                <span class="font-bold">{{ player.name }}</span>
                <span class="text-sm font-mono">Lv.{{ player.level }}</span>
              </div>
              <div class="h-4 bg-muted rounded-full overflow-hidden border border-border relative">
                <div class="h-full bg-green-500 transition-all duration-300" :style="{ width: `${(currentHp / player.maxHp) * 100}%` }"></div>
                <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">{{ currentHp }}/{{ player.maxHp }}</span>
              </div>
            </div>
          </div>

          <!-- VS 标志 -->
          <div class="text-6xl font-black text-red-600 italic drop-shadow-[4px_4px_0_#000] animate-pulse">VS</div>

          <!-- 敌人信息 -->
          <div class="flex items-center gap-4 bg-background/80 p-3 rounded-xl border-2 border-foreground shadow-lg backdrop-blur-sm flex-row-reverse text-right">
            <div class="w-16 h-16 rounded-full border-2 border-destructive bg-gray-200 flex items-center justify-center text-2xl">😈</div>
            <div class="w-48">
              <div class="flex justify-between mb-1 flex-row-reverse">
                <span class="font-bold">{{ enemy.name }}</span>
                <span class="text-sm font-mono">Lv.{{ enemy.level }}</span>
              </div>
              <div class="h-4 bg-muted rounded-full overflow-hidden border border-border relative">
                <div class="h-full bg-red-500 transition-all duration-300" :style="{ width: `${(enemyHp / enemy.maxHp) * 100}%` }"></div>
                <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">{{ enemyHp }}/{{ enemy.maxHp }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 战斗日志区域 -->
        <div class="flex-1 my-6 overflow-hidden relative">
          <div class="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background/90 to-transparent pointer-events-none z-10"></div>
          <div ref="logContainer" class="h-full overflow-y-auto space-y-2 px-4 pb-4 scroll-smooth">
            <div v-for="(log, index) in battleLogs" :key="index" 
              class="p-2 rounded-lg text-sm font-medium animate-in slide-in-from-bottom-2 fade-in duration-300"
              :class="{
                'bg-primary/10 text-primary-foreground border-l-4 border-primary': log.type === 'player',
                'bg-destructive/10 text-destructive-foreground border-r-4 border-destructive text-right': log.type === 'enemy',
                'bg-yellow-100 text-yellow-800 text-center font-bold': log.type === 'system'
              }"
            >
              {{ log.message }}
            </div>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="flex justify-center gap-4">
          <button 
            v-if="!isBattleStarted"
            @click="startBattle"
            class="pop-button text-2xl px-16 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-xl animate-bounce"
          >
            开始战斗！
          </button>
          
          <button 
            v-if="isBattleEnded"
            @click="router.push('/')"
            class="pop-button text-xl px-8 py-3 bg-muted text-muted-foreground hover:bg-muted/80"
          >
            返回大厅
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { storeToRefs } from 'pinia'

const router = useRouter()
const gameStore = useGameStore()
const { player } = storeToRefs(gameStore)

const currentHp = ref(player.value.hp)
const enemyHp = ref(100)
const isBattleStarted = ref(false)
const isBattleEnded = ref(false)
const logContainer = ref<HTMLElement | null>(null)

const enemy = ref({
  name: '菜菜企鹅',
  level: 1,
  maxHp: 100,
  strength: 8,
  agility: 4
})

interface BattleLog {
  type: 'player' | 'enemy' | 'system'
  message: string
}

const battleLogs = ref<BattleLog[]>([])

const addLog = (type: 'player' | 'enemy' | 'system', message: string) => {
  battleLogs.value.push({ type, message })
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const calculateDamage = (attacker: any, defender: any, isPlayer: boolean) => {
  const baseDamage = attacker.strength
  const weaponDamage = isPlayer && attacker.weapon ? attacker.weapon.damage : 0
  const randomFactor = Math.random() * 0.4 + 0.8 // 0.8 - 1.2
  const isCrit = Math.random() < 0.1
  
  let damage = Math.floor((baseDamage + weaponDamage) * randomFactor)
  if (isCrit) {
    damage = Math.floor(damage * 1.5)
  }
  
  // 闪避判定
  const dodgeChance = defender.agility * 0.02
  const isDodge = Math.random() < dodgeChance
  
  return { damage, isCrit, isDodge }
}

const startBattle = async () => {
  isBattleStarted.value = true
  addLog('system', '战斗开始！')
  
  while (currentHp.value > 0 && enemyHp.value > 0) {
    // 玩家回合
    await sleep(1000)
    const playerAttack = calculateDamage(player.value, enemy.value, true)
    
    if (playerAttack.isDodge) {
      addLog('enemy', `${enemy.value.name} 灵巧地躲过了你的攻击！`)
    } else {
      enemyHp.value = Math.max(0, enemyHp.value - playerAttack.damage)
      const critText = playerAttack.isCrit ? '【暴击】' : ''
      const weaponText = player.value.weapon ? `使用 ${player.value.weapon.name} ` : '赤手空拳'
      addLog('player', `你${weaponText}${critText}造成了 ${playerAttack.damage} 点伤害！`)
    }
    
    if (enemyHp.value <= 0) break
    
    // 敌人回合
    await sleep(1000)
    const enemyAttack = calculateDamage(enemy.value, player.value, false)
    
    if (enemyAttack.isDodge) {
      addLog('player', `你灵巧地躲过了 ${enemy.value.name} 的攻击！`)
    } else {
      currentHp.value = Math.max(0, currentHp.value - enemyAttack.damage)
      const critText = enemyAttack.isCrit ? '【暴击】' : ''
      addLog('enemy', `${enemy.value.name} ${critText}对你造成了 ${enemyAttack.damage} 点伤害！`)
    }
  }
  
  isBattleEnded.value = true
  if (currentHp.value > 0) {
    addLog('system', '战斗胜利！获得 50 点经验值！')
    gameStore.gainExp(50)
  } else {
    addLog('system', '战斗失败... 下次再来吧！')
    // 恢复一点血量以免卡死
    currentHp.value = 1
  }
}

// 初始化
onMounted(() => {
  // 根据玩家等级调整敌人属性
  enemy.value.level = player.value.level
  enemy.value.maxHp = 80 + player.value.level * 15
  enemyHp.value = enemy.value.maxHp
  enemy.value.strength = 5 + player.value.level * 1.5
  enemy.value.agility = 3 + player.value.level * 0.8
})
</script>
