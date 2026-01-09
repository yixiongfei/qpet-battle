import { describe, it, expect } from 'vitest';
import { RACE_CONFIG, calculatePetStats, EVOLUTION_LEVELS, SKILLS_BY_RACE } from '../shared/raceSystem';

describe('Race System', () => {
  describe('RACE_CONFIG', () => {
    it('should have three races defined', () => {
      expect(Object.keys(RACE_CONFIG)).toHaveLength(3);
      expect(RACE_CONFIG).toHaveProperty('human');
      expect(RACE_CONFIG).toHaveProperty('beast');
      expect(RACE_CONFIG).toHaveProperty('hybrid');
    });

    it('should have correct HP/MP configuration for each race', () => {
      // Human: Low HP, High MP
      expect(RACE_CONFIG.human.hpBase).toBeLessThan(RACE_CONFIG.beast.hpBase);
      expect(RACE_CONFIG.human.mpBase).toBeGreaterThan(RACE_CONFIG.beast.mpBase);

      // Beast: High HP, Low MP
      expect(RACE_CONFIG.beast.hpBase).toBeGreaterThan(RACE_CONFIG.human.hpBase);
      expect(RACE_CONFIG.beast.mpBase).toBeLessThan(RACE_CONFIG.human.mpBase);

      // Hybrid: Balanced
      expect(RACE_CONFIG.hybrid.hpBase).toBeGreaterThan(RACE_CONFIG.human.hpBase);
      expect(RACE_CONFIG.hybrid.hpBase).toBeLessThan(RACE_CONFIG.beast.hpBase);
      expect(RACE_CONFIG.hybrid.mpBase).toBeGreaterThan(RACE_CONFIG.beast.mpBase);
      expect(RACE_CONFIG.hybrid.mpBase).toBeLessThan(RACE_CONFIG.human.mpBase);
    });

    it('should have unique names for each race', () => {
      const names = [
        RACE_CONFIG.human.name,
        RACE_CONFIG.beast.name,
        RACE_CONFIG.hybrid.name,
      ];
      expect(new Set(names).size).toBe(3);
    });
  });

  describe('calculatePetStats', () => {
    it('should calculate correct HP for level 1', () => {
      const humanStats = calculatePetStats('human', 1);
      expect(humanStats.hp).toBe(RACE_CONFIG.human.hpBase);
      expect(humanStats.maxHp).toBe(RACE_CONFIG.human.hpBase);

      const beastStats = calculatePetStats('beast', 1);
      expect(beastStats.hp).toBe(RACE_CONFIG.beast.hpBase);
      expect(beastStats.maxHp).toBe(RACE_CONFIG.beast.hpBase);
    });

    it('should calculate correct MP for level 1', () => {
      const humanStats = calculatePetStats('human', 1);
      expect(humanStats.mp).toBe(RACE_CONFIG.human.mpBase);
      expect(humanStats.maxMp).toBe(RACE_CONFIG.human.mpBase);

      const beastStats = calculatePetStats('beast', 1);
      expect(beastStats.mp).toBe(RACE_CONFIG.beast.mpBase);
      expect(beastStats.maxMp).toBe(RACE_CONFIG.beast.mpBase);
    });

    it('should increase stats with level', () => {
      const level1Stats = calculatePetStats('human', 1);
      const level10Stats = calculatePetStats('human', 10);
      const level50Stats = calculatePetStats('human', 50);

      expect(level10Stats.maxHp).toBeGreaterThan(level1Stats.maxHp);
      expect(level50Stats.maxHp).toBeGreaterThan(level10Stats.maxHp);
      expect(level10Stats.maxMp).toBeGreaterThan(level1Stats.maxMp);
      expect(level50Stats.maxMp).toBeGreaterThan(level10Stats.maxMp);
    });

    it('should calculate stats correctly for each race at level 50', () => {
      const humanStats = calculatePetStats('human', 50);
      const beastStats = calculatePetStats('beast', 50);
      const hybridStats = calculatePetStats('hybrid', 50);

      // Human: High MP
      expect(humanStats.maxMp).toBeGreaterThan(beastStats.maxMp);
      expect(humanStats.maxMp).toBeGreaterThan(hybridStats.maxMp);

      // Beast: High HP
      expect(beastStats.maxHp).toBeGreaterThan(humanStats.maxHp);
      expect(beastStats.maxHp).toBeGreaterThan(hybridStats.maxHp);

      // Hybrid: Balanced
      expect(hybridStats.maxHp).toBeGreaterThan(humanStats.maxHp);
      expect(hybridStats.maxHp).toBeLessThan(beastStats.maxHp);
      expect(hybridStats.maxMp).toBeGreaterThan(beastStats.maxMp);
      expect(hybridStats.maxMp).toBeLessThan(humanStats.maxMp);
    });

    it('should return current HP equal to max HP for new pets', () => {
      const stats = calculatePetStats('hybrid', 1);
      expect(stats.hp).toBe(stats.maxHp);
      expect(stats.mp).toBe(stats.maxMp);
    });
  });

  describe('Evolution System', () => {
    it('should have evolution levels defined', () => {
      expect(EVOLUTION_LEVELS).toContain(10);
      expect(EVOLUTION_LEVELS).toContain(30);
      expect(EVOLUTION_LEVELS).toContain(50);
      expect(EVOLUTION_LEVELS.length).toBe(3);
    });

    it('should determine correct evolution stage for each level', () => {
      const getEvolutionStage = (level: number): number => {
        return EVOLUTION_LEVELS.filter((evoLevel) => level >= evoLevel).length;
      };

      expect(getEvolutionStage(1)).toBe(0);
      expect(getEvolutionStage(9)).toBe(0);
      expect(getEvolutionStage(10)).toBe(1);
      expect(getEvolutionStage(29)).toBe(1);
      expect(getEvolutionStage(30)).toBe(2);
      expect(getEvolutionStage(49)).toBe(2);
      expect(getEvolutionStage(50)).toBe(3);
      expect(getEvolutionStage(100)).toBe(3);
    });
  });

  describe('Skills by Race', () => {
    it('should have 4 skills for each race', () => {
      expect(SKILLS_BY_RACE.human).toHaveLength(4);
      expect(SKILLS_BY_RACE.beast).toHaveLength(4);
      expect(SKILLS_BY_RACE.hybrid).toHaveLength(4);
    });

    it('should have unique skill IDs across all races', () => {
      const allSkillIds = [
        ...SKILLS_BY_RACE.human.map((s) => s.id),
        ...SKILLS_BY_RACE.beast.map((s) => s.id),
        ...SKILLS_BY_RACE.hybrid.map((s) => s.id),
      ];
      expect(new Set(allSkillIds).size).toBe(12);
    });

    it('should have skills with valid evolution requirements', () => {
      const allSkills = [
        ...SKILLS_BY_RACE.human,
        ...SKILLS_BY_RACE.beast,
        ...SKILLS_BY_RACE.hybrid,
      ];

      allSkills.forEach((skill) => {
        if (skill.requiredEvolution !== undefined) {
          expect(skill.requiredEvolution).toBeGreaterThanOrEqual(0);
          expect(skill.requiredEvolution).toBeLessThanOrEqual(3);
        }
      });
    });

    it('should have skills with reasonable MP costs', () => {
      const allSkills = [
        ...SKILLS_BY_RACE.human,
        ...SKILLS_BY_RACE.beast,
        ...SKILLS_BY_RACE.hybrid,
      ];

      allSkills.forEach((skill) => {
        expect(skill.mpCost).toBeGreaterThan(0);
        expect(skill.mpCost).toBeLessThanOrEqual(100);
      });
    });

    it('should have skills with reasonable damage values', () => {
      const allSkills = [
        ...SKILLS_BY_RACE.human,
        ...SKILLS_BY_RACE.beast,
        ...SKILLS_BY_RACE.hybrid,
      ];

      allSkills.forEach((skill) => {
        expect(skill.damage).toBeGreaterThanOrEqual(0);
        expect(skill.damage).toBeLessThanOrEqual(200);
      });
    });
  });

  describe('Race-specific characteristics', () => {
    it('human race should have high MP skills', () => {
      const humanSkills = SKILLS_BY_RACE.human;
      const avgMpCost =
        humanSkills.reduce((sum, s) => sum + s.mpCost, 0) / humanSkills.length;
      expect(avgMpCost).toBeGreaterThan(10);
    });

    it('beast race should have high damage skills', () => {
      const beastSkills = SKILLS_BY_RACE.beast;
      const avgDamage =
        beastSkills.reduce((sum, s) => sum + s.damage, 0) / beastSkills.length;
      expect(avgDamage).toBeGreaterThan(20);
    });

    it('hybrid race should have balanced skills', () => {
      const hybridSkills = SKILLS_BY_RACE.hybrid;
      const avgMpCost =
        hybridSkills.reduce((sum, s) => sum + s.mpCost, 0) / hybridSkills.length;
      const avgDamage =
        hybridSkills.reduce((sum, s) => sum + s.damage, 0) / hybridSkills.length;

      expect(avgMpCost).toBeGreaterThan(5);
      expect(avgDamage).toBeGreaterThan(10);
    });
  });
});
