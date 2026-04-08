const PLAYER_PROFILE_STORAGE_KEY = "on-target-player-profile";

function createWeaponProjectile(config: {
    id: string;
    scale: number;
    lifetimeMs: number;
    maxActive: number;
    damage: DamageProfile;
    tint: number;
    pierceCount?: number;
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
        pierceCount: config.pierceCount ?? 0
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
                body: -2,
                head: 20
            },
            tint: 0x94d2bd
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
