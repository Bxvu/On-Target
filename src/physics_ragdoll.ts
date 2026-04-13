interface HumanoidProfileDefinition {
    parts: HumanoidPartConfig[];
    constraints: HumanoidConstraintConfig[];
    sprites: HumanoidSpriteConfig[];
    throwingArm: BodyPartName;
    attackTelegraphPart: BodyPartName;
}

const DEFAULT_HUMANOID_PROFILE: HumanoidProfileDefinition = {
    parts: [
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
    ],
    constraints: [
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
    ],
    sprites: [
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
    ],
    throwingArm: "leftLowerArm",
    attackTelegraphPart: "leftLowerArm"
};

const HUMANOID_BODY_ORDER: BodyPartName[] = [
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

const STARFISH_HUMANOID_PROFILE: HumanoidProfileDefinition = {
    parts: [
        { name: "head", label: "head", offsetX: 0, offsetY: 0, width: 60, height: 60, color: "#FFBC42", chamfer: (scale) => [24 * scale, 24 * scale, 24 * scale, 24 * scale] },
        { name: "chest", label: "head", offsetX: 0, offsetY: 34, width: 12, height: 12, color: "#FFBC42", chamfer: (scale) => [6 * scale, 6 * scale, 6 * scale, 6 * scale] },
        { name: "leftUpperArm", label: "left-arm", offsetX: 0, offsetY: -40, width: 26, height: 42, color: "#FFBC42", angle: 0, chamfer: (scale) => 12 * scale },
        { name: "leftLowerArm", label: "left-lower-arm", offsetX: 24, offsetY: -16, width: 26, height: 46, color: "#E59B12", angle: 1.15, chamfer: (scale) => 12 * scale },
        { name: "rightUpperArm", label: "right-arm", offsetX: 42, offsetY: 0, width: 26, height: 42, color: "#FFBC42", angle: Math.PI / 2, chamfer: (scale) => 12 * scale },
        { name: "rightLowerArm", label: "right-lower-arm", offsetX: 18, offsetY: 26, width: 26, height: 46, color: "#E59B12", angle: 2.7, chamfer: (scale) => 12 * scale },
        { name: "leftUpperLeg", label: "left-leg", offsetX: 0, offsetY: 42, width: 26, height: 42, color: "#FFBC42", angle: Math.PI, chamfer: (scale) => 12 * scale },
        { name: "leftLowerLeg", label: "left-lower-leg", offsetX: -24, offsetY: 18, width: 26, height: 46, color: "#E59B12", angle: -2.05, chamfer: (scale) => 12 * scale },
        { name: "rightUpperLeg", label: "right-leg", offsetX: -42, offsetY: 0, width: 26, height: 42, color: "#FFBC42", angle: -Math.PI / 2, chamfer: (scale) => 12 * scale },
        { name: "rightLowerLeg", label: "right-lower-leg", offsetX: -18, offsetY: -26, width: 26, height: 46, color: "#E59B12", angle: -0.6, chamfer: (scale) => 12 * scale }
    ],
    constraints: [
        { bodyA: "head", bodyB: "leftUpperArm", length: (scale) => 8 * scale, stiffness: 0.82, pointA: { x: 0, y: -20 }, pointB: { x: 0, y: -14 } },
        { bodyA: "head", bodyB: "rightUpperArm", length: (scale) => 8 * scale, stiffness: 0.82, pointA: { x: 20, y: 0 }, pointB: { x: 0, y: -14 } },
        { bodyA: "head", bodyB: "leftUpperLeg", length: (scale) => 8 * scale, stiffness: 0.82, pointA: { x: 0, y: 20 }, pointB: { x: 0, y: -14 } },
        { bodyA: "head", bodyB: "rightUpperLeg", length: (scale) => 8 * scale, stiffness: 0.82, pointA: { x: -20, y: 0 }, pointB: { x: 0, y: -14 } },
        { bodyA: "leftUpperArm", bodyB: "leftLowerArm", length: (scale) => 8 * scale, stiffness: 0.78, pointA: { x: 0, y: 14 }, pointB: { x: 0, y: -16 } },
        { bodyA: "rightUpperArm", bodyB: "rightLowerArm", length: (scale) => 8 * scale, stiffness: 0.78, pointA: { x: 0, y: 14 }, pointB: { x: 0, y: -16 } },
        { bodyA: "leftUpperLeg", bodyB: "leftLowerLeg", length: (scale) => 8 * scale, stiffness: 0.78, pointA: { x: 0, y: 14 }, pointB: { x: 0, y: -16 } },
        { bodyA: "rightUpperLeg", bodyB: "rightLowerLeg", length: (scale) => 8 * scale, stiffness: 0.78, pointA: { x: 0, y: 14 }, pointB: { x: 0, y: -16 } },
        { bodyA: "head", bodyB: "chest", length: (scale) => 6 * scale, stiffness: 0.9, pointA: { x: 0, y: 14 }, pointB: { x: 0, y: -6 } }
    ],
    sprites: [
        { bodyName: "head", texture: "aOpponentHead", scale: 0.34 },
        { bodyName: "rightUpperArm", texture: "aOpponentShortLimb", scale: 0.26 },
        { bodyName: "rightLowerArm", texture: "aOpponentArm", scale: 0.26 },
        { bodyName: "leftUpperArm", texture: "aOpponentShortLimb", scale: 0.26 },
        { bodyName: "leftLowerArm", texture: "aOpponentArm", scale: 0.26 },
        { bodyName: "rightUpperLeg", texture: "aOpponentShortLimb", scale: 0.26 },
        { bodyName: "rightLowerLeg", texture: "aOpponentLeg", scale: 0.26 },
        { bodyName: "leftUpperLeg", texture: "aOpponentShortLimb", scale: 0.26 },
        { bodyName: "leftLowerLeg", texture: "aOpponentLeg", scale: 0.26 }
    ],
    throwingArm: "head",
    attackTelegraphPart: "head"
};

const HUMANOID_PROFILES: Record<HumanoidBodyProfile, HumanoidProfileDefinition> = {
    default: DEFAULT_HUMANOID_PROFILE,
    starfish: STARFISH_HUMANOID_PROFILE
};

const PLAYER_COLLISION_GROUPS: Record<BodyPartName, number> = {
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
const PLAYER_RAGDOLL_COLLISION_CATEGORY = 0x0004;
const PLAYER_LEFT_WALL_COLLISION_CATEGORY = 0x0008;

class HumanoidFactory {
    constructor(private scene: LooseScene) {
    }

    createEnemy(x: number, y: number, scale: number, options: Partial<HumanoidBuildOptions> = {}): RagdollPerson {
        return this.createHumanoid(x, y, scale, {
            ...options,
            showHealthDisplay: true,
            collisionGroupResolver: () => this.scene.matter.body.nextGroup(true)
        });
    }

    createPlayer(x: number, y: number, scale: number, options: Partial<HumanoidBuildOptions> = {}): RagdollPerson {
        const player = this.createHumanoid(x, y, scale, {
            ...options,
            collisionGroupResolver: (partName) => PLAYER_COLLISION_GROUPS[partName]
        });

        Object.values(player.parts).forEach((part: MatterBody) => {
            part.collisionFilter.category = PLAYER_RAGDOLL_COLLISION_CATEGORY;
        });

        return player;
    }

    createHumanoid(x: number, y: number, scale: number, options: HumanoidBuildOptions): RagdollPerson {
        const resolvedScale = Math.abs(scale);
        const {
            staticBody = false,
            health = 1,
            flip = false,
            attackInterval = 0,
            delayAttack = 0,
            showHealthDisplay = false,
            bodyProfile = "default",
            collisionGroupResolver
        } = options;
        const humanoidProfile = HUMANOID_PROFILES[bodyProfile] ?? DEFAULT_HUMANOID_PROFILE;
        const parts = this.buildBodies(humanoidProfile.parts, x, y, resolvedScale, staticBody, collisionGroupResolver);
        const constraints = this.buildConstraints(humanoidProfile.constraints, parts, resolvedScale);
        const person = this.scene.matter.composite.create({
            bodies: HUMANOID_BODY_ORDER.map((partName) => parts[partName]),
            constraints
        }) as RagdollPerson;

        this.scene.matter.body.setStatic(parts.chest, !staticBody);

        const spriteBundle = this.createLinkedSprites(humanoidProfile.sprites, parts, resolvedScale, flip);

        person.parts = parts;
        person.bodyProfile = bodyProfile;
        person.health = health;
        person.dead = false;
        person.linkedSprites = spriteBundle.sprites;
        person.linkedSpritesByPart = spriteBundle.spritesByPart;
        person.linkedArrows = [];
        person.throwingArm = parts[humanoidProfile.throwingArm];
        person.attackTelegraphSprite = spriteBundle.spritesByPart[humanoidProfile.attackTelegraphPart];
        person.activeStatusEffects = {};
        person.rewardMultiplier = 1;
        person.aimSpreadMultiplier = 1;
        person.throwForceMultiplier = 1;
        person.chargeRateMultiplier = 1;
        person.meleeAttackRateMultiplier = 1;
        person.moveSpeedMultiplier = 1;
        person.behaviorKind = "ranged";
        person.facingDirection = flip ? -1 : 1;
        person.actionState = {
            kind: "idle",
            elapsedMs: 0,
            durationMs: 0
        };
        person.meleeHitApplied = false;
        person.meleeAttackCount = 0;

        if (showHealthDisplay) {
            person.attackInterval = attackInterval;
            person.baseAttackInterval = attackInterval;
            person.timer = 0;
            person.currentDelay = 0;
            person.delayAttack = delayAttack;
            person.baseDelayAttack = delayAttack;
            person.triggered = false;
            person.healthDisplay = this.scene.add.text(0, 0, `${person.health}`, { font: "40px Arial", fill: "#ffFFFF" }).setOrigin(0.5, 0.5);
            person.statusDisplay = this.scene.add.text(0, 0, "", { font: "22px Arial", fill: "#1b1b1b" }).setOrigin(0.5, 0.5);
        }

        return person;
    }

    buildBodies(
        partConfigs: HumanoidPartConfig[],
        x: number,
        y: number,
        scale: number,
        staticBody: boolean,
        collisionGroupResolver: (partName: BodyPartName) => number
    ): RagdollPartMap {
        const parts = {} as RagdollPartMap;

        partConfigs.forEach((part) => {
            parts[part.name] = this.scene.matter.add.rectangle(
                x + part.offsetX * scale,
                y + part.offsetY * scale,
                part.width * scale,
                part.height * scale,
                {
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
                }
            );

            if (part.angle != null) {
                Phaser.Physics.Matter.Matter.Body.setAngle(parts[part.name], part.angle);
            }
        });

        return parts;
    }

    buildConstraints(constraintConfigs: HumanoidConstraintConfig[], parts: RagdollPartMap, scale: number): MatterConstraint[] {
        return constraintConfigs.map((constraint) => this.scene.matter.add.constraint(
            parts[constraint.bodyA],
            parts[constraint.bodyB],
            constraint.length(scale),
            constraint.stiffness,
            {
                pointA: constraint.pointA ? { x: constraint.pointA.x * scale, y: constraint.pointA.y * scale } : undefined,
                pointB: constraint.pointB ? { x: constraint.pointB.x * scale, y: constraint.pointB.y * scale } : undefined,
                render: {
                    visible: false
                }
            }
        ));
    }

    createLinkedSprites(
        spriteConfigs: HumanoidSpriteConfig[],
        parts: RagdollPartMap,
        scale: number,
        flip: boolean
    ): { sprites: LinkedSprite[]; spritesByPart: RagdollSpriteMap } {
        const sprites: LinkedSprite[] = [];
        const spritesByPart: RagdollSpriteMap = {};

        spriteConfigs.forEach((spriteConfig) => {
            const sprite = this.scene.add.sprite(0, 0, spriteConfig.texture).setScale(scale * spriteConfig.scale) as LinkedSprite;
            sprite.linkedBody = parts[spriteConfig.bodyName];
            sprite.setFlipX(flip);
            sprites.push(sprite);
            spritesByPart[spriteConfig.bodyName] = sprite;
        });

        return { sprites, spritesByPart };
    }

    syncLinkedSprites(person?: RagdollPerson): void {
        if (!person || !person.linkedSprites) {
            return;
        }

        person.linkedSprites.forEach((sprite) => {
            if (!sprite.active || !sprite.linkedBody) {
                return;
            }

            const localOffsetX = sprite.localOffsetX ?? 0;
            const localOffsetY = sprite.localOffsetY ?? 0;
            const bodyAngle = sprite.linkedBody.angle;
            const cos = Math.cos(bodyAngle);
            const sin = Math.sin(bodyAngle);
            const worldOffsetX = cos * localOffsetX - sin * localOffsetY;
            const worldOffsetY = sin * localOffsetX + cos * localOffsetY;

            sprite.setPosition(
                sprite.linkedBody.position.x + worldOffsetX,
                sprite.linkedBody.position.y + worldOffsetY
            );
            sprite.setRotation(bodyAngle + (sprite.rotationOffset ?? 0));
        });
    }
}
