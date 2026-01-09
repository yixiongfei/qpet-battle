import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection({
  host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('//')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[1]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/')[3] || 'qpet_battle',
});

// 定义4个技能
const skills = [
  {
    name: '烈火斩',
    description: '使用烈火攻击对手，造成大量伤害',
    damage: 35,
    mpCost: 20,
    cooldown: 1,
    mpRestore: 0,
    requiredLevel: 1,
    requiredEvolution: 0,
    icon: '🔥',
  },
  {
    name: '冰冻术',
    description: '冻结对手，造成中等伤害并降低其攻击',
    damage: 25,
    mpCost: 15,
    cooldown: 2,
    mpRestore: 0,
    requiredLevel: 5,
    requiredEvolution: 0,
    icon: '❄️',
  },
  {
    name: '防护盾',
    description: '释放防护盾，减少伤害并恢复蓝量',
    damage: 0,
    mpCost: 10,
    cooldown: 1,
    mpRestore: 20,
    requiredLevel: 1,
    requiredEvolution: 0,
    icon: '🛡️',
  },
  {
    name: '生命恢复',
    description: '恢复自身血量和蓝量',
    damage: 0,
    mpCost: 25,
    cooldown: 3,
    mpRestore: 30,
    requiredLevel: 10,
    requiredEvolution: 1,
    icon: '💚',
  },
];

try {
  console.log('开始初始化技能...');

  // 检查技能是否已存在
  const [existingSkills] = await connection.query('SELECT COUNT(*) as count FROM skills');
  
  if (existingSkills[0].count === 0) {
    // 插入技能
    for (const skill of skills) {
      await connection.query(
        'INSERT INTO skills (name, description, damage, mpCost, cooldown, mpRestore, requiredLevel, requiredEvolution, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          skill.name,
          skill.description,
          skill.damage,
          skill.mpCost,
          skill.cooldown,
          skill.mpRestore,
          skill.requiredLevel,
          skill.requiredEvolution,
          skill.icon,
        ]
      );
      console.log(`✓ 创建技能: ${skill.name}`);
    }

    // 获取所有宠物
    const [pets] = await connection.query('SELECT id FROM pets');
    const [skillIds] = await connection.query('SELECT id FROM skills');

    console.log(`\n为 ${pets.length} 只宠物添加技能...`);

    // 为每只宠物添加所有技能
    for (const pet of pets) {
      for (const skillId of skillIds) {
        await connection.query(
          'INSERT IGNORE INTO petSkills (petId, skillId) VALUES (?, ?)',
          [pet.id, skillId.id]
        );
      }
      console.log(`✓ 为宠物 ${pet.id} 添加了 ${skillIds.length} 个技能`);
    }

    console.log('\n✅ 技能初始化完成！');
  } else {
    console.log('技能已存在，跳过初始化');
  }

  await connection.end();
} catch (error) {
  console.error('❌ 初始化失败:', error);
  process.exit(1);
}
