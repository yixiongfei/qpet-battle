<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 顶部导航 -->
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold text-primary">游戏设置</h1>
      <button @click="router.push('/')" class="pop-button px-4 py-2 bg-muted text-muted-foreground hover:bg-muted/80">
        返回大厅
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- 数据管理 -->
      <div class="pop-card p-6">
        <h2 class="text-2xl font-bold mb-6 flex items-center">
          <span class="text-3xl mr-3">💾</span>
          数据管理
        </h2>

        <div class="space-y-4">
          <!-- 保存状态 -->
          <div class="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-bold text-green-700">✓ 数据已保存</div>
                <div class="text-sm text-green-600">
                  最后保存时间: {{ lastSaveTime }}
                </div>
              </div>
              <span class="text-3xl">✅</span>
            </div>
          </div>

          <!-- 导出数据 -->
          <div class="border-2 border-border rounded-lg p-4">
            <h3 class="font-bold mb-3 flex items-center">
              <span class="text-2xl mr-2">📥</span>
              导出游戏数据
            </h3>
            <p class="text-sm text-muted-foreground mb-4">
              将您的游戏数据导出为 JSON 文件，以便备份或转移到其他设备。
            </p>
            <button 
              @click="exportData"
              class="pop-button w-full px-4 py-3 bg-blue-500 text-white hover:bg-blue-600 font-bold"
            >
              📥 导出数据
            </button>
          </div>

          <!-- 导入数据 -->
          <div class="border-2 border-border rounded-lg p-4">
            <h3 class="font-bold mb-3 flex items-center">
              <span class="text-2xl mr-2">📤</span>
              导入游戏数据
            </h3>
            <p class="text-sm text-muted-foreground mb-4">
              从之前导出的 JSON 文件恢复您的游戏数据。
            </p>
            <input 
              ref="fileInput"
              type="file"
              accept=".json"
              @change="handleFileSelect"
              class="hidden"
            />
            <button 
              @click="$refs.fileInput?.click()"
              class="pop-button w-full px-4 py-3 bg-purple-500 text-white hover:bg-purple-600 font-bold"
            >
              📤 导入数据
            </button>
          </div>
        </div>
      </div>

      <!-- 游戏统计 -->
      <div class="pop-card p-6">
        <h2 class="text-2xl font-bold mb-6 flex items-center">
          <span class="text-3xl mr-3">📊</span>
          游戏统计
        </h2>

        <div class="space-y-3">
          <div class="flex justify-between p-3 bg-muted/50 rounded-lg">
            <span class="font-bold">玩家名称</span>
            <span class="text-primary font-bold">{{ gameStore.player.name }}</span>
          </div>
          <div class="flex justify-between p-3 bg-muted/50 rounded-lg">
            <span class="font-bold">当前等级</span>
            <span class="text-primary font-bold">{{ gameStore.player.level }}</span>
          </div>
          <div class="flex justify-between p-3 bg-muted/50 rounded-lg">
            <span class="font-bold">当前金币</span>
            <span class="text-yellow-600 font-bold">{{ gameStore.player.gold }}</span>
          </div>
          <div class="flex justify-between p-3 bg-muted/50 rounded-lg">
            <span class="font-bold">当前经验</span>
            <span class="text-blue-600 font-bold">{{ gameStore.player.exp }}/{{ gameStore.player.maxExp }}</span>
          </div>
          <div class="flex justify-between p-3 bg-muted/50 rounded-lg">
            <span class="font-bold">生命值</span>
            <span class="text-red-600 font-bold">{{ gameStore.player.hp }}/{{ gameStore.player.maxHp }}</span>
          </div>
          <div class="flex justify-between p-3 bg-muted/50 rounded-lg">
            <span class="font-bold">力量</span>
            <span class="text-orange-600 font-bold">{{ gameStore.player.strength }}</span>
          </div>
          <div class="flex justify-between p-3 bg-muted/50 rounded-lg">
            <span class="font-bold">敏捷</span>
            <span class="text-green-600 font-bold">{{ gameStore.player.agility }}</span>
          </div>
          <div class="flex justify-between p-3 bg-muted/50 rounded-lg">
            <span class="font-bold">武器数量</span>
            <span class="text-purple-600 font-bold">{{ gameStore.player.inventory.length }}</span>
          </div>
          <div class="flex justify-between p-3 bg-muted/50 rounded-lg">
            <span class="font-bold">药水数量</span>
            <span class="text-pink-600 font-bold">{{ totalPotions }}</span>
          </div>
        </div>
      </div>

      <!-- 危险操作 -->
      <div class="pop-card p-6 border-2 border-red-300 lg:col-span-2">
        <h2 class="text-2xl font-bold mb-6 flex items-center text-red-600">
          <span class="text-3xl mr-3">⚠️</span>
          危险操作
        </h2>

        <div class="space-y-4">
          <div class="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <h3 class="font-bold text-red-700 mb-2">清除所有数据</h3>
            <p class="text-sm text-red-600 mb-4">
              此操作将永久删除您的所有游戏数据，包括角色信息、成就、排行榜等。此操作无法撤销！
            </p>
            <button 
              @click="clearAllData"
              class="pop-button w-full px-4 py-3 bg-red-600 text-white hover:bg-red-700 font-bold"
            >
              🗑️ 清除所有数据
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 提示信息 -->
    <div v-if="notification" class="fixed bottom-4 right-4 pop-card p-4 bg-blue-50 border-2 border-blue-300 max-w-sm">
      {{ notification }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { storeToRefs } from 'pinia'
import * as storageService from '@/services/storage'

const router = useRouter()
const gameStore = useGameStore()
const { player } = storeToRefs(gameStore)

const fileInput = ref<HTMLInputElement | null>(null)
const notification = ref('')

const lastSaveTime = computed(() => {
  const time = storageService.getLastSaveTime()
  if (!time) return '未保存'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
})

const totalPotions = computed(() => {
  return Object.values(player.value.potions).reduce((sum, count) => sum + count, 0)
})

const exportData = () => {
  try {
    const jsonData = storageService.exportGameData()
    if (!jsonData) {
      notification.value = '导出失败，没有可导出的数据'
      return
    }

    // 创建 Blob 对象
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    // 创建下载链接
    const link = document.createElement('a')
    link.href = url
    link.download = `qpet-battle-save-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    notification.value = '✓ 数据导出成功！'
    setTimeout(() => {
      notification.value = ''
    }, 3000)
  } catch (error) {
    notification.value = '导出失败，请重试'
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      if (storageService.importGameData(content)) {
        notification.value = '✓ 数据导入成功！页面将在2秒后刷新'
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        notification.value = '导入失败，文件格式不正确'
      }
    } catch (error) {
      notification.value = '导入失败，请检查文件'
    }
  }
  reader.readAsText(file)

  // 重置文件输入
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const clearAllData = () => {
  if (confirm('确定要清除所有游戏数据吗？此操作无法撤销！')) {
    if (confirm('再次确认：您确定要清除所有数据吗？')) {
      storageService.clearAllData()
      notification.value = '✓ 所有数据已清除，页面将在2秒后刷新'
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
  }
}
</script>
