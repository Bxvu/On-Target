"use strict";
class LooseScene extends Phaser.Scene {
    constructor(...args) {
        super(...args);
    }
}
const PLAYER_PROFILE_STORAGE_KEY = "on-target-player-profile";
function createWeaponProjectile(config) {
    var _a, _b;
    return {
        id: config.id,
        texture: "arrow",
        scale: config.scale,
        lifetimeMs: config.lifetimeMs,
        collisionGroup: -15,
        maxActive: config.maxActive,
        damage: config.damage,
        tint: config.tint,
        pierceCount: (_a = config.pierceCount) !== null && _a !== void 0 ? _a : 0,
        statusEffects: (_b = config.statusEffects) === null || _b === void 0 ? void 0 : _b.map((effect) => (Object.assign({}, effect)))
    };
}
function createWeaponDefinition(config) {
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
function formatModifierPercent(value) {
    return `${Math.round(value * 100)}%`;
}
function describeEnemyStatusEffect(effect) {
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
function getProjectileStatusSummary(projectile) {
    if (!projectile.statusEffects || projectile.statusEffects.length === 0) {
        return ["Status: None"];
    }
    return projectile.statusEffects.map((effect) => describeEnemyStatusEffect(effect));
}
const ENEMY_ARROW_CONFIG = {
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
const STANDARD_ENEMY_ARCHETYPE = {
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
const WEAPON_CATALOG = [
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
const DEFAULT_PLAYER_LOADOUT = {
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
const SHOP_CATALOG = WEAPON_CATALOG.map((weapon) => ({
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
function getWeaponDefinition(weaponId) {
    var _a;
    return (_a = WEAPON_CATALOG.find((weapon) => weapon.id === weaponId)) !== null && _a !== void 0 ? _a : STARTER_WEAPON;
}
function createPlayerLoadout(weaponId) {
    const weapon = getWeaponDefinition(weaponId);
    return {
        weapon,
        projectile: weapon.projectile,
        powerMultiplier: weapon.powerMultiplier
    };
}
function createDefaultPlayerProfile() {
    return {
        currency: 0,
        unlockedWeaponIds: [STARTER_WEAPON.id],
        selectedWeaponId: STARTER_WEAPON.id
    };
}
function normalizePlayerProfile(profile) {
    var _a, _b, _c;
    const defaultProfile = createDefaultPlayerProfile();
    const unlockedWeaponIds = Array.from(new Set([
        STARTER_WEAPON.id,
        ...((_a = profile === null || profile === void 0 ? void 0 : profile.unlockedWeaponIds) !== null && _a !== void 0 ? _a : []).filter((weaponId) => WEAPON_CATALOG.some((weapon) => weapon.id === weaponId))
    ]));
    const selectedWeaponId = unlockedWeaponIds.includes((_b = profile === null || profile === void 0 ? void 0 : profile.selectedWeaponId) !== null && _b !== void 0 ? _b : "")
        ? profile.selectedWeaponId
        : defaultProfile.selectedWeaponId;
    return {
        currency: Math.max(0, Math.floor((_c = profile === null || profile === void 0 ? void 0 : profile.currency) !== null && _c !== void 0 ? _c : defaultProfile.currency)),
        unlockedWeaponIds,
        selectedWeaponId
    };
}
function loadPlayerProfile() {
    try {
        const storedProfile = window.localStorage.getItem(PLAYER_PROFILE_STORAGE_KEY);
        if (!storedProfile) {
            return createDefaultPlayerProfile();
        }
        return normalizePlayerProfile(JSON.parse(storedProfile));
    }
    catch (_error) {
        return createDefaultPlayerProfile();
    }
}
function savePlayerProfile(profile) {
    const normalizedProfile = normalizePlayerProfile(profile);
    try {
        window.localStorage.setItem(PLAYER_PROFILE_STORAGE_KEY, JSON.stringify(normalizedProfile));
    }
    catch (_error) {
        // Ignore storage failures so gameplay still works in restricted browsers.
    }
    return normalizedProfile;
}
function updatePlayerProfile(updater) {
    const profile = loadPlayerProfile();
    updater(profile);
    return savePlayerProfile(profile);
}
function isWeaponUnlocked(profile, weaponId) {
    return profile.unlockedWeaponIds.includes(weaponId);
}
function selectWeaponForProfile(weaponId) {
    return updatePlayerProfile((profile) => {
        if (isWeaponUnlocked(profile, weaponId)) {
            profile.selectedWeaponId = weaponId;
        }
    });
}
function purchaseWeaponForProfile(weaponId) {
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
function createEnemySpawnConfig(config) {
    return Object.assign({ staticBody: false, archetype: STANDARD_ENEMY_ARCHETYPE }, config);
}
const MANUAL_LEVEL_DEFINITIONS = [
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
            const enemyConfigs = [
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
function getManualLevelDefinitions() {
    return MANUAL_LEVEL_DEFINITIONS;
}
function getManualLevelDefinition(sceneKey) {
    var _a;
    return (_a = MANUAL_LEVEL_DEFINITIONS.find((definition) => definition.sceneKey === sceneKey)) !== null && _a !== void 0 ? _a : MANUAL_LEVEL_DEFINITIONS[0];
}
function createTextButton(scene, config) {
    var _a, _b, _c, _d, _e;
    const container = scene.add.container(config.x, config.y);
    const background = scene.add.rexRoundRectangle(0, 0, config.width, config.height, (_a = config.radius) !== null && _a !== void 0 ? _a : DEFAULT_TEXT_BUTTON_STYLE.radius, (_b = config.backgroundColor) !== null && _b !== void 0 ? _b : DEFAULT_TEXT_BUTTON_STYLE.backgroundColor, 1);
    background.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
    background.setInteractive({ useHandCursor: true });
    const label = scene.add.text(0, 0, config.label, {
        font: (_c = config.font) !== null && _c !== void 0 ? _c : DEFAULT_TEXT_BUTTON_STYLE.font,
        fill: (_d = config.textColor) !== null && _d !== void 0 ? _d : DEFAULT_TEXT_BUTTON_STYLE.textColor
    }).setOrigin(0.5);
    container.add([background, label]);
    container.setDepth((_e = config.depth) !== null && _e !== void 0 ? _e : 1);
    if (config.parent) {
        config.parent.add(container);
    }
    return { container, background, label };
}
function bindFullscreenToggle(scene, button) {
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
const HUMANOID_PARTS = [
    // These values were tuned to preserve the humanoid silhouette of the ragdolls.
    { name: "head", label: "head", offsetX: 0, offsetY: -60, width: 34, height: 40, color: "#FFBC42", chamfer: (scale) => [15 * scale, 15 * scale, 15 * scale, 15 * scale] },
    { name: "chest", label: "chest", offsetX: 0, offsetY: 0, width: 55, height: 80, color: "#E0A423", chamfer: (scale) => [20 * scale, 20 * scale, 26 * scale, 26 * scale] },
    { name: "leftUpperArm", label: "left-arm", offsetX: -39, offsetY: -15, width: 20, height: 40, color: "#FFBC42", chamfer: (scale) => 10 * scale },
    { name: "leftLowerArm", label: "left-lower-arm", offsetX: -39, offsetY: 25, width: 20, height: 60, color: "#E59B12", chamfer: (scale) => 10 * scale },
    { name: "rightUpperArm", label: "right-arm", offsetX: 39, offsetY: -15, width: 20, height: 40, color: "#FFBC42", chamfer: (scale) => 10 * scale },
    { name: "rightLowerArm", label: "right-lower-arm", offsetX: 39, offsetY: 25, width: 20, height: 60, color: "#E59B12", chamfer: (scale) => 10 * scale },
    { name: "leftUpperLeg", label: "left-leg", offsetX: -20, offsetY: 57, width: 20, height: 40, color: "#FFBC42", chamfer: (scale) => 10 * scale },
    { name: "leftLowerLeg", label: "left-lower-leg", offsetX: -20, offsetY: 97, width: 20, height: 60, color: "#E59B12", chamfer: (scale) => 10 * scale },
    { name: "rightUpperLeg", label: "right-leg", offsetX: 20, offsetY: 57, width: 20, height: 40, color: "#FFBC42", chamfer: (scale) => 10 * scale },
    { name: "rightLowerLeg", label: "right-lower-leg", offsetX: 20, offsetY: 97, width: 20, height: 60, color: "#FFBC42", chamfer: (scale) => 10 * scale }
];
const HUMANOID_BODY_ORDER = [
    "chest",
    "head",
    "leftLowerArm",
    "leftUpperArm",
    "rightLowerArm",
    "rightUpperArm",
    "leftLowerLeg",
    "rightLowerLeg",
    "leftUpperLeg",
    "rightUpperLeg"
];
const HUMANOID_CONSTRAINTS = [
    { bodyA: "chest", bodyB: "rightUpperArm", length: (scale) => 25 * (scale * 0.6), stiffness: 0.6, pointA: { x: 24, y: -23 }, pointB: { x: 0, y: -8 } },
    { bodyA: "chest", bodyB: "leftUpperArm", length: (scale) => 25 * (scale * 0.6), stiffness: 0.6, pointA: { x: -24, y: -23 }, pointB: { x: 0, y: -8 } },
    { bodyA: "chest", bodyB: "leftUpperLeg", length: (scale) => 25 * (scale * 0.8), stiffness: 0.6, pointA: { x: -10, y: 30 }, pointB: { x: 0, y: -10 } },
    { bodyA: "chest", bodyB: "rightUpperLeg", length: (scale) => 25 * (scale * 0.8), stiffness: 0.6, pointA: { x: 10, y: 30 }, pointB: { x: 0, y: -10 } },
    { bodyA: "rightUpperArm", bodyB: "rightLowerArm", length: (scale) => 15 * (scale * 0.6), stiffness: 0.6, pointA: { x: 0, y: 15 }, pointB: { x: 0, y: -25 } },
    { bodyA: "leftUpperArm", bodyB: "leftLowerArm", length: (scale) => 15 * (scale * 0.6), stiffness: 0.6, pointA: { x: 0, y: 15 }, pointB: { x: 0, y: -25 } },
    { bodyA: "leftUpperLeg", bodyB: "leftLowerLeg", length: (scale) => 15 * (scale * 0.6), stiffness: 0.6, pointA: { x: 0, y: 20 }, pointB: { x: 0, y: -20 } },
    { bodyA: "rightUpperLeg", bodyB: "rightLowerLeg", length: (scale) => 15 * (scale * 0.6), stiffness: 0.6, pointA: { x: 0, y: 20 }, pointB: { x: 0, y: -20 } },
    { bodyA: "head", bodyB: "chest", length: () => 0, stiffness: 0.6, pointA: { x: 0, y: 25 }, pointB: { x: 0, y: -35 } },
    { bodyA: "leftLowerLeg", bodyB: "rightLowerLeg", length: (scale) => 50 * (scale * 0.4), stiffness: 0.01 }
];
const HUMANOID_SPRITES = [
    { bodyName: "head", texture: "aOpponentHead", scale: 0.22 },
    { bodyName: "chest", texture: "aOpponentBody", scale: 0.24 },
    { bodyName: "rightUpperArm", texture: "aOpponentShortLimb", scale: 0.24 },
    { bodyName: "rightLowerArm", texture: "aOpponentArm", scale: 0.24 },
    { bodyName: "leftUpperArm", texture: "aOpponentShortLimb", scale: 0.24 },
    { bodyName: "leftLowerArm", texture: "aOpponentArm", scale: 0.24 },
    { bodyName: "rightUpperLeg", texture: "aOpponentShortLimb", scale: 0.24 },
    { bodyName: "rightLowerLeg", texture: "aOpponentLeg", scale: 0.24 },
    { bodyName: "leftUpperLeg", texture: "aOpponentShortLimb", scale: 0.24 },
    { bodyName: "leftLowerLeg", texture: "aOpponentLeg", scale: 0.24 }
];
const PLAYER_COLLISION_GROUPS = {
    head: -2,
    chest: -15,
    leftUpperArm: -15,
    leftLowerArm: -15,
    rightUpperArm: -15,
    rightLowerArm: -15,
    leftUpperLeg: -14,
    leftLowerLeg: -14,
    rightUpperLeg: -15,
    rightLowerLeg: -15
};
class HumanoidFactory {
    constructor(scene) {
        this.scene = scene;
    }
    createEnemy(x, y, scale, options = {}) {
        return this.createHumanoid(x, y, scale, Object.assign(Object.assign({}, options), { showHealthDisplay: true, collisionGroupResolver: () => this.scene.matter.body.nextGroup(true) }));
    }
    createPlayer(x, y, scale, options = {}) {
        return this.createHumanoid(x, y, scale, Object.assign(Object.assign({}, options), { collisionGroupResolver: (partName) => PLAYER_COLLISION_GROUPS[partName] }));
    }
    createHumanoid(x, y, scale, options) {
        const resolvedScale = Math.abs(scale);
        const { staticBody = false, health = 1, flip = false, attackInterval = 0, delayAttack = 0, showHealthDisplay = false, collisionGroupResolver } = options;
        const parts = this.buildBodies(x, y, resolvedScale, staticBody, collisionGroupResolver);
        const constraints = this.buildConstraints(parts, resolvedScale);
        const person = this.scene.matter.composite.create({
            bodies: HUMANOID_BODY_ORDER.map((partName) => parts[partName]),
            constraints
        });
        this.scene.matter.body.setStatic(parts.chest, !staticBody);
        const spriteBundle = this.createLinkedSprites(parts, resolvedScale, flip);
        person.parts = parts;
        person.health = health;
        person.dead = false;
        person.linkedSprites = spriteBundle.sprites;
        person.linkedSpritesByPart = spriteBundle.spritesByPart;
        person.linkedArrows = [];
        person.throwingArm = parts.leftLowerArm;
        person.attackTelegraphSprite = spriteBundle.spritesByPart.leftLowerArm;
        person.activeStatusEffects = {};
        person.rewardMultiplier = 1;
        person.aimSpreadMultiplier = 1;
        person.throwForceMultiplier = 1;
        if (showHealthDisplay) {
            person.attackInterval = attackInterval;
            person.baseAttackInterval = attackInterval;
            person.timer = 0;
            person.currentDelay = 0;
            person.delayAttack = delayAttack;
            person.triggered = false;
            person.healthDisplay = this.scene.add.text(0, 0, `${person.health}`, { font: "40px Arial", fill: "#ffFFFF" }).setOrigin(0.5, 0.5);
            person.statusDisplay = this.scene.add.text(0, 0, "", { font: "22px Arial", fill: "#1b1b1b" }).setOrigin(0.5, 0.5);
        }
        return person;
    }
    buildBodies(x, y, scale, staticBody, collisionGroupResolver) {
        const parts = {};
        HUMANOID_PARTS.forEach((part) => {
            parts[part.name] = this.scene.matter.add.rectangle(x + part.offsetX * scale, y + part.offsetY * scale, part.width * scale, part.height * scale, {
                isStatic: staticBody,
                label: part.label,
                collisionFilter: {
                    group: collisionGroupResolver(part.name)
                },
                chamfer: {
                    radius: part.chamfer(scale)
                },
                render: {
                    fillStyle: part.color
                }
            });
        });
        return parts;
    }
    buildConstraints(parts, scale) {
        return HUMANOID_CONSTRAINTS.map((constraint) => this.scene.matter.add.constraint(parts[constraint.bodyA], parts[constraint.bodyB], constraint.length(scale), constraint.stiffness, {
            pointA: constraint.pointA ? { x: constraint.pointA.x * scale, y: constraint.pointA.y * scale } : undefined,
            pointB: constraint.pointB ? { x: constraint.pointB.x * scale, y: constraint.pointB.y * scale } : undefined,
            render: {
                visible: false
            }
        }));
    }
    createLinkedSprites(parts, scale, flip) {
        const sprites = [];
        const spritesByPart = {};
        HUMANOID_SPRITES.forEach((spriteConfig) => {
            const sprite = this.scene.add.sprite(0, 0, spriteConfig.texture).setScale(scale * spriteConfig.scale);
            sprite.linkedBody = parts[spriteConfig.bodyName];
            sprite.setFlipX(flip);
            sprites.push(sprite);
            spritesByPart[spriteConfig.bodyName] = sprite;
        });
        return { sprites, spritesByPart };
    }
    syncLinkedSprites(person) {
        if (!person || !person.linkedSprites) {
            return;
        }
        person.linkedSprites.forEach((sprite) => {
            if (!sprite.active || !sprite.linkedBody) {
                return;
            }
            sprite.setPosition(sprite.linkedBody.position.x, sprite.linkedBody.position.y);
            sprite.setRotation(sprite.linkedBody.angle);
        });
    }
}
const LEVEL_IMAGE_ASSETS = [
    ["aOpponentHead", "armoredOpponent-head.png"],
    ["aOpponentBody", "armoredOpponent-body.png"],
    ["aOpponentShortLimb", "armoredOpponent-shortLimb.png"],
    ["aOpponentLeg", "armoredOpponent-leg.png"],
    ["aOpponentArm", "armoredOpponent-arm.png"],
    ["arrow", "arrow.png"],
    ["bow", "bow.png"]
];
const LEVEL_PLUGINS = [
    ["rexroundrectangleplugin", "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexroundrectangleplugin.min.js"],
    ["rexkawaseblurpipelineplugin", "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexkawaseblurpipelineplugin.min.js"],
    ["rexdropshadowpipelineplugin", "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexdropshadowpipelineplugin.min.js"]
];
const PLAYER_SPAWN = { x: 75, y: 850 };
const WORLD_BOUNDS = {
    ground: { x: 1920 / 2, y: 1300, width: 2000, height: 500 },
    ceiling: { x: 1920 / 2, y: -1000, width: 2000, height: 500 },
    rightWall: { x: 1920 + 240, y: (1080 / 2) - 1000, width: 500, height: 3500 },
    leftWall: { x: -240, y: (1080 / 2) - 1000, width: 500, height: 3500 }
};
const HUD_STYLES = {
    charge: { font: "20px Arial", fill: "#ffff00" },
    playerHealth: { font: "20px Arial", fill: "#ff1010" },
    currency: { font: "32px Arial", fill: "#1b1b1b" },
    weapon: { font: "24px Arial", fill: "#1b1b1b" }
};
const ENEMY_STATUS_ORDER = ["bounty", "burn", "scatter", "jam"];
class LevelScene extends LooseScene {
    init(data = {}) {
        this.levelData = data;
        this.startTime = 0;
        this.sceneDuration = 0;
    }
    preload() {
        this.load.path = "./assets/";
        LEVEL_IMAGE_ASSETS.forEach(([key, file]) => this.load.image(key, file));
        LEVEL_PLUGINS.forEach(([key, url]) => this.load.plugin(key, url, true));
    }
    create() {
        this.initializeLevelState();
        this.registerDebugControls();
        this.registerSceneEvents();
        this.createHud();
        this.createPlayerRig();
        this.createWorldBounds();
    }
    initializeLevelState() {
        this.startTime = this.sys.game.loop.time;
        this.sceneDuration = 0;
        this.levelScale = this.levelData.scale != null ? this.levelData.scale : 1;
        this.ragdollFactory = new HumanoidFactory(this);
        this.matter.world.engine.timing.timeScale = 1;
        this.playerProfile = loadPlayerProfile();
        this.playerLoadout = createPlayerLoadout(this.playerProfile.selectedWeaponId);
        this.nextCombatantId = 0;
        this.bowStream = false;
        this.instaCharge = false;
        this.canCharge = true;
        this.chargeTime = 0;
        this.isLevelEnding = false;
        this.arrowsShot = 0;
        this.arrowsHit = 0;
        this.kills = 0;
        this.currencyEarned = 0;
        this.spawnedArrows = this.createArrowCollection("player");
        this.opponentArrows = this.createArrowCollection("enemy");
        this.humanoids = [];
        this.mousex = this.input.activePointer.x;
        this.mousey = this.input.activePointer.y;
        this.events.removeAllListeners("levelEnd");
        this.events.removeAllListeners("arrowHit");
        this.events.removeAllListeners("nextWave");
    }
    createArrowCollection(owner) {
        const arrows = [];
        arrows.owner = owner;
        arrows.fromplayer = owner === "player";
        return arrows;
    }
    registerDebugControls() {
        const down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        const right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        const up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        const escape = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        down.on("down", () => {
            this.bowStream = !this.bowStream;
        });
        right.on("down", () => {
            this.instaCharge = !this.instaCharge;
        });
        up.on("up", () => {
            this.scene.restart(this.levelData);
        });
        escape.on("down", () => {
            this.openPauseMenu();
        });
    }
    registerSceneEvents() {
        this.events.on("arrowHit", (hits) => {
            this.arrowsHit += hits;
        });
        this.events.on("levelEnd", () => {
            this.detachBowConstraints();
        });
    }
    createHud() {
        this.chargeDisplay = this.add.text(0, 0, "Charge: 0", HUD_STYLES.charge);
        this.chargeDisplay.setOrigin(0.5, 0.5).setDepth(10);
        this.currencyDisplay = this.add.text(960, 52, "", HUD_STYLES.currency).setOrigin(0.5, 0.5).setDepth(25);
        this.weaponDisplay = this.add.text(960, 92, "", HUD_STYLES.weapon).setOrigin(0.5, 0.5).setDepth(25);
        this.refreshEconomyDisplay();
        this.createSystemButtons();
    }
    refreshEconomyDisplay() {
        this.currencyDisplay.setText(`Money: $${this.playerProfile.currency}`);
        this.weaponDisplay.setText(`Weapon: ${this.playerLoadout.weapon.name}`);
    }
    createSystemButtons() {
        const pauseButton = createTextButton(this, {
            x: 110,
            y: 60,
            width: 180,
            height: 78,
            label: "Pause",
            backgroundColor: 0xffd166,
            depth: 25
        });
        pauseButton.background.on("pointerup", () => {
            this.openPauseMenu();
        });
        const fullscreenButton = createTextButton(this, {
            x: 1785,
            y: 60,
            width: 240,
            height: 78,
            label: "Fullscreen",
            backgroundColor: 0x8ecae6,
            depth: 25
        });
        bindFullscreenToggle(this, fullscreenButton);
    }
    openPauseMenu() {
        if (this.isLevelEnding || this.scene.isActive("PauseScene") || this.scene.isActive("SummaryScene")) {
            return;
        }
        this.chargeTime = 0;
        this.chargeDisplay.setText("Charge: 0");
        this.scene.launch("PauseScene", {
            currentLevel: this.currentLevel,
            levelData: this.levelData
        });
        this.scene.bringToTop("PauseScene");
        this.scene.pause();
    }
    createPlayerRig() {
        const playerItems = this.createPlayer(PLAYER_SPAWN.x, PLAYER_SPAWN.y, Math.abs(this.levelScale), 10);
        this.bow = playerItems.playerContainer;
        this.bowSprite = playerItems.bowSprite;
        this.player = playerItems.player;
        this.player.loadout = this.playerLoadout;
        this.player.healthDisplay = this.add.text(PLAYER_SPAWN.x, PLAYER_SPAWN.y - 100, "Health: 10", HUD_STYLES.playerHealth);
        this.player.healthDisplay.setOrigin(0.5, 0.5);
        this.rightArmBowConstraint = this.matter.add.constraint(this.player.parts.rightLowerArm, this.bowSprite.body, 0, 0.001, {
            pointA: { x: 0, y: 0 },
            pointB: { x: 0, y: 0 },
            render: { visible: false }
        });
        this.leftArmBowConstraint = this.matter.add.constraint(this.player.parts.leftLowerArm, this.bowSprite.body, 0, 0.001, {
            pointA: { x: 0, y: 0 },
            pointB: { x: 0, y: 0 },
            render: { visible: false }
        });
    }
    detachBowConstraints() {
        if (this.rightArmBowConstraint) {
            this.matter.world.removeConstraint(this.rightArmBowConstraint);
        }
        if (this.leftArmBowConstraint) {
            this.matter.world.removeConstraint(this.leftArmBowConstraint);
        }
    }
    createWorldBounds() {
        this.matter.add.rectangle(WORLD_BOUNDS.ground.x, WORLD_BOUNDS.ground.y, WORLD_BOUNDS.ground.width, WORLD_BOUNDS.ground.height, { isStatic: true });
        this.matter.add.rectangle(WORLD_BOUNDS.ceiling.x, WORLD_BOUNDS.ceiling.y, WORLD_BOUNDS.ceiling.width, WORLD_BOUNDS.ceiling.height, { isStatic: true });
        this.add.rectangle(WORLD_BOUNDS.ground.x, WORLD_BOUNDS.ground.y, WORLD_BOUNDS.ground.width, WORLD_BOUNDS.ground.height, 0x01FFA3);
        this.matter.add.rectangle(WORLD_BOUNDS.rightWall.x, WORLD_BOUNDS.rightWall.y, WORLD_BOUNDS.rightWall.width, WORLD_BOUNDS.rightWall.height, { isStatic: true });
        this.matter.add.rectangle(WORLD_BOUNDS.leftWall.x, WORLD_BOUNDS.leftWall.y, WORLD_BOUNDS.leftWall.width, WORLD_BOUNDS.leftWall.height, { isStatic: true });
    }
    update(time, delta) {
        this.updateSceneTimer();
        this.updatePointerTracking();
        this.updateChargeDisplayPosition();
        this.handlePlayerCharge();
        this.updateBowAim();
        this.syncRagdollSprites();
        const humanoidsDefeated = this.checkCombatCollisions();
        this.updateHumanoidAI(delta);
        this.updatePlayerHealthDisplay();
        this.handlePlayerDefeat();
        this.handleWaveVictory(humanoidsDefeated);
    }
    updateSceneTimer() {
        if (!this.isLevelEnding) {
            this.sceneDuration = this.sys.game.loop.time - this.startTime;
        }
    }
    updatePointerTracking() {
        const pointer = this.input.activePointer;
        if (!this.isLevelEnding) {
            this.mousex = pointer.x;
            this.mousey = pointer.y;
        }
    }
    updateChargeDisplayPosition() {
        this.chargeDisplay.x = this.mousex;
        this.chargeDisplay.y = this.mousey - 20;
    }
    handlePlayerCharge() {
        const pointer = this.input.activePointer;
        const scaleMagnitude = Math.abs(this.levelScale) || 1;
        if (pointer.isDown && this.canCharge) {
            if (this.bowStream) {
                this.firePlayerArrow(100 + 10 / scaleMagnitude);
                this.chargeTime = 0;
            }
            else if (this.instaCharge) {
                this.chargeTime = 100;
            }
            else if (this.chargeTime < 100) {
                this.chargeTime = this.chargeTime === 0 ? 1 : this.chargeTime * 1.1;
                this.chargeTime = Math.min(this.chargeTime, 100);
            }
            this.chargeDisplay.setText(`Charge: ${this.chargeTime.toFixed(1)}`);
            return;
        }
        if (this.chargeTime > 0) {
            this.firePlayerArrow(this.chargeTime + 10 / scaleMagnitude);
            this.chargeTime = 0;
            this.chargeDisplay.setText("Charge: 0");
        }
    }
    firePlayerArrow(power) {
        this.shootArrow(power * this.playerLoadout.powerMultiplier, this.levelScale, this.bow, this.mousex, this.mousey, this.playerLoadout.projectile, this.spawnedArrows);
        this.arrowsShot += 1;
    }
    updateBowAim() {
        if (this.rightArmBowConstraint) {
            this.rightArmBowConstraint.pointB.x = this.mousex;
            this.rightArmBowConstraint.pointB.y = this.mousey;
        }
        if (this.leftArmBowConstraint) {
            this.leftArmBowConstraint.pointB.x = this.mousex + 300;
            this.leftArmBowConstraint.pointB.y = this.mousey + 500;
        }
        const angle = Phaser.Math.Angle.Between(this.bow.x, this.bow.y, this.mousex, this.mousey);
        this.bow.rotation = angle;
    }
    syncRagdollSprites() {
        this.ragdollFactory.syncLinkedSprites(this.player);
        this.humanoids.forEach((humanoid) => this.ragdollFactory.syncLinkedSprites(humanoid));
    }
    checkCombatCollisions() {
        let humanoidsDefeated = true;
        this.humanoids.forEach((humanoid) => {
            this.checkArrowCollisions(this.spawnedArrows, humanoid);
            if (humanoid.health > 0) {
                humanoidsDefeated = false;
            }
        });
        this.checkArrowCollisions(this.opponentArrows, this.player);
        return humanoidsDefeated;
    }
    updateHumanoidAI(delta) {
        this.humanoids.forEach((humanoid) => {
            if (humanoid.health > 0) {
                this.updateHumanoidStatusEffects(humanoid, delta);
                if (humanoid.health <= 0) {
                    return;
                }
                humanoid.healthDisplay.x = humanoid.parts.head.position.x;
                humanoid.healthDisplay.y = humanoid.parts.head.position.y;
                humanoid.healthDisplay.setText(`${humanoid.health}`);
                humanoid.statusDisplay.x = humanoid.parts.head.position.x;
                humanoid.statusDisplay.y = humanoid.parts.head.position.y - 34;
                humanoid.timer += delta;
                if (humanoid.timer >= humanoid.attackInterval) {
                    humanoid.timer -= humanoid.attackInterval;
                    if (humanoid.currentDelay <= humanoid.delayAttack) {
                        humanoid.currentDelay += 1;
                    }
                    else {
                        this.humanoidAttack(humanoid, this.levelScale, this.rollAttackPower(humanoid), this.player);
                    }
                    if (humanoid.currentDelay >= humanoid.delayAttack && !humanoid.triggered) {
                        humanoid.triggered = true;
                        humanoid.attackTelegraphSprite.preFX.addGlow(humanoid.archetype.attack.telegraphColor, humanoid.archetype.attack.telegraphThickness, humanoid.archetype.attack.telegraphOuterStrength);
                    }
                }
            }
        });
    }
    updateHumanoidStatusEffects(humanoid, delta) {
        const activeEffects = humanoid.activeStatusEffects;
        if (!activeEffects) {
            return;
        }
        let pendingBurnDamage = 0;
        ENEMY_STATUS_ORDER.forEach((statusKind) => {
            const activeStatus = activeEffects[statusKind];
            if (!activeStatus) {
                return;
            }
            if (activeStatus.remainingMs != null) {
                activeStatus.remainingMs -= delta;
                if (activeStatus.remainingMs <= 0) {
                    delete activeEffects[statusKind];
                    return;
                }
            }
            if (activeStatus.effect.kind === "burn") {
                activeStatus.tickTimerMs += delta;
                while (activeStatus.tickTimerMs >= activeStatus.effect.tickIntervalMs) {
                    activeStatus.tickTimerMs -= activeStatus.effect.tickIntervalMs;
                    pendingBurnDamage += activeStatus.effect.damagePerTick * activeStatus.stacks;
                }
            }
        });
        if (pendingBurnDamage > 0) {
            this.applyStatusDamage(humanoid, pendingBurnDamage);
        }
        this.refreshHumanoidStatusModifiers(humanoid);
        this.refreshHumanoidStatusDisplay(humanoid);
    }
    applyStatusDamage(person, damage) {
        if (person.health <= 0) {
            return;
        }
        person.linkedSprites.forEach((sprite) => {
            sprite.setTint(0xff7b00);
        });
        person.health -= damage;
        this.time.delayedCall(120, () => {
            person.linkedSprites.forEach((sprite) => {
                sprite.clearTint();
            });
        });
        if (person.health <= 0) {
            this.handlePersonDeath(person);
        }
    }
    applyProjectileStatusEffects(person, statusEffects) {
        if (!statusEffects || statusEffects.length === 0 || person === this.player || !person.activeStatusEffects) {
            return;
        }
        statusEffects.forEach((statusEffect) => {
            this.applyEnemyStatusEffect(person, statusEffect);
        });
        this.refreshHumanoidStatusModifiers(person);
        this.refreshHumanoidStatusDisplay(person);
    }
    applyEnemyStatusEffect(person, statusEffect) {
        var _a;
        const activeEffects = person.activeStatusEffects;
        const existingStatus = activeEffects[statusEffect.kind];
        const maxStacks = Math.max(1, (_a = statusEffect.maxStacks) !== null && _a !== void 0 ? _a : 1);
        const durationMs = statusEffect.durationMs != null && statusEffect.durationMs > 0
            ? statusEffect.durationMs
            : undefined;
        if (!existingStatus) {
            activeEffects[statusEffect.kind] = {
                effect: Object.assign({}, statusEffect),
                stacks: 1,
                remainingMs: durationMs,
                tickTimerMs: 0
            };
            return;
        }
        existingStatus.effect = Object.assign({}, statusEffect);
        existingStatus.stacks = Math.min(existingStatus.stacks + 1, maxStacks);
        if (durationMs != null) {
            existingStatus.remainingMs = durationMs;
        }
    }
    refreshHumanoidStatusModifiers(humanoid) {
        let rewardMultiplier = 1;
        let aimSpreadMultiplier = 1;
        let attackIntervalMultiplier = 1;
        let throwForceMultiplier = 1;
        ENEMY_STATUS_ORDER.forEach((statusKind) => {
            var _a;
            const activeStatus = (_a = humanoid.activeStatusEffects) === null || _a === void 0 ? void 0 : _a[statusKind];
            if (!activeStatus) {
                return;
            }
            switch (activeStatus.effect.kind) {
                case "bounty":
                    rewardMultiplier += activeStatus.effect.rewardMultiplierPerStack * activeStatus.stacks;
                    break;
                case "scatter":
                    aimSpreadMultiplier += activeStatus.effect.aimSpreadMultiplierPerStack * activeStatus.stacks;
                    throwForceMultiplier -= activeStatus.effect.throwForceReductionPerStack * activeStatus.stacks;
                    break;
                case "jam":
                    attackIntervalMultiplier += activeStatus.effect.attackIntervalMultiplierPerStack * activeStatus.stacks;
                    throwForceMultiplier -= activeStatus.effect.throwForceReductionPerStack * activeStatus.stacks;
                    break;
                default:
                    break;
            }
        });
        humanoid.rewardMultiplier = rewardMultiplier;
        humanoid.aimSpreadMultiplier = aimSpreadMultiplier;
        humanoid.throwForceMultiplier = Math.max(0.2, throwForceMultiplier);
        if (humanoid.baseAttackInterval != null) {
            humanoid.attackInterval = Math.max(250, humanoid.baseAttackInterval * attackIntervalMultiplier);
        }
    }
    refreshHumanoidStatusDisplay(humanoid) {
        if (!humanoid.statusDisplay) {
            return;
        }
        const statusSegments = [];
        ENEMY_STATUS_ORDER.forEach((statusKind) => {
            var _a;
            const activeStatus = (_a = humanoid.activeStatusEffects) === null || _a === void 0 ? void 0 : _a[statusKind];
            if (!activeStatus) {
                return;
            }
            switch (activeStatus.effect.kind) {
                case "bounty":
                    statusSegments.push(`Cash x${(1 + activeStatus.effect.rewardMultiplierPerStack * activeStatus.stacks).toFixed(2)}`);
                    break;
                case "burn":
                    statusSegments.push(`Burn ${activeStatus.stacks}`);
                    break;
                case "scatter":
                    statusSegments.push(`Scatter ${activeStatus.stacks}`);
                    break;
                case "jam":
                    statusSegments.push(`Slow ${activeStatus.stacks}`);
                    break;
                default:
                    break;
            }
        });
        humanoid.statusDisplay.setText(statusSegments.join("  |  "));
    }
    rollAttackPower(humanoid) {
        const attackConfig = humanoid.archetype.attack;
        return (Math.random() * (attackConfig.powerMax - attackConfig.powerMin)) + attackConfig.powerMin;
    }
    updatePlayerHealthDisplay() {
        this.player.healthDisplay.setText(`Health: ${this.player.health}`);
        this.player.healthDisplay.x = this.player.parts.chest.position.x;
        this.player.healthDisplay.y = this.player.parts.chest.position.y - 100;
    }
    handlePlayerDefeat() {
        if (this.player.health > 0 || this.isLevelEnding) {
            return;
        }
        this.events.emit("levelEnd", { victory: false });
        this.isLevelEnding = true;
        this.canCharge = false;
        this.releaseBow();
        this.time.delayedCall(5000, () => {
            this.showSummary();
        });
    }
    releaseBow() {
        const releasePosition = this.player.parts.rightLowerArm.position;
        this.bow.list.forEach((item) => {
            item.x = releasePosition.x;
            item.y = releasePosition.y;
            item.setStatic(false);
            item.body.collisionFilter.group = -1;
        });
        this.bow.removeAll(false);
    }
    handleWaveVictory(humanoidsDefeated) {
        if (!humanoidsDefeated || this.isLevelEnding) {
            return;
        }
        this.isLevelEnding = true;
        if (this.currentLevel !== "TimedLevel") {
            this.events.emit("levelEnd", { victory: true });
            this.addSlowdown();
            this.time.delayedCall(5000, () => {
                this.showSummary();
            });
        }
        else {
            this.addSlowdown();
            this.time.delayedCall(5000, () => {
                this.events.emit("nextWave", { victory: true });
                this.matter.world.engine.timing.timeScale = 1;
                this.isLevelEnding = false;
            });
        }
    }
    addSlowdown() {
        let deltaTime = 0;
        const scaleMagnitude = Math.abs(this.levelScale) || 1;
        this.tweens.addCounter({
            from: 0,
            to: 1000,
            onUpdate: (tween) => {
                if (deltaTime === 0) {
                    deltaTime = tween.getValue();
                }
                else {
                    deltaTime = Math.abs(deltaTime - tween.getValue());
                }
                for (let iterations = 0; iterations < deltaTime / (200 / scaleMagnitude + 0.2); iterations++) {
                    this.matter.world.engine.timing.timeScale = this.matter.world.engine.timing.timeScale > 0.001
                        ? this.matter.world.engine.timing.timeScale * 0.975
                        : 0.001;
                }
            }
        });
    }
    showSummary() {
        this.humanoids.forEach((humanoid) => {
            humanoid.linkedSprites.forEach((sprite) => {
                sprite.setAlpha(0.01);
            });
        });
        this.scene.launch("SummaryScene", {
            arrowsHit: this.arrowsHit,
            arrowsShot: this.arrowsShot,
            health: this.player.health,
            maxHealth: 10,
            duration: this.sceneDuration,
            currentLevel: this.currentLevel,
            nextLevel: this.nextLevel,
            kills: this.kills,
            currencyEarned: this.currencyEarned,
            totalCurrency: this.playerProfile.currency
        });
        this.plugins.get("rexkawaseblurpipelineplugin").add(this.cameras.main, {
            blur: 5,
            quality: 3
        });
        this.scene.pause();
    }
    constructHumanoid(x, y, scale, staticBody, health, flip, attackInterval, delay) {
        return this.spawnEnemy(createEnemySpawnConfig({
            x,
            y,
            scale,
            staticBody,
            health,
            flip,
            attackInterval,
            attackDelay: delay
        }));
    }
    spawnEnemy(config) {
        const enemy = this.assignCombatId(this.ragdollFactory.createEnemy(config.x, config.y, config.scale, {
            staticBody: config.staticBody,
            health: config.health,
            flip: config.flip,
            attackInterval: config.attackInterval,
            delayAttack: config.attackDelay
        }));
        enemy.archetype = config.archetype;
        enemy.spawnConfig = config;
        return enemy;
    }
    spawnEnemies(configs) {
        return configs.map((config) => this.spawnEnemy(config));
    }
    humanoidAttack(humanoid, scale, power, player) {
        var _a, _b;
        const spawnpoint = humanoid.throwingArm;
        const attackConfig = humanoid.archetype.attack;
        const aimSpreadMultiplier = (_a = humanoid.aimSpreadMultiplier) !== null && _a !== void 0 ? _a : 1;
        const throwForceMultiplier = (_b = humanoid.throwForceMultiplier) !== null && _b !== void 0 ? _b : 1;
        const aimSpreadX = attackConfig.aimSpreadX * aimSpreadMultiplier;
        const aimSpreadY = attackConfig.aimSpreadY * aimSpreadMultiplier;
        spawnpoint.force = {
            x: attackConfig.throwForceX * scale * throwForceMultiplier,
            y: attackConfig.throwForceY * scale * throwForceMultiplier
        };
        const resolvedScale = Math.abs(scale);
        const targetBody = player.bodies[Math.floor(Math.random() * player.bodies.length)];
        const targetPosition = targetBody.position;
        const angle = Phaser.Math.Angle.Between(spawnpoint.position.x, spawnpoint.position.y, targetPosition.x + (Math.random() * aimSpreadX * 2 - aimSpreadX), targetPosition.y + (Math.random() * aimSpreadY * 2 - aimSpreadY));
        const speed = power * resolvedScale;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        const newArrow = this.spawnArrow(spawnpoint.position.x, spawnpoint.position.y, angle, velocityX, velocityY, resolvedScale, humanoid.archetype.projectile);
        this.opponentArrows.push(newArrow);
        this.time.delayedCall(attackConfig.cleanupDelayMs, () => {
            if (newArrow) {
                this.destroyArrow(newArrow, this.opponentArrows);
            }
        });
    }
    constructPlayer(x, y, scale, staticBody, health, flip) {
        return this.assignCombatId(this.ragdollFactory.createPlayer(x, y, scale, {
            staticBody,
            health,
            flip
        }));
    }
    assignCombatId(person) {
        person.combatId = `combatant-${this.nextCombatantId}`;
        this.nextCombatantId += 1;
        return person;
    }
    spawnArrow(x, y, angle, velocityX, velocityY, scale, projectileConfig) {
        var _a;
        const arrow = this.matter.add.image(x, y, projectileConfig.texture, null);
        arrow.setScale(projectileConfig.scale * scale);
        arrow.setAngle(angle);
        arrow.setVelocity(velocityX, velocityY);
        arrow.rotation = angle;
        arrow.alreadyHit = false;
        arrow.projectileConfig = projectileConfig;
        arrow.body.collisionFilter.group = projectileConfig.collisionGroup;
        arrow.hitTargetIds = [];
        arrow.piercesRemaining = (_a = projectileConfig.pierceCount) !== null && _a !== void 0 ? _a : 0;
        if (projectileConfig.tint != null) {
            arrow.setTint(projectileConfig.tint);
        }
        return arrow;
    }
    shootArrow(power, scale, bow, mousex, mousey, projectileConfig, arrowList) {
        const resolvedScale = Math.abs(scale);
        const angle = Phaser.Math.Angle.Between(bow.x, bow.y, mousex, mousey);
        const speed = power * resolvedScale;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        const newArrow = this.spawnArrow(bow.x, bow.y, angle, velocityX, velocityY, resolvedScale, projectileConfig);
        arrowList.push(newArrow);
        this.time.delayedCall(projectileConfig.lifetimeMs, () => {
            if (newArrow) {
                this.destroyArrow(newArrow, arrowList);
            }
        });
        while (arrowList.length > projectileConfig.maxActive) {
            this.destroyArrow(arrowList[0], arrowList);
        }
    }
    destroyArrow(arrow, arrowList) {
        if (!arrow || !arrow.active) {
            return;
        }
        if (arrowList != null) {
            const arrowIndex = arrowList.indexOf(arrow);
            if (arrowIndex >= 0) {
                arrowList.splice(arrowIndex, 1);
            }
        }
        this.tweens.add({
            targets: [arrow],
            alpha: "0",
            duration: 1000,
            ease: "Cubic.easeOut",
            repeat: 0,
            onComplete: () => {
                if (arrow.bodyConstraint) {
                    this.matter.world.removeConstraint(arrow.bodyConstraint);
                }
                arrow.active = false;
                arrow.destroy();
            }
        });
    }
    createPlayer(x, y, scale, health) {
        const aimArrow = this.createStaticWeaponSprite(this.playerLoadout.projectile.texture, scale, this.playerLoadout.projectile.tint);
        const bowSprite = this.createStaticWeaponSprite(this.playerLoadout.weapon.bowTexture, scale, this.playerLoadout.weapon.bowTint);
        const player = this.constructPlayer(x, y, scale, false, health, false);
        const playerContainer = this.add.container(x, y);
        playerContainer.add([bowSprite, aimArrow]);
        return { player, playerContainer, bowSprite, aimArrow };
    }
    createStaticWeaponSprite(texture, scale, tint) {
        const weaponSprite = this.matter.add.image(100, 0, texture, null);
        weaponSprite.setStatic(true);
        weaponSprite.setScale(0.2 * scale);
        if (tint != null) {
            weaponSprite.setTint(tint);
        }
        return weaponSprite;
    }
    checkArrowCollisions(arrowList, person) {
        arrowList.slice().forEach((arrow) => {
            if (!arrow || !arrow.body) {
                return;
            }
            for (const part of person.bodies) {
                const collision = this.matter.collision.collides(arrow.body, part);
                if (!collision) {
                    continue;
                }
                this.handleArrowCollision(arrow, arrowList, person, part);
                if (arrow.alreadyHit) {
                    break;
                }
            }
        });
    }
    handleArrowCollision(arrow, arrowList, person, part) {
        if (arrow.alreadyHit || arrow.hitTargetIds.includes(person.combatId)) {
            return;
        }
        const shouldStick = arrow.piercesRemaining <= 0;
        arrow.hitTargetIds.push(person.combatId);
        if (person.health > 0) {
            person.linkedSprites.forEach((sprite) => {
                sprite.setTint(0xff0000);
            });
            person.health -= part.label === "head"
                ? arrow.projectileConfig.damage.head
                : arrow.projectileConfig.damage.body;
            if (arrowList.fromplayer) {
                this.events.emit("arrowHit", 1);
            }
            this.time.delayedCall(250, () => {
                person.linkedSprites.forEach((sprite) => {
                    sprite.clearTint();
                });
            });
            if (arrowList.fromplayer) {
                this.applyProjectileStatusEffects(person, arrow.projectileConfig.statusEffects);
            }
            if (person.health <= 0) {
                this.handlePersonDeath(person);
            }
        }
        if (shouldStick) {
            this.stickArrowToPart(arrow, person, part);
            return;
        }
        arrow.piercesRemaining -= 1;
    }
    stickArrowToPart(arrow, person, part) {
        arrow.bodyConstraint = this.matter.add.constraint(arrow, part, 0, 0, {
            pointA: {
                x: (0.5 - Math.random()) * 75,
                y: (0.5 - Math.random()) * 30
            },
            pointB: { x: 0, y: 0 },
            render: { visible: true }
        });
        person.linkedArrows.push(arrow);
        arrow.body.collisionFilter.group = part.collisionFilter.group;
        arrow.alreadyHit = true;
    }
    handlePersonDeath(person) {
        var _a, _b, _c;
        if (person.dead) {
            return;
        }
        person.dead = true;
        if (person !== this.player) {
            this.kills += 1;
            const baseReward = (_b = (_a = person.archetype) === null || _a === void 0 ? void 0 : _a.currencyReward) !== null && _b !== void 0 ? _b : 0;
            const reward = Math.max(0, Math.round(baseReward * ((_c = person.rewardMultiplier) !== null && _c !== void 0 ? _c : 1)));
            if (reward > 0) {
                this.playerProfile = updatePlayerProfile((profile) => {
                    profile.currency += reward;
                });
                this.currencyEarned += reward;
                this.refreshEconomyDisplay();
                this.showCurrencyReward(person, reward);
            }
        }
        if (person.healthDisplay) {
            person.healthDisplay.setText("");
        }
        if (person.statusDisplay) {
            person.statusDisplay.setText("");
        }
        person.activeStatusEffects = {};
        person.bodies.forEach((bodyPart) => {
            if (bodyPart.label === "chest") {
                this.matter.body.setStatic(bodyPart, false);
            }
        });
        this.time.delayedCall(2500, () => {
            person.constraints.forEach((constraint) => {
                this.matter.world.removeConstraint(constraint);
            });
            person.bodies.forEach((bodyPart) => {
                bodyPart.collisionFilter.group = -1;
            });
            person.linkedArrows.forEach((linkedArrow) => {
                if (linkedArrow.body) {
                    linkedArrow.body.collisionFilter.group = -1;
                }
            });
            this.tweens.add({
                delay: 1000,
                targets: person.linkedSprites,
                alpha: { from: 1, to: 0.25 },
                duration: 2000,
                ease: "Cubic.easeOut",
                repeat: 0
            });
        });
    }
    showCurrencyReward(person, reward) {
        const rewardText = this.add.text(person.parts.head.position.x, person.parts.head.position.y - 60, `+$${reward}`, { font: "bold 28px Arial", fill: "#ffd166" }).setOrigin(0.5, 0.5).setDepth(30);
        this.tweens.add({
            targets: rewardText,
            y: rewardText.y - 60,
            alpha: { from: 1, to: 0 },
            duration: 900,
            ease: "Cubic.out",
            onComplete: () => {
                rewardText.destroy();
            }
        });
    }
}
class ManualLevelScene extends LevelScene {
    constructor(manualLevelKey) {
        super(manualLevelKey);
        this.manualLevelKey = manualLevelKey;
    }
    create() {
        var _a, _b;
        super.create();
        const definition = getManualLevelDefinition(this.manualLevelKey);
        this.currentLevel = definition.sceneKey;
        this.nextLevel = definition.nextLevel;
        if (definition.instructions) {
            const instructions = this.add.text(definition.instructions.x, definition.instructions.y, definition.instructions.text, {
                font: (_a = definition.instructions.font) !== null && _a !== void 0 ? _a : "bold 40px Arial",
                fill: (_b = definition.instructions.fill) !== null && _b !== void 0 ? _b : "#ffffff"
            });
            this.events.once("levelEnd", () => {
                instructions.destroy();
            });
        }
        this.humanoids.push(...this.spawnEnemies(definition.createEnemyConfigs(this.levelScale)));
    }
}
class Menu extends LooseScene {
    init(data) {
    }
    preload() {
        this.load.plugin("rexroundrectangleplugin", "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexroundrectangleplugin.min.js", true);
        this.load.plugin("rexkawaseblurpipelineplugin", "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexkawaseblurpipelineplugin.min.js", true);
        this.load.plugin("rexdropshadowpipelineplugin", "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexdropshadowpipelineplugin.min.js", true);
    }
    create() {
    }
    update() {
    }
    closeMenu(originalScene, nextScene, config) {
        this.scene.stop("SummaryScene");
        this.scene.start(nextScene, config);
        if (nextScene !== originalScene) {
            this.scene.stop(originalScene);
        }
    }
    menuLeave(target, originalScene, nextScene, config) {
        this.tweens.add({
            targets: target,
            x: 3550,
            duration: 500,
            ease: "Cubic.in",
            onComplete: () => {
                this.time.delayedCall(250, () => {
                    this.closeMenu(originalScene, nextScene, config);
                });
            }
        });
    }
}
class TimedLevel extends LevelScene {
    constructor() {
        super("TimedLevel");
    }
    preload() {
        super.preload();
    }
    create() {
        super.create();
        this.currentLevel = "TimedLevel";
        this.nextLevel = "MainMenu";
        this.totaltime = 90;
        this.timerDisplay = this.add.text(1920 / 2, 100, `Time: ${(this.totaltime - this.sceneDuration / 1000).toFixed(2)}s`, { font: "40px Arial", fill: "#FFFFFF" });
        this.timerDisplay.setOrigin(0.5, 0.5);
        this.events.on("nextWave", () => {
            this.totaltime += 5;
            this.nextWave();
        });
        this.events.emit("nextWave", { victory: true });
    }
    update(time, delta) {
        super.update(time, delta);
        this.timerDisplay.setText(`Time: ${(this.totaltime - this.sceneDuration / 1000).toFixed(2)}s`);
        if (this.totaltime - this.sceneDuration / 1000 < 0 && !this.isLevelEnding) {
            this.events.emit("levelEnd", { victory: true });
            this.isLevelEnding = true;
            let count = 0;
            this.humanoids.forEach((humanoid) => {
                if (humanoid.health <= 0) {
                    count += 1;
                }
            });
            this.kills = count;
            this.addSlowdown();
            this.time.delayedCall(5000, () => {
                this.showSummary();
            });
        }
    }
    nextWave() {
        let humanoidCount = Math.random() * 4 + 5;
        const amalgamSpawned = Math.random() < 0.3;
        const waveConfigs = [];
        if (amalgamSpawned) {
            const weirdAmalgamX = Math.random() * 1400 + 500;
            const weirdAmalgamY = Math.random() * 900 + 100;
            const weirdAmalgamScale = Math.random() + 0.2;
            for (let count = 0; count < humanoidCount; count++) {
                waveConfigs.push(createEnemySpawnConfig({
                    x: weirdAmalgamX - count,
                    y: weirdAmalgamY,
                    scale: weirdAmalgamScale,
                    health: 1,
                    flip: true,
                    attackInterval: Math.random() * 2500 + 750,
                    attackDelay: Math.random() * 10 + 15
                }));
            }
        }
        humanoidCount = amalgamSpawned ? Math.random() * 4 + 1 : Math.random() * 6 + 2;
        for (let count = 0; count < humanoidCount; count++) {
            const difficulty = Math.random();
            waveConfigs.push(createEnemySpawnConfig({
                x: Math.random() * 1400 + 500,
                y: Math.random() * 900 + 100,
                scale: this.levelScale + (difficulty - 0.5),
                health: Math.floor(difficulty * 5) + 1,
                flip: true,
                attackInterval: Math.random() * 5000 + 750,
                attackDelay: Math.random() * 9 + 1
            }));
        }
        this.humanoids.push(...this.spawnEnemies(waveConfigs));
    }
}
class PauseScene extends Menu {
    constructor() {
        super("PauseScene");
    }
    init(data) {
        var _a;
        this.currentLevel = data.currentLevel;
        this.levelData = (_a = data.levelData) !== null && _a !== void 0 ? _a : { scale: 1 };
    }
    preload() {
        super.preload();
    }
    create() {
        const overlay = this.add.rectangle(1920 / 2, 1080 / 2, 1920, 1080, 0x000000, 0.55);
        overlay.setDepth(1000);
        overlay.setInteractive();
        const pauseContainer = this.add.container(1920 / 2, -500);
        pauseContainer.setDepth(1001);
        const panel = this.add.rexRoundRectangle(0, 0, 900, 650, 30, 0x99b0af, 1);
        panel.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        const title = this.add.text(0, -220, "Paused", { font: "100px Arial", fill: "#000000" }).setOrigin(0.5);
        const subtitle = this.add.text(0, -130, "Take a breather, then jump right back in.", { font: "38px Arial", fill: "#1b1b1b" }).setOrigin(0.5);
        pauseContainer.add([panel, title, subtitle]);
        const resumeButton = createTextButton(this, {
            x: 0,
            y: 10,
            width: 320,
            height: 110,
            label: "Resume",
            backgroundColor: 0x3fafaa,
            parent: pauseContainer
        });
        const restartButton = createTextButton(this, {
            x: -185,
            y: 170,
            width: 290,
            height: 110,
            label: "Restart",
            backgroundColor: 0xffd166,
            parent: pauseContainer
        });
        const mainMenuButton = createTextButton(this, {
            x: 185,
            y: 170,
            width: 290,
            height: 110,
            label: "Main Menu",
            backgroundColor: 0xef476f,
            textColor: "#ffffff",
            parent: pauseContainer
        });
        const escape = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        escape.on("down", () => {
            this.resumeLevel();
        });
        resumeButton.background.on("pointerup", () => {
            this.resumeLevel();
        });
        restartButton.background.on("pointerup", () => {
            this.scene.stop(this.currentLevel);
            this.scene.start(this.currentLevel, this.levelData);
        });
        mainMenuButton.background.on("pointerup", () => {
            this.scene.stop(this.currentLevel);
            this.scene.start("MainMenu");
        });
        this.tweens.add({
            targets: pauseContainer,
            y: 1080 / 2,
            duration: 500,
            ease: "Cubic.out"
        });
        this.scene.bringToTop();
    }
    resumeLevel() {
        this.scene.stop();
        this.scene.resume(this.currentLevel);
    }
}
class SummaryScene extends Menu {
    constructor() {
        super("SummaryScene");
    }
    init(data) {
        this.arrowsHit = data.arrowsHit;
        this.arrowsShot = data.arrowsShot;
        this.health = data.health;
        this.maxHealth = data.maxHealth;
        this.timeTaken = data.duration;
        this.currentLevel = data.currentLevel;
        this.nextLevel = data.nextLevel;
        this.kills = data.kills;
        this.currencyEarned = data.currencyEarned;
        this.totalCurrency = data.totalCurrency;
    }
    preload() {
        super.preload();
    }
    create() {
        const summaryBox = this.add.container(1920 / 2, -1000);
        const entireBox = this.add.rexRoundRectangle(0, 0, 820, 820, 30, 0x99b0af, 1);
        entireBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        summaryBox.add([entireBox]);
        const summaryTitle = this.health <= 0
            ? this.add.text(0, -310, "You Died...", { font: "100px Arial", fill: "#000000" })
            : this.add.text(0, -310, "Summary", { font: "100px Arial", fill: "#000000" });
        summaryTitle.setOrigin(0.5);
        const accuracyValue = this.arrowsShot > 0
            ? ((this.arrowsHit / this.arrowsShot) * 100).toFixed(3)
            : "0.000";
        const accuracy = `Accuracy: ${accuracyValue}%`;
        const accuracyText = this.add.text(0, -180, accuracy, { font: "50px Arial", fill: "#a0ffa0" });
        accuracyText.setOrigin(0.5);
        const health = `Health Remaining: ${this.health} / ${this.maxHealth}`;
        const healthText = this.add.text(0, -80, health, { font: "50px Arial", fill: "#a0ffa0" });
        healthText.setOrigin(0.5);
        let duration = "";
        if (this.health <= 0 && this.currentLevel === "TimedLevel") {
            duration = `Time Survived: ${(this.timeTaken / 1000).toFixed(3)}s`;
        }
        else if (this.kills) {
            duration = `Kills: ${this.kills}`;
        }
        else {
            duration = `Time Taken: ${(this.timeTaken / 1000).toFixed(3)}s`;
        }
        const durationText = this.add.text(0, 10, duration, { font: "50px Arial", fill: "#a0ffa0" });
        durationText.setOrigin(0.5);
        const currencyText = this.add.text(0, 105, `Currency: +$${this.currencyEarned}   Total: $${this.totalCurrency}`, { font: "42px Arial", fill: "#ffd166" }).setOrigin(0.5);
        summaryBox.add([summaryTitle, accuracyText, healthText, durationText, currencyText]);
        const nextLevelBox = this.add.rexRoundRectangle((750 / 2) - (750 / 4), 250, 275, 200, 30, 0xffafaa, 1);
        nextLevelBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        nextLevelBox.setInteractive();
        const mainMenuBox = this.add.rexRoundRectangle(-(750 / 4), 250, 275, 200, 30, 0xffffaa, 1);
        mainMenuBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        mainMenuBox.setInteractive();
        summaryBox.add([nextLevelBox, mainMenuBox]);
        const mainMenuText = this.add.text(-(750 / 4), 250, " Main\nMenu", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
        const nextLevelText = (this.health <= 0 || this.currentLevel === "TimedLevel")
            ? this.add.text((750 / 2) - (750 / 4), 250, "Retry", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5)
            : this.add.text((750 / 2) - (750 / 4), 250, " Next\nLevel", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
        summaryBox.add([mainMenuText, nextLevelText]);
        this.tweens.add({
            targets: summaryBox,
            y: 1080 / 2,
            duration: 1000,
            ease: "Cubic.out",
            onComplete: () => {
                mainMenuBox.on("pointerdown", () => {
                    this.menuLeave(summaryBox, this.currentLevel, "MainMenu");
                });
                nextLevelBox.on("pointerdown", () => {
                    if (this.health <= 0 || this.currentLevel === "TimedLevel") {
                        this.menuLeave(summaryBox, this.currentLevel, this.currentLevel);
                    }
                    else {
                        this.menuLeave(summaryBox, this.currentLevel, this.nextLevel);
                    }
                });
            }
        });
    }
    update() {
    }
}
class MainMenu extends Menu {
    constructor() {
        super("MainMenu");
    }
    init(data) {
    }
    preload() {
        super.preload();
    }
    create() {
        const playerProfile = loadPlayerProfile();
        const selectedWeapon = getWeaponDefinition(playerProfile.selectedWeaponId);
        const manualLevels = getManualLevelDefinitions();
        const fullscreenButton = createTextButton(this, {
            x: 1785,
            y: 60,
            width: 240,
            height: 78,
            label: "Fullscreen",
            backgroundColor: 0x8ecae6,
            depth: 20
        });
        bindFullscreenToggle(this, fullscreenButton);
        const wholeContainer = this.add.container(1920 / 2, -1000);
        const entireBox = this.add.rexRoundRectangle(0, 0, 1800, 920, 30, 0x99b0af, 1);
        entireBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        wholeContainer.add(entireBox);
        const title = this.add.text(0, -360, "On Target", { font: "100px Arial", fill: "#000000" }).setOrigin(0.5);
        const bankText = this.add.text(0, -265, `Money: $${playerProfile.currency}`, {
            font: "48px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);
        const weaponText = this.add.text(0, -205, `Equipped: ${selectedWeapon.name}`, {
            font: "36px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);
        wholeContainer.add([title, bankText, weaponText]);
        const manualColumns = Math.max(1, Math.min(3, manualLevels.length));
        const manualRows = Math.ceil(manualLevels.length / manualColumns);
        const manualSpacingX = 320;
        const manualSpacingY = 195;
        const manualStartX = -((manualColumns - 1) * manualSpacingX) / 2;
        const manualStartY = manualRows > 1 ? -80 : 0;
        manualLevels.forEach((level, index) => {
            const column = index % manualColumns;
            const row = Math.floor(index / manualColumns);
            const button = createTextButton(this, {
                x: manualStartX + column * manualSpacingX,
                y: manualStartY + row * manualSpacingY,
                width: 280,
                height: 160,
                label: level.label,
                backgroundColor: level.menuColor,
                font: "bold 42px Arial",
                parent: wholeContainer
            });
            button.background.on("pointerup", () => {
                this.menuLeave(wholeContainer, "MainMenu", level.sceneKey);
            });
        });
        const utilityButtonConfigs = [
            {
                x: -420,
                label: "Timed\nMode",
                color: 0xffafaa,
                scene: "TimedLevel"
            },
            {
                x: 0,
                label: "Credits",
                color: 0xffffaa,
                scene: "Credits"
            },
            {
                x: 420,
                label: "Shop",
                color: 0xcdb4db,
                scene: "ShopMenu"
            }
        ];
        utilityButtonConfigs.forEach((buttonConfig) => {
            const button = createTextButton(this, {
                x: buttonConfig.x,
                y: 300,
                width: 300,
                height: 170,
                label: buttonConfig.label,
                backgroundColor: buttonConfig.color,
                font: "bold 44px Arial",
                parent: wholeContainer
            });
            button.background.on("pointerup", () => {
                this.menuLeave(wholeContainer, "MainMenu", buttonConfig.scene);
            });
        });
        this.tweens.add({
            targets: wholeContainer,
            y: 1080 / 2,
            duration: 500,
            ease: "Cubic.out"
        });
    }
    update() {
    }
}
class Credits extends Menu {
    constructor() {
        super("Credits");
    }
    preload() {
        super.preload();
    }
    create() {
        const wholeContainer = this.add.container(1920 / 2, -1000);
        const entireBox = this.add.rexRoundRectangle(0, 0, 750, 750, 30, 0x99b0af, 1);
        entireBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        wholeContainer.add([entireBox]);
        const title = this.add.text(0, -310, "Credits", { font: "100px Arial", fill: "#000000" });
        title.setOrigin(0.5);
        wholeContainer.add([title]);
        const mainMenuBox = this.add.rexRoundRectangle(0, 200, 275, 200, 30, 0x3fafaa, 1);
        mainMenuBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        mainMenuBox.setInteractive();
        wholeContainer.add([mainMenuBox]);
        const mainMenuText = this.add.text(0, 200, "Main\nMenu", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
        const creditsText = this.add.text(0, -90, "Everything By Benthan Vu \n(except Phaser Library)", { font: "50px Arial", fill: "#000000" }).setOrigin(0.5);
        wholeContainer.add([creditsText, mainMenuText]);
        this.tweens.add({
            targets: wholeContainer,
            y: 1080 / 2,
            duration: 500,
            ease: "Cubic.out",
            onComplete: () => {
                mainMenuBox.on("pointerdown", () => {
                    this.menuLeave(wholeContainer, "Credits", "MainMenu");
                });
            }
        });
    }
}
class ShopMenu extends Menu {
    constructor() {
        super("ShopMenu");
    }
    preload() {
        super.preload();
    }
    create() {
        this.playerProfile = loadPlayerProfile();
        this.focusedWeaponId = this.playerProfile.selectedWeaponId;
        const wholeContainer = this.add.container(1920 / 2, -1000);
        const panel = this.add.rexRoundRectangle(0, 0, 1820, 960, 30, 0x99b0af, 1);
        panel.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        wholeContainer.add(panel);
        this.shopMoneyText = this.add.text(0, -360, "", {
            font: "52px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);
        const title = this.add.text(0, -425, "Weapon Shop", {
            font: "90px Arial",
            fill: "#000000"
        }).setOrigin(0.5);
        const subtitle = this.add.text(0, -310, "Hover or tap a weapon to inspect it, then buy or equip from the details panel.", {
            font: "30px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);
        this.shopStatusText = this.add.text(0, 385, "", {
            font: "34px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);
        wholeContainer.add([title, this.shopMoneyText, subtitle, this.shopStatusText]);
        const gridPanel = this.add.rexRoundRectangle(-420, 30, 720, 650, 26, 0xe5efe9, 1);
        gridPanel.setStrokeStyle(4, 0x7c8a87, 1);
        const detailPanel = this.add.rexRoundRectangle(380, 30, 760, 650, 26, 0xf8fbf7, 1);
        detailPanel.setStrokeStyle(4, 0x7c8a87, 1);
        wholeContainer.add([gridPanel, detailPanel]);
        const gridTitle = this.add.text(-420, -235, "Weapons", {
            font: "48px Arial",
            fill: "#000000"
        }).setOrigin(0.5);
        const detailTitle = this.add.text(380, -235, "Details", {
            font: "48px Arial",
            fill: "#000000"
        }).setOrigin(0.5);
        wholeContainer.add([gridTitle, detailTitle]);
        this.shopCards = [];
        const gridColumns = WEAPON_CATALOG.length <= 4 ? 2 : 3;
        const gridRows = Math.max(1, Math.ceil(WEAPON_CATALOG.length / gridColumns));
        const tileWidth = gridColumns === 2 ? 235 : 190;
        const tileHeight = gridRows >= 3 ? 170 : 235;
        const gridSpacingX = gridColumns === 2 ? 270 : 220;
        const gridSpacingY = gridRows >= 3 ? 195 : 270;
        const startX = -420 - ((gridColumns - 1) * gridSpacingX) / 2;
        const startY = 30 - ((gridRows - 1) * gridSpacingY) / 2;
        WEAPON_CATALOG.forEach((weapon, index) => {
            const column = index % gridColumns;
            const row = Math.floor(index / gridColumns);
            const tilePosition = {
                x: startX + column * gridSpacingX,
                y: startY + row * gridSpacingY
            };
            const tile = this.add.container(tilePosition.x, tilePosition.y);
            const tileBackground = this.add.rexRoundRectangle(0, 0, tileWidth, tileHeight, 24, 0xfafcf9, 1);
            tileBackground.setStrokeStyle(5, weapon.accentColor, 1);
            tileBackground.setInteractive({ useHandCursor: true });
            const previewBackground = this.add.rexRoundRectangle(0, tileHeight >= 200 ? -22 : -12, tileWidth - 80, tileHeight >= 200 ? 120 : 88, 18, weapon.accentColor, 0.18);
            previewBackground.setStrokeStyle(4, weapon.accentColor, 1);
            const previewLabel = this.add.text(0, tileHeight >= 200 ? -40 : -25, "PLACEHOLDER", {
                font: tileHeight >= 200 ? "bold 18px Arial" : "bold 14px Arial",
                fill: "#1b1b1b"
            }).setOrigin(0.5);
            const previewName = this.add.text(0, tileHeight >= 200 ? -2 : 10, weapon.placeholderLabel, {
                font: tileHeight >= 200 ? "38px Arial" : "28px Arial",
                fill: "#1b1b1b"
            }).setOrigin(0.5);
            const weaponName = this.add.text(0, tileHeight >= 200 ? 72 : 52, weapon.name, {
                font: tileHeight >= 200 ? "bold 26px Arial" : "bold 21px Arial",
                fill: "#000000",
                align: "center",
                wordWrap: { width: tileWidth - 40 }
            }).setOrigin(0.5);
            const stateText = this.add.text(0, tileHeight >= 200 ? 104 : 72, "", {
                font: tileHeight >= 200 ? "20px Arial" : "18px Arial",
                fill: "#1b1b1b",
                align: "center"
            }).setOrigin(0.5);
            tileBackground.on("pointerover", () => {
                this.focusShopWeapon(weapon.id);
            });
            tileBackground.on("pointerup", () => {
                this.focusShopWeapon(weapon.id);
            });
            tile.add([tileBackground, previewBackground, previewLabel, previewName, weaponName, stateText]);
            wholeContainer.add(tile);
            this.shopCards.push({ weapon, tileBackground, stateText });
        });
        this.detailPreviewBackground = this.add.rexRoundRectangle(380, -55, 270, 190, 24, 0xffffff, 1);
        this.detailPreviewBackground.setStrokeStyle(5, 0x8ecae6, 1);
        this.detailPlaceholderLabel = this.add.text(380, -83, "PLACEHOLDER", {
            font: "bold 30px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);
        this.detailPreviewName = this.add.text(380, -28, "", {
            font: "58px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);
        this.detailWeaponName = this.add.text(380, 105, "", {
            font: "bold 50px Arial",
            fill: "#000000"
        }).setOrigin(0.5);
        this.detailDescription = this.add.text(380, 190, "", {
            font: "30px Arial",
            fill: "#1b1b1b",
            align: "center",
            wordWrap: { width: 560 }
        }).setOrigin(0.5);
        this.detailStats = this.add.text(380, 305, "", {
            font: "28px Arial",
            fill: "#1b1b1b",
            align: "center"
        }).setOrigin(0.5);
        this.detailState = this.add.text(380, 395, "", {
            font: "30px Arial",
            fill: "#1b1b1b",
            align: "center"
        }).setOrigin(0.5);
        wholeContainer.add([
            this.detailPreviewBackground,
            this.detailPlaceholderLabel,
            this.detailPreviewName,
            this.detailWeaponName,
            this.detailDescription,
            this.detailStats,
            this.detailState
        ]);
        this.shopActionButton = createTextButton(this, {
            x: 380,
            y: 470,
            width: 300,
            height: 96,
            label: "",
            backgroundColor: 0x8ecae6,
            textColor: "#1b1b1b",
            font: "bold 32px Arial",
            parent: wholeContainer
        });
        this.shopActionButton.background.on("pointerup", () => {
            this.handleShopAction(getWeaponDefinition(this.focusedWeaponId));
        });
        const backButton = createTextButton(this, {
            x: -690,
            y: 385,
            width: 280,
            height: 100,
            label: "Main Menu",
            backgroundColor: 0x3fafaa,
            parent: wholeContainer
        });
        backButton.background.on("pointerup", () => {
            this.menuLeave(wholeContainer, "ShopMenu", "MainMenu");
        });
        this.refreshShopState();
        this.tweens.add({
            targets: wholeContainer,
            y: 1080 / 2,
            duration: 500,
            ease: "Cubic.out"
        });
    }
    handleShopAction(weapon) {
        if (isWeaponUnlocked(this.playerProfile, weapon.id)) {
            this.playerProfile = selectWeaponForProfile(weapon.id);
            this.focusedWeaponId = weapon.id;
            this.shopStatusText.setText(`${weapon.name} equipped.`);
            this.refreshShopState();
            return;
        }
        const purchaseResult = purchaseWeaponForProfile(weapon.id);
        this.playerProfile = purchaseResult.profile;
        this.focusedWeaponId = this.playerProfile.selectedWeaponId;
        this.shopStatusText.setText(purchaseResult.message);
        this.refreshShopState();
    }
    focusShopWeapon(weaponId) {
        this.focusedWeaponId = weaponId;
        this.refreshShopState();
    }
    refreshShopState() {
        var _a;
        this.shopMoneyText.setText(`Money: $${this.playerProfile.currency}`);
        const focusedWeapon = getWeaponDefinition(this.focusedWeaponId);
        const focusedUnlocked = isWeaponUnlocked(this.playerProfile, focusedWeapon.id);
        const focusedSelected = this.playerProfile.selectedWeaponId === focusedWeapon.id;
        this.detailPreviewBackground.setFillStyle(focusedWeapon.accentColor, 0.18);
        this.detailPreviewBackground.setStrokeStyle(5, focusedWeapon.accentColor, 1);
        this.detailPreviewName.setText(focusedWeapon.placeholderLabel);
        this.detailWeaponName.setText(focusedWeapon.name);
        this.detailDescription.setText(focusedWeapon.description);
        this.detailStats.setText([
            `Body Damage: ${focusedWeapon.projectile.damage.body}`,
            `Head Damage: ${focusedWeapon.projectile.damage.head}`,
            `Shot Speed: x${focusedWeapon.powerMultiplier.toFixed(2)}`,
            `Pierce: ${(_a = focusedWeapon.projectile.pierceCount) !== null && _a !== void 0 ? _a : 0}`,
            ...getProjectileStatusSummary(focusedWeapon.projectile),
            focusedWeapon.cost > 0 ? `Price: $${focusedWeapon.cost}` : "Included from the start"
        ].join("\n"));
        this.detailState.setText(focusedSelected
            ? "Currently equipped"
            : focusedUnlocked
                ? "Unlocked and ready to equip"
                : `Locked until you buy it for $${focusedWeapon.cost}`);
        if (focusedSelected) {
            this.shopActionButton.label.setText("Equipped");
        }
        else if (focusedUnlocked) {
            this.shopActionButton.label.setText("Equip Weapon");
        }
        else {
            this.shopActionButton.label.setText(`Buy for $${focusedWeapon.cost}`);
        }
        this.shopActionButton.background.setFillStyle(focusedWeapon.accentColor, 1);
        this.shopCards.forEach((card) => {
            const unlocked = isWeaponUnlocked(this.playerProfile, card.weapon.id);
            const selected = this.playerProfile.selectedWeaponId === card.weapon.id;
            const focused = this.focusedWeaponId === card.weapon.id;
            card.tileBackground.setStrokeStyle(focused ? 8 : 5, card.weapon.accentColor, 1);
            card.tileBackground.setFillStyle(focused ? 0xffffff : 0xfafcf9, 1);
            if (selected) {
                card.stateText.setText("Equipped");
                return;
            }
            if (unlocked) {
                card.stateText.setText("Unlocked");
                return;
            }
            card.stateText.setText(`$${card.weapon.cost}`);
        });
    }
}
const manualLevelScenes = getManualLevelDefinitions().map((definition) => new ManualLevelScene(definition.sceneKey));
const game = new Phaser.Game({
    type: Phaser.AUTO,
    backgroundColor: "#2beaff",
    physics: {
        default: "matter",
        matter: {
            enableSleeping: true,
            gravity: {
                y: 0.3
            }
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1080
    },
    scene: [MainMenu, ShopMenu, PauseScene, SummaryScene, ...manualLevelScenes, TimedLevel, Credits],
    title: "Physics Game"
});
//# sourceMappingURL=game.js.map