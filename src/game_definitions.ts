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

const DEFAULT_TEXT_BUTTON_STYLE = {
    radius: 24,
    backgroundColor: 0x3fafaa,
    textColor: "#1b1b1b",
    font: "bold 32px Arial"
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
