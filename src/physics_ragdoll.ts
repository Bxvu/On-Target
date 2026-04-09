const HUMANOID_PARTS: HumanoidPartConfig[] = [
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

const HUMANOID_CONSTRAINTS: HumanoidConstraintConfig[] = [
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

const HUMANOID_SPRITES: HumanoidSpriteConfig[] = [
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
        return this.createHumanoid(x, y, scale, {
            ...options,
            collisionGroupResolver: (partName) => PLAYER_COLLISION_GROUPS[partName]
        });
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
            collisionGroupResolver
        } = options;

        const parts = this.buildBodies(x, y, resolvedScale, staticBody, collisionGroupResolver);
        const constraints = this.buildConstraints(parts, resolvedScale);
        const person = this.scene.matter.composite.create({
            bodies: HUMANOID_BODY_ORDER.map((partName) => parts[partName]),
            constraints
        }) as RagdollPerson;

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
        person.chargeRateMultiplier = 1;
        person.behaviorKind = "ranged";
        person.facingDirection = flip ? -1 : 1;
        person.actionState = {
            kind: "idle",
            elapsedMs: 0,
            durationMs: 0
        };
        person.meleeHitApplied = false;

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

    buildBodies(
        x: number,
        y: number,
        scale: number,
        staticBody: boolean,
        collisionGroupResolver: (partName: BodyPartName) => number
    ): RagdollPartMap {
        const parts = {} as RagdollPartMap;

        HUMANOID_PARTS.forEach((part) => {
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
        });

        return parts;
    }

    buildConstraints(parts: RagdollPartMap, scale: number): MatterConstraint[] {
        return HUMANOID_CONSTRAINTS.map((constraint) => this.scene.matter.add.constraint(
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

    createLinkedSprites(parts: RagdollPartMap, scale: number, flip: boolean): { sprites: LinkedSprite[]; spritesByPart: RagdollSpriteMap } {
        const sprites: LinkedSprite[] = [];
        const spritesByPart: RagdollSpriteMap = {};

        HUMANOID_SPRITES.forEach((spriteConfig) => {
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

            sprite.setPosition(sprite.linkedBody.position.x, sprite.linkedBody.position.y);
            sprite.setRotation(sprite.linkedBody.angle);
        });
    }
}
