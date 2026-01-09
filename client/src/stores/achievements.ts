import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as storageService from '@/services/storage'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: string
  unlocked: boolean
  unlockedAt?: number
}

export interface PlayerStats {
  totalBattles: number
  totalWins: number
  currentWinStreak: number
  maxWinStreak: number
  totalGoldEarned: number
  totalExpEarned: number
  totalPotionsUsed: number
  weaponsCollected: number
}

export const useAchievementsStore = defineStore('achievements', () => {
  // 从 localStorage 加载已保存的数据
  const savedAchievementsData = storageService.loadAchievementsData()
  
  // 所有可能的成就定义
  const allAchievements = ref<Achievement[]>(savedAchievementsData?.allAchievements || [
    {
      id: 'first_victory',
      name: '初出茅庐',
      description: '赢得第一场战斗',
      icon: '🎖️',
      condition: 'totalWins >= 1',
      unlocked: false
    },
    {
      id: 'three_win_streak',
      name: '连胜小将',
      description: '获得3连胜',
      icon: '⭐',
      condition: 'maxWinStreak >= 3',
      unlocked: false
    },
    {
      id: 'five_win_streak',
      name: '连胜高手',
      description: '获得5连胜',
      icon: '✨',
      condition: 'maxWinStreak >= 5',
      unlocked: false
    },
    {
      id: 'ten_win_streak',
      name: '连胜大师',
      description: '获得10连胜',
      icon: '👑',
      condition: 'maxWinStreak >= 10',
      unlocked: false
    },
    {
      id: 'gold_collector',
      name: '金币收集家',
      description: '累计获得1000金币',
      icon: '💰',
      condition: 'totalGoldEarned >= 1000',
      unlocked: false
    },
    {
      id: 'gold_millionaire',
      name: '金币大富翁',
      description: '累计获得5000金币',
      icon: '💎',
      condition: 'totalGoldEarned >= 5000',
      unlocked: false
    },
    {
      id: 'weapon_collector',
      name: '武器收集家',
      description: '收集所有4种武器',
      icon: '⚔️',
      condition: 'weaponsCollected >= 4',
      unlocked: false
    },
    {
      id: 'potion_master',
      name: '药剂大师',
      description: '使用50瓶药水',
      icon: '🧪',
      condition: 'totalPotionsUsed >= 50',
      unlocked: false
    },
    {
      id: 'battle_veteran',
      name: '战斗老兵',
      description: '参加50场战斗',
      icon: '🏅',
      condition: 'totalBattles >= 50',
      unlocked: false
    },
    {
      id: 'exp_master',
      name: '经验大师',
      description: '累计获得5000经验值',
      icon: '📈',
      condition: 'totalExpEarned >= 5000',
      unlocked: false
    }
  ])

  const playerStats = ref<PlayerStats>(savedAchievementsData?.playerStats || {
    totalBattles: 0,
    totalWins: 0,
    currentWinStreak: 0,
    maxWinStreak: 0,
    totalGoldEarned: 0,
    totalExpEarned: 0,
    totalPotionsUsed: 0,
    weaponsCollected: 0
  })

  // 排行榜数据（模拟多个玩家）
  const leaderboard = ref(savedAchievementsData?.leaderboard || [
    { rank: 1, name: '乐斗之王', maxWinStreak: 15, totalGold: 8500 },
    { rank: 2, name: '连胜小王子', maxWinStreak: 12, totalGold: 6200 },
    { rank: 3, name: '金币猎人', maxWinStreak: 8, totalGold: 7800 },
    { rank: 4, name: '武器大师', maxWinStreak: 10, totalGold: 5600 },
    { rank: 5, name: '菜菜企鹅', maxWinStreak: 3, totalGold: 1200 }
  ])

  // 自动保存数据到 localStorage
  let saveTimer: NodeJS.Timeout | null = null
  const autoSave = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      storageService.saveAchievementsData({
        allAchievements: allAchievements.value,
        playerStats: playerStats.value,
        leaderboard: leaderboard.value
      })
    }, 1000)
  }

  // 检查并解锁成就
  const checkAchievements = () => {
    allAchievements.value.forEach(achievement => {
      if (!achievement.unlocked) {
        const conditionMet = evaluateCondition(achievement.condition)
        if (conditionMet) {
          achievement.unlocked = true
          achievement.unlockedAt = Date.now()
        }
      }
    })
  }

  // 评估成就条件
  const evaluateCondition = (condition: string): boolean => {
    // 简单的条件评估器
    const stats = playerStats.value
    
    // 替换条件字符串中的变量
    let evaluable = condition
      .replace(/totalWins/g, stats.totalWins.toString())
      .replace(/maxWinStreak/g, stats.maxWinStreak.toString())
      .replace(/totalGoldEarned/g, stats.totalGoldEarned.toString())
      .replace(/totalExpEarned/g, stats.totalExpEarned.toString())
      .replace(/totalPotionsUsed/g, stats.totalPotionsUsed.toString())
      .replace(/weaponsCollected/g, stats.weaponsCollected.toString())
      .replace(/totalBattles/g, stats.totalBattles.toString())

    try {
      return eval(evaluable)
    } catch {
      return false
    }
  }

  // 记录战斗胜利
  const recordVictory = (goldEarned: number, expEarned: number) => {
    playerStats.value.totalBattles++
    playerStats.value.totalWins++
    playerStats.value.currentWinStreak++
    playerStats.value.totalGoldEarned += goldEarned
    playerStats.value.totalExpEarned += expEarned

    if (playerStats.value.currentWinStreak > playerStats.value.maxWinStreak) {
      playerStats.value.maxWinStreak = playerStats.value.currentWinStreak
    }

    checkAchievements()
    autoSave()
  }

  // 记录战斗失败
  const recordDefeat = () => {
    playerStats.value.totalBattles++
    playerStats.value.currentWinStreak = 0
    autoSave()
  }

  // 记录药水使用
  const recordPotionUsed = () => {
    playerStats.value.totalPotionsUsed++
    checkAchievements()
    autoSave()
  }

  // 记录武器收集
  const recordWeaponCollected = (count: number) => {
    playerStats.value.weaponsCollected = count
    checkAchievements()
    autoSave()
  }

  // 获取已解锁的成就
  const unlockedAchievements = computed(() => {
    return allAchievements.value.filter(a => a.unlocked)
  })

  // 获取进度百分比
  const achievementProgress = computed(() => {
    const total = allAchievements.value.length
    const unlocked = unlockedAchievements.value.length
    return Math.round((unlocked / total) * 100)
  })

  // 更新排行榜（添加当前玩家）
  const updateLeaderboard = (playerName: string) => {
    const playerRank = {
      rank: 0,
      name: playerName,
      maxWinStreak: playerStats.value.maxWinStreak,
      totalGold: playerStats.value.totalGoldEarned
    }

    // 找到合适的排名位置
    let inserted = false
    for (let i = 0; i < leaderboard.value.length; i++) {
      if (playerRank.maxWinStreak > leaderboard.value[i].maxWinStreak ||
          (playerRank.maxWinStreak === leaderboard.value[i].maxWinStreak && 
           playerRank.totalGold > leaderboard.value[i].totalGold)) {
        leaderboard.value.splice(i, 0, playerRank)
        inserted = true
        break
      }
    }

    if (!inserted && leaderboard.value.length < 10) {
      leaderboard.value.push(playerRank)
    }

    // 重新排名
    leaderboard.value.forEach((entry: any, index: number) => {
      entry.rank = index + 1
    })

    // 只保留前10名
    if (leaderboard.value.length > 10) {
      leaderboard.value = leaderboard.value.slice(0, 10)
    }
    autoSave()
  }

  return {
    allAchievements,
    playerStats,
    leaderboard,
    unlockedAchievements,
    achievementProgress,
    recordVictory,
    recordDefeat,
    recordPotionUsed,
    recordWeaponCollected,
    updateLeaderboard,
    checkAchievements,
    autoSave
  }
})
