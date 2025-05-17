/**
 * DPS Calculator Utilities
 * Provides utility functions for DPS calculations
 */

/**
 * DPS Utilities for calculating player damage output
 */
export const dpsUtils = {
  /**
   * Calculate effective level based on base level, prayer bonus, and potion boost
   * @param {number} baseLevel - Base skill level
   * @param {number} prayerBonus - Prayer bonus as a decimal (e.g., 0.15)
   * @param {number} potionBoost - Potion boost (flat)
   * @returns {number} - Effective level
   */
  calculateEffectiveLevel(baseLevel, prayerBonus = 0, potionBoost = 0) {
    // Apply potion boost first, then prayer percentage
    const potionBoostedLevel = Math.floor(baseLevel + potionBoost);
    return Math.floor(potionBoostedLevel * (1 + prayerBonus));
  },

  /**
   * Calculate maximum hit based on effective strength and equipment
   * @param {number} effectiveStrength - Effective strength level
   * @param {number} strengthBonus - Equipment strength bonus
   * @param {number} styleBonus - Style bonus (aggressive=3, controlled=1, etc.)
   * @param {boolean} isOnSlayerTask - Whether player is on slayer task
   * @param {boolean} hasSlayerHelm - Whether player has slayer helm/black mask
   * @returns {number} - Maximum hit
   */
  calculateMaxHit(effectiveStrength, strengthBonus, styleBonus = 0, isOnSlayerTask = false, hasSlayerHelm = false) {
    // Base formula: MaxHit = 0.5 + EffectiveLevel * (StrengthBonus + 64) / 640
    let maxHit = Math.floor(0.5 + (effectiveStrength * (strengthBonus + 64)) / 640);
    
    // Apply style bonus
    maxHit += styleBonus;
    
    // Apply slayer helm/black mask bonus
    if (isOnSlayerTask && hasSlayerHelm) {
      maxHit = Math.floor(maxHit * 1.1667);
    }
    
    return maxHit;
  },

  /**
   * Calculate maximum ranged hit based on effective ranged and equipment
   * @param {number} effectiveRanged - Effective ranged level
   * @param {number} rangedStrength - Equipment ranged strength
   * @param {number} styleBonus - Style bonus
   * @param {boolean} isOnSlayerTask - Whether player is on slayer task
   * @param {boolean} hasSlayerHelm - Whether player has slayer helm
   * @returns {number} - Maximum ranged hit
   */
  calculateMaxRangedHit(effectiveRanged, rangedStrength, styleBonus = 0, isOnSlayerTask = false, hasSlayerHelm = false) {
    // Base formula for ranged
    let maxHit = Math.floor(0.5 + (effectiveRanged * (rangedStrength + 64)) / 640);
    
    // Apply style bonus
    maxHit += styleBonus;
    
    // Apply slayer helm bonus
    if (isOnSlayerTask && hasSlayerHelm) {
      maxHit = Math.floor(maxHit * 1.1667);
    }
    
    return maxHit;
  },

  /**
   * Calculate accuracy based on attack roll and defense roll
   * @param {number} attackRoll - Player's attack roll
   * @param {number} defenseRoll - Monster's defense roll
   * @returns {number} - Accuracy as a decimal
   */
  calculateAccuracy(attackRoll, defenseRoll) {
    if (attackRoll > defenseRoll) {
      return 1 - (defenseRoll + 2) / (2 * (attackRoll + 1));
    } else {
      return attackRoll / (2 * (defenseRoll + 1));
    }
  },

  /**
   * Calculate player's attack roll
   * @param {number} effectiveLevel - Effective attack/ranged/magic level
   * @param {number} equipmentBonus - Equipment attack bonus for the style
   * @param {number} styleBonus - Style bonus
   * @returns {number} - Attack roll
   */
  calculateAttackRoll(effectiveLevel, equipmentBonus, styleBonus = 0) {
    return (effectiveLevel + styleBonus) * (equipmentBonus + 64);
  },

  /**
   * Calculate monster's defense roll
   * @param {number} defenseLevel - Monster's defense level
   * @param {number} defenseBonus - Monster's defense bonus against attack style
   * @returns {number} - Defense roll
   */
  calculateDefenseRoll(defenseLevel, defenseBonus) {
    return (defenseLevel + 9) * (defenseBonus + 64);
  },

  /**
   * Calculate DPS based on max hit, accuracy, and attack speed
   * @param {number} maxHit - Maximum hit
   * @param {number} accuracy - Accuracy as a decimal
   * @param {number} attackSpeed - Attack speed in ticks
   * @returns {number} - Damage per second
   */
  calculateDPS(maxHit, accuracy, attackSpeed) {
    // Average damage per hit = maxHit / 2
    // Hits per second = 1 / (attackSpeed * 0.6)  [0.6 seconds per tick]
    const averageDamage = (maxHit * accuracy) / 2;
    const hitsPerSecond = 1 / (attackSpeed * 0.6);
    return (averageDamage * hitsPerSecond).toFixed(2);
  },

  /**
   * Get prayer bonuses based on selected prayers
   * @param {Object} prayers - Object with prayer selections
   * @returns {Object} - Prayer bonuses for attack, strength, defense, ranged, magic
   */
  getPrayerBonuses(prayers) {
    const bonuses = {
      attack: 0,
      strength: 0,
      defense: 0,
      ranged: 0,
      magic: 0
    };

    // Melee prayers
    if (prayers.piety) {
      bonuses.attack = 0.20;
      bonuses.strength = 0.23;
      bonuses.defense = 0.25;
    } else if (prayers.chivalry) {
      bonuses.attack = 0.15;
      bonuses.strength = 0.18;
      bonuses.defense = 0.20;
    } else if (prayers.ultimateStrength) {
      bonuses.strength = 0.15;
    }

    // Ranged prayers
    if (prayers.rigour) {
      bonuses.ranged = 0.20;
      bonuses.rangedStrength = 0.23;
      bonuses.defense = 0.25;
    } else if (prayers.eagleEye) {
      bonuses.ranged = 0.15;
      bonuses.rangedStrength = 0.15;
    } else if (prayers.hawkEye) {
      bonuses.ranged = 0.10;
      bonuses.rangedStrength = 0.10;
    }

    // Magic prayers
    if (prayers.augury) {
      bonuses.magic = 0.25;
      bonuses.defense = 0.25;
    } else if (prayers.mysticMight) {
      bonuses.magic = 0.15;
    } else if (prayers.mysticWill) {
      bonuses.magic = 0.10;
    }

    return bonuses;
  },

  /**
   * Get potion boosts based on selected potions
   * @param {Object} potions - Object with potion selections
   * @returns {Object} - Potion boosts for various stats
   */
  getPotionBoosts(potions) {
    const boosts = {
      attack: 0,
      strength: 0,
      defense: 0,
      ranged: 0,
      magic: 0
    };

    // Melee potions
    if (potions.superCombat) {
      boosts.attack = 5 + Math.floor(0.15 * 99);
      boosts.strength = 5 + Math.floor(0.15 * 99);
      boosts.defense = 5 + Math.floor(0.15 * 99);
    } else if (potions.superAttack) {
      boosts.attack = 5 + Math.floor(0.15 * 99);
    } else if (potions.superStrength) {
      boosts.strength = 5 + Math.floor(0.15 * 99);
    }

    // Ranged potions
    if (potions.ranging) {
      boosts.ranged = 4 + Math.floor(0.1 * 99);
    }

    // Magic potions
    if (potions.magic) {
      boosts.magic = 4;
    }

    return boosts;
  },

  /**
   * Determine if an item can be equipped by a player based on requirements
   * @param {Object} item - Item with requirements
   * @param {Object} playerStats - Player's stats
   * @returns {boolean} - Whether the player can equip the item
   */
  canEquipItem(item, playerStats) {
    if (!item || !item.requirements || !playerStats) {
      return true;
    }

    const requirements = item.requirements;
    
    // Check each requirement against player stats
    for (const [stat, level] of Object.entries(requirements)) {
      if (!playerStats[stat] || playerStats[stat] < level) {
        return false;
      }
    }
    
    return true;
  },

  /**
   * Find the best DPS setup from available gear
   * @param {Object} player - Player stats and available gear
   * @param {Object} monster - Monster stats and weaknesses
   * @param {Object} settings - Settings including prayers, potions, etc.
   * @returns {Object} - Best DPS setup including gear, stats, and DPS value
   */
  findBestDPSSetup(player, monster, settings) {
    // For simplicity, we'll check a few preset builds:
    // 1. Best melee setup
    // 2. Best ranged setup
    // 3. Best magic setup
    
    const meleeDPS = this.calculateMeleeDPS(player, monster, settings);
    const rangedDPS = this.calculateRangedDPS(player, monster, settings);
    const magicDPS = this.calculateMagicDPS(player, monster, settings);
    
    // Find the highest DPS setup
    if (meleeDPS.dps >= rangedDPS.dps && meleeDPS.dps >= magicDPS.dps) {
      return meleeDPS;
    } else if (rangedDPS.dps >= meleeDPS.dps && rangedDPS.dps >= magicDPS.dps) {
      return rangedDPS;
    } else {
      return magicDPS;
    }
  },
  
  /**
   * Calculate melee DPS setup
   * @param {Object} player - Player stats and available gear
   * @param {Object} monster - Monster stats and weaknesses
   * @param {Object} settings - Settings including prayers, potions, etc.
   * @returns {Object} - Melee DPS setup data
   */
  calculateMeleeDPS(player, monster, settings) {
    const bestWeapons = this.getBestMeleeWeapons(player);
    let bestDPS = 0;
    let bestSetup = {
      weapon: null,
      gear: [],
      maxHit: 0,
      accuracy: 0,
      dps: 0,
      attackStyle: "slash"
    };
    
    // For each potential weapon, calculate DPS
    for (const weapon of bestWeapons) {
      // Choose best attack style (slash, stab, crush)
      const styles = ["slash", "stab", "crush"];
      for (const style of styles) {
        const meleeBonus = this.getBestMeleeBonus(player, weapon, style);
        
        // Calculate effective levels with prayers and potions
        const prayerBonuses = this.getPrayerBonuses(settings.prayers);
        const potionBoosts = this.getPotionBoosts(settings.potions);
        
        const effectiveAttack = this.calculateEffectiveLevel(
          player.stats.attack,
          prayerBonuses.attack,
          potionBoosts.attack
        );
        
        const effectiveStrength = this.calculateEffectiveLevel(
          player.stats.strength,
          prayerBonuses.strength,
          potionBoosts.strength
        );
        
        // Calculate attack roll
        const attackRoll = this.calculateAttackRoll(
          effectiveAttack,
          meleeBonus[`${style}Attack`],
          0 // Style bonus
        );
        
        // Calculate defense roll
        const defenseRoll = this.calculateDefenseRoll(
          monster.stats.defense,
          monster.bonuses[`${style}Defense`]
        );
        
        // Calculate accuracy
        const accuracy = this.calculateAccuracy(attackRoll, defenseRoll);
        
        // Calculate max hit
        const maxHit = this.calculateMaxHit(
          effectiveStrength,
          meleeBonus.strengthBonus,
          0, // Style bonus
          settings.slayerTask,
          this.hasSlayerHelm(player)
        );
        
        // Calculate DPS
        const dps = this.calculateDPS(maxHit, accuracy, weapon.attackSpeed);
        
        if (dps > bestDPS) {
          bestDPS = dps;
          bestSetup = {
            weapon: weapon,
            gear: meleeBonus.gear,
            maxHit: maxHit,
            accuracy: accuracy,
            dps: dps,
            attackStyle: style
          };
        }
      }
    }
    
    return bestSetup;
  },
  
  /**
   * Calculate ranged DPS setup
   * @param {Object} player - Player stats and available gear
   * @param {Object} monster - Monster stats and weaknesses
   * @param {Object} settings - Settings including prayers, potions, etc.
   * @returns {Object} - Ranged DPS setup data
   */
  calculateRangedDPS(player, monster, settings) {
    // Similar structure to calculateMeleeDPS but for ranged
    // For brevity, this is a simplified implementation
    return {
      weapon: { name: "Magic shortbow (i)", attackSpeed: 3 },
      gear: [],
      maxHit: 20,
      accuracy: 0.7,
      dps: 3.5,
      attackStyle: "ranged"
    };
  },
  
  /**
   * Calculate magic DPS setup
   * @param {Object} player - Player stats and available gear
   * @param {Object} monster - Monster stats and weaknesses
   * @param {Object} settings - Settings including prayers, potions, etc.
   * @returns {Object} - Magic DPS setup data
   */
  calculateMagicDPS(player, monster, settings) {
    // Similar structure to calculateMeleeDPS but for magic
    // For brevity, this is a simplified implementation
    return {
      weapon: { name: "Trident of the swamp", attackSpeed: 4 },
      gear: [],
      maxHit: 25,
      accuracy: 0.8,
      dps: 3.0,
      attackStyle: "magic"
    };
  },
  
  /**
   * Get best melee weapons available to player
   * @param {Object} player - Player data with available gear
   * @returns {Array} - Array of best melee weapons
   */
  getBestMeleeWeapons(player) {
    // In a real implementation, this would check the player's bank/inventory
    // For now, return placeholder data
    return [
      {
        name: "Abyssal whip",
        attackSpeed: 4,
        attackBonus: {
          slash: 82,
          stab: 0,
          crush: 0
        },
        strengthBonus: 82
      },
      {
        name: "Dragon scimitar",
        attackSpeed: 4,
        attackBonus: {
          slash: 67,
          stab: 0,
          crush: 0
        },
        strengthBonus: 66
      }
    ];
  },
  
  /**
   * Get best melee gear bonus based on available items
   * @param {Object} player - Player data
   * @param {Object} weapon - Weapon data
   * @param {string} style - Attack style
   * @returns {Object} - Combined bonuses and gear list
   */
  getBestMeleeBonus(player, weapon, style) {
    // In a real implementation, this would find optimal gear for the style
    // For now, return placeholder data
    return {
      slashAttack: 120,
      stabAttack: 70,
      crushAttack: 60,
      strengthBonus: 120,
      gear: [
        weapon,
        { name: "Fighter torso", slot: "body" },
        { name: "Berserker helm", slot: "head" },
        { name: "Dragon defender", slot: "shield" }
      ]
    };
  },
  
  /**
   * Check if player has slayer helm or black mask
   * @param {Object} player - Player data
   * @returns {boolean} - Whether player has slayer helm/black mask
   */
  hasSlayerHelm(player) {
    // In a real implementation, this would check player gear
    // For now, return placeholder data
    return true;
  },
  
  /**
   * Load gear from player data based on selected source
   * @param {string} playerId - ID of selected player
   * @param {string} gearSource - Source of gear (self, shared, everyone)
   * @param {Object} groupData - Group data including all players
   * @returns {Object} - Available gear for calculations
   */
  loadAvailableGear(playerId, gearSource, groupData) {
    if (!groupData || !groupData.players) {
      return { equipment: [], inventory: [], bank: [] };
    }
    
    const player = groupData.players.find(p => p.id === playerId);
    if (!player) {
      return { equipment: [], inventory: [], bank: [] };
    }
    
    let availableGear = {
      equipment: [...(player.equipment || [])],
      inventory: [...(player.inventory || [])],
      bank: [...(player.bank || [])]
    };
    
    // Add shared bank if selected
    if (gearSource === 'shared' || gearSource === 'everyone') {
      availableGear.bank = [...availableGear.bank, ...(groupData.sharedBank || [])];
    }
    
    // Add other players' gear if selected
    if (gearSource === 'everyone') {
      for (const otherPlayer of groupData.players) {
        if (otherPlayer.id !== playerId) {
          availableGear.bank = [
            ...availableGear.bank,
            ...(otherPlayer.equipment || []),
            ...(otherPlayer.inventory || []),
            ...(otherPlayer.bank || [])
          ];
        }
      }
    }
    
    return availableGear;
  },
  
  /**
   * Load monster data from wiki
   * @param {string} monsterId - Monster ID/name
   * @param {Object} wikiService - Wiki service instance
   * @returns {Promise<Object>} - Monster data
   */
  async loadMonsterData(monsterId, wikiService) {
    // In a real implementation, this would use wiki-service.js
    // For now, return placeholder data
    return {
      id: monsterId,
      name: monsterId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      stats: {
        hitpoints: 100,
        attack: 70,
        strength: 70,
        defense: 70,
        magic: 70,
        ranged: 70
      },
      bonuses: {
        slashDefense: 20,
        stabDefense: 40,
        crushDefense: 30,
        magicDefense: 0,
        rangedDefense: 40
      },
      attributes: {
        size: "medium",
        isUndead: false,
        isDemon: false,
        isDragon: false
      }
    };
  }
};

export default dpsUtils;
