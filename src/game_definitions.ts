const PLAYER_PROFILE_STORAGE_KEY = "on-target-player-profile";

function createWeaponProjectile(config: {
    id: string;
    scale: number;
    lifetimeMs: number;
    maxActive: number;
    damage: DamageProfile;
    tint: number;
    pierceCount?: number;
    statusEffects?: EnemyStatusEffectConfig[];
}): ProjectileConfig {
    return {
        id: config.id,
        texture: "arrow",
        scale: config.scale,
        lifetimeMs: config.lifetimeMs,
        collisionGroup: -15,
        maxActive: config.maxActive,
        damage: config.damage,
        tint: config.tint,
        pierceCount: config.pierceCount ?? 0,
        statusEffects: config.statusEffects?.map((effect) => ({ ...effect }))
    };
}

function createWeaponDefinition(config: {
    id: string;
    name: string;
    description: string;
    cost: number;
    bowTint: number;
    powerMultiplier: number;
    accentColor: number;
    placeholderLabel: string;
        projectile: {
            id: string;
            scale: number;
            lifetimeMs: number;
            maxActive: number;
            damage: DamageProfile;
            tint: number;
            pierceCount?: number;
            statusEffects?: EnemyStatusEffectConfig[];
        };
}): WeaponDefinition {
    return {
        id: config.id,
        name: config.name,
        description: config.description,
        cost: config.cost,
        bowTexture: "bow",
        bowTint: config.bowTint,
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
        return `Status: +${formatModifierPercent(effect.rewardMultiplierPerStack)} money per stack`;
    case "burn":
        return `Status: Burn ${effect.damagePerTick} every ${Math.round(effect.tickIntervalMs / 100) / 10}s`;
    case "scatter":
        return `Status: +${formatModifierPercent(effect.aimSpreadMultiplierPerStack)} aim spread, -${formatModifierPercent(effect.throwForceReductionPerStack)} throw force per stack`;
    case "jam":
        return `Status: +${formatModifierPercent(effect.attackIntervalMultiplierPerStack)} fire delay, -${formatModifierPercent(effect.throwForceReductionPerStack)} throw force per stack`;
    default:
        return "Status: None";
    }
}

function getProjectileStatusSummary(projectile: ProjectileConfig): string[] {
    if (!projectile.statusEffects || projectile.statusEffects.length === 0) {
        return ["Status: None"];
    }

    return projectile.statusEffects.map((effect) => describeEnemyStatusEffect(effect));
}

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
    },
    currencyReward: 10
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
                tickIntervalMs: 100,
                durationMs: 500,
                maxStacks: 1
            },
            {
                kind: "scatter",
                aimSpreadMultiplierPerStack: 0.35,
                throwForceReductionPerStack: 0.15,
                durationMs: 10000,
                maxStacks: 1000
            }]
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
    })
];

const STARTER_WEAPON = WEAPON_CATALOG[0];

const DEFAULT_PLAYER_LOADOUT: PlayerLoadout = {
    weapon: STARTER_WEAPON,
    projectile: STARTER_WEAPON.projectile,
    powerMultiplier: STARTER_WEAPON.powerMultiplier
};

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
        selectedWeaponId: STARTER_WEAPON.id
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
        selectedWeaponId
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
        nextLevel: "MainMenu",
        createEnemyConfigs: (levelScale) => [
            createEnemySpawnConfig({
                x: 1250,
                y: 400,
                scale: levelScale + 0.5,
                health: 25,
                flip: true,
                attackInterval: 2000,
                attackDelay: 0
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
