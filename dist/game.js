"use strict";
class LooseScene extends Phaser.Scene {
    constructor(...args) {
        super(...args);
    }
}
const PLAYER_ARROW_CONFIG = {
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
    }
};
const DEFAULT_PLAYER_LOADOUT = {
    projectile: PLAYER_ARROW_CONFIG
};
// Typed scaffolding for a future shop system. Keeping the catalog data-driven
// will make the eventual menu implementation much simpler.
const SHOP_CATALOG = [];
function createEnemySpawnConfig(config) {
    return Object.assign({ staticBody: false, archetype: STANDARD_ENEMY_ARCHETYPE }, config);
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
        if (showHealthDisplay) {
            person.attackInterval = attackInterval;
            person.timer = 0;
            person.currentDelay = 0;
            person.delayAttack = delayAttack;
            person.triggered = false;
            person.healthDisplay = this.scene.add.text(0, 0, `${person.health}`, { font: "40px Arial", fill: "#ffFFFF" }).setOrigin(0.5, 0.5);
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
    playerHealth: { font: "20px Arial", fill: "#ff1010" }
};
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
        this.playerLoadout = DEFAULT_PLAYER_LOADOUT;
        this.bowStream = false;
        this.instaCharge = false;
        this.canCharge = true;
        this.chargeTime = 0;
        this.isLevelEnding = false;
        this.arrowsShot = 0;
        this.arrowsHit = 0;
        this.kills = 0;
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
        down.on("down", () => {
            this.bowStream = !this.bowStream;
        });
        right.on("down", () => {
            this.instaCharge = !this.instaCharge;
        });
        up.on("up", () => {
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
        this.shootArrow(power, this.levelScale, this.bow, this.mousex, this.mousey, this.playerLoadout.projectile, this.spawnedArrows);
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
            kills: this.kills
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
        const enemy = this.ragdollFactory.createEnemy(config.x, config.y, config.scale, {
            staticBody: config.staticBody,
            health: config.health,
            flip: config.flip,
            attackInterval: config.attackInterval,
            delayAttack: config.attackDelay
        });
        enemy.archetype = config.archetype;
        enemy.spawnConfig = config;
        return enemy;
    }
    spawnEnemies(configs) {
        return configs.map((config) => this.spawnEnemy(config));
    }
    humanoidAttack(humanoid, scale, power, player) {
        const spawnpoint = humanoid.throwingArm;
        const attackConfig = humanoid.archetype.attack;
        spawnpoint.force = { x: attackConfig.throwForceX * scale, y: attackConfig.throwForceY * scale };
        const resolvedScale = Math.abs(scale);
        const targetBody = player.bodies[Math.floor(Math.random() * player.bodies.length)];
        const targetPosition = targetBody.position;
        const angle = Phaser.Math.Angle.Between(spawnpoint.position.x, spawnpoint.position.y, targetPosition.x + (Math.random() * attackConfig.aimSpreadX * 2 - attackConfig.aimSpreadX), targetPosition.y + (Math.random() * attackConfig.aimSpreadY * 2 - attackConfig.aimSpreadY));
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
        return this.ragdollFactory.createPlayer(x, y, scale, {
            staticBody,
            health,
            flip
        });
    }
    spawnArrow(x, y, angle, velocityX, velocityY, scale, projectileConfig) {
        const arrow = this.matter.add.image(x, y, projectileConfig.texture, null);
        arrow.setScale(projectileConfig.scale * scale);
        arrow.setAngle(angle);
        arrow.setVelocity(velocityX, velocityY);
        arrow.rotation = angle;
        arrow.alreadyHit = false;
        arrow.projectileConfig = projectileConfig;
        arrow.body.collisionFilter.group = projectileConfig.collisionGroup;
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
        const aimArrow = this.createStaticWeaponSprite("arrow", scale);
        const bowSprite = this.createStaticWeaponSprite("bow", scale);
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
            person.healthDisplay.setText("");
        }
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
class LevelOne extends LevelScene {
    constructor() {
        super("LevelOne");
    }
    preload() {
        super.preload();
    }
    create() {
        super.create();
        this.currentLevel = "LevelOne";
        this.nextLevel = "LevelTwo";
        const enemyConfigs = [
            createEnemySpawnConfig({
                x: 1300,
                y: 600,
                scale: this.levelScale,
                health: 3,
                flip: true,
                attackInterval: 3000,
                attackDelay: 2
            })
        ];
        const instructions = this.add.text(200, 150, "Hold Click to Charge the Bow\nLet Go to Shoot the Arrow in the direction of your Mouse\n\nEach Arrow does 1 DMG\nHeadshotting Opponents does 3 DMG\nOpponents can shoot at you\nTheir Arm will glow orange when they start throwing arrows\nYou have 10 Health", { font: "bold 40px Arial", fill: "#ffffff" });
        this.humanoids.push(...this.spawnEnemies(enemyConfigs));
        this.events.on("levelEnd", () => {
            instructions.setText("");
        });
    }
}
class LevelTwo extends LevelScene {
    constructor() {
        super("LevelTwo");
    }
    preload() {
        super.preload();
    }
    create() {
        super.create();
        this.currentLevel = "LevelTwo";
        this.nextLevel = "LevelThree";
        const enemyConfigs = [
            createEnemySpawnConfig({
                x: 1300,
                y: 700,
                scale: this.levelScale + 0.2,
                health: 5,
                flip: true,
                attackInterval: 2000,
                attackDelay: 2
            }),
            createEnemySpawnConfig({
                x: 1000,
                y: 500,
                scale: this.levelScale - 0.3,
                health: 2,
                flip: true,
                attackInterval: 3000,
                attackDelay: 3
            }),
            createEnemySpawnConfig({
                x: 1600,
                y: 300,
                scale: this.levelScale - 0.5,
                health: 1,
                flip: true,
                attackInterval: 4000,
                attackDelay: 1
            })
        ];
        const instructions = this.add.text(200, 300, "There is no lore to this game,\nidk why these guys are floating\n(other than making it so \nyou have to aim in the air)", { font: "bold 40px Arial", fill: "#ffffff" });
        this.events.on("levelEnd", () => {
            instructions.setText("");
        });
        this.humanoids.push(...this.spawnEnemies(enemyConfigs));
    }
}
class LevelThree extends LevelScene {
    constructor() {
        super("LevelThree");
    }
    preload() {
        super.preload();
    }
    create() {
        super.create();
        this.currentLevel = "LevelThree";
        this.nextLevel = "MainMenu";
        const bossConfigs = [
            createEnemySpawnConfig({
                x: 1250,
                y: 400,
                scale: this.levelScale + 0.5,
                health: 9,
                flip: true,
                attackInterval: 5000,
                attackDelay: 5
            })
        ];
        const instructions = this.add.text(200, 200, "Extra Stuff:\nPress the Down Arrow to toggle bow stream cheat\nPress the Up Arrow to reset the level\nPress the Right Arrow to have your shots instantly charge\nThere is no Konami Code unfortunately", { font: "bold 25px Arial", fill: "#ffffff" });
        this.events.on("levelEnd", () => {
            instructions.setText("");
        });
        this.humanoids.push(...this.spawnEnemies(bossConfigs));
        const weirdAmalgamX = 1700;
        const weirdAmalgamY = 600;
        const weirdAmalgamScale = this.levelScale - 0.6;
        const humanoidCount = 10;
        const amalgamConfigs = [];
        for (let count = 0; count < humanoidCount; count++) {
            amalgamConfigs.push(createEnemySpawnConfig({
                x: weirdAmalgamX - count,
                y: weirdAmalgamY,
                scale: weirdAmalgamScale,
                health: 1,
                flip: true,
                attackInterval: Math.random() * 500 + 750,
                attackDelay: Math.random() * 2 + 10
            }));
        }
        this.humanoids.push(...this.spawnEnemies(amalgamConfigs));
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
    }
    preload() {
        super.preload();
    }
    create() {
        const summaryBox = this.add.container(1920 / 2, -1000);
        const entireBox = this.add.rexRoundRectangle(0, 0, 750, 750, 30, 0x99b0af, 1);
        entireBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        summaryBox.add([entireBox]);
        const summaryTitle = this.health <= 0
            ? this.add.text(0, -310, "You Died...", { font: "100px Arial", fill: "#000000" })
            : this.add.text(0, -310, "Summary", { font: "100px Arial", fill: "#000000" });
        summaryTitle.setOrigin(0.5);
        const accuracy = `Accuracy: ${((this.arrowsHit / this.arrowsShot) * 100).toFixed(3)}%`;
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
        const durationText = this.add.text(0, 20, duration, { font: "50px Arial", fill: "#a0ffa0" });
        durationText.setOrigin(0.5);
        summaryBox.add([summaryTitle, accuracyText, healthText, durationText]);
        const nextLevelBox = this.add.rexRoundRectangle((750 / 2) - (750 / 4), 200, 275, 200, 30, 0xffafaa, 1);
        nextLevelBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        nextLevelBox.setInteractive();
        const mainMenuBox = this.add.rexRoundRectangle(-(750 / 4), 200, 275, 200, 30, 0xffffaa, 1);
        mainMenuBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        mainMenuBox.setInteractive();
        summaryBox.add([nextLevelBox, mainMenuBox]);
        const mainMenuText = this.add.text(-(750 / 4), 200, " Main\nMenu", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
        const nextLevelText = (this.health <= 0 || this.currentLevel === "TimedLevel")
            ? this.add.text((750 / 2) - (750 / 4), 200, "Retry", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5)
            : this.add.text((750 / 2) - (750 / 4), 200, " Next\nLevel", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
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
                        this.menuLeave(summaryBox, this.currentLevel, this.currentLevel, { scale: 1, canCharge: false });
                    }
                    else {
                        this.menuLeave(summaryBox, this.currentLevel, this.nextLevel, { scale: 1, canCharge: false });
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
        const wholeContainer = this.add.container(1920 / 2, -1000);
        const entireBox = this.add.rexRoundRectangle(0, 0, 1800, 1080 - 120, 30, 0x99b0af, 1);
        entireBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        wholeContainer.add([entireBox]);
        const title = this.add.text(0, -310, "On Target", { font: "100px Arial", fill: "#000000" });
        title.setOrigin(0.5);
        wholeContainer.add([title]);
        const level1Box = this.add.rexRoundRectangle(-450, -90, 275, 200, 30, 0x3fafaa, 1);
        level1Box.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        level1Box.setInteractive();
        const level2Box = this.add.rexRoundRectangle(0, -90, 275, 200, 30, 0xf0f6af, 1);
        level2Box.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        level2Box.setInteractive();
        const level3Box = this.add.rexRoundRectangle(450, -90, 275, 200, 30, 0x8ff00f, 1);
        level3Box.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        level3Box.setInteractive();
        const timedBox = this.add.rexRoundRectangle((750 / 2) - (750 / 4), 200, 275, 200, 30, 0xffafaa, 1);
        timedBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        timedBox.setInteractive();
        const creditsBox = this.add.rexRoundRectangle(-(750 / 4), 200, 275, 200, 30, 0xffffaa, 1);
        creditsBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        creditsBox.setInteractive();
        wholeContainer.add([level1Box, level2Box, level3Box, timedBox, creditsBox]);
        const level1Text = this.add.text(-450, -90, "Level 1", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
        const level2Text = this.add.text(0, -90, "Level 2", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
        const level3Text = this.add.text(450, -90, "Level 3", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
        const timedLevelText = this.add.text(-(750 / 4), 200, "Timed\n Mode", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
        const creditsText = this.add.text((750 / 2) - (750 / 4), 200, "Credits", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
        wholeContainer.add([creditsText, timedLevelText, level1Text, level2Text, level3Text]);
        this.tweens.add({
            targets: wholeContainer,
            y: 1080 / 2,
            duration: 500,
            ease: "Cubic.out",
            onComplete: () => {
                level1Box.on("pointerdown", () => {
                    this.menuLeave(wholeContainer, "MainMenu", "LevelOne", { scale: 1, canCharge: false });
                });
                level2Box.on("pointerdown", () => {
                    this.menuLeave(wholeContainer, "MainMenu", "LevelTwo", { scale: 1, canCharge: false });
                });
                level3Box.on("pointerdown", () => {
                    this.menuLeave(wholeContainer, "MainMenu", "LevelThree", { scale: 1, canCharge: false });
                });
                // This keeps the original scene mapping behavior intact.
                timedBox.on("pointerdown", () => {
                    this.menuLeave(wholeContainer, "MainMenu", "Credits");
                });
                creditsBox.on("pointerdown", () => {
                    this.menuLeave(wholeContainer, "MainMenu", "TimedLevel", { scale: 1, canCharge: false });
                });
            }
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
    scene: [MainMenu, SummaryScene, LevelOne, LevelTwo, LevelThree, TimedLevel, Credits],
    title: "Physics Game"
});
//# sourceMappingURL=game.js.map