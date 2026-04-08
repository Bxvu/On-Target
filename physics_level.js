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
    ['rexroundrectangleplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexroundrectangleplugin.min.js'],
    ['rexkawaseblurpipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexkawaseblurpipelineplugin.min.js'],
    ['rexdropshadowpipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexdropshadowpipelineplugin.min.js']
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
    playerHealth: { font: "20px Arial", fill: "#ff1010" }
};

const MAX_ARROWS_PER_GROUP = 25;

class LevelScene extends Phaser.Scene {

    init(data = {}) {
        this.levelData = data;
        this.startTime = 0;
        this.sceneDuration = 0;
    }

    preload() {
        this.load.path = './assets/';
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

        this.bowStream = false;
        this.instaCharge = false;
        this.canCharge = true;
        this.chargeTime = 0;
        this.isLevelEnding = false;

        this.arrowsShot = 0;
        this.arrowsHit = 0;
        this.kills = 0;

        this.spawnedArrows = this.createArrowCollection(true);
        this.opponentArrows = this.createArrowCollection(false);
        this.humanoids = [];

        this.mousex = this.input.activePointer.x;
        this.mousey = this.input.activePointer.y;

        this.events.removeAllListeners("levelEnd");
        this.events.removeAllListeners("arrowHit");
        this.events.removeAllListeners("nextWave");
    }

    createArrowCollection(fromPlayer) {
        const arrows = [];
        arrows.fromplayer = fromPlayer;
        return arrows;
    }

    registerDebugControls() {
        const down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        const right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        const up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

        down.on('down', () => {
            this.bowStream = !this.bowStream;
        });

        right.on('down', () => {
            this.instaCharge = !this.instaCharge;
        });

        up.on('up', () => {
            this.scene.restart({ scale: 1 });
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
    }

    createPlayerRig() {
        const playerItems = this.createPlayer(PLAYER_SPAWN.x, PLAYER_SPAWN.y, Math.abs(this.levelScale), 10);

        this.bow = playerItems.playerContainer;
        this.bowSprite = playerItems.bowSprite;
        this.player = playerItems.player;
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
        this.shootArrow(power, this.levelScale, this.bow, this.mousex, this.mousey, this.spawnedArrows);
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
                humanoid.healthDisplay.x = humanoid.parts.head.position.x;
                humanoid.healthDisplay.y = humanoid.parts.head.position.y;
                humanoid.healthDisplay.setText(`${humanoid.health}`);
                humanoid.timer += delta;

                if (humanoid.timer >= humanoid.attackInterval) {
                    humanoid.timer -= humanoid.attackInterval;

                    if (humanoid.currentDelay <= humanoid.delayAttack) {
                        humanoid.currentDelay += 1;
                    }
                    else {
                        this.humanoidAttack(humanoid, this.levelScale, (Math.random() * 95) + 5, this.player);
                    }

                    if (humanoid.currentDelay >= humanoid.delayAttack && !humanoid.triggered) {
                        humanoid.triggered = true;
                        humanoid.attackTelegraphSprite.preFX.addGlow(0xFFA500, 5, 1);
                    }
                }
            }
        });
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

        this.scene.launch('SummaryScene', {
            arrowsHit: this.arrowsHit,
            arrowsShot: this.arrowsShot,
            health: this.player.health,
            maxHealth: 10,
            duration: this.sceneDuration,
            currentLevel: this.currentLevel,
            nextLevel: this.nextLevel,
            kills: this.kills
        });

        this.plugins.get('rexkawaseblurpipelineplugin').add(this.cameras.main, {
            blur: 5,
            quality: 3
        });

        this.scene.pause();
    }

    constructHumanoid(x, y, scale, staticBody, health, flip, attackInterval, delay) {
        return this.ragdollFactory.createEnemy(x, y, scale, {
            staticBody,
            health,
            flip,
            attackInterval,
            delayAttack: delay
        });
    }

    humanoidAttack(humanoid, scale, power, player) {
        const spawnpoint = humanoid.throwingArm;
        spawnpoint.force = { x: -0.025 * scale, y: -0.002 * scale };

        const resolvedScale = Math.abs(scale);
        const targetBody = player.bodies[Math.floor(Math.random() * player.bodies.length)];
        const targetPosition = targetBody.position;
        const angle = Phaser.Math.Angle.Between(
            spawnpoint.position.x,
            spawnpoint.position.y,
            targetPosition.x + (Math.random() * 200 - 100),
            targetPosition.y + (Math.random() * 200 - 100)
        );
        const speed = power * resolvedScale;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        const newArrow = this.spawnArrow(spawnpoint.position.x, spawnpoint.position.y, angle, velocityX, velocityY, resolvedScale, 15);

        this.opponentArrows.push(newArrow);
        this.time.delayedCall(2500, () => {
            if (newArrow) {
                this.destroyArrow(newArrow, this.opponentArrows);
            }
        });
    }

    constructPlayer(x, y, scale, staticBody, health, flip) {
        return this.ragdollFactory.createPlayer(x, y, scale, {
            staticBody,
            health,
            flip
        });
    }

    spawnArrow(x, y, angle, velocityX, velocityY, scale, group) {
        const arrow = this.matter.add.image(x, y, 'arrow', null);
        arrow.setScale(0.2 * scale);
        arrow.setAngle(angle);
        arrow.setVelocity(velocityX, velocityY);
        arrow.rotation = angle;
        arrow.alreadyHit = false;
        arrow.body.collisionFilter.group = group != null ? group : -15;
        return arrow;
    }

    shootArrow(power, scale, bow, mousex, mousey, arrowList) {
        const resolvedScale = Math.abs(scale);
        const angle = Phaser.Math.Angle.Between(bow.x, bow.y, mousex, mousey);
        const speed = power * resolvedScale;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;

        const newArrow = this.spawnArrow(bow.x, bow.y, angle, velocityX, velocityY, resolvedScale);
        arrowList.push(newArrow);

        this.time.delayedCall(7500, () => {
            if (newArrow) {
                this.destroyArrow(newArrow, arrowList);
            }
        });

        while (arrowList.length > MAX_ARROWS_PER_GROUP) {
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
            alpha: '0',
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
        const aimArrow = this.createStaticWeaponSprite('arrow', scale);
        const bowSprite = this.createStaticWeaponSprite('bow', scale);
        const player = this.constructPlayer(x, y, scale, false, health, false);
        const playerContainer = this.add.container(x, y);

        playerContainer.add([bowSprite, aimArrow]);
        return { player, playerContainer, bowSprite, aimArrow };
    }

    createStaticWeaponSprite(texture, scale) {
        const weaponSprite = this.matter.add.image(100, 0, texture, null);
        weaponSprite.setStatic(true);
        weaponSprite.setScale(0.2 * scale);
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
        if (!arrow.alreadyHit) {
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

            if (person.health > 0) {
                person.linkedSprites.forEach((sprite) => {
                    sprite.setTint(0xff0000);
                });

                person.health -= part.label === "head" ? 3 : 1;

                if (arrowList.fromplayer) {
                    this.events.emit("arrowHit", 1);
                }

                this.time.delayedCall(250, () => {
                    person.linkedSprites.forEach((sprite) => {
                        sprite.clearTint();
                    });
                });

                if (person.health <= 0) {
                    this.handlePersonDeath(person);
                }
            }
        }
        else if (person.health <= 0) {
            this.handlePersonDeath(person);
        }
    }

    handlePersonDeath(person) {
        if (person.dead) {
            return;
        }

        person.dead = true;

        if (person.healthDisplay) {
            person.healthDisplay.setText('');
        }

        person.bodies.forEach((bodyPart) => {
            if (bodyPart.label === 'chest') {
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
}
