/**
 * 本地存储服务
 * 负责管理所有游戏数据的持久化
 */

const STORAGE_KEYS = {
  PLAYER_DATA: 'qpet_player_data',
  ACHIEVEMENTS_DATA: 'qpet_achievements_data',
  GAME_STATS: 'qpet_game_stats',
  LEADERBOARD: 'qpet_leaderboard',
  LAST_SAVE_TIME: 'qpet_last_save_time'
}

export interface StorageData {
  playerData: any
  achievementsData: any
  gameStats: any
  leaderboard: any
  lastSaveTime: number
}

/**
 * 保存玩家数据
 */
export const savePlayerData = (data: any): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_DATA, JSON.stringify(data))
    updateLastSaveTime()
  } catch (error) {
    console.error('Failed to save player data:', error)
  }
}

/**
 * 加载玩家数据
 */
export const loadPlayerData = (): any => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PLAYER_DATA)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to load player data:', error)
    return null
  }
}

/**
 * 保存成就数据
 */
export const saveAchievementsData = (data: any): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS_DATA, JSON.stringify(data))
    updateLastSaveTime()
  } catch (error) {
    console.error('Failed to save achievements data:', error)
  }
}

/**
 * 加载成就数据
 */
export const loadAchievementsData = (): any => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS_DATA)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to load achievements data:', error)
    return null
  }
}

/**
 * 保存游戏统计数据
 */
export const saveGameStats = (data: any): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.GAME_STATS, JSON.stringify(data))
    updateLastSaveTime()
  } catch (error) {
    console.error('Failed to save game stats:', error)
  }
}

/**
 * 加载游戏统计数据
 */
export const loadGameStats = (): any => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GAME_STATS)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to load game stats:', error)
    return null
  }
}

/**
 * 保存排行榜数据
 */
export const saveLeaderboard = (data: any): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(data))
    updateLastSaveTime()
  } catch (error) {
    console.error('Failed to save leaderboard:', error)
  }
}

/**
 * 加载排行榜数据
 */
export const loadLeaderboard = (): any => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LEADERBOARD)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to load leaderboard:', error)
    return null
  }
}

/**
 * 更新最后保存时间
 */
export const updateLastSaveTime = (): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SAVE_TIME, Date.now().toString())
  } catch (error) {
    console.error('Failed to update save time:', error)
  }
}

/**
 * 获取最后保存时间
 */
export const getLastSaveTime = (): number => {
  try {
    const time = localStorage.getItem(STORAGE_KEYS.LAST_SAVE_TIME)
    return time ? parseInt(time) : 0
  } catch (error) {
    console.error('Failed to get save time:', error)
    return 0
  }
}

/**
 * 保存所有游戏数据
 */
export const saveAllData = (storageData: StorageData): void => {
  try {
    savePlayerData(storageData.playerData)
    saveAchievementsData(storageData.achievementsData)
    saveGameStats(storageData.gameStats)
    saveLeaderboard(storageData.leaderboard)
    updateLastSaveTime()
  } catch (error) {
    console.error('Failed to save all data:', error)
  }
}

/**
 * 加载所有游戏数据
 */
export const loadAllData = (): StorageData | null => {
  try {
    const playerData = loadPlayerData()
    const achievementsData = loadAchievementsData()
    const gameStats = loadGameStats()
    const leaderboard = loadLeaderboard()
    const lastSaveTime = getLastSaveTime()

    if (playerData || achievementsData || gameStats || leaderboard) {
      return {
        playerData,
        achievementsData,
        gameStats,
        leaderboard,
        lastSaveTime
      }
    }
    return null
  } catch (error) {
    console.error('Failed to load all data:', error)
    return null
  }
}

/**
 * 清除所有游戏数据
 */
export const clearAllData = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.error('Failed to clear all data:', error)
  }
}

/**
 * 导出游戏数据为 JSON
 */
export const exportGameData = (): string => {
  try {
    const data = loadAllData()
    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('Failed to export game data:', error)
    return ''
  }
}

/**
 * 导入游戏数据
 */
export const importGameData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString) as StorageData
    saveAllData(data)
    return true
  } catch (error) {
    console.error('Failed to import game data:', error)
    return false
  }
}

/**
 * 检查是否有保存的数据
 */
export const hasSavedData = (): boolean => {
  try {
    return (
      !!localStorage.getItem(STORAGE_KEYS.PLAYER_DATA) ||
      !!localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS_DATA) ||
      !!localStorage.getItem(STORAGE_KEYS.GAME_STATS) ||
      !!localStorage.getItem(STORAGE_KEYS.LEADERBOARD)
    )
  } catch (error) {
    console.error('Failed to check saved data:', error)
    return false
  }
}
