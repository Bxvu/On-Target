const PLAYER_PROFILE_STORAGE_KEY = "on-target-player-profile";

function ensureLocalRoundRectangleFactory(): void {
    const factory = Phaser.GameObjects.GameObjectFactory as any;

    if (factory.prototype.rexRoundRectangle || factory.__onTargetRoundRectRegistered) {
        return;
    }

    factory.register(
        "rexRoundRectangle",
        function (
            this: any,
            x: number,
            y: number,
            width: number,
            height: number,
            _radius: number,
            fillColor: number,
            fillAlpha: number
        ) {
            const rectangle = new Phaser.GameObjects.Rectangle(this.scene, x, y, width, height, fillColor, fillAlpha);
            this.displayList.add(rectangle);
            return rectangle;
        }
    );

    factory.__onTargetRoundRectRegistered = true;
}

function getOfflineModeStatus(): { title: string; detail: string } {
    const supportsServiceWorker = "serviceWorker" in navigator && window.isSecureContext;

    if (!supportsServiceWorker) {
        return {
            title: "Offline mode unavailable here",
            detail: "This browser session does not allow installing the offline cache."
        };
    }

    if (navigator.serviceWorker.controller) {
        return {
            title: "Offline mode ready",
            detail: "If your connection drops after this page finishes loading, cached scenes and assets will keep working."
        };
    }

    return {
        title: "Offline mode installing",
        detail: "The cache is being installed now. Refresh once after the first successful load so this tab is controlled offline too."
    };
}

function createWeaponProjectile(config: {
    id: string;
    texture?: string;
    scale: number;
    lifetimeMs: number;
    maxActive: number;
    damage: DamageProfile;
    tint: number;
    pierceCount?: number;
    statusEffects?: EnemyStatusEffectConfig[];
    hitboxShape?: ProjectileHitboxShape;
    sticksToTargets?: boolean;
    minImpactSpeed?: number;
    healPlayerOnHit?: number;
    healPlayerOnKill?: number;
    healOwnerOnHit?: number;
}): ProjectileConfig {
    return {
        id: config.id,
        texture: config.texture ?? "arrow",
        scale: config.scale,
        lifetimeMs: config.lifetimeMs,
        collisionGroup: -15,
        maxActive: config.maxActive,
        damage: config.damage,
        tint: config.tint,
        pierceCount: config.pierceCount ?? 0,
        statusEffects: config.statusEffects?.map((effect) => ({ ...effect })),
        hitboxShape: config.hitboxShape ?? "rectangle",
        sticksToTargets: config.sticksToTargets ?? true,
        minImpactSpeed: config.minImpactSpeed,
        healPlayerOnHit: config.healPlayerOnHit,
        healPlayerOnKill: config.healPlayerOnKill,
        healOwnerOnHit: config.healOwnerOnHit
    };
}

function createEnemyProjectile(config: {
    id: string;
    texture?: string;
    scale: number;
    lifetimeMs: number;
    maxActive: number;
    damage: DamageProfile;
    tint?: number;
    pierceCount?: number;
    statusEffects?: EnemyStatusEffectConfig[];
    hitboxShape?: ProjectileHitboxShape;
    sticksToTargets?: boolean;
    minImpactSpeed?: number;
    healOwnerOnHit?: number;
}): ProjectileConfig {
    return {
        id: config.id,
        texture: config.texture ?? "arrow",
        scale: config.scale,
        lifetimeMs: config.lifetimeMs,
        collisionGroup: 15,
        maxActive: config.maxActive,
        damage: config.damage,
        tint: config.tint,
        pierceCount: config.pierceCount ?? 0,
        statusEffects: config.statusEffects?.map((effect) => ({ ...effect })),
        hitboxShape: config.hitboxShape ?? "rectangle",
        sticksToTargets: config.sticksToTargets ?? true,
        minImpactSpeed: config.minImpactSpeed,
        healOwnerOnHit: config.healOwnerOnHit
    };
}

function createWeaponDefinition(config: {
    id: string;
    name: string;
    description: string;
    cost: number;
    bowTint: number;
    attackStyle?: WeaponAttackStyle;
    powerMultiplier: number;
    accentColor: number;
    placeholderLabel: string;
        projectile: {
            id: string;
            texture?: string;
            scale: number;
            lifetimeMs: number;
            maxActive: number;
            damage: DamageProfile;
            tint: number;
            pierceCount?: number;
            statusEffects?: EnemyStatusEffectConfig[];
            hitboxShape?: ProjectileHitboxShape;
            sticksToTargets?: boolean;
            minImpactSpeed?: number;
            healPlayerOnHit?: number;
            healPlayerOnKill?: number;
        };
}): WeaponDefinition {
    return {
        id: config.id,
        name: config.name,
        description: config.description,
        cost: config.cost,
        bowTexture: "bow",
        bowTint: config.bowTint,
        attackStyle: config.attackStyle ?? "bow",
        projectile: createWeaponProjectile(config.projectile),
        powerMultiplier: config.powerMultiplier,
        accentColor: config.accentColor,
        placeholderLabel: config.placeholderLabel
    };
}

function formatModifierPercent(value: number): string {
    return `${Math.round(value * 100)}%`;
}

function describeEnemyStatusEffect(effect: EnemyStatusEffectConfig): string {
    switch (effect.kind) {
    case "bounty":
        return effect.currencyLossOnHit != null && effect.currencyLossOnHit > 0
            ? `Status: -$${effect.currencyLossOnHit} on hit`
            : `Status: +${formatModifierPercent(effect.rewardMultiplierPerStack ?? 0)} money per stack`;
    case "burn":
        return effect.minHealthAfterTicks != null
            ? `Status: Burn ${effect.damagePerTick} every ${Math.round(effect.tickIntervalMs / 100) / 10}s (stops at ${effect.minHealthAfterTicks} HP)`
            : `Status: Burn ${effect.damagePerTick} every ${Math.round(effect.tickIntervalMs / 100) / 10}s`;
    case "scatter":
        return `Status: +${formatModifierPercent(effect.aimSpreadMultiplierPerStack)} aim spread, -${formatModifierPercent(effect.throwForceReductionPerStack)} throw force per stack`;
    case "jam":
        return `Status: +${formatModifierPercent(effect.attackIntervalMultiplierPerStack)} fire delay, -${formatModifierPercent(effect.throwForceReductionPerStack)} throw force per stack`;
    default:
        return "Status: None";
    }
}

function getProjectileStatusSummary(projectile: ProjectileConfig): string[] {
    const summary: string[] = [];

    if (projectile.healPlayerOnHit && projectile.healPlayerOnHit > 0) {
        summary.push(`Heal: +${projectile.healPlayerOnHit} on hit`);
    }

    if (projectile.healPlayerOnKill && projectile.healPlayerOnKill > 0) {
        summary.push(`Heal: +${projectile.healPlayerOnKill} on kill`);
    }

    if (projectile.healOwnerOnHit && projectile.healOwnerOnHit > 0) {
        summary.push(`Heal owner: +${projectile.healOwnerOnHit} on hit`);
    }

    if (projectile.statusEffects && projectile.statusEffects.length > 0) {
        summary.push(...projectile.statusEffects.map((effect) => describeEnemyStatusEffect(effect)));
    }

    if (summary.length === 0) {
        return ["Status: None"];
    }

    return summary;
}

const ENEMY_ARROW_CONFIG: ProjectileConfig = createEnemyProjectile({
    id: "enemy-arrow",
    scale: 0.2,
    lifetimeMs: 2500,
    maxActive: 25,
    damage: {
        body: 1,
        head: 3
    }
});

const ENEMY_JAM_ARROW_CONFIG: ProjectileConfig = createEnemyProjectile({
    id: "enemy-jam-arrow",
    scale: 0.2,
    lifetimeMs: 2500,
    maxActive: 25,
    damage: {
        body: 1,
        head: 3
    },
    tint: 0x577590,
    statusEffects: [{
        kind: "jam",
        attackIntervalMultiplierPerStack: 0.1,
        throwForceReductionPerStack: 0.05,
        durationMs: 3500,
        maxStacks: 2
    }]
});

const ENEMY_BOUNTY_ARROW_CONFIG: ProjectileConfig = createEnemyProjectile({
    id: "enemy-bounty-arrow",
    scale: 0.18,
    lifetimeMs: 2500,
    maxActive: 25,
    damage: {
        body: 1,
        head: 2
    },
    tint: 0xf9c74f,
    statusEffects: [{
        kind: "bounty",
        currencyLossOnHit: 8
    }]
});

const ENEMY_BURN_ARROW_CONFIG: ProjectileConfig = createEnemyProjectile({
    id: "enemy-burn-arrow",
    scale: 0.19,
    lifetimeMs: 2500,
    maxActive: 25,
    damage: {
        body: 1,
        head: 3
    },
    tint: 0xf3722c,
    statusEffects: [{
        kind: "burn",
        damagePerTick: 1,
        tickIntervalMs: 700,
        durationMs: 4200,
        maxStacks: 3,
        minHealthAfterTicks: 4
    }]
});

const ENEMY_SCATTER_ARROW_CONFIG: ProjectileConfig = createEnemyProjectile({
    id: "enemy-scatter-arrow",
    scale: 0.18,
    lifetimeMs: 2500,
    maxActive: 25,
    damage: {
        body: 1,
        head: 3
    },
    tint: 0x43aa8b,
    statusEffects: [{
        kind: "scatter",
        aimSpreadMultiplierPerStack: 0.12,
        throwForceReductionPerStack: 0.05,
        durationMs: 5000,
        maxStacks: 3
    }]
});

const ENEMY_PIERCE_ARROW_CONFIG: ProjectileConfig = createEnemyProjectile({
    id: "enemy-pierce-arrow",
    scale: 0.2,
    lifetimeMs: 2500,
    maxActive: 25,
    damage: {
        body: 2,
        head: 4
    },
    tint: 0x7b2cbf,
    pierceCount: 2
});

const ENEMY_HEALING_ARROW_CONFIG: ProjectileConfig = createEnemyProjectile({
    id: "enemy-healing-arrow",
    scale: 0.19,
    lifetimeMs: 2500,
    maxActive: 25,
    damage: {
        body: 2,
        head: 3
    },
    tint: 0x52b788,
    healOwnerOnHit: 2
});

const ENEMY_ROCK_CONFIG: ProjectileConfig = createEnemyProjectile({
    id: "enemy-rock",
    texture: "rock",
    scale: 0.18,
    lifetimeMs: 2500,
    maxActive: 25,
    damage: {
        body: 2,
        head: 3
    },
    tint: 0xffffff,
    hitboxShape: "circle",
    sticksToTargets: false,
    minImpactSpeed: 0
});

const ENEMY_ALTERNATE_PROJECTILE_CHANCE = 0.1;
const ENEMY_ALTERNATE_PROJECTILES: ProjectileConfig[] = [
    ENEMY_BOUNTY_ARROW_CONFIG,
    ENEMY_BURN_ARROW_CONFIG,
    ENEMY_SCATTER_ARROW_CONFIG,
    ENEMY_JAM_ARROW_CONFIG,
    ENEMY_PIERCE_ARROW_CONFIG,
    ENEMY_HEALING_ARROW_CONFIG,
    ENEMY_ROCK_CONFIG
];

const STANDARD_ENEMY_ARCHETYPE: EnemyArchetype = {
    id: "standard",
    behavior: "ranged",
    projectile: ENEMY_ARROW_CONFIG,
    attack: {
        throwForceX: -0.025,
        throwForceY: -0.002,
        aimSpreadX: 100,
        aimSpreadY: 100,
        powerMin: 5,
        powerMax: 100,
        cleanupDelayMs: 2500,
        telegraphColor: 0xFFA500,
        telegraphThickness: 5,
        telegraphOuterStrength: 1
    },
    currencyReward: 10
};

const LEVEL_FOUR_BOSS_ARCHETYPE: EnemyArchetype = {
    ...STANDARD_ENEMY_ARCHETYPE,
    id: "level-four-boss",
    behavior: "ranged",
    projectile: createEnemyProjectile({
        id: "level-four-boss-shot",
        texture: "arrow",
        scale: 0.22,
        lifetimeMs: 3200,
        maxActive: 25,
        damage: {
            body: 2,
            head: 4
        },
        tint: 0xff4d6d,
        pierceCount: 3,
        healOwnerOnHit: 2,
        statusEffects: [
            {
                kind: "bounty",
                currencyLossOnHit: 10
            },
            {
                kind: "burn",
                damagePerTick: 1,
                tickIntervalMs: 700,
                durationMs: 4200,
                maxStacks: 3,
                minHealthAfterTicks: 4
            },
            {
                kind: "scatter",
                aimSpreadMultiplierPerStack: 0.35,
                throwForceReductionPerStack: 0.05,
                durationMs: 5000,
                maxStacks: 3
            },
            {
                kind: "jam",
                attackIntervalMultiplierPerStack: 0.2,
                throwForceReductionPerStack: 0.05,
                durationMs: 3500,
                maxStacks: 2
            }
        ]
    })
};

const GROUND_BRUISER_ARCHETYPE: EnemyArchetype = {
    id: "ground-bruiser",
    behavior: "melee",
    melee: {
        moveSpeed: 0.18,
        preferredRange: 130,
        attackRange: 175,
        damage: 2,
        windupMs: 450,
        recoverMs: 800,
        startupDelayMs: 2500,
        telegraphColor: 0xff7b00,
        telegraphThickness: 5,
        telegraphOuterStrength: 1
    },
    currencyReward: 20
};

const SWIRL_STARFISH_ARCHETYPE: EnemyArchetype = {
    id: "swirl-starfish",
    behavior: "ranged",
    bodyProfile: "starfish",
    attack: {
        throwForceX: 0,
        throwForceY: 0,
        aimSpreadX: 0,
        aimSpreadY: 0,
        powerMin: 0,
        powerMax: 0,
        cleanupDelayMs: 0,
        telegraphColor: 0xff8fab,
        telegraphThickness: 6,
        telegraphOuterStrength: 1.2
    },
    pulse: {
        range: 1800,
        powerupDrainMs: 2000,
        fallbackDamage: 2,
        visualColor: 0xff8fab,
        visualDurationMs: 520
    },
    currencyReward: 24
};


// Add new weapons here. One entry is all the shop and gameplay need.
const WEAPON_CATALOG: WeaponDefinition[] = [
    createWeaponDefinition({
        id: "starter-bow",
        name: "Starter Bow",
        description: "The free default. Solid range and steady damage.",
        cost: 0,
        bowTint: 0xffffff,
        powerMultiplier: 1,
        accentColor: 0x8ecae6,
        placeholderLabel: "Balanced",
        projectile: {
            id: "starter-arrow",
            scale: 0.2,
            lifetimeMs: 7500,
            maxActive: 25,
            damage: {
                body: 1,
                head: 3
            },
            tint: 0xffffff
        }
    }),
    createWeaponDefinition({
        id: "hunter-bow",
        name: "Hunter Bow",
        description: "Placeholder unlock with quicker arrows and stronger hits.",
        cost: 40,
        bowTint: 0x90be6d,
        powerMultiplier: 1.15,
        accentColor: 0x90be6d,
        placeholderLabel: "Fast",
        projectile: {
            id: "hunter-arrow",
            scale: 0.18,
            lifetimeMs: 8500,
            maxActive: 30,
            damage: {
                body: 2,
                head: 4
            },
            tint: 0x90be6d
        }
    }),
    createWeaponDefinition({
        id: "heavy-bow",
        name: "Heavy Bow",
        description: "Placeholder unlock that trades speed for chunky damage.",
        cost: 90,
        bowTint: 0xf8961e,
        powerMultiplier: 0.9,
        accentColor: 0xf8961e,
        placeholderLabel: "Power",
        projectile: {
            id: "heavy-arrow",
            scale: 0.24,
            lifetimeMs: 7000,
            maxActive: 18,
            damage: {
                body: 3,
                head: 5
            },
            tint: 0xf8961e
        }
    }),
    createWeaponDefinition({
        id: "strange-bow",
        name: "Strange Bow",
        description: "A risky bow with weak body shots but nasty headshots.",
        cost: 90,
        bowTint: 0x94d2bd,
        powerMultiplier: 1,
        accentColor: 0x94d2bd,
        placeholderLabel: "Weird",
        projectile: {
            id: "strange-arrow",
            scale: 0.16,
            lifetimeMs: 7000,
            maxActive: 18,
            damage: {
                body: -10,
                head: 20
            },
            tint: 0x94d2bd,
            statusEffects: [{
                kind: "bounty",
                rewardMultiplierPerStack: 1,
                maxStacks: 1000
            },
            {
                kind: "jam",
                attackIntervalMultiplierPerStack: 0.3,
                throwForceReductionPerStack: 0.5,
                durationMs: 10000,
                maxStacks: 1000
            },
            {
                kind: "burn",
                damagePerTick: 1,
                tickIntervalMs: 200,
                durationMs: 1000,
                maxStacks: 1000
            },
            {
                kind: "scatter",
                aimSpreadMultiplierPerStack: 0.35,
                throwForceReductionPerStack: 0.15,
                durationMs: 10000,
                maxStacks: 1000
            }],
            healPlayerOnHit: 1,
            healPlayerOnKill: 5,
            sticksToTargets: false
        }
    }),
    createWeaponDefinition({
        id: "phantom-bow",
        name: "Phantom Bow",
        description: "Piercing arrows pass through two enemies before the next hit sticks.",
        cost: 130,
        bowTint: 0x7b2cbf,
        powerMultiplier: 0.95,
        accentColor: 0x7b2cbf,
        placeholderLabel: "Pierce",
        projectile: {
            id: "phantom-arrow",
            scale: 0.2,
            lifetimeMs: 7800,
            maxActive: 20,
            damage: {
                body: 2,
                head: 4
            },
            tint: 0x7b2cbf,
            pierceCount: 2
        }
    }),
    createWeaponDefinition({
        id: "bounty-bow",
        name: "Bounty Bow",
        description: "Low damage, but every hit marks enemies for a fatter payout when they go down.",
        cost: 70,
        bowTint: 0xf9c74f,
        powerMultiplier: 1,
        accentColor: 0xf9c74f,
        placeholderLabel: "Cash",
        projectile: {
            id: "bounty-arrow",
            scale: 0.18,
            lifetimeMs: 8000,
            maxActive: 24,
            damage: {
                body: 1,
                head: 2
            },
            tint: 0xf9c74f,
            statusEffects: [{
                kind: "bounty",
                rewardMultiplierPerStack: 0.25,
                maxStacks: 4
            }]
        }
    }),
    createWeaponDefinition({
        id: "ember-bow",
        name: "Ember Bow",
        description: "Ignites targets with stacking burn damage that keeps chewing through tougher enemies.",
        cost: 110,
        bowTint: 0xf3722c,
        powerMultiplier: 1.05,
        accentColor: 0xf3722c,
        placeholderLabel: "Burn",
        projectile: {
            id: "ember-arrow",
            scale: 0.19,
            lifetimeMs: 7600,
            maxActive: 22,
            damage: {
                body: 1,
                head: 3
            },
            tint: 0xf3722c,
            statusEffects: [{
                kind: "burn",
                damagePerTick: 1,
                tickIntervalMs: 700,
                durationMs: 4200,
                maxStacks: 4
            }]
        }
    }),
    createWeaponDefinition({
        id: "scrambler-bow",
        name: "Scrambler Bow",
        description: "Debuff shots throw enemy aim off, making return fire drift wider and wider.",
        cost: 95,
        bowTint: 0x43aa8b,
        powerMultiplier: 1,
        accentColor: 0x43aa8b,
        placeholderLabel: "Scatter",
        projectile: {
            id: "scrambler-arrow",
            scale: 0.18,
            lifetimeMs: 7800,
            maxActive: 24,
            damage: {
                body: 1,
                head: 3
            },
            tint: 0x43aa8b,
            statusEffects: [{
                kind: "scatter",
                aimSpreadMultiplierPerStack: 0.35,
                throwForceReductionPerStack: 0.15,
                durationMs: 5000,
                maxStacks: 3
            }]
        }
    }),
    createWeaponDefinition({
        id: "ballast-bow",
        name: "Ballast Bow",
        description: "Heavy shots gum up the enemy rhythm and slow how often they can fire back.",
        cost: 105,
        bowTint: 0x577590,
        powerMultiplier: 0.95,
        accentColor: 0x577590,
        placeholderLabel: "Slow",
        projectile: {
            id: "ballast-arrow",
            scale: 0.2,
            lifetimeMs: 7800,
            maxActive: 20,
            damage: {
                body: 2,
                head: 3
            },
            tint: 0x577590,
            statusEffects: [{
                kind: "jam",
                attackIntervalMultiplierPerStack: 0.3,
                throwForceReductionPerStack: 0.5,
                durationMs: 5000,
                maxStacks: 5
            }]
        }
    }),
    createWeaponDefinition({
        id: "rock-bow",
        name: "Rock",
        description: "Fires a blunt stone that slams into enemies with a round hitbox instead of pinning into them.",
        cost: 85,
        bowTint: 0x8d6e63,
        attackStyle: "throw",
        powerMultiplier: 0.5,
        accentColor: 0x8d6e63,
        placeholderLabel: "Stone",
        projectile: {
            id: "rock-shot",
            texture: "rock",
            scale: 0.18,
            lifetimeMs: 6500,
            maxActive: 18,
            damage: {
                body: 3,
                head: 4
            },
            tint: 0xffffff,
            hitboxShape: "circle",
            sticksToTargets: false,
            minImpactSpeed: 1
        }
    }),
    createWeaponDefinition({
        id: "ember-rock-bow",
        name: "Ember Rock",
        description: "A hot stone that bonks hard and leaves a short burn ticking after impact.",
        cost: 135,
        bowTint: 0xf3722c,
        attackStyle: "throw",
        powerMultiplier: 0.52,
        accentColor: 0xf3722c,
        placeholderLabel: "Scorch",
        projectile: {
            id: "ember-rock-shot",
            texture: "rock",
            scale: 0.18,
            lifetimeMs: 6500,
            maxActive: 16,
            damage: {
                body: 2,
                head: 3
            },
            tint: 0xf3722c,
            hitboxShape: "circle",
            sticksToTargets: false,
            minImpactSpeed: 1,
            statusEffects: [{
                kind: "burn",
                damagePerTick: 1,
                tickIntervalMs: 700,
                durationMs: 3500,
                maxStacks: 2
            }]
        }
    }),
    createWeaponDefinition({
        id: "bounty-rock-bow",
        name: "Bounty Rock",
        description: "A marked stone that tags enemies for a fatter payout after the hit.",
        cost: 115,
        bowTint: 0xf9c74f,
        attackStyle: "throw",
        powerMultiplier: 0.5,
        accentColor: 0xf9c74f,
        placeholderLabel: "Cash",
        projectile: {
            id: "bounty-rock-shot",
            texture: "rock",
            scale: 0.18,
            lifetimeMs: 6500,
            maxActive: 16,
            damage: {
                body: 2,
                head: 3
            },
            tint: 0xf9c74f,
            hitboxShape: "circle",
            sticksToTargets: false,
            minImpactSpeed: 1,
            statusEffects: [{
                kind: "bounty",
                rewardMultiplierPerStack: 0.35,
                maxStacks: 3
            }]
        }
    }),
    createWeaponDefinition({
        id: "crusher-rock-bow",
        name: "Crusher Rock",
        description: "The heaviest throw in the lineup. Slow to launch, but every hit lands like a brick.",
        cost: 145,
        bowTint: 0x6c757d,
        attackStyle: "throw",
        powerMultiplier: 0.42,
        accentColor: 0x6c757d,
        placeholderLabel: "Heavy",
        projectile: {
            id: "crusher-rock-shot",
            texture: "rock",
            scale: 0.22,
            lifetimeMs: 7000,
            maxActive: 14,
            damage: {
                body: 4,
                head: 6
            },
            tint: 0xd9d9d9,
            hitboxShape: "circle",
            sticksToTargets: false,
            minImpactSpeed: 0
        }
    }),
    createWeaponDefinition({
        id: "healing-rock-bow",
        name: "Healing Rock",
        description: "Each solid rock hit patches you up, rewarding close chains of blunt impacts.",
        cost: 120,
        bowTint: 0x52b788,
        attackStyle: "throw",
        powerMultiplier: 0.55,
        accentColor: 0x52b788,
        placeholderLabel: "Leech",
        projectile: {
            id: "healing-rock-shot",
            texture: "rock",
            scale: 0.18,
            lifetimeMs: 6500,
            maxActive: 16,
            damage: {
                body: 2,
                head: 3
            },
            tint: 0x52b788,
            hitboxShape: "circle",
            sticksToTargets: false,
            minImpactSpeed: 0,
            healPlayerOnHit: 1
        }
    }),
    createWeaponDefinition({
        id: "healing-arrow-bow",
        name: "Healing Arrow",
        description: "Slim arrows restore health only when they finish an enemy off.",
        cost: 125,
        bowTint: 0x2a9d8f,
        powerMultiplier: 1,
        accentColor: 0x2a9d8f,
        placeholderLabel: "Heal",
        projectile: {
            id: "healing-arrow-shot",
            texture: "arrow",
            scale: 0.19,
            lifetimeMs: 7900,
            maxActive: 22,
            damage: {
                body: 2,
                head: 4
            },
            tint: 0x2a9d8f,
            healPlayerOnKill: 4
        }
    })
];

const STARTER_WEAPON = WEAPON_CATALOG[0];

const DEFAULT_PLAYER_LOADOUT: PlayerLoadout = {
    weapon: STARTER_WEAPON,
    projectile: STARTER_WEAPON.projectile,
    powerMultiplier: STARTER_WEAPON.powerMultiplier
};

const PLAYER_TIMED_POWERUP_ORDER: TimedPowerupKind[] = ["rapidCharge", "damage", "pierce"];

const TIMED_POWERUP_DEFINITIONS: TimedPowerupDefinition[] = [
    {
        id: "timed-rapid-charge",
        kind: "rapidCharge",
        label: "Rapid Charge",
        shortLabel: "CHG",
        color: 0xffd166,
        textColor: "#1b1b1b",
        durationMs: 5000,
        chargeRateMultiplier: 2
    },
    {
        id: "timed-heal",
        kind: "heal",
        label: "Heal",
        shortLabel: "HP",
        color: 0x52b788,
        textColor: "#ffffff",
        healAmount: 4
    },
    {
        id: "timed-damage",
        kind: "damage",
        label: "Damage Up",
        shortLabel: "DMG",
        color: 0xf94144,
        textColor: "#ffffff",
        durationMs: 8000,
        damageBonus: 2
    },
    {
        id: "timed-pierce",
        kind: "pierce",
        label: "Piercing",
        shortLabel: "PRC",
        color: 0x7b2cbf,
        textColor: "#ffffff",
        durationMs: 8000,
        pierceBonus: 1
    }
];

const TIMED_POWERUP_DROP_DEFINITIONS: TimedPowerupDefinition[] = [
    {
        id: "timed-rapid-charge-plus",
        kind: "rapidCharge",
        label: "Rapid Charge+",
        shortLabel: "CHG+",
        color: 0xffb703,
        textColor: "#1b1b1b",
        durationMs: 8000,
        instantCharge: true
    },
    {
        id: "timed-heal-plus",
        kind: "heal",
        label: "Heal+",
        shortLabel: "HP+",
        color: 0x2dc653,
        textColor: "#ffffff",
        healAmount: 7
    },
    {
        id: "timed-damage-plus",
        kind: "damage",
        label: "Damage Up+",
        shortLabel: "DMG+",
        color: 0xd00000,
        textColor: "#ffffff",
        durationMs: 10000,
        damageBonus: 4
    },
    {
        id: "timed-pierce-plus",
        kind: "pierce",
        label: "Piercing+",
        shortLabel: "PRC+",
        color: 0x5a189a,
        textColor: "#ffffff",
        durationMs: 10000,
        pierceBonus: 2
    }
];

const PAUSE_POWERUP_SHOP_OFFERS: PausePowerupOffer[] = [
    {
        id: "pause-heal-plus",
        label: "Heal+",
        description: "Restore 7 HP instantly.",
        cost: 150,
        definition: TIMED_POWERUP_DROP_DEFINITIONS[1]
    },
    {
        id: "pause-rapid-charge-plus",
        label: "Rapid Charge+",
        description: "Instant full charge for 8 seconds.",
        cost: 180,
        definition: TIMED_POWERUP_DROP_DEFINITIONS[0]
    },
    {
        id: "pause-damage-plus",
        label: "Damage Up+",
        description: "+4 body and head damage for 10 seconds.",
        cost: 240,
        definition: TIMED_POWERUP_DROP_DEFINITIONS[2]
    },
    {
        id: "pause-pierce-plus",
        label: "Piercing+",
        description: "+4 pierce for 10 seconds.",
        cost: 240,
        definition: TIMED_POWERUP_DROP_DEFINITIONS[3]
    }
];

const DEFAULT_TEXT_BUTTON_STYLE = {
    radius: 24,
    backgroundColor: 0x3fafaa,
    textColor: "#1b1b1b",
    font: "bold 32px Arial"
};

const SHOP_CATALOG: ShopItemDefinition[] = WEAPON_CATALOG.map((weapon) => ({
    id: weapon.id,
    name: weapon.name,
    description: weapon.description,
    category: "bow",
    cost: weapon.cost,
    effect: {
        type: "projectile",
        projectile: weapon.projectile
    }
}));

function getWeaponDefinition(weaponId?: string): WeaponDefinition {
    return WEAPON_CATALOG.find((weapon) => weapon.id === weaponId) ?? STARTER_WEAPON;
}

function createPlayerLoadout(weaponId?: string): PlayerLoadout {
    const weapon = getWeaponDefinition(weaponId);
    return {
        weapon,
        projectile: weapon.projectile,
        powerMultiplier: weapon.powerMultiplier
    };
}

function createDefaultPlayerProfile(): PlayerProfile {
    return {
        currency: 0,
        unlockedWeaponIds: [STARTER_WEAPON.id],
        selectedWeaponId: STARTER_WEAPON.id,
        removeFadedEnemyCorpses: false
    };
}

function normalizePlayerProfile(profile?: Partial<PlayerProfile> | null): PlayerProfile {
    const defaultProfile = createDefaultPlayerProfile();
    const unlockedWeaponIds = Array.from(new Set([
        STARTER_WEAPON.id,
        ...(profile?.unlockedWeaponIds ?? []).filter((weaponId) => WEAPON_CATALOG.some((weapon) => weapon.id === weaponId))
    ]));
    const selectedWeaponId = unlockedWeaponIds.includes(profile?.selectedWeaponId ?? "")
        ? profile!.selectedWeaponId!
        : defaultProfile.selectedWeaponId;

    return {
        currency: Math.max(0, Math.floor(profile?.currency ?? defaultProfile.currency)),
        unlockedWeaponIds,
        selectedWeaponId,
        removeFadedEnemyCorpses: profile?.removeFadedEnemyCorpses ?? defaultProfile.removeFadedEnemyCorpses
    };
}

function loadPlayerProfile(): PlayerProfile {
    try {
        const storedProfile = window.localStorage.getItem(PLAYER_PROFILE_STORAGE_KEY);

        if (!storedProfile) {
            return createDefaultPlayerProfile();
        }

        return normalizePlayerProfile(JSON.parse(storedProfile) as Partial<PlayerProfile>);
    }
    catch (_error) {
        return createDefaultPlayerProfile();
    }
}

function savePlayerProfile(profile: PlayerProfile): PlayerProfile {
    const normalizedProfile = normalizePlayerProfile(profile);

    try {
        window.localStorage.setItem(PLAYER_PROFILE_STORAGE_KEY, JSON.stringify(normalizedProfile));
    }
    catch (_error) {
        // Ignore storage failures so gameplay still works in restricted browsers.
    }

    return normalizedProfile;
}

function updatePlayerProfile(updater: (profile: PlayerProfile) => void): PlayerProfile {
    const profile = loadPlayerProfile();
    updater(profile);
    return savePlayerProfile(profile);
}

function isWeaponUnlocked(profile: PlayerProfile, weaponId: string): boolean {
    return profile.unlockedWeaponIds.includes(weaponId);
}

function selectWeaponForProfile(weaponId: string): PlayerProfile {
    return updatePlayerProfile((profile) => {
        if (isWeaponUnlocked(profile, weaponId)) {
            profile.selectedWeaponId = weaponId;
        }
    });
}

function purchaseWeaponForProfile(weaponId: string): { success: boolean; profile: PlayerProfile; message: string } {
    const weapon = getWeaponDefinition(weaponId);
    let resultMessage = "";

    const profile = updatePlayerProfile((currentProfile) => {
        if (isWeaponUnlocked(currentProfile, weapon.id)) {
            currentProfile.selectedWeaponId = weapon.id;
            resultMessage = `${weapon.name} equipped.`;
            return;
        }

        if (currentProfile.currency < weapon.cost) {
            resultMessage = `You need $${weapon.cost - currentProfile.currency} more for ${weapon.name}.`;
            return;
        }

        currentProfile.currency -= weapon.cost;
        currentProfile.unlockedWeaponIds.push(weapon.id);
        currentProfile.selectedWeaponId = weapon.id;
        resultMessage = `${weapon.name} unlocked and equipped.`;
    });

    return {
        success: isWeaponUnlocked(profile, weapon.id),
        profile,
        message: resultMessage
    };
}

function createEnemySpawnConfig(config: Omit<EnemySpawnConfig, "archetype"> & { archetype?: EnemyArchetype }): EnemySpawnConfig {
    return {
        staticBody: false,
        archetype: STANDARD_ENEMY_ARCHETYPE,
        ...config
    };
}

function resolveEnemyArchetype(archetype: EnemyArchetype, alternateProjectileChance = ENEMY_ALTERNATE_PROJECTILE_CHANCE): EnemyArchetype {
    if (archetype.behavior !== "ranged" || !archetype.projectile || archetype.projectile.id !== ENEMY_ARROW_CONFIG.id) {
        return archetype;
    }

    if (Math.random() >= alternateProjectileChance) {
        return archetype;
    }

    const alternateProjectiles = ENEMY_ALTERNATE_PROJECTILES.filter((projectile) => projectile.id !== archetype.projectile.id);

    if (alternateProjectiles.length === 0) {
        return archetype;
    }

    const projectile = alternateProjectiles[Math.floor(Math.random() * alternateProjectiles.length)];

    return {
        ...archetype,
        projectile
    };
}

const MANUAL_LEVEL_DEFINITIONS: ManualLevelDefinition[] = [
    {
        sceneKey: "LevelOne",
        label: "Level 1",
        menuColor: 0x3fafaa,
        nextLevel: "LevelTwo",
        instructions: {
            x: 200,
            y: 150,
            text: "Hold Click to Charge the Bow\nLet Go to Shoot the Arrow in the direction of your Mouse\n\nEach Arrow does 1 DMG\nHeadshotting Opponents does 3 DMG\nOpponents can shoot at you\nTheir Arm will glow orange when they start throwing arrows\nYou have 10 Health",
            font: "bold 40px Arial",
            fill: "#ffffff"
        },
        createEnemyConfigs: (levelScale) => [
            createEnemySpawnConfig({
                x: 1300,
                y: 600,
                scale: levelScale,
                health: 3,
                flip: true,
                attackInterval: 3000,
                attackDelay: 2
            })
        ]
    },
    {
        sceneKey: "LevelTwo",
        label: "Level 2",
        menuColor: 0xf0f6af,
        nextLevel: "LevelThree",
        instructions: {
            x: 200,
            y: 300,
            text: "There is no lore to this game,\nidk why these guys are floating\n(other than making it so \nyou have to aim in the air)",
            font: "bold 40px Arial",
            fill: "#ffffff"
        },
        createEnemyConfigs: (levelScale) => [
            createEnemySpawnConfig({
                x: 1300,
                y: 700,
                scale: levelScale + 0.2,
                health: 5,
                flip: true,
                attackInterval: 2000,
                attackDelay: 2
            }),
            createEnemySpawnConfig({
                x: 1000,
                y: 500,
                scale: levelScale - 0.3,
                health: 2,
                flip: true,
                attackInterval: 3000,
                attackDelay: 3
            }),
            createEnemySpawnConfig({
                x: 1600,
                y: 300,
                scale: levelScale - 0.5,
                health: 1,
                flip: true,
                attackInterval: 4000,
                attackDelay: 1
            })
        ]
    },
    {
        sceneKey: "LevelThree",
        label: "Level 3",
        menuColor: 0x8ff00f,
        nextLevel: "LevelFour",
        instructions: {
            x: 200,
            y: 200,
            text: "Extra Stuff:\nPress the Down Arrow to toggle bow stream cheat\nPress the Up Arrow to reset the level\nPress the Right Arrow to have your shots instantly charge\nThere is no Konami Code unfortunately",
            font: "bold 25px Arial",
            fill: "#ffffff"
        },
        createEnemyConfigs: (levelScale) => {
            const enemyConfigs: EnemySpawnConfig[] = [
                createEnemySpawnConfig({
                    x: 1250,
                    y: 400,
                    scale: levelScale + 0.5,
                    health: 9,
                    flip: true,
                    attackInterval: 5000,
                    attackDelay: 5
                })
            ];
            const weirdAmalgamX = 1700;
            const weirdAmalgamY = 600;
            const weirdAmalgamScale = levelScale - 0.6;
            const humanoidCount = 10;

            for (let count = 0; count < humanoidCount; count++) {
                enemyConfigs.push(createEnemySpawnConfig({
                    x: weirdAmalgamX - count,
                    y: weirdAmalgamY,
                    scale: weirdAmalgamScale,
                    health: 1,
                    flip: true,
                    attackInterval: Math.random() * 500 + 750,
                    attackDelay: Math.random() * 2 + 10
                }));
            }

            return enemyConfigs;
        }
    },
    {
        sceneKey: "LevelFour",
        label: "Level 4",
        menuColor: 0x6d9dc5,
        nextLevel: "LevelFive",
        createEnemyConfigs: (levelScale) => {
            const enemyConfigs: EnemySpawnConfig[] = [
                createEnemySpawnConfig({
                    x: 1700,
                    y: 450,
                    scale: levelScale + 0.5,
                    health: 50,
                    flip: true,
                    attackInterval: 2000,
                    attackDelay: 0,
                    archetype: LEVEL_FOUR_BOSS_ARCHETYPE
                })
            ];
            const weirdAmalgamX = 1550;
            const weirdAmalgamY = 475;
            const weirdAmalgamScale = levelScale - 0.6;
            const humanoidCount = 10;

            for (let count = 0; count < humanoidCount; count++) {
                enemyConfigs.push(createEnemySpawnConfig({
                    x: weirdAmalgamX - count,
                    y: weirdAmalgamY,
                    scale: weirdAmalgamScale,
                    health: 1,
                    flip: true,
                    attackInterval: Math.random() * 500 + 7500,
                    attackDelay: Math.random() * 2 + 10000
                }));
            }

            return enemyConfigs;
        }
    },
    {
        sceneKey: "LevelFive",
        label: "Level 5",
        menuColor: 0xf4a261,
        nextLevel: "LevelSix",
        instructions: {
            x: 220,
            y: 170,
            text: "Ground bruisers rush you on the floor and swing in melee.\nSwirl starfish curl around their head, then open up to blast 2 seconds off your active powerups.\nIf you have no active powerups, that pulse hits for 2 damage.\nRock weapons now use a throw motion instead of the bow pose.",
            font: "bold 34px Arial",
            fill: "#ffffff"
        },
        createEnemyConfigs: (levelScale) => [
            createEnemySpawnConfig({
                x: 1480,
                y: 500,
                scale: levelScale - 0.05,
                health: 5,
                flip: true,
                attackInterval: 3600,
                attackDelay: 1,
                archetype: SWIRL_STARFISH_ARCHETYPE
            }),
            createEnemySpawnConfig({
                x: 1550,
                y: 900,
                scale: levelScale + 0.15,
                health: 8,
                flip: true,
                attackInterval: 0,
                attackDelay: 0,
                archetype: GROUND_BRUISER_ARCHETYPE
            }),
            createEnemySpawnConfig({
                x: 1780,
                y: 900,
                scale: levelScale,
                health: 6,
                flip: true,
                attackInterval: 0,
                attackDelay: 0,
                archetype: GROUND_BRUISER_ARCHETYPE
            }),
            createEnemySpawnConfig({
                x: 1400,
                y: 420,
                scale: levelScale - 0.1,
                health: 4,
                flip: true,
                attackInterval: 2400,
                attackDelay: 1
            }),
            createEnemySpawnConfig({
                x: 1150,
                y: 540,
                scale: levelScale - 0.2,
                health: 3,
                flip: true,
                attackInterval: 2200,
                attackDelay: 2
            })
        ]
    },
    {
        sceneKey: "LevelSix",
        label: "Level 6",
        menuColor: 0xff8fab,
        nextLevel: "MainMenu",
        instructions: {
            x: 220,
            y: 160,
            text: "Starfish test room.\nTheir middle core is the head.\nWhen they uncurl and pulse, they shave 2 seconds off active powerups.\nIf you have none active, the pulse hits for 2 damage instead.",
            font: "bold 36px Arial",
            fill: "#ffffff"
        },
        createEnemyConfigs: (levelScale) => [
            createEnemySpawnConfig({
                x: 1380,
                y: 320,
                scale: levelScale - 0.1,
                health: 4,
                flip: true,
                attackInterval: 4200,
                attackDelay: 0,
                archetype: SWIRL_STARFISH_ARCHETYPE
            }),
            createEnemySpawnConfig({
                x: 1620,
                y: 520,
                scale: levelScale + 0.05,
                health: 5,
                flip: true,
                attackInterval: 3400,
                attackDelay: 1,
                archetype: SWIRL_STARFISH_ARCHETYPE
            }),
            createEnemySpawnConfig({
                x: 1260,
                y: 700,
                scale: levelScale + 0.15,
                health: 6,
                flip: true,
                attackInterval: 2800,
                attackDelay: 2,
                archetype: SWIRL_STARFISH_ARCHETYPE
            })
        ]
    }
];

function getManualLevelDefinitions(): ManualLevelDefinition[] {
    return MANUAL_LEVEL_DEFINITIONS;
}

function getManualLevelDefinition(sceneKey: ManualLevelKey): ManualLevelDefinition {
    return MANUAL_LEVEL_DEFINITIONS.find((definition) => definition.sceneKey === sceneKey) ?? MANUAL_LEVEL_DEFINITIONS[0];
}

function createTextButton(
    scene: LooseScene,
    config: {
        x: number;
        y: number;
        width: number;
        height: number;
        label: string;
        parent?: GameContainer;
        radius?: number;
        backgroundColor?: number;
        textColor?: string;
        font?: string;
        depth?: number;
    }
): TextButton {
    const container = scene.add.container(config.x, config.y);
    const background = scene.add.rexRoundRectangle(
        0,
        0,
        config.width,
        config.height,
        config.radius ?? DEFAULT_TEXT_BUTTON_STYLE.radius,
        config.backgroundColor ?? DEFAULT_TEXT_BUTTON_STYLE.backgroundColor,
        1
    );

    background.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
    background.setInteractive({ useHandCursor: true });

    const label = scene.add.text(0, 0, config.label, {
        font: config.font ?? DEFAULT_TEXT_BUTTON_STYLE.font,
        fill: config.textColor ?? DEFAULT_TEXT_BUTTON_STYLE.textColor
    }).setOrigin(0.5);

    container.add([background, label]);
    container.setDepth(config.depth ?? 1);

    if (config.parent) {
        config.parent.add(container);
    }

    return { container, background, label };
}

function bindFullscreenToggle(scene: LooseScene, button: TextButton): void {
    const updateButtonLabel = () => {
        button.label.setText(scene.scale.isFullscreen ? "Windowed" : "Fullscreen");
    };

    button.background.on("pointerup", () => {
        if (scene.scale.isFullscreen) {
            scene.scale.stopFullscreen();
        }
        else {
            scene.scale.startFullscreen();
        }

        updateButtonLabel();
    });

    scene.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, updateButtonLabel);
    scene.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, updateButtonLabel);
    scene.events.once("shutdown", () => {
        scene.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, updateButtonLabel);
        scene.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, updateButtonLabel);
    });

    updateButtonLabel();
}

ensureLocalRoundRectangleFactory();
