const LEVEL_IMAGE_ASSETS: Array<[string, string]> = [
    ["aOpponentHead", "armoredOpponent-head.png"],
    ["aOpponentBody", "armoredOpponent-body.png"],
    ["aOpponentShortLimb", "armoredOpponent-shortLimb.png"],
    ["aOpponentLeg", "armoredOpponent-leg.png"],
    ["aOpponentArm", "armoredOpponent-arm.png"],
    ["arrow", "arrow.png"],
    ["rock", "rock.png"],
    ["bow", "bow.png"],
    ["sword", "sword.png"]
];

const PLAYER_SPAWN = { x: 75, y: 850 };
const PLAYER_MAX_HEALTH = 10;
const PLAYER_OVERHEAL_DECAY_INTERVAL_MS = 1000;
const WORLD_BOUNDS = {
    ground: { x: 1920 / 2, y: 1300, width: 2000, height: 500 },
    ceiling: { x: 1920 / 2, y: -1000, width: 2000, height: 500 },
    rightWall: { x: 1920 + 240, y: (1080 / 2) - 1000, width: 500, height: 3500 },
    leftWall: { x: -240, y: (1080 / 2) - 1000, width: 500, height: 3500 }
};

const HUD_STYLES = {
    charge: { font: "20px Arial", fill: "#ffff00" },
    playerHealth: { font: "20px Arial", fill: "#ff1010" },
    playerStatus: { font: "18px Arial", fill: "#1b1b1b" },
    currency: { font: "32px Arial", fill: "#1b1b1b" },
    weapon: { font: "24px Arial", fill: "#1b1b1b" }
};

const ENEMY_STATUS_ORDER: EnemyStatusEffectKind[] = ["bounty", "burn", "scatter", "jam"];
const PLAYER_SHOT_SCATTER_PIXELS = 120;
const PLAYER_THROW_ANIMATION_MS = 220;
const PLAYER_THROW_ARM_FORCE = 0.014;
const PLAYER_THROW_WINDUP_FORCE = 0.0018;
const PLAYER_THROW_RELEASE_FORCE = 0.006;
const PLAYER_THROW_FOREARM_RELEASE_FORCE = 0.009;
const PLAYER_THROW_IDLE_POSE_FORCE = 0.0012;
const PLAYER_THROW_IDLE_OFFSET_X = 34;
const PLAYER_THROW_IDLE_OFFSET_Y = 22;
const PLAYER_THROW_WINDUP_OFFSET_X = 68;
const PLAYER_THROW_WINDUP_OFFSET_Y = 72;
const PLAYER_THROW_RELEASE_OFFSET_X = 92;
const PLAYER_THROW_RELEASE_OFFSET_Y = 10;
const PLAYER_THROW_ANCHOR_DISTANCE = 56;
const MELEE_ATTACK_ARM_FORCE = 0.05;
const MELEE_WINDUP_FORCE = 0.0013;
const MELEE_RECOVER_FORCE = 0.0019;
const MELEE_DAMAGE_RAMP_PER_ATTACK = 1.5;
const PROJECTILE_COLLISION_CATEGORY = 0x0002;
const TIMED_POWERUP_PICKUP_SCALE = 0.32;
const TIMED_POWERUP_PICKUP_LIFETIME_MS = 9000;
const TIMED_POWERUP_DROP_LIFETIME_MS = 6500;
const TIMED_POWERUP_DROP_CHANCE = 0.2;
const TIMED_POWERUP_COLLISION_RADIUS = 38;

class LevelScene extends LooseScene {
    init(data: LevelInitData = {}): void {
        this.levelData = data;
        this.startTime = 0;
        this.sceneDuration = 0;
    }

    preload(): void {
        this.load.path = "./assets/";
        LEVEL_IMAGE_ASSETS.forEach(([key, file]) => this.load.image(key, file));
    }

    create(): void {
        this.initializeLevelState();
        this.registerDebugControls();
        this.registerSceneEvents();
        this.createHud();
        this.createPlayerRig();
        this.createWorldBounds();
    }

    initializeLevelState(): void {
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
        this.overhealDecayTimerMs = 0;
        this.activeTimedPowerups = {} as Partial<Record<TimedPowerupKind, ActiveTimedPowerupState>>;
        this.timedPowerups = [] as TimedPowerupPickup[];

        this.spawnedArrows = this.createArrowCollection("player");
        this.opponentArrows = this.createArrowCollection("enemy");
        this.humanoids = [] as RagdollPerson[];

        this.mousex = this.input.activePointer.x;
        this.mousey = this.input.activePointer.y;

        this.events.removeAllListeners("levelEnd");
        this.events.removeAllListeners("arrowHit");
        this.events.removeAllListeners("nextWave");
    }

    createArrowCollection(owner: ProjectileOwner): ArrowCollection {
        const arrows = [] as ArrowCollection;
        arrows.owner = owner;
        arrows.fromplayer = owner === "player";
        return arrows;
    }

    registerDebugControls(): void {
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

    registerSceneEvents(): void {
        this.events.on("arrowHit", (hits: number) => {
            this.arrowsHit += hits;
        });

        this.events.on("levelEnd", () => {
            this.detachBowConstraints();
        });
    }

    createHud(): void {
        this.chargeDisplay = this.add.text(0, 0, "Charge: 0", HUD_STYLES.charge);
        this.chargeDisplay.setOrigin(0.5, 0.5).setDepth(10);
        this.currencyDisplay = this.add.text(960, 52, "", HUD_STYLES.currency).setOrigin(0.5, 0.5).setDepth(25);
        this.weaponDisplay = this.add.text(960, 92, "", HUD_STYLES.weapon).setOrigin(0.5, 0.5).setDepth(25);
        this.refreshEconomyDisplay();
        this.createSystemButtons();
    }

    refreshEconomyDisplay(): void {
        this.currencyDisplay.setText(`Money: $${this.playerProfile.currency}`);
        this.weaponDisplay.setText(`Weapon: ${this.playerLoadout.weapon.name}`);
    }

    createSystemButtons(): void {
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
    }

    openPauseMenu(): void {
        if (this.isLevelEnding || this.scene.isActive("PauseScene") || this.scene.isActive("SummaryScene")) {
            return;
        }

        this.chargeTime = 0;
        this.chargeDisplay.setText("Charge: 0");
        this.scene.launch("PauseScene", {
            currentLevel: this.currentLevel,
            levelData: this.levelData
        } as PauseSceneData);
        this.scene.bringToTop("PauseScene");
        this.scene.pause();
    }

    isWaveModeScene(): boolean {
        return this.currentLevel === "TimedLevel" || this.currentLevel === "EndlessLevel";
    }

    getEnemyAttackDelayCycles(humanoid: RagdollPerson): number {
        return Math.max(0, humanoid.baseDelayAttack ?? humanoid.delayAttack ?? 0);
    }

    getEnemyAlternateProjectileChance(): number {
        return ENEMY_ALTERNATE_PROJECTILE_CHANCE;
    }

    getTimedPowerupDropChance(): number {
        return TIMED_POWERUP_DROP_CHANCE;
    }

    createPlayerRig(): void {
        const playerItems = this.createPlayer(PLAYER_SPAWN.x, PLAYER_SPAWN.y, Math.abs(this.levelScale), PLAYER_MAX_HEALTH);
        const attackStyle = this.playerLoadout.weapon.attackStyle;

        this.bow = playerItems.playerContainer;
        this.bowSprite = playerItems.bowSprite;
        this.playerAimSprite = playerItems.aimArrow;
        this.player = playerItems.player;
        this.player.loadout = this.playerLoadout;
        this.player.healthDisplay = this.add.text(PLAYER_SPAWN.x, PLAYER_SPAWN.y - 100, `Health: ${PLAYER_MAX_HEALTH}`, HUD_STYLES.playerHealth);
        this.player.healthDisplay.setOrigin(0.5, 0.5);
        this.player.statusDisplay = this.add.text(PLAYER_SPAWN.x, PLAYER_SPAWN.y - 132, "", HUD_STYLES.playerStatus).setOrigin(0.5, 0.5);
        this.refreshPlayerStatusModifiers();
        this.refreshPlayerStatusDisplay();

        if (attackStyle === "bow") {
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
        else {
            this.rightArmBowConstraint = undefined;
            this.leftArmBowConstraint = undefined;
        }

        this.syncPlayerAttackAnchor();
    }

    detachBowConstraints(): void {
        if (this.rightArmBowConstraint) {
            this.matter.world.removeConstraint(this.rightArmBowConstraint);
        }

        if (this.leftArmBowConstraint) {
            this.matter.world.removeConstraint(this.leftArmBowConstraint);
        }
    }

    createWorldBounds(): void {
        this.matter.add.rectangle(WORLD_BOUNDS.ground.x, WORLD_BOUNDS.ground.y, WORLD_BOUNDS.ground.width, WORLD_BOUNDS.ground.height, { isStatic: true });
        this.matter.add.rectangle(WORLD_BOUNDS.ceiling.x, WORLD_BOUNDS.ceiling.y, WORLD_BOUNDS.ceiling.width, WORLD_BOUNDS.ceiling.height, { isStatic: true });
        this.add.rectangle(WORLD_BOUNDS.ground.x, WORLD_BOUNDS.ground.y, WORLD_BOUNDS.ground.width, WORLD_BOUNDS.ground.height, 0x01FFA3);
        this.matter.add.rectangle(WORLD_BOUNDS.rightWall.x, WORLD_BOUNDS.rightWall.y, WORLD_BOUNDS.rightWall.width, WORLD_BOUNDS.rightWall.height, { isStatic: true });
        this.matter.add.rectangle(WORLD_BOUNDS.leftWall.x, WORLD_BOUNDS.leftWall.y, WORLD_BOUNDS.leftWall.width, WORLD_BOUNDS.leftWall.height, { isStatic: true });
    }

    hasActiveTimedPowerup(kind: TimedPowerupKind): boolean {
        const activePowerup = this.activeTimedPowerups?.[kind];
        return activePowerup != null && activePowerup.remainingMs > 0;
    }

    getTimedPowerupValue(kind: TimedPowerupKind, key: "damageBonus" | "pierceBonus"): number {
        const activePowerup = this.activeTimedPowerups?.[kind];

        if (!activePowerup || activePowerup.remainingMs <= 0) {
            return 0;
        }

        return activePowerup.definition[key] ?? 0;
    }

    getRapidChargeRateMultiplier(): number {
        const activePowerup = this.activeTimedPowerups?.rapidCharge;

        if (!activePowerup || activePowerup.remainingMs <= 0) {
            return 1;
        }

        return activePowerup.definition.chargeRateMultiplier ?? 1;
    }

    hasInstantRapidChargePowerup(): boolean {
        const activePowerup = this.activeTimedPowerups?.rapidCharge;
        return activePowerup != null
            && activePowerup.remainingMs > 0
            && (activePowerup.definition.instantCharge ?? false);
    }

    getPlayerProjectileConfig(): ProjectileConfig {
        const projectile = this.playerLoadout.projectile;
        const damageBonus = this.getTimedPowerupValue("damage", "damageBonus");
        const pierceBonus = this.getTimedPowerupValue("pierce", "pierceBonus");

        if (damageBonus <= 0 && pierceBonus <= 0) {
            return projectile;
        }

        return {
            ...projectile,
            damage: {
                body: projectile.damage.body + damageBonus,
                head: projectile.damage.head + damageBonus
            },
            pierceCount: (projectile.pierceCount ?? 0) + pierceBonus
        };
    }

    spawnTimedPowerup(
        definition: TimedPowerupDefinition,
        x: number,
        y: number,
        options: { staticBody?: boolean; lifetimeMs?: number; launchVelocity?: { x: number; y: number } } = {}
    ): TimedPowerupPickup {
        const pickup = this.matter.add.image(x, y, "rock", null) as TimedPowerupPickup;
        const lifetimeMs = options.lifetimeMs ?? TIMED_POWERUP_PICKUP_LIFETIME_MS;
        const isStaticBody = options.staticBody ?? true;

        pickup.setCircle(TIMED_POWERUP_COLLISION_RADIUS);
        pickup.setStatic(isStaticBody);
        pickup.setScale(TIMED_POWERUP_PICKUP_SCALE);
        pickup.setTint(definition.color);
        pickup.setDepth(18);
        pickup.body.isSensor = true;
        pickup.body.ignoreGravity = isStaticBody;
        pickup.body.collisionFilter.group = -30;
        pickup.powerupDefinition = definition;
        pickup.active = true;
        pickup.maxLifetimeMs = lifetimeMs;
        pickup.remainingLifetimeMs = lifetimeMs;
        pickup.labelText = this.add.text(x, y, definition.shortLabel, {
            font: "bold 20px Arial",
            fill: definition.textColor
        }).setOrigin(0.5, 0.5).setDepth(19);

        if (!isStaticBody) {
            pickup.setBounce(0.45);
            pickup.setFriction(0.02);
            pickup.setFrictionAir(0.008);

            if (options.launchVelocity) {
                pickup.setVelocity(options.launchVelocity.x, options.launchVelocity.y);
            }
        }

        this.timedPowerups.push(pickup);
        return pickup;
    }

    destroyTimedPowerup(powerup: TimedPowerupPickup): void {
        if (!powerup || !powerup.active) {
            return;
        }

        powerup.active = false;

        const powerupIndex = this.timedPowerups.indexOf(powerup);

        if (powerupIndex >= 0) {
            this.timedPowerups.splice(powerupIndex, 1);
        }

        if (powerup.labelText) {
            powerup.labelText.destroy();
        }
        this.tweens.add({
            targets: powerup,
            alpha: { from: powerup.alpha, to: 0 },
            duration: 180,
            ease: "Cubic.out",
            onComplete: () => {
                powerup.destroy();
            }
        });
    }

    syncTimedPowerupSprites(): void {
        this.timedPowerups.forEach((powerup: TimedPowerupPickup) => {
            if (!powerup.active || !powerup.body) {
                return;
            }

            powerup.setPosition(powerup.body.position.x, powerup.body.position.y);

            if (powerup.labelText) {
                powerup.labelText.setPosition(powerup.body.position.x, powerup.body.position.y);
                powerup.labelText.setAlpha(powerup.alpha);
            }
        });
    }

    checkTimedPowerupCollisions(arrowList: ArrowCollection): void {
        arrowList.slice().forEach((arrow) => {
            if (!arrow || !arrow.body || !arrow.active) {
                return;
            }

            if (arrowList.owner !== "player" || arrow.hitLivingTarget || arrow.bodyConstraint || arrow.alreadyHit) {
                return;
            }

            for (const powerup of this.timedPowerups.slice()) {
                if (!powerup.active || !powerup.body) {
                    continue;
                }

                const collision = this.matter.collision.collides(arrow.body, powerup.body);

                if (!collision) {
                    continue;
                }

                this.collectTimedPowerup(powerup, arrow, arrowList);
                break;
            }
        });
    }

    collectTimedPowerup(powerup: TimedPowerupPickup, arrow: MatterArrow, arrowList: ArrowCollection): void {
        const definition = powerup.powerupDefinition;
        this.applyTimedPowerupToPlayer(definition, powerup.x, powerup.y - 48);
        this.showTimedPowerupPickupText(definition.label, powerup.x, powerup.y - 70, definition.color);
        this.destroyTimedPowerup(powerup);
        this.refreshPlayerStatusModifiers();
        this.refreshPlayerStatusDisplay();
    }

    applyTimedPowerupToPlayer(definition: TimedPowerupDefinition, x: number, y: number): void {
        if (definition.kind === "heal") {
            this.healPlayer(definition.healAmount ?? 0, x, y);
            return;
        }

        if (definition.durationMs != null && definition.durationMs > 0) {
            this.activeTimedPowerups[definition.kind] = {
                definition,
                remainingMs: definition.durationMs
            };
        }
    }

    drainPlayerTimedPowerups(amountMs: number): boolean {
        let drainedPowerup = false;
        let statusChanged = false;

        PLAYER_TIMED_POWERUP_ORDER.forEach((kind) => {
            const activePowerup = this.activeTimedPowerups?.[kind];

            if (!activePowerup || activePowerup.remainingMs <= 0) {
                return;
            }

            drainedPowerup = true;
            activePowerup.remainingMs = Math.max(0, activePowerup.remainingMs - amountMs);
            statusChanged = true;

            if (activePowerup.remainingMs <= 0) {
                delete this.activeTimedPowerups[kind];
            }
        });

        if (statusChanged) {
            this.refreshPlayerStatusModifiers();
            this.refreshPlayerStatusDisplay();
        }

        return drainedPowerup;
    }

    purchasePausePowerupOffer(offer: PausePowerupOffer): { success: boolean; message: string } {
        if (this.player.health <= 0 || this.isLevelEnding) {
            return {
                success: false,
                message: "You can't buy powerups right now."
            };
        }

        if (this.playerProfile.currency < offer.cost) {
            return {
                success: false,
                message: `You need $${offer.cost - this.playerProfile.currency} more for ${offer.label}.`
            };
        }

        this.removePlayerCurrency(offer.cost);
        this.applyTimedPowerupToPlayer(
            offer.definition,
            this.player.parts.chest.position.x,
            this.player.parts.chest.position.y - 120
        );
        this.showTimedPowerupPickupText(
            `${offer.definition.label} Purchased`,
            this.player.parts.chest.position.x,
            this.player.parts.chest.position.y - 170,
            offer.definition.color
        );
        this.refreshPlayerStatusModifiers();
        this.refreshPlayerStatusDisplay();

        return {
            success: true,
            message: `${offer.label} activated.`
        };
    }

    maybeDropTimedPowerup(person: RagdollPerson): void {
        if (
            !this.isWaveModeScene() ||
            this.timedPowerups.length >= 3 ||
            Math.random() >= this.getTimedPowerupDropChance()
        ) {
            return;
        }

        const definition = Phaser.Utils.Array.GetRandom(TIMED_POWERUP_DROP_DEFINITIONS);
        const spawnX = person.parts.head.position.x;
        const spawnY = person.parts.head.position.y - 30;
        const launchVelocity = {
            x: (Math.random() - 0.5) * 8,
            y: -6 - (Math.random() * 2)
        };

        this.spawnTimedPowerup(definition, spawnX, spawnY, {
            staticBody: false,
            lifetimeMs: TIMED_POWERUP_DROP_LIFETIME_MS,
            launchVelocity
        });
    }

    showTimedPowerupPickupText(label: string, x: number, y: number, color: number): void {
        const powerupText = this.add.text(x, y, label, {
            font: "bold 24px Arial",
            fill: `#${color.toString(16).padStart(6, "0")}`
        }).setOrigin(0.5, 0.5).setDepth(30);

        this.tweens.add({
            targets: powerupText,
            y: powerupText.y - 40,
            alpha: { from: 1, to: 0 },
            duration: 750,
            ease: "Cubic.out",
            onComplete: () => {
                powerupText.destroy();
            }
        });
    }

    updateTimedPowerups(delta: number): void {
        let statusChanged = false;
        let hasActivePowerups = false;

        if (!this.isLevelEnding) {
            this.timedPowerups.slice().forEach((powerup: TimedPowerupPickup) => {
                if (!powerup.active) {
                    return;
                }

                powerup.remainingLifetimeMs -= delta;

                if (powerup.remainingLifetimeMs <= 0) {
                    this.destroyTimedPowerup(powerup);
                    return;
                }

                const lifetimeProgress = Phaser.Math.Clamp(powerup.remainingLifetimeMs / powerup.maxLifetimeMs, 0.18, 1);
                powerup.setAlpha(lifetimeProgress);

                if (powerup.labelText) {
                    powerup.labelText.setAlpha(lifetimeProgress);
                }
            });
        }

        PLAYER_TIMED_POWERUP_ORDER.forEach((kind) => {
            const activePowerup = this.activeTimedPowerups?.[kind];

            if (!activePowerup) {
                return;
            }

            hasActivePowerups = true;

            if (this.isLevelEnding) {
                return;
            }

            activePowerup.remainingMs -= delta;

            if (activePowerup.remainingMs <= 0) {
                delete this.activeTimedPowerups[kind];
                statusChanged = true;
            }
        });

        if (statusChanged || hasActivePowerups) {
            this.refreshPlayerStatusModifiers();
            this.refreshPlayerStatusDisplay();
        }
    }

    update(time: number, delta: number): void {
        this.updateSceneTimer();
        this.updatePointerTracking();
        this.updateChargeDisplayPosition();
        this.handlePlayerCharge();
        this.updateBowAim(delta);

        const humanoidsDefeated = this.checkCombatCollisions();
        this.updateHumanoidAI(delta);
        this.updatePlayerStatusEffects(delta);
        this.updateTimedPowerups(delta);
        this.updatePlayerOverheal(delta);
        this.syncRagdollSprites();
        this.updatePlayerHealthDisplay();
        this.handlePlayerDefeat();
        this.handleWaveVictory(humanoidsDefeated);
    }

    updateSceneTimer(): void {
        if (!this.isLevelEnding) {
            this.sceneDuration = this.sys.game.loop.time - this.startTime;
        }
    }

    updatePointerTracking(): void {
        const pointer = this.input.activePointer;

        if (!this.isLevelEnding) {
            this.mousex = pointer.x;
            this.mousey = pointer.y;
        }
    }

    updateChargeDisplayPosition(): void {
        this.chargeDisplay.x = this.mousex;
        this.chargeDisplay.y = this.mousey - 20;
    }

    handlePlayerCharge(): void {
        const pointer = this.input.activePointer;
        const scaleMagnitude = Math.abs(this.levelScale) || 1;
        const chargeRateMultiplier = (this.player?.chargeRateMultiplier ?? 1) * this.getRapidChargeRateMultiplier();
        const attackStyle = this.playerLoadout.weapon.attackStyle;

        if (pointer.isDown && this.canCharge) {
            if (this.bowStream) {
                if (attackStyle === "throw") {
                    this.setCombatAction(this.player, "throw", PLAYER_THROW_ANIMATION_MS);
                }
                this.firePlayerArrow(100 + 10 / scaleMagnitude);
                this.chargeTime = 0;
            }
            else if (this.instaCharge || this.hasInstantRapidChargePowerup()) {
                this.chargeTime = 100;
            }
            else if (this.chargeTime < 100) {
                this.chargeTime = this.chargeTime === 0
                    ? Math.max(1, chargeRateMultiplier)
                    : this.chargeTime * (1 + (0.1 * chargeRateMultiplier));
                this.chargeTime = Math.min(this.chargeTime, 100);
            }

            if (attackStyle === "throw") {
                this.setCombatAction(this.player, "charge");
            }
            this.chargeDisplay.setText(`Charge: ${this.chargeTime.toFixed(1)}`);
            return;
        }

        if (this.chargeTime > 0) {
            if (attackStyle === "throw") {
                this.setCombatAction(this.player, "throw", PLAYER_THROW_ANIMATION_MS);
            }
            this.firePlayerArrow(this.chargeTime + 10 / scaleMagnitude);
            this.chargeTime = 0;
            this.chargeDisplay.setText("Charge: 0");
            return;
        }

        if (attackStyle === "throw" && this.player.actionState?.kind === "charge") {
            this.setCombatAction(this.player, "idle");
        }
    }

    firePlayerArrow(power: number): void {
        const aimSpreadMultiplier = this.player.aimSpreadMultiplier ?? 1;
        const throwForceMultiplier = this.player.throwForceMultiplier ?? 1;
        const scatterRadius = Math.max(0, (aimSpreadMultiplier - 1) * PLAYER_SHOT_SCATTER_PIXELS);
        const targetX = this.mousex + (Math.random() * scatterRadius * 2 - scatterRadius);
        const targetY = this.mousey + (Math.random() * scatterRadius * 2 - scatterRadius);
        const projectileAnchor = this.getPlayerProjectileAnchor(targetX, targetY);

        if (this.playerLoadout.weapon.attackStyle === "throw") {
            const throwForceScale = Phaser.Math.Clamp(power / 100, 0.35, 1.25);
            this.applyDirectionalAttackForce(this.player.parts.rightLowerArm, targetX, targetY, PLAYER_THROW_ARM_FORCE * throwForceScale);
        }

        this.syncPlayerAttackAnchor(projectileAnchor.x, projectileAnchor.y);
        this.shootArrow(
            power * this.playerLoadout.powerMultiplier * throwForceMultiplier,
            this.levelScale,
            this.bow,
            targetX,
            targetY,
            this.getPlayerProjectileConfig(),
            this.spawnedArrows
        );
        this.arrowsShot += 1;
    }

    updateBowAim(delta: number): void {
        const playerActionComplete = this.advanceCombatAction(this.player, delta);
        const chestPosition = this.player.parts.chest.position;
        const aimAngle = Phaser.Math.Angle.Between(chestPosition.x, chestPosition.y, this.mousex, this.mousey);
        const attackStyle = this.playerLoadout.weapon.attackStyle;
        const projectileAnchor = this.getPlayerProjectileAnchor(this.mousex, this.mousey);

        if (playerActionComplete && this.player.actionState?.kind === "throw") {
            this.setCombatAction(this.player, "idle");
        }

        this.syncPlayerAttackAnchor(projectileAnchor.x, projectileAnchor.y);

        if (attackStyle === "throw") {
            this.updateThrownWeaponPose(aimAngle);
            return;
        }

        if (this.rightArmBowConstraint) {
            this.rightArmBowConstraint.pointB.x = this.mousex;
            this.rightArmBowConstraint.pointB.y = this.mousey;
        }

        if (this.leftArmBowConstraint) {
            this.leftArmBowConstraint.pointB.x = this.mousex + 300;
            this.leftArmBowConstraint.pointB.y = this.mousey + 500;
        }

        this.bow.rotation = Phaser.Math.Angle.Between(this.bow.x, this.bow.y, this.mousex, this.mousey);

        if (this.bowSprite) {
            this.bowSprite.setAlpha(1);
        }

        if (this.playerAimSprite) {
            this.playerAimSprite.setAlpha(0.75);
            this.playerAimSprite.setVisible(true);
        }
    }

    getPlayerProjectileAnchor(targetX: number, targetY: number): { x: number; y: number } {
        const chest = this.player.parts.chest.position;
        const aimAngle = Phaser.Math.Angle.Between(chest.x, chest.y, targetX, targetY);

        return {
            x: chest.x + Math.cos(aimAngle) * PLAYER_THROW_ANCHOR_DISTANCE,
            y: chest.y + Math.sin(aimAngle) * PLAYER_THROW_ANCHOR_DISTANCE
        };
    }

    syncPlayerAttackAnchor(anchorX?: number, anchorY?: number): void {
        if (!this.bow || !this.player) {
            return;
        }

        const rightHand = this.player.parts.rightLowerArm.position;
        const leftHand = this.player.parts.leftLowerArm.position;
        const attackStyle = this.playerLoadout.weapon.attackStyle;
        const resolvedAnchorX = attackStyle === "throw"
            ? (anchorX ?? this.bow.x)
            : (rightHand.x + leftHand.x) / 2;
        const resolvedAnchorY = attackStyle === "throw"
            ? (anchorY ?? this.bow.y)
            : (rightHand.y + leftHand.y) / 2;

        this.bow.x = resolvedAnchorX;
        this.bow.y = resolvedAnchorY;
    }

    updateThrownWeaponPose(aimAngle: number): void {
        const actionKind = this.player.actionState?.kind ?? "idle";
        const chest = this.player.parts.chest.position;
        const aimDirectionX = Math.cos(aimAngle);
        const aimDirectionY = Math.sin(aimAngle);
        const perpendicularX = Math.cos(aimAngle - Math.PI / 2);
        const perpendicularY = Math.sin(aimAngle - Math.PI / 2);

        let rightPoseX = chest.x + aimDirectionX * PLAYER_THROW_IDLE_OFFSET_X + perpendicularX * PLAYER_THROW_IDLE_OFFSET_Y;
        let rightPoseY = chest.y + aimDirectionY * PLAYER_THROW_IDLE_OFFSET_X + perpendicularY * PLAYER_THROW_IDLE_OFFSET_Y;
        let leftPoseX = chest.x - aimDirectionX * 18 - perpendicularX * 38;
        let leftPoseY = chest.y - aimDirectionY * 18 - perpendicularY * 26;

        if (actionKind === "charge") {
            rightPoseX = chest.x - aimDirectionX * PLAYER_THROW_WINDUP_OFFSET_X + perpendicularX * PLAYER_THROW_WINDUP_OFFSET_Y;
            rightPoseY = chest.y - aimDirectionY * PLAYER_THROW_WINDUP_OFFSET_X + perpendicularY * PLAYER_THROW_WINDUP_OFFSET_Y;
            leftPoseX = chest.x - aimDirectionX * 8 - perpendicularX * 44;
            leftPoseY = chest.y - aimDirectionY * 8 - perpendicularY * 20;
            this.applyPoseForce(this.player.parts.rightLowerArm, rightPoseX, rightPoseY, PLAYER_THROW_WINDUP_FORCE);
            this.applyPoseForce(this.player.parts.leftLowerArm, leftPoseX, leftPoseY, PLAYER_THROW_WINDUP_FORCE * 0.75);
        }
        else if (actionKind === "throw") {
            rightPoseX = chest.x + aimDirectionX * PLAYER_THROW_RELEASE_OFFSET_X + perpendicularX * PLAYER_THROW_RELEASE_OFFSET_Y;
            rightPoseY = chest.y + aimDirectionY * PLAYER_THROW_RELEASE_OFFSET_X + perpendicularY * PLAYER_THROW_RELEASE_OFFSET_Y;
            leftPoseX = chest.x - aimDirectionX * 16 - perpendicularX * 32;
            leftPoseY = chest.y - aimDirectionY * 16 - perpendicularY * 16;
            this.applyPoseForce(this.player.parts.rightLowerArm, rightPoseX, rightPoseY, PLAYER_THROW_RELEASE_FORCE);
            this.applyPoseForce(
                this.player.parts.rightLowerArm,
                chest.x + aimDirectionX * (PLAYER_THROW_RELEASE_OFFSET_X + 34),
                chest.y + aimDirectionY * (PLAYER_THROW_RELEASE_OFFSET_X + 34),
                PLAYER_THROW_FOREARM_RELEASE_FORCE
            );
            this.applyPoseForce(this.player.parts.leftLowerArm, leftPoseX, leftPoseY, PLAYER_THROW_RELEASE_FORCE * 0.45);
        }
        else {
            this.applyPoseForce(this.player.parts.rightLowerArm, rightPoseX, rightPoseY, PLAYER_THROW_IDLE_POSE_FORCE);
            this.applyPoseForce(this.player.parts.leftLowerArm, leftPoseX, leftPoseY, PLAYER_THROW_IDLE_POSE_FORCE * 0.8);
        }

        this.bow.rotation = aimAngle;

        if (this.bowSprite) {
            this.bowSprite.setAlpha(1);
        }

        if (this.playerAimSprite) {
            this.playerAimSprite.setVisible(false);
            this.playerAimSprite.setAlpha(0);
        }
    }

    setConstraintTarget(constraint: MatterConstraint | undefined, x: number, y: number): void {
        if (!constraint) {
            return;
        }

        constraint.pointB.x = x;
        constraint.pointB.y = y;
    }

    setCombatAction(person: RagdollPerson, kind: CombatActionKind, durationMs = 0): void {
        if (person.actionState?.kind === kind && person.actionState.durationMs === durationMs) {
            return;
        }

        person.actionState = {
            kind,
            elapsedMs: 0,
            durationMs
        };
        person.triggered = false;

        if (kind === "meleeWindup") {
            person.meleeHitApplied = false;
        }
    }

    advanceCombatAction(person: RagdollPerson, delta: number): boolean {
        if (!person.actionState || person.actionState.durationMs <= 0) {
            return false;
        }

        person.actionState.elapsedMs = Math.min(person.actionState.durationMs, person.actionState.elapsedMs + delta);
        return person.actionState.elapsedMs >= person.actionState.durationMs;
    }

    getCombatActionProgress(person: RagdollPerson): number {
        if (!person.actionState || person.actionState.durationMs <= 0) {
            return 0;
        }

        return Phaser.Math.Clamp(person.actionState.elapsedMs / person.actionState.durationMs, 0, 1);
    }

    syncRagdollSprites(): void {
        this.ragdollFactory.syncLinkedSprites(this.player);
        this.humanoids.forEach((humanoid: RagdollPerson) => this.ragdollFactory.syncLinkedSprites(humanoid));
        this.syncTimedPowerupSprites();
    }

    checkCombatCollisions(): boolean {
        let humanoidsDefeated = true;

        this.checkTimedPowerupCollisions(this.spawnedArrows);

        this.humanoids.forEach((humanoid: RagdollPerson) => {
            this.checkArrowCollisions(this.spawnedArrows, humanoid);

            if (humanoid.health > 0) {
                humanoidsDefeated = false;
            }
        });

        this.checkArrowCollisions(this.opponentArrows, this.player);
        return humanoidsDefeated;
    }

    updateHumanoidAI(delta: number): void {
        this.humanoids.forEach((humanoid: RagdollPerson) => {
            if (humanoid.health > 0) {
                this.updateHumanoidStatusEffects(humanoid, delta);

                if (humanoid.health <= 0) {
                    return;
                }

                this.updateHumanoidUi(humanoid);
                this.updateHumanoidBehavior(humanoid, delta);
            }
        });
    }

    updateHumanoidUi(humanoid: RagdollPerson): void {
        humanoid.healthDisplay!.x = humanoid.parts.head.position.x;
        humanoid.healthDisplay!.y = humanoid.parts.head.position.y;
        humanoid.healthDisplay!.setText(`${humanoid.health}`);
        humanoid.statusDisplay!.x = humanoid.parts.head.position.x;
        humanoid.statusDisplay!.y = humanoid.parts.head.position.y - 34;
    }

    updateHumanoidBehavior(humanoid: RagdollPerson, delta: number): void {
        const actionComplete = this.advanceCombatAction(humanoid, delta);

        if (humanoid.behaviorKind === "melee") {
            this.updateMeleeHumanoidAI(humanoid, delta, actionComplete);
        }
        else {
            this.updateRangedHumanoidAI(humanoid, delta, actionComplete);
        }

        this.updateHumanoidVisualState(humanoid);
    }

    updateRangedHumanoidAI(humanoid: RagdollPerson, delta: number, actionComplete: boolean): void {
        const attackConfig = humanoid.archetype?.attack;
        const pulseConfig = humanoid.archetype?.pulse;

        if (!attackConfig) {
            return;
        }

        if (humanoid.actionState?.kind === "throw" && pulseConfig) {
            if (!humanoid.triggered && this.getCombatActionProgress(humanoid) >= 0.55) {
                humanoid.triggered = true;
                this.performHumanoidAttack(humanoid);
            }
        }

        if (actionComplete && (humanoid.actionState?.kind === "telegraph" || humanoid.actionState?.kind === "throw")) {
            this.setCombatAction(humanoid, "idle");
        }

        humanoid.timer! += delta;

        if (humanoid.currentDelay! < this.getEnemyAttackDelayCycles(humanoid)) {
            if (humanoid.timer! >= humanoid.attackInterval!) {
                humanoid.timer! -= humanoid.attackInterval!;
                humanoid.currentDelay! += 1;
            }

            return;
        }

        const telegraphWindowMs = pulseConfig
            ? Math.min(1100, Math.max(700, humanoid.attackInterval! * 0.5))
            : Math.min(450, humanoid.attackInterval! * 0.35);

        if (
            humanoid.timer! >= humanoid.attackInterval! - telegraphWindowMs
            && humanoid.timer! < humanoid.attackInterval!
            && humanoid.actionState?.kind !== "telegraph"
        ) {
            this.setCombatAction(humanoid, "telegraph", telegraphWindowMs);
        }

        if (humanoid.timer! < humanoid.attackInterval!) {
            return;
        }

        humanoid.timer! -= humanoid.attackInterval!;
        this.setCombatAction(humanoid, "throw", pulseConfig ? 360 : 180);

        if (!pulseConfig) {
            this.performHumanoidAttack(humanoid);
        }
    }

    updateMeleeHumanoidAI(humanoid: RagdollPerson, delta: number, actionComplete: boolean): void {
        const meleeConfig = humanoid.archetype?.melee;

        if (!meleeConfig) {
            return;
        }

        const playerChest = this.player.parts.chest.position;
        const chest = humanoid.parts.chest.position;
        const distanceX = playerChest.x - chest.x;
        const facingDirection = distanceX >= 0 ? 1 : -1;
        const distanceToPlayer = Math.abs(distanceX);
        const meleeAttackRateMultiplier = Math.max(0.2, humanoid.meleeAttackRateMultiplier ?? 1);
        const moveSpeedMultiplier = Math.max(0.2, humanoid.moveSpeedMultiplier ?? 1);

        humanoid.facingDirection = facingDirection;

        if ((humanoid.behaviorDelayRemainingMs ?? 0) > 0) {
            humanoid.behaviorDelayRemainingMs = Math.max(0, (humanoid.behaviorDelayRemainingMs ?? 0) - delta);
            this.setCombatAction(humanoid, "idle");
            return;
        }

        if (humanoid.actionState?.kind === "meleeWindup") {
            this.applyDirectionalAttackForce(
                humanoid.throwingArm,
                chest.x - (facingDirection * 160),
                chest.y - 120,
                MELEE_WINDUP_FORCE
            );

            if (!humanoid.meleeHitApplied && this.getCombatActionProgress(humanoid) >= 0.65) {
                const meleeAttackCount = humanoid.meleeAttackCount ?? 0;
                const scaledDamage = Math.max(
                    1,
                    Math.round(meleeConfig.damage * (1 + (meleeAttackCount * MELEE_DAMAGE_RAMP_PER_ATTACK)))
                );

                humanoid.meleeHitApplied = true;
                this.applyDirectionalAttackForce(
                    humanoid.throwingArm,
                    playerChest.x,
                    playerChest.y,
                    MELEE_ATTACK_ARM_FORCE * 0.8
                );

                if (distanceToPlayer <= meleeConfig.attackRange) {
                    this.applyDirectDamage(this.player, scaledDamage, 0xff7b00);
                }
            }

            if (actionComplete) {
                humanoid.meleeAttackCount = (humanoid.meleeAttackCount ?? 0) + 1;
                this.setCombatAction(humanoid, "meleeRecover", meleeConfig.recoverMs * meleeAttackRateMultiplier);
            }

            return;
        }

        if (humanoid.actionState?.kind === "meleeRecover") {
            this.applyDirectionalAttackForce(
                humanoid.throwingArm,
                playerChest.x,
                playerChest.y,
                MELEE_RECOVER_FORCE
            );

            if (actionComplete) {
                this.setCombatAction(humanoid, "idle");
            }

            return;
        }

        if (distanceToPlayer <= meleeConfig.attackRange) {
            this.applyDirectionalAttackForce(
                humanoid.throwingArm,
                playerChest.x,
                playerChest.y,
                MELEE_ATTACK_ARM_FORCE
            );
            this.setCombatAction(humanoid, "meleeWindup", meleeConfig.windupMs * meleeAttackRateMultiplier);
            return;
        }

        if (distanceToPlayer > meleeConfig.preferredRange) {
            this.setCombatAction(humanoid, "walk");
            this.moveHumanoid(humanoid, facingDirection * meleeConfig.moveSpeed * moveSpeedMultiplier * delta, 0);
            return;
        }

        this.setCombatAction(humanoid, "idle");
    }

    updateHumanoidVisualState(humanoid: RagdollPerson): void {
        const actionKind = humanoid.actionState?.kind ?? "idle";
        const telegraphSprite = humanoid.attackTelegraphSprite;

        if (humanoid.bodyProfile === "starfish") {
            this.applyStarfishPose(humanoid);
        }

        if (telegraphSprite) {
            if (actionKind === "telegraph" || actionKind === "meleeWindup") {
                const telegraphColor = humanoid.behaviorKind === "melee"
                    ? humanoid.archetype?.melee?.telegraphColor
                    : humanoid.archetype?.attack?.telegraphColor;
                telegraphSprite.setTint(telegraphColor ?? 0xffa500);
            }
            else {
                telegraphSprite.clearTint();
            }
        }

        if (humanoid.behaviorKind !== "melee") {
            return;
        }

        const walkCycle = this.sys.game.loop.time * 0.015;
        const swingDirection = humanoid.facingDirection ?? -1;

        if (actionKind === "walk") {
            this.applyForceToBody(humanoid.parts.leftLowerLeg, Math.sin(walkCycle) * 0.00008 * swingDirection, 0);
            this.applyForceToBody(humanoid.parts.rightLowerLeg, -Math.sin(walkCycle) * 0.00008 * swingDirection, 0);
            this.applyForceToBody(humanoid.parts.leftLowerArm, -Math.cos(walkCycle) * 0.00006 * swingDirection, -0.00002);
            this.applyForceToBody(humanoid.parts.rightLowerArm, Math.cos(walkCycle) * 0.00004 * swingDirection, -0.00002);
        }
        else if (actionKind === "meleeWindup") {
            this.applyForceToBody(humanoid.parts.leftLowerArm, 0.00012 * swingDirection, -0.00004);
            this.applyForceToBody(humanoid.parts.chest, -0.00005 * swingDirection, -0.00002);
        }
        else if (actionKind === "meleeRecover") {
            this.applyForceToBody(humanoid.parts.chest, 0.00009 * swingDirection, 0);
        }
    }

    moveHumanoid(humanoid: RagdollPerson, deltaX: number, deltaY: number): void {
        if (deltaX === 0 && deltaY === 0) {
            return;
        }

        humanoid.bodies.forEach((bodyPart) => {
            Phaser.Physics.Matter.Matter.Body.translate(bodyPart, { x: deltaX, y: deltaY });
        });
    }

    applyForceToBody(body: MatterBody, x: number, y: number): void {
        Phaser.Physics.Matter.Matter.Body.applyForce(body, body.position, { x, y });
    }

    applyPoseForce(body: MatterBody, targetX: number, targetY: number, magnitude: number): void {
        const deltaX = targetX - body.position.x;
        const deltaY = targetY - body.position.y;
        const distance = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));

        if (distance < 1) {
            return;
        }

        const scaledMagnitude = magnitude * Phaser.Math.Clamp(distance / 80, 0.2, 1.3);
        this.applyForceToBody(
            body,
            (deltaX / distance) * scaledMagnitude,
            (deltaY / distance) * scaledMagnitude
        );
    }

    applyDirectionalAttackForce(body: MatterBody, targetX: number, targetY: number, magnitude: number): void {
        const angle = Phaser.Math.Angle.Between(body.position.x, body.position.y, targetX, targetY);

        this.applyForceToBody(
            body,
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }

    applyStarfishPose(humanoid: RagdollPerson): void {
        if (humanoid.dead) {
            return;
        }

        const actionKind = humanoid.actionState?.kind ?? "idle";
        const revealProgress = actionKind === "throw"
            ? 1
            : actionKind === "telegraph"
                ? this.getCombatActionProgress(humanoid)
                : 0;
        const pulse = Math.sin((this.sys.game.loop.time + humanoid.parts.head.position.x) * 0.005) * (1 - revealProgress) * 3;
        const scaleMagnitude = Math.max(0.4, Math.abs(humanoid.spawnConfig?.scale ?? this.levelScale));
        const centerX = humanoid.parts.head.position.x;
        const centerY = humanoid.parts.head.position.y;
        const poseForce = 0.0005 * scaleMagnitude;
        const coreForce = 0.0007 * scaleMagnitude;
        const poseTargets: Array<{
            partName: Exclude<BodyPartName, "head">;
            wrapped: { x: number; y: number };
            exposed: { x: number; y: number };
            magnitude?: number;
        }> = [
            { partName: "chest", wrapped: { x: 0, y: 30 }, exposed: { x: 0, y: 38 }, magnitude: coreForce },
            { partName: "leftUpperArm", wrapped: { x: 0, y: -42 }, exposed: { x: 0, y: -72 }, magnitude: poseForce },
            { partName: "leftLowerArm", wrapped: { x: 26 + pulse, y: -18 }, exposed: { x: 0, y: -122 }, magnitude: poseForce * 1.08 },
            { partName: "rightUpperArm", wrapped: { x: 42, y: 0 }, exposed: { x: 72, y: 0 }, magnitude: poseForce },
            { partName: "rightLowerArm", wrapped: { x: 18, y: 28 + pulse }, exposed: { x: 122, y: 0 }, magnitude: poseForce * 1.08 },
            { partName: "leftUpperLeg", wrapped: { x: 0, y: 42 }, exposed: { x: 0, y: 72 }, magnitude: poseForce },
            { partName: "leftLowerLeg", wrapped: { x: -26 - pulse, y: 18 }, exposed: { x: 0, y: 122 }, magnitude: poseForce * 1.08 },
            { partName: "rightUpperLeg", wrapped: { x: -42, y: 0 }, exposed: { x: -72, y: 0 }, magnitude: poseForce },
            { partName: "rightLowerLeg", wrapped: { x: -18, y: -28 - pulse }, exposed: { x: -122, y: 0 }, magnitude: poseForce * 1.08 }
        ];

        poseTargets.forEach((target) => {
            const poseX = Phaser.Math.Linear(target.wrapped.x, target.exposed.x, revealProgress) * scaleMagnitude;
            const poseY = Phaser.Math.Linear(target.wrapped.y, target.exposed.y, revealProgress) * scaleMagnitude;
            this.applyPoseForce(
                humanoid.parts[target.partName],
                centerX + poseX,
                centerY + poseY,
                target.magnitude ?? poseForce
            );
        });
    }

    updateHumanoidStatusEffects(humanoid: RagdollPerson, delta: number): void {
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

    updatePlayerStatusEffects(delta: number): void {
        const activeEffects = this.player.activeStatusEffects;

        if (!activeEffects || this.player.health <= 0) {
            return;
        }

        let pendingBurnDamage = 0;
        let burnHealthFloor = 0;

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
                burnHealthFloor = Math.max(burnHealthFloor, activeStatus.effect.minHealthAfterTicks ?? 0);

                while (activeStatus.tickTimerMs >= activeStatus.effect.tickIntervalMs) {
                    activeStatus.tickTimerMs -= activeStatus.effect.tickIntervalMs;
                    pendingBurnDamage += activeStatus.effect.damagePerTick * activeStatus.stacks;
                }
            }
        });

        if (pendingBurnDamage > 0) {
            this.applyStatusDamage(this.player, pendingBurnDamage, burnHealthFloor);
        }

        this.refreshPlayerStatusModifiers();
        this.refreshPlayerStatusDisplay();
    }

    applyStatusDamage(person: RagdollPerson, damage: number, minRemainingHealth = 0): void {
        if (person.health <= 0 || damage <= 0) {
            return;
        }

        person.linkedSprites.forEach((sprite) => {
            sprite.setTint(0xff7b00);
        });

        const maxDamage = Math.max(0, person.health - minRemainingHealth);
        const resolvedDamage = Math.min(damage, maxDamage);

        if (resolvedDamage <= 0) {
            this.time.delayedCall(120, () => {
                person.linkedSprites.forEach((sprite) => {
                    sprite.clearTint();
                });
            });
            return;
        }

        person.health -= resolvedDamage;

        this.time.delayedCall(120, () => {
            person.linkedSprites.forEach((sprite) => {
                sprite.clearTint();
            });
        });

        if (person.health <= 0) {
            this.handlePersonDeath(person);
        }
    }

    applyStatusEffect(person: RagdollPerson, statusEffect: EnemyStatusEffectConfig): void {
        const activeEffects = person.activeStatusEffects;

        if (!activeEffects) {
            return;
        }

        const existingStatus = activeEffects[statusEffect.kind];
        const maxStacks = Math.max(1, statusEffect.maxStacks ?? 1);
        const durationMs = statusEffect.durationMs != null && statusEffect.durationMs > 0
            ? statusEffect.durationMs
            : undefined;

        if (!existingStatus) {
            activeEffects[statusEffect.kind] = {
                effect: { ...statusEffect },
                stacks: 1,
                remainingMs: durationMs,
                tickTimerMs: 0
            };
            return;
        }

        existingStatus.effect = { ...statusEffect };
        existingStatus.stacks = Math.min(existingStatus.stacks + 1, maxStacks);

        if (durationMs != null) {
            existingStatus.remainingMs = durationMs;
        }
    }

    applyStatusEffectsToHumanoid(person: RagdollPerson, statusEffects?: EnemyStatusEffectConfig[]): void {
        if (!statusEffects || statusEffects.length === 0 || person === this.player) {
            return;
        }

        statusEffects.forEach((statusEffect) => {
            this.applyStatusEffect(person, statusEffect);
        });

        this.refreshHumanoidStatusModifiers(person);
        this.refreshHumanoidStatusDisplay(person);
    }

    applyStatusEffectsToPlayer(statusEffects?: EnemyStatusEffectConfig[]): void {
        if (!statusEffects || statusEffects.length === 0) {
            return;
        }

        statusEffects.forEach((statusEffect) => {
            if (statusEffect.kind === "bounty") {
                this.removePlayerCurrency(statusEffect.currencyLossOnHit ?? 0);
                return;
            }

            this.applyStatusEffect(this.player, statusEffect);
        });

        this.refreshPlayerStatusModifiers();
        this.refreshPlayerStatusDisplay();
    }

    refreshHumanoidStatusModifiers(humanoid: RagdollPerson): void {
        let rewardMultiplier = 1;
        let aimSpreadMultiplier = 1;
        let attackIntervalMultiplier = 1;
        let throwForceMultiplier = 1;
        let meleeAttackRateMultiplier = 1;
        let moveSpeedMultiplier = 1;

        ENEMY_STATUS_ORDER.forEach((statusKind) => {
            const activeStatus = humanoid.activeStatusEffects?.[statusKind];

            if (!activeStatus) {
                return;
            }

            switch (activeStatus.effect.kind) {
            case "bounty":
                rewardMultiplier += (activeStatus.effect.rewardMultiplierPerStack ?? 0) * activeStatus.stacks;
                break;
            case "scatter":
                aimSpreadMultiplier += activeStatus.effect.aimSpreadMultiplierPerStack * activeStatus.stacks;
                throwForceMultiplier -= activeStatus.effect.throwForceReductionPerStack * activeStatus.stacks;
                meleeAttackRateMultiplier += activeStatus.effect.aimSpreadMultiplierPerStack * activeStatus.stacks;
                break;
            case "jam":
                attackIntervalMultiplier += activeStatus.effect.attackIntervalMultiplierPerStack * activeStatus.stacks;
                throwForceMultiplier -= activeStatus.effect.throwForceReductionPerStack * activeStatus.stacks;
                moveSpeedMultiplier /= 1 + (activeStatus.effect.attackIntervalMultiplierPerStack * activeStatus.stacks);
                break;
            default:
                break;
            }
        });

        humanoid.rewardMultiplier = rewardMultiplier;
        humanoid.aimSpreadMultiplier = aimSpreadMultiplier;
        humanoid.throwForceMultiplier = Math.max(0.2, throwForceMultiplier);
        humanoid.meleeAttackRateMultiplier = Math.max(0.2, meleeAttackRateMultiplier);
        humanoid.moveSpeedMultiplier = Math.max(0.2, moveSpeedMultiplier);

        if (humanoid.baseAttackInterval != null) {
            humanoid.attackInterval = Math.max(250, humanoid.baseAttackInterval * attackIntervalMultiplier);
        }
    }

    refreshHumanoidStatusDisplay(humanoid: RagdollPerson): void {
        if (!humanoid.statusDisplay) {
            return;
        }

        const statusSegments: string[] = [];

        ENEMY_STATUS_ORDER.forEach((statusKind) => {
            const activeStatus = humanoid.activeStatusEffects?.[statusKind];

            if (!activeStatus) {
                return;
            }

            switch (activeStatus.effect.kind) {
            case "bounty":
                statusSegments.push(`Cash x${(1 + ((activeStatus.effect.rewardMultiplierPerStack ?? 0) * activeStatus.stacks)).toFixed(2)}`);
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

    refreshPlayerStatusModifiers(): void {
        let aimSpreadMultiplier = 1;
        let throwForceMultiplier = 1;
        let chargeRateMultiplier = 1;

        ENEMY_STATUS_ORDER.forEach((statusKind) => {
            const activeStatus = this.player.activeStatusEffects?.[statusKind];

            if (!activeStatus) {
                return;
            }

            switch (activeStatus.effect.kind) {
            case "scatter":
                aimSpreadMultiplier += activeStatus.effect.aimSpreadMultiplierPerStack * activeStatus.stacks;
                throwForceMultiplier -= activeStatus.effect.throwForceReductionPerStack * activeStatus.stacks;
                break;
            case "jam":
                chargeRateMultiplier /= 1 + (activeStatus.effect.attackIntervalMultiplierPerStack * activeStatus.stacks);
                throwForceMultiplier -= activeStatus.effect.throwForceReductionPerStack * activeStatus.stacks;
                break;
            default:
                break;
            }
        });

        this.player.aimSpreadMultiplier = aimSpreadMultiplier;
        this.player.throwForceMultiplier = Math.max(0.2, throwForceMultiplier);
        this.player.chargeRateMultiplier = Math.max(0.2, chargeRateMultiplier);
    }

    refreshPlayerStatusDisplay(): void {
        if (!this.player.statusDisplay) {
            return;
        }

        const statusSegments: string[] = [];

        ENEMY_STATUS_ORDER.forEach((statusKind) => {
            const activeStatus = this.player.activeStatusEffects?.[statusKind];

            if (!activeStatus) {
                return;
            }

            switch (activeStatus.effect.kind) {
            case "burn":
                statusSegments.push(`Burn ${activeStatus.stacks}`);
                break;
            case "scatter":
                statusSegments.push(`Scatter ${activeStatus.stacks}`);
                break;
            case "jam":
                statusSegments.push(`Jam ${activeStatus.stacks}`);
                break;
            default:
                break;
            }
        });

        PLAYER_TIMED_POWERUP_ORDER.forEach((kind) => {
            const activePowerup = this.activeTimedPowerups?.[kind];

            if (!activePowerup) {
                return;
            }

            const remainingSeconds = Math.max(0.1, activePowerup.remainingMs / 1000).toFixed(1);

            switch (kind) {
            case "rapidCharge":
                statusSegments.push(
                    activePowerup.definition.instantCharge
                        ? `Instant ${remainingSeconds}s`
                        : `Charge x${activePowerup.definition.chargeRateMultiplier ?? 1} ${remainingSeconds}s`
                );
                break;
            case "damage":
                statusSegments.push(`Damage +${activePowerup.definition.damageBonus ?? 0} ${remainingSeconds}s`);
                break;
            case "pierce":
                statusSegments.push(`Pierce +${activePowerup.definition.pierceBonus ?? 0} ${remainingSeconds}s`);
                break;
            default:
                break;
            }
        });

        this.player.statusDisplay.setText(statusSegments.join("  |  "));
    }

    rollAttackPower(humanoid: RagdollPerson): number {
        const attackConfig = humanoid.archetype?.attack;

        if (!attackConfig) {
            return 0;
        }

        return (Math.random() * (attackConfig.powerMax - attackConfig.powerMin)) + attackConfig.powerMin;
    }

    updatePlayerHealthDisplay(): void {
        this.player.healthDisplay!.setText(`Health: ${this.player.health}`);
        this.player.healthDisplay!.x = this.player.parts.chest.position.x;
        this.player.healthDisplay!.y = this.player.parts.chest.position.y - 100;

        if (this.player.statusDisplay) {
            this.player.statusDisplay.x = this.player.parts.chest.position.x;
            this.player.statusDisplay.y = this.player.parts.chest.position.y - 132;
        }
    }

    updatePlayerOverheal(delta: number): void {
        if (this.isLevelEnding || this.player.health <= PLAYER_MAX_HEALTH) {
            this.overhealDecayTimerMs = 0;
            return;
        }

        this.overhealDecayTimerMs += delta;

        while (this.overhealDecayTimerMs >= PLAYER_OVERHEAL_DECAY_INTERVAL_MS && this.player.health > PLAYER_MAX_HEALTH) {
            this.overhealDecayTimerMs -= PLAYER_OVERHEAL_DECAY_INTERVAL_MS;
            this.player.health -= 1;
        }

        if (this.player.health <= PLAYER_MAX_HEALTH) {
            this.player.health = Math.max(this.player.health, PLAYER_MAX_HEALTH);
            this.overhealDecayTimerMs = 0;
        }
    }

    handlePlayerDefeat(): void {
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

    releaseBow(): void {
        const releasePosition = this.player.parts.rightLowerArm.position;

        this.bow.list.forEach((item: MatterImage) => {
            item.x = releasePosition.x;
            item.y = releasePosition.y;
            item.setStatic(false);
            item.body.collisionFilter.group = -1;
        });

        this.bow.removeAll(false);
    }

    handleWaveVictory(humanoidsDefeated: boolean): void {
        if (!humanoidsDefeated || this.isLevelEnding) {
            return;
        }

        this.isLevelEnding = true;

        if (!this.isWaveModeScene()) {
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

    addSlowdown(): void {
        let deltaTime = 0;
        const scaleMagnitude = Math.abs(this.levelScale) || 1;

        this.tweens.addCounter({
            from: 0,
            to: 1000,
            onUpdate: (tween: any) => {
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

    showSummary(): void {
        this.humanoids.forEach((humanoid: RagdollPerson) => {
            humanoid.linkedSprites.forEach((sprite) => {
                sprite.setAlpha(0.01);
            });
        });

        this.scene.launch("SummaryScene", {
            arrowsHit: this.arrowsHit,
            arrowsShot: this.arrowsShot,
            health: this.player.health,
            maxHealth: PLAYER_MAX_HEALTH,
            duration: this.sceneDuration,
            currentLevel: this.currentLevel,
            nextLevel: this.nextLevel,
            kills: this.kills,
            currencyEarned: this.currencyEarned,
            totalCurrency: this.playerProfile.currency
        } as SummarySceneData);

        this.scene.pause();
    }

    constructHumanoid(x: number, y: number, scale: number, staticBody: boolean, health: number, flip: boolean, attackInterval: number, delay: number): RagdollPerson {
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

    spawnEnemy(config: EnemySpawnConfig): RagdollPerson {
        const resolvedArchetype = resolveEnemyArchetype(config.archetype, this.getEnemyAlternateProjectileChance());
        const enemy = this.assignCombatId(this.ragdollFactory.createEnemy(config.x, config.y, config.scale, {
            staticBody: config.staticBody,
            health: config.health,
            flip: config.flip,
            attackInterval: config.attackInterval,
            delayAttack: config.attackDelay,
            bodyProfile: resolvedArchetype.bodyProfile ?? "default"
        }));

        enemy.archetype = resolvedArchetype;
        enemy.behaviorKind = resolvedArchetype.behavior;
        enemy.behaviorDelayRemainingMs = resolvedArchetype.melee?.startupDelayMs ?? 0;
        enemy.spawnConfig = {
            ...config,
            archetype: resolvedArchetype
        };

        if (resolvedArchetype.behavior === "melee") {
            this.attachMeleeWeaponSprite(enemy, config.scale, config.flip);
        }

        return enemy;
    }

    spawnEnemies(configs: EnemySpawnConfig[]): RagdollPerson[] {
        return configs.map((config) => this.spawnEnemy(config));
    }

    performHumanoidAttack(humanoid: RagdollPerson): void {
        if (humanoid.archetype?.pulse) {
            this.humanoidPulseAttack(humanoid);
            return;
        }

        this.humanoidAttack(humanoid, this.levelScale, this.rollAttackPower(humanoid), this.player);
    }

    humanoidAttack(humanoid: RagdollPerson, scale: number, power: number, player: RagdollPerson): void {
        const spawnpoint = humanoid.throwingArm;
        const attackConfig = humanoid.archetype?.attack;
        const projectileConfig = humanoid.archetype?.projectile;

        if (!attackConfig || !projectileConfig) {
            return;
        }

        const aimSpreadMultiplier = humanoid.aimSpreadMultiplier ?? 1;
        const throwForceMultiplier = humanoid.throwForceMultiplier ?? 1;
        const aimSpreadX = attackConfig.aimSpreadX * aimSpreadMultiplier;
        const aimSpreadY = attackConfig.aimSpreadY * aimSpreadMultiplier;
        spawnpoint.force = {
            x: attackConfig.throwForceX * scale * throwForceMultiplier,
            y: attackConfig.throwForceY * scale * throwForceMultiplier
        };

        const resolvedScale = Math.abs(scale);
        const targetBody = player.bodies[Math.floor(Math.random() * player.bodies.length)];
        const targetPosition = targetBody.position;
        const angle = Phaser.Math.Angle.Between(
            spawnpoint.position.x,
            spawnpoint.position.y,
            targetPosition.x + (Math.random() * aimSpreadX * 2 - aimSpreadX),
            targetPosition.y + (Math.random() * aimSpreadY * 2 - aimSpreadY)
        );
        const speed = power * resolvedScale;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        const newArrow = this.spawnArrow(
            spawnpoint.position.x,
            spawnpoint.position.y,
            angle,
            velocityX,
            velocityY,
            resolvedScale,
            projectileConfig
        );

        newArrow.sourceCombatId = humanoid.combatId;
        this.opponentArrows.push(newArrow);
        this.time.delayedCall(attackConfig.cleanupDelayMs, () => {
            if (newArrow) {
                this.destroyArrow(newArrow, this.opponentArrows);
            }
        });
    }

    humanoidPulseAttack(humanoid: RagdollPerson): void {
        const pulseConfig = humanoid.archetype?.pulse;

        if (!pulseConfig || this.player.health <= 0 || this.isLevelEnding) {
            return;
        }

        const originX = humanoid.parts.head.position.x;
        const originY = humanoid.parts.head.position.y;
        const pulseRing = this.add.circle(originX, originY, 24, pulseConfig.visualColor, 0.08);
        pulseRing.setStrokeStyle(10, pulseConfig.visualColor, 0.95);
        pulseRing.setDepth(14);

        this.tweens.add({
            targets: pulseRing,
            scaleX: pulseConfig.range / 24,
            scaleY: pulseConfig.range / 24,
            alpha: { from: 0.95, to: 0 },
            duration: pulseConfig.visualDurationMs,
            ease: "Cubic.out",
            onComplete: () => {
                pulseRing.destroy();
            }
        });

        const playerTextX = this.player.parts.chest.position.x;
        const playerTextY = this.player.parts.chest.position.y - 150;
        const drainedPowerup = this.drainPlayerTimedPowerups(pulseConfig.powerupDrainMs);

        if (drainedPowerup) {
            this.showTimedPowerupPickupText(`Power Drain -${Math.round(pulseConfig.powerupDrainMs / 1000)}s`, playerTextX, playerTextY, pulseConfig.visualColor);
            return;
        }

        this.applyDirectDamage(this.player, pulseConfig.fallbackDamage, pulseConfig.visualColor);
        this.showTimedPowerupPickupText(`Pulse Hit -${pulseConfig.fallbackDamage} HP`, playerTextX, playerTextY, pulseConfig.visualColor);
    }

    interruptPulseAttack(humanoid: RagdollPerson): void {
        if (!humanoid.archetype?.pulse || humanoid.health <= 0) {
            return;
        }

        const actionKind = humanoid.actionState?.kind;

        if (actionKind !== "telegraph" && actionKind !== "throw") {
            return;
        }

        humanoid.timer = 0;
        humanoid.triggered = false;
        this.setCombatAction(humanoid, "idle");

        if (humanoid.attackTelegraphSprite) {
            humanoid.attackTelegraphSprite.clearTint();
        }
    }

    constructPlayer(x: number, y: number, scale: number, staticBody: boolean, health: number, flip: boolean): RagdollPerson {
        return this.assignCombatId(this.ragdollFactory.createPlayer(x, y, scale, {
            staticBody,
            health,
            flip
        }));
    }

    assignCombatId(person: RagdollPerson): RagdollPerson {
        person.combatId = `combatant-${this.nextCombatantId}`;
        this.nextCombatantId += 1;
        return person;
    }

    spawnArrow(x: number, y: number, angle: number, velocityX: number, velocityY: number, scale: number, projectileConfig: ProjectileConfig): MatterArrow {
        const arrow = this.matter.add.image(x, y, projectileConfig.texture, null) as MatterArrow;

        if (projectileConfig.hitboxShape === "circle") {
            const radius = Math.max(4, Math.min(arrow.width, arrow.height) * 0.5);
            arrow.setCircle(radius);
        }

        arrow.setScale(projectileConfig.scale * scale);
        arrow.setAngle(angle);
        arrow.setVelocity(velocityX, velocityY);
        arrow.rotation = angle;
        arrow.alreadyHit = false;
        arrow.projectileConfig = projectileConfig;
        arrow.body.collisionFilter.category = PROJECTILE_COLLISION_CATEGORY;
        arrow.body.collisionFilter.group = projectileConfig.collisionGroup;
        arrow.body.isSensor = (projectileConfig.pierceCount ?? 0) > 0;
        arrow.hitLivingTarget = false;
        arrow.hitTargetIds = [];
        arrow.piercesRemaining = projectileConfig.pierceCount ?? 0;

        if (projectileConfig.tint != null) {
            arrow.setTint(projectileConfig.tint);
        }

        return arrow;
    }

    shootArrow(
        power: number,
        scale: number,
        bow: GameContainer,
        mousex: number,
        mousey: number,
        projectileConfig: ProjectileConfig,
        arrowList: ArrowCollection
    ): void {
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

    destroyArrow(arrow: MatterArrow, arrowList?: ArrowCollection): void {
        if (!arrow || !arrow.active) {
            return;
        }

        if (arrowList != null) {
            const arrowIndex = arrowList.indexOf(arrow);

            if (arrowIndex >= 0) {
                arrowList.splice(arrowIndex, 1);
            }
        }

        arrow.active = false;

        if (arrow.body) {
            arrow.body.collisionFilter.mask = 0;
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

                arrow.destroy();
            }
        });
    }

    createPlayer(x: number, y: number, scale: number, health: number): { player: RagdollPerson; playerContainer: GameContainer; bowSprite: MatterImage; aimArrow: MatterImage } {
        const attackStyle = this.playerLoadout.weapon.attackStyle;
        const aimArrow = this.createStaticWeaponSprite(
            this.playerLoadout.projectile.texture,
            scale,
            this.playerLoadout.projectile.tint,
            this.playerLoadout.projectile.scale
        );
        const bowSprite = this.createStaticWeaponSprite(
            attackStyle === "throw" ? this.playerLoadout.projectile.texture : this.playerLoadout.weapon.bowTexture,
            scale,
            attackStyle === "throw" ? this.playerLoadout.projectile.tint : this.playerLoadout.weapon.bowTint,
            attackStyle === "throw" ? this.playerLoadout.projectile.scale * 1.35 : 0.2
        );
        const player = this.constructPlayer(x, y, scale, false, health, false);
        const playerContainer = this.add.container(x, y);

        if (attackStyle === "throw") {
            aimArrow.setVisible(false);
            aimArrow.setAlpha(0);
        }

        playerContainer.add([bowSprite, aimArrow]);
        return { player, playerContainer, bowSprite, aimArrow };
    }

    createStaticWeaponSprite(texture: string, scale: number, tint?: number, spriteScale = 0.2): MatterImage {
        const weaponSprite = this.matter.add.image(100, 0, texture, null);
        weaponSprite.setStatic(true);
        weaponSprite.setScale(spriteScale * scale);

        if (tint != null) {
            weaponSprite.setTint(tint);
        }

        return weaponSprite;
    }

    attachMeleeWeaponSprite(humanoid: RagdollPerson, scale: number, flip: boolean): void {
        const scaleMagnitude = Math.abs(scale) || 1;
        const swordSprite = this.add.sprite(0, 0, "sword") as LinkedSprite;

        swordSprite.linkedBody = humanoid.throwingArm;
        swordSprite.localOffsetX = -12 * scaleMagnitude;
        swordSprite.localOffsetY = 22 * scaleMagnitude;
        swordSprite.rotationOffset = -Math.PI * 0.75;
        swordSprite.setScale(0.1 * scaleMagnitude);
        swordSprite.setFlipX(flip);
        humanoid.linkedSprites.push(swordSprite);
        this.ragdollFactory.syncLinkedSprites(humanoid);
    }

    checkArrowCollisions(arrowList: ArrowCollection, person: RagdollPerson): void {
        if (person.ignoresProjectileCollisions) {
            return;
        }

        arrowList.slice().forEach((arrow) => {
            if (!arrow || !arrow.body || !arrow.active) {
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

    handleArrowCollision(arrow: MatterArrow, arrowList: ArrowCollection, person: RagdollPerson, part: MatterBody): void {
        if (arrow.alreadyHit || arrow.hitTargetIds.includes(person.combatId)) {
            return;
        }

        const impactVelocity = arrow.body.velocity;
        const impactSpeed = Math.sqrt(
            impactVelocity.x * impactVelocity.x +
            impactVelocity.y * impactVelocity.y
        );
        const minImpactSpeed = arrow.projectileConfig.minImpactSpeed ?? 0;

        if (impactSpeed < minImpactSpeed) {
            return;
        }

        const sticksToTargets = arrow.projectileConfig.sticksToTargets ?? true;
        const shouldStick = sticksToTargets && arrow.piercesRemaining <= 0;
        arrow.hitTargetIds.push(person.combatId);

        if (person.health > 0) {
            arrow.hitLivingTarget = true;
            person.linkedSprites.forEach((sprite) => {
                sprite.setTint(0xff0000);
            });

            const damageDealt = part.label === "head"
                ? arrow.projectileConfig.damage.head
                : arrow.projectileConfig.damage.body;
            person.health -= damageDealt;

            if (arrowList.fromplayer) {
                this.events.emit("arrowHit", 1);
            }

            this.time.delayedCall(250, () => {
                person.linkedSprites.forEach((sprite) => {
                    sprite.clearTint();
                });
            });

            if (arrowList.fromplayer) {
                this.applyStatusEffectsToHumanoid(person, arrow.projectileConfig.statusEffects);

                if (damageDealt > 0) {
                    this.interruptPulseAttack(person);
                    this.healPlayer(arrow.projectileConfig.healPlayerOnHit ?? 0, person.parts.head.position.x, person.parts.head.position.y - 90);
                }
            }
            else {
                this.applyStatusEffectsToPlayer(arrow.projectileConfig.statusEffects);

                if (damageDealt > 0) {
                    this.healProjectileOwner(arrow.sourceCombatId, arrow.projectileConfig.healOwnerOnHit ?? 0);
                }
            }

            if (person.health <= 0) {
                this.handlePersonDeath(person, arrowList.fromplayer ? arrow.projectileConfig : undefined);
            }
        }

        if (shouldStick) {
            this.stickArrowToPart(arrow, person, part);
            return;
        }

        if (!sticksToTargets) {
            return;
        }

        arrow.piercesRemaining -= 1;
    }

    stickArrowToPart(arrow: MatterArrow, person: RagdollPerson, part: MatterBody): void {
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

    applyDirectDamage(person: RagdollPerson, damage: number, flashTint = 0xff0000): void {
        if (damage <= 0 || person.health <= 0) {
            return;
        }

        person.linkedSprites.forEach((sprite) => {
            sprite.setTint(flashTint);
        });

        person.health -= damage;

        this.time.delayedCall(180, () => {
            person.linkedSprites.forEach((sprite) => {
                sprite.clearTint();
            });
        });

        if (person.health <= 0) {
            this.handlePersonDeath(person);
        }
    }

    healPlayer(amount: number, x: number, y: number): void {
        if (amount <= 0 || this.player.health <= 0) {
            return;
        }

        const previousHealth = this.player.health;
        this.player.health += amount;
        const healedAmount = this.player.health - previousHealth;

        if (healedAmount <= 0) {
            return;
        }

        if (this.player.health > PLAYER_MAX_HEALTH) {
            this.overhealDecayTimerMs = 0;
        }

        const healText = this.add.text(x, y, `+${healedAmount} HP`, {
            font: "bold 24px Arial",
            fill: "#52b788"
        }).setOrigin(0.5, 0.5).setDepth(30);

        this.tweens.add({
            targets: healText,
            y: healText.y - 50,
            alpha: { from: 1, to: 0 },
            duration: 700,
            ease: "Cubic.out",
            onComplete: () => {
                healText.destroy();
            }
        });
    }

    healProjectileOwner(sourceCombatId: string | undefined, amount: number): void {
        if (!sourceCombatId || amount <= 0) {
            return;
        }

        const sourceEnemy = this.humanoids.find((humanoid) => humanoid.combatId === sourceCombatId);

        if (!sourceEnemy || sourceEnemy.health <= 0) {
            return;
        }

        const maxHealth = sourceEnemy.spawnConfig?.health ?? sourceEnemy.health;
        const previousHealth = sourceEnemy.health;
        sourceEnemy.health = Math.min(maxHealth, sourceEnemy.health + amount);
        const healedAmount = sourceEnemy.health - previousHealth;

        if (healedAmount <= 0) {
            return;
        }

        const healText = this.add.text(sourceEnemy.parts.head.position.x, sourceEnemy.parts.head.position.y - 90, `+${healedAmount} HP`, {
            font: "bold 24px Arial",
            fill: "#52b788"
        }).setOrigin(0.5, 0.5).setDepth(30);

        this.tweens.add({
            targets: healText,
            y: healText.y - 50,
            alpha: { from: 1, to: 0 },
            duration: 700,
            ease: "Cubic.out",
            onComplete: () => {
                healText.destroy();
            }
        });
    }

    removePlayerCurrency(amount: number): void {
        if (amount <= 0 || this.player.health <= 0) {
            return;
        }

        const removedAmount = Math.min(amount, this.playerProfile.currency);

        if (removedAmount <= 0) {
            return;
        }

        this.playerProfile = updatePlayerProfile((profile) => {
            profile.currency = Math.max(0, profile.currency - removedAmount);
        });
        this.currencyEarned -= removedAmount;
        this.refreshEconomyDisplay();

        const lossText = this.add.text(
            this.player.parts.chest.position.x,
            this.player.parts.chest.position.y - 160,
            `-$${removedAmount}`,
            { font: "bold 28px Arial", fill: "#ef476f" }
        ).setOrigin(0.5, 0.5).setDepth(30);

        this.tweens.add({
            targets: lossText,
            y: lossText.y - 50,
            alpha: { from: 1, to: 0 },
            duration: 800,
            ease: "Cubic.out",
            onComplete: () => {
                lossText.destroy();
            }
        });
    }

    shouldRemoveFadedEnemyCorpses(): boolean {
        return loadPlayerProfile().removeFadedEnemyCorpses;
    }

    removeArrowFromCollections(arrow: MatterArrow): void {
        const spawnedArrowIndex = this.spawnedArrows.indexOf(arrow);

        if (spawnedArrowIndex >= 0) {
            this.spawnedArrows.splice(spawnedArrowIndex, 1);
        }

        const opponentArrowIndex = this.opponentArrows.indexOf(arrow);

        if (opponentArrowIndex >= 0) {
            this.opponentArrows.splice(opponentArrowIndex, 1);
        }
    }

    cleanupDeadEnemyCorpse(person: RagdollPerson): void {
        this.removeHumanoid(person);

        person.linkedArrows.slice().forEach((linkedArrow) => {
            this.removeArrowFromCollections(linkedArrow);

            if (linkedArrow.bodyConstraint) {
                this.matter.world.removeConstraint(linkedArrow.bodyConstraint);
            }

            if (linkedArrow.active) {
                linkedArrow.destroy();
            }
        });
        person.linkedArrows = [];

        person.constraints.forEach((constraint) => {
            this.matter.world.removeConstraint(constraint);
        });

        person.bodies.forEach((bodyPart) => {
            this.matter.world.remove(bodyPart, true);
        });

        person.linkedSprites.forEach((sprite) => {
            if (sprite.active) {
                sprite.destroy();
            }
        });

        person.healthDisplay?.destroy();
        person.statusDisplay?.destroy();
    }

    removeHumanoid(person: RagdollPerson): void {
        const humanoidIndex = this.humanoids.indexOf(person);

        if (humanoidIndex >= 0) {
            this.humanoids.splice(humanoidIndex, 1);
        }
    }

    handlePersonDeath(person: RagdollPerson, sourceProjectile?: ProjectileConfig): void {
        if (person.dead) {
            return;
        }

        person.dead = true;
        this.setCombatAction(person, "dead");

        if (person !== this.player) {
            this.kills += 1;

            if (sourceProjectile) {
                this.healPlayer(sourceProjectile.healPlayerOnKill ?? 0, person.parts.head.position.x, person.parts.head.position.y - 90);
            }

            this.maybeDropTimedPowerup(person);

            const baseReward = person.archetype?.currencyReward ?? 0;
            const reward = Math.max(0, Math.round(baseReward * (person.rewardMultiplier ?? 1)));

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

        if (person.attackTelegraphSprite) {
            person.attackTelegraphSprite.clearTint();
        }

        person.activeStatusEffects = {};

        person.bodies.forEach((bodyPart) => {
            this.matter.body.setStatic(bodyPart, false);
        });

        this.time.delayedCall(2500, () => {
            person.constraints.forEach((constraint) => {
                this.matter.world.removeConstraint(constraint);
            });

            person.bodies.forEach((bodyPart) => {
                bodyPart.collisionFilter.group = -1;
            });

            if (person !== this.player) {
                this.disableProjectileCollisionsForSplitCorpse(person);
            }

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
                repeat: 0,
                onComplete: () => {
                    if (person !== this.player && this.shouldRemoveFadedEnemyCorpses()) {
                        this.cleanupDeadEnemyCorpse(person);
                    }
                }
            });
        });
    }

    disableProjectileCollisionsForSplitCorpse(person: RagdollPerson): void {
        person.ignoresProjectileCollisions = true;

        person.bodies.forEach((bodyPart) => {
            bodyPart.collisionFilter.mask &= ~PROJECTILE_COLLISION_CATEGORY;
        });
    }

    showCurrencyReward(person: RagdollPerson, reward: number): void {
        const rewardText = this.add.text(
            person.parts.head.position.x,
            person.parts.head.position.y - 60,
            `+$${reward}`,
            { font: "bold 28px Arial", fill: "#ffd166" }
        ).setOrigin(0.5, 0.5).setDepth(30);

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
    constructor(private manualLevelKey: ManualLevelKey) {
        super(manualLevelKey);
    }

    create(): void {
        super.create();

        const definition = getManualLevelDefinition(this.manualLevelKey);
        this.currentLevel = definition.sceneKey;
        this.nextLevel = definition.nextLevel;

        if (definition.instructions) {
            const instructions = this.add.text(
                definition.instructions.x,
                definition.instructions.y,
                definition.instructions.text,
                {
                    font: definition.instructions.font ?? "bold 40px Arial",
                    fill: definition.instructions.fill ?? "#ffffff"
                }
            );

            this.events.once("levelEnd", () => {
                instructions.destroy();
            });
        }

        this.humanoids.push(...this.spawnEnemies(definition.createEnemyConfigs(this.levelScale)));
    }
}
