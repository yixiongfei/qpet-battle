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

export interface Player {
  name: string
  level: number
  exp: number
  maxExp: number
  hp: number
  maxHp: number
  strength: number
  agility: number
  weapon: Weapon | null
  inventory: Weapon[]
  skills: Skill[]
}

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
    weapon: null,
    inventory: [
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
      }
    ],
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

  return {
    player,
    equipWeapon,
    gainExp
  }
})
