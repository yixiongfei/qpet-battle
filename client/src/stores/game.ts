import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Weapon {
  id: string
  name: string
  icon: string
  damage: number
  description: string
  type: 'melee' | 'ranged'
}

export interface Skill {
  id: string
  name: string
  description: string
  damageMultiplier: number
  cooldown: number
}

export interface Potion {
  id: string
  name: string
  icon: string
  healAmount: number
  description: string
  price: number
}

export interface Player {
  name: string
  level: number
  exp: number
  maxExp: number
  hp: number
  maxHp: number
  strength: number
  agility: number
  gold: number
  weapon: Weapon | null
  inventory: Weapon[]
  potions: { [key: string]: number } // 药水ID -> 数量
  skills: Skill[]
}

// 商店中可购买的武器
const shopWeapons: Weapon[] = [
  {
    id: 'w1',
    name: '木剑',
    icon: '/images/weapon_sword.png',
    damage: 5,
    description: '一把普通的木剑，适合新手练习。',
    type: 'melee'
  },
  {
    id: 'w2',
    name: '板砖',
    icon: '/images/weapon_brick.png',
    damage: 8,
    description: '随处可见的板砖，威力惊人。',
    type: 'melee'
  },
  {
    id: 'w3',
    name: '铁棍',
    icon: '/images/weapon_sword.png',
    damage: 12,
    description: '坚硬的铁棍，需要一定的力量才能挥舞。',
    type: 'melee'
  },
  {
    id: 'w4',
    name: '金刚棒',
    icon: '/images/weapon_sword.png',
    damage: 18,
    description: '传说中的武器，拥有强大的破坏力。',
    type: 'melee'
  }
]

// 商店中可购买的药水
const shopPotions: Potion[] = [
  {
    id: 'p1',
    name: '小红瓶',
    icon: '🧪',
    healAmount: 30,
    description: '恢复30点生命值',
    price: 50
  },
  {
    id: 'p2',
    name: '中红瓶',
    icon: '🧪',
    healAmount: 60,
    description: '恢复60点生命值',
    price: 100
  },
  {
    id: 'p3',
    name: '大红瓶',
    icon: '🧪',
    healAmount: 100,
    description: '恢复100点生命值',
    price: 150
  }
]

export const useGameStore = defineStore('game', () => {
  const player = ref<Player>({
    name: 'Q宠大侠',
    level: 1,
    exp: 0,
    maxExp: 100,
    hp: 100,
    maxHp: 100,
    strength: 10,
    agility: 5,
    gold: 500,
    weapon: null,
    inventory: [
      shopWeapons[0],
      shopWeapons[1]
    ],
    potions: {
      'p1': 2
    },
    skills: []
  })

  const equipWeapon = (weaponId: string) => {
    const weapon = player.value.inventory.find(w => w.id === weaponId)
    if (weapon) {
      player.value.weapon = weapon
    }
  }

  const gainExp = (amount: number) => {
    player.value.exp += amount
    if (player.value.exp >= player.value.maxExp) {
      levelUp()
    }
  }

  const levelUp = () => {
    player.value.level++
    player.value.exp -= player.value.maxExp
    player.value.maxExp = Math.floor(player.value.maxExp * 1.2)
    player.value.maxHp += 20
    player.value.hp = player.value.maxHp
    player.value.strength += 2
    player.value.agility += 1
  }

  const gainGold = (amount: number) => {
    player.value.gold += amount
  }

  const buyWeapon = (weaponId: string, price: number): boolean => {
    if (player.value.gold < price) {
      return false
    }
    const weapon = shopWeapons.find(w => w.id === weaponId)
    if (!weapon) return false
    
    // 检查是否已拥有
    if (player.value.inventory.some(w => w.id === weaponId)) {
      return false
    }
    
    player.value.gold -= price
    player.value.inventory.push(weapon)
    return true
  }

  const buyPotion = (potionId: string, price: number): boolean => {
    if (player.value.gold < price) {
      return false
    }
    
    player.value.gold -= price
    player.value.potions[potionId] = (player.value.potions[potionId] || 0) + 1
    return true
  }

  const usePotion = (potionId: string): boolean => {
    if (!player.value.potions[potionId] || player.value.potions[potionId] <= 0) {
      return false
    }
    
    const potion = shopPotions.find(p => p.id === potionId)
    if (!potion) return false
    
    const healAmount = Math.min(potion.healAmount, player.value.maxHp - player.value.hp)
    player.value.hp += healAmount
    player.value.potions[potionId]--
    return true
  }

  const getShopWeapons = () => shopWeapons
  const getShopPotions = () => shopPotions
  const getOwnedWeaponIds = () => player.value.inventory.map(w => w.id)

  return {
    player,
    equipWeapon,
    gainExp,
    gainGold,
    buyWeapon,
    buyPotion,
    usePotion,
    getShopWeapons,
    getShopPotions,
    getOwnedWeaponIds
  }
})
