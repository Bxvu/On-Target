const PLAYER_ARROW_CONFIG: ProjectileConfig = {
    id: "player-arrow",
    texture: "arrow",
    scale: 0.2,
    lifetimeMs: 7500,
    collisionGroup: -15,
    maxActive: 25,
    damage: {
        body: 1,
        head: 3
    }
};

const ENEMY_ARROW_CONFIG: ProjectileConfig = {
    id: "enemy-arrow",
    texture: "arrow",
    scale: 0.2,
    lifetimeMs: 2500,
    collisionGroup: 15,
    maxActive: 25,
    damage: {
        body: 1,
        head: 3
    }
};

const STANDARD_ENEMY_ARCHETYPE: EnemyArchetype = {
    id: "standard",
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
    }
};

const DEFAULT_PLAYER_LOADOUT: PlayerLoadout = {
    projectile: PLAYER_ARROW_CONFIG
};

// Typed scaffolding for a future shop system. Keeping the catalog data-driven
// will make the eventual menu implementation much simpler.
const SHOP_CATALOG: ShopItemDefinition[] = [];

function createEnemySpawnConfig(config: Omit<EnemySpawnConfig, "archetype"> & { archetype?: EnemyArchetype }): EnemySpawnConfig {
    return {
        staticBody: false,
        archetype: STANDARD_ENEMY_ARCHETYPE,
        ...config
    };
}
