<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 顶部导航 -->
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold text-primary">武器铺</h1>
      <div class="flex items-center gap-4">
        <div class="pop-card px-6 py-3 flex items-center gap-2 bg-yellow-100 border-2 border-yellow-600">
          <span class="text-2xl">💰</span>
          <span class="font-bold text-lg">{{ player.gold }}</span>
        </div>
        <button @click="router.push('/')" class="pop-button px-4 py-2 bg-muted text-muted-foreground hover:bg-muted/80">
          返回大厅
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 武器商店 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="pop-card p-6">
          <h2 class="text-2xl font-bold mb-6 flex items-center">
            <span class="w-2 h-6 bg-primary mr-3 rounded-full"></span>
            武器商城
          </h2>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div v-for="weapon in gameStore.getShopWeapons()" :key="weapon.id"
              class="pop-card p-4 bg-gradient-to-br from-card to-accent/10 hover:shadow-lg transition-all"
            >
              <div class="flex items-center gap-4 mb-4">
                <img :src="weapon.icon" class="w-20 h-20 object-contain bg-white rounded-lg border-2 border-foreground p-1" />
                <div class="flex-1">
                  <h3 class="text-lg font-bold">{{ weapon.name }}</h3>
                  <div class="text-sm text-muted-foreground">攻击力 +{{ weapon.damage }}</div>
                </div>
              </div>
              
              <p class="text-sm text-muted-foreground mb-4">{{ weapon.description }}</p>
              
              <div class="flex justify-between items-center">
                <div class="text-2xl font-bold text-primary">
                  {{ getWeaponPrice(weapon.id) }}
                  <span class="text-sm">💰</span>
                </div>
                <button 
                  @click="handleBuyWeapon(weapon.id)"
                  :disabled="isWeaponOwned(weapon.id) || player.gold < getWeaponPrice(weapon.id)"
                  class="pop-button px-4 py-2 text-sm"
                  :class="{
                    'bg-primary text-primary-foreground hover:bg-primary/90': !isWeaponOwned(weapon.id) && player.gold >= getWeaponPrice(weapon.id),
                    'bg-muted text-muted-foreground cursor-not-allowed': isWeaponOwned(weapon.id) || player.gold < getWeaponPrice(weapon.id)
                  }"
                >
                  {{ isWeaponOwned(weapon.id) ? '已拥有' : player.gold < getWeaponPrice(weapon.id) ? '金币不足' : '购买' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 药水商店和背包 -->
      <div class="space-y-6">
        <!-- 药水商店 -->
        <div class="pop-card p-6">
          <h2 class="text-2xl font-bold mb-6 flex items-center">
            <span class="w-2 h-6 bg-secondary mr-3 rounded-full"></span>
            药水店
          </h2>
          
          <div class="space-y-4">
            <div v-for="potion in gameStore.getShopPotions()" :key="potion.id"
              class="pop-card p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-3xl">{{ potion.icon }}</span>
                  <div>
                    <h3 class="font-bold">{{ potion.name }}</h3>
                    <div class="text-xs text-muted-foreground">{{ potion.description }}</div>
                  </div>
                </div>
              </div>
              
              <div class="flex justify-between items-center mt-3">
                <div class="text-lg font-bold text-red-600">{{ potion.price }}💰</div>
                <button 
                  @click="handleBuyPotion(potion.id)"
                  :disabled="player.gold < potion.price"
                  class="pop-button px-3 py-1 text-sm"
                  :class="{
                    'bg-red-500 text-white hover:bg-red-600': player.gold >= potion.price,
                    'bg-muted text-muted-foreground cursor-not-allowed': player.gold < potion.price
                  }"
                >
                  {{ player.gold < potion.price ? '金币不足' : '购买' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 背包药水 -->
        <div class="pop-card p-6">
          <h2 class="text-2xl font-bold mb-4 flex items-center">
            <span class="w-2 h-6 bg-accent mr-3 rounded-full"></span>
            背包药水
          </h2>
          
          <div class="space-y-2">
            <div v-if="Object.keys(player.potions).length === 0" class="text-center py-6 text-muted-foreground">
              暂无药水
            </div>
            <div v-for="(count, potionId) in player.potions" v-show="count > 0" :key="potionId"
              class="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
            >
              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ getPotionIcon(potionId) }}</span>
                <div>
                  <div class="font-bold text-sm">{{ getPotionName(potionId) }}</div>
                  <div class="text-xs text-muted-foreground">x{{ count }}</div>
                </div>
              </div>
              <button 
                @click="handleUsePotion(potionId)"
                class="pop-button px-3 py-1 text-sm bg-green-500 text-white hover:bg-green-600"
              >
                使用
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

const router = useRouter()
const gameStore = useGameStore()
const { player } = storeToRefs(gameStore)

// 武器价格表
const weaponPrices: { [key: string]: number } = {
  'w1': 0,
  'w2': 100,
  'w3': 250,
  'w4': 500
}

const getWeaponPrice = (weaponId: string) => weaponPrices[weaponId] || 0

const isWeaponOwned = (weaponId: string) => {
  return gameStore.getOwnedWeaponIds().includes(weaponId)
}

const handleBuyWeapon = (weaponId: string) => {
  const price = getWeaponPrice(weaponId)
  if (gameStore.buyWeapon(weaponId, price)) {
    // 购买成功，显示提示
    showNotification(`成功购买武器！`)
  } else {
    showNotification(`购买失败！金币不足或已拥有此武器。`)
  }
}

const handleBuyPotion = (potionId: string) => {
  const potion = gameStore.getShopPotions().find(p => p.id === potionId)
  if (potion && gameStore.buyPotion(potionId, potion.price)) {
    showNotification(`成功购买 ${potion.name}！`)
  } else {
    showNotification(`购买失败！`)
  }
}

const handleUsePotion = (potionId: string) => {
  if (gameStore.usePotion(potionId)) {
    const potion = gameStore.getShopPotions().find(p => p.id === potionId)
    showNotification(`使用了 ${potion?.name}，恢复了生命值！`)
  }
}

const getPotionName = (potionId: string) => {
  return gameStore.getShopPotions().find(p => p.id === potionId)?.name || ''
}

const getPotionIcon = (potionId: string) => {
  return gameStore.getShopPotions().find(p => p.id === potionId)?.icon || ''
}

const notification = ref('')
const showNotification = (message: string) => {
  notification.value = message
  setTimeout(() => {
    notification.value = ''
  }, 2000)
}
</script>
