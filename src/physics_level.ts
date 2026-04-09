const LEVEL_IMAGE_ASSETS: Array<[string, string]> = [
    ["aOpponentHead", "armoredOpponent-head.png"],
    ["aOpponentBody", "armoredOpponent-body.png"],
    ["aOpponentShortLimb", "armoredOpponent-shortLimb.png"],
    ["aOpponentLeg", "armoredOpponent-leg.png"],
    ["aOpponentArm", "armoredOpponent-arm.png"],
    ["arrow", "arrow.png"],
    ["rock", "rock.png"],
    ["bow", "bow.png"]
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

    createPlayerRig(): void {
        const playerItems = this.createPlayer(PLAYER_SPAWN.x, PLAYER_SPAWN.y, Math.abs(this.levelScale), PLAYER_MAX_HEALTH);

        this.bow = playerItems.playerContainer;
        this.bowSprite = playerItems.bowSprite;
        this.player = playerItems.player;
        this.player.loadout = this.playerLoadout;
        this.player.healthDisplay = this.add.text(PLAYER_SPAWN.x, PLAYER_SPAWN.y - 100, `Health: ${PLAYER_MAX_HEALTH}`, HUD_STYLES.playerHealth);
        this.player.healthDisplay.setOrigin(0.5, 0.5);
        this.player.statusDisplay = this.add.text(PLAYER_SPAWN.x, PLAYER_SPAWN.y - 132, "", HUD_STYLES.playerStatus).setOrigin(0.5, 0.5);
        this.refreshPlayerStatusModifiers();
        this.refreshPlayerStatusDisplay();

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

    update(time: number, delta: number): void {
        this.updateSceneTimer();
        this.updatePointerTracking();
        this.updateChargeDisplayPosition();
        this.handlePlayerCharge();
        this.updateBowAim();
        this.syncRagdollSprites();

        const humanoidsDefeated = this.checkCombatCollisions();
        this.updateHumanoidAI(delta);
        this.updatePlayerStatusEffects(delta);
        this.updatePlayerOverheal(delta);
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
        const chargeRateMultiplier = this.player?.chargeRateMultiplier ?? 1;

        if (pointer.isDown && this.canCharge) {
            if (this.bowStream) {
                this.firePlayerArrow(100 + 10 / scaleMagnitude);
                this.chargeTime = 0;
            }
            else if (this.instaCharge) {
                this.chargeTime = 100;
            }
            else if (this.chargeTime < 100) {
                this.chargeTime = this.chargeTime === 0
                    ? Math.max(1, chargeRateMultiplier)
                    : this.chargeTime * (1 + (0.1 * chargeRateMultiplier));
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

    firePlayerArrow(power: number): void {
        const aimSpreadMultiplier = this.player.aimSpreadMultiplier ?? 1;
        const throwForceMultiplier = this.player.throwForceMultiplier ?? 1;
        const scatterRadius = Math.max(0, (aimSpreadMultiplier - 1) * PLAYER_SHOT_SCATTER_PIXELS);
        const targetX = this.mousex + (Math.random() * scatterRadius * 2 - scatterRadius);
        const targetY = this.mousey + (Math.random() * scatterRadius * 2 - scatterRadius);

        this.shootArrow(
            power * this.playerLoadout.powerMultiplier * throwForceMultiplier,
            this.levelScale,
            this.bow,
            targetX,
            targetY,
            this.playerLoadout.projectile,
            this.spawnedArrows
        );
        this.arrowsShot += 1;
    }

    updateBowAim(): void {
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

    syncRagdollSprites(): void {
        this.ragdollFactory.syncLinkedSprites(this.player);
        this.humanoids.forEach((humanoid: RagdollPerson) => this.ragdollFactory.syncLinkedSprites(humanoid));
    }

    checkCombatCollisions(): boolean {
        let humanoidsDefeated = true;

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

                humanoid.healthDisplay!.x = humanoid.parts.head.position.x;
                humanoid.healthDisplay!.y = humanoid.parts.head.position.y;
                humanoid.healthDisplay!.setText(`${humanoid.health}`);
                humanoid.statusDisplay!.x = humanoid.parts.head.position.x;
                humanoid.statusDisplay!.y = humanoid.parts.head.position.y - 34;
                humanoid.timer! += delta;

                if (humanoid.timer! >= humanoid.attackInterval!) {
                    humanoid.timer! -= humanoid.attackInterval!;

                    if (humanoid.currentDelay! <= humanoid.delayAttack!) {
                        humanoid.currentDelay! += 1;
                    }
                    else {
                        this.humanoidAttack(humanoid, this.levelScale, this.rollAttackPower(humanoid), this.player);
                    }

                    if (humanoid.currentDelay! >= humanoid.delayAttack! && !humanoid.triggered) {
                        humanoid.triggered = true;
                        humanoid.attackTelegraphSprite!.preFX.addGlow(
                            humanoid.archetype!.attack.telegraphColor,
                            humanoid.archetype!.attack.telegraphThickness,
                            humanoid.archetype!.attack.telegraphOuterStrength
                        );
                    }
                }
            }
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

        this.player.statusDisplay.setText(statusSegments.join("  |  "));
    }

    rollAttackPower(humanoid: RagdollPerson): number {
        const attackConfig = humanoid.archetype!.attack;
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
        const resolvedArchetype = resolveEnemyArchetype(config.archetype);
        const enemy = this.assignCombatId(this.ragdollFactory.createEnemy(config.x, config.y, config.scale, {
            staticBody: config.staticBody,
            health: config.health,
            flip: config.flip,
            attackInterval: config.attackInterval,
            delayAttack: config.attackDelay
        }));

        enemy.archetype = resolvedArchetype;
        enemy.spawnConfig = {
            ...config,
            archetype: resolvedArchetype
        };
        return enemy;
    }

    spawnEnemies(configs: EnemySpawnConfig[]): RagdollPerson[] {
        return configs.map((config) => this.spawnEnemy(config));
    }

    humanoidAttack(humanoid: RagdollPerson, scale: number, power: number, player: RagdollPerson): void {
        const spawnpoint = humanoid.throwingArm;
        const attackConfig = humanoid.archetype!.attack;
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
            humanoid.archetype!.projectile
        );

        newArrow.sourceCombatId = humanoid.combatId;
        this.opponentArrows.push(newArrow);
        this.time.delayedCall(attackConfig.cleanupDelayMs, () => {
            if (newArrow) {
                this.destroyArrow(newArrow, this.opponentArrows);
            }
        });
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
        arrow.body.collisionFilter.group = projectileConfig.collisionGroup;
        arrow.body.isSensor = (projectileConfig.pierceCount ?? 0) > 0;
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

    createPlayer(x: number, y: number, scale: number, health: number): { player: RagdollPerson; playerContainer: GameContainer; bowSprite: MatterImage; aimArrow: MatterImage } {
        const aimArrow = this.createStaticWeaponSprite(
            this.playerLoadout.projectile.texture,
            scale,
            this.playerLoadout.projectile.tint,
            this.playerLoadout.projectile.scale
        );
        const bowSprite = this.createStaticWeaponSprite(
            this.playerLoadout.weapon.bowTexture,
            scale,
            this.playerLoadout.weapon.bowTint
        );
        const player = this.constructPlayer(x, y, scale, false, health, false);
        const playerContainer = this.add.container(x, y);

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

    checkArrowCollisions(arrowList: ArrowCollection, person: RagdollPerson): void {
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

    handlePersonDeath(person: RagdollPerson, sourceProjectile?: ProjectileConfig): void {
        if (person.dead) {
            return;
        }

        person.dead = true;

        if (person !== this.player) {
            this.kills += 1;

            if (sourceProjectile) {
                this.healPlayer(sourceProjectile.healPlayerOnKill ?? 0, person.parts.head.position.x, person.parts.head.position.y - 90);
            }

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
