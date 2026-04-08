type SceneKey =
    | "MainMenu"
    | "ShopMenu"
    | "PauseScene"
    | "SummaryScene"
    | "LevelOne"
    | "LevelTwo"
    | "LevelThree"
    | "TimedLevel"
    | "Credits";

type MatterBody = any;
type MatterConstraint = any;
type MatterImage = any;
type GameContainer = any;
type GameSprite = any;
type GameText = any;
type GameObject = any;
type ProjectileOwner = "player" | "enemy";
type ShopItemCategory = "bow" | "arrow" | "utility";
type EnemyArchetypeId = "standard";
type RagdollPartMap = Record<BodyPartName, MatterBody>;
type RagdollSpriteMap = Partial<Record<BodyPartName, LinkedSprite>>;

type BodyPartName =
    | "head"
    | "chest"
    | "leftUpperArm"
    | "leftLowerArm"
    | "rightUpperArm"
    | "rightLowerArm"
    | "leftUpperLeg"
    | "leftLowerLeg"
    | "rightUpperLeg"
    | "rightLowerLeg";

interface LevelInitData {
    scale?: number;
    canCharge?: boolean;
}

interface SummarySceneData {
    arrowsHit: number;
    arrowsShot: number;
    health: number;
    maxHealth: number;
    duration: number;
    currentLevel: SceneKey;
    nextLevel: SceneKey;
    kills: number;
    currencyEarned: number;
    totalCurrency: number;
}

interface PauseSceneData {
    currentLevel: SceneKey;
    levelData?: LevelInitData;
}

interface MenuTransitionConfig extends LevelInitData {
}

interface TextButton {
    container: GameContainer;
    background: GameObject;
    label: GameText;
}

interface LinkedSprite extends GameSprite {
    linkedBody: MatterBody;
}

interface MatterArrow extends MatterImage {
    alreadyHit: boolean;
    bodyConstraint?: MatterConstraint;
    projectileConfig: ProjectileConfig;
    body: MatterBody;
    active: boolean;
    hitTargetIds: string[];
    piercesRemaining: number;
}

interface ArrowCollection extends Array<MatterArrow> {
    owner: ProjectileOwner;
    fromplayer: boolean;
}

interface RagdollPerson {
    combatId: string;
    bodies: MatterBody[];
    constraints: MatterConstraint[];
    parts: RagdollPartMap;
    health: number;
    dead: boolean;
    linkedSprites: LinkedSprite[];
    linkedSpritesByPart: RagdollSpriteMap;
    linkedArrows: MatterArrow[];
    throwingArm: MatterBody;
    attackTelegraphSprite?: LinkedSprite;
    healthDisplay?: GameText;
    attackInterval?: number;
    timer?: number;
    currentDelay?: number;
    delayAttack?: number;
    triggered?: boolean;
    archetype?: EnemyArchetype;
    loadout?: PlayerLoadout;
    spawnConfig?: EnemySpawnConfig;
}

interface DamageProfile {
    body: number;
    head: number;
}

interface ProjectileConfig {
    id: string;
    texture: string;
    scale: number;
    lifetimeMs: number;
    collisionGroup: number;
    maxActive: number;
    damage: DamageProfile;
    tint?: number;
    pierceCount?: number;
}

interface EnemyAttackTuning {
    throwForceX: number;
    throwForceY: number;
    aimSpreadX: number;
    aimSpreadY: number;
    powerMin: number;
    powerMax: number;
    cleanupDelayMs: number;
    telegraphColor: number;
    telegraphThickness: number;
    telegraphOuterStrength: number;
}

interface EnemyArchetype {
    id: EnemyArchetypeId | string;
    projectile: ProjectileConfig;
    attack: EnemyAttackTuning;
    currencyReward: number;
}

interface EnemySpawnConfig {
    x: number;
    y: number;
    scale: number;
    health: number;
    flip: boolean;
    attackInterval: number;
    attackDelay: number;
    staticBody?: boolean;
    archetype: EnemyArchetype;
}

interface PlayerLoadout {
    weapon: WeaponDefinition;
    projectile: ProjectileConfig;
    powerMultiplier: number;
}

interface WeaponDefinition {
    id: string;
    name: string;
    description: string;
    cost: number;
    bowTexture: string;
    bowTint: number;
    projectile: ProjectileConfig;
    powerMultiplier: number;
    accentColor: number;
    placeholderLabel: string;
}

interface PlayerProfile {
    currency: number;
    unlockedWeaponIds: string[];
    selectedWeaponId: string;
}

interface ShopStatEffect {
    type: "stat";
    stat: "chargeMultiplier" | "maxHealth" | "projectileSpeedMultiplier";
    value: number;
}

interface ShopProjectileEffect {
    type: "projectile";
    projectile: ProjectileConfig;
}

type ShopItemEffect = ShopStatEffect | ShopProjectileEffect;

interface ShopItemDefinition {
    id: string;
    name: string;
    description: string;
    category: ShopItemCategory;
    cost: number;
    effect: ShopItemEffect;
}

interface HumanoidPartConfig {
    name: BodyPartName;
    label: string;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    color: string;
    chamfer: (scale: number) => number | number[];
}

interface ConstraintPointConfig {
    x: number;
    y: number;
}

interface HumanoidConstraintConfig {
    bodyA: BodyPartName;
    bodyB: BodyPartName;
    length: (scale: number) => number;
    stiffness: number;
    pointA?: ConstraintPointConfig;
    pointB?: ConstraintPointConfig;
}

interface HumanoidSpriteConfig {
    bodyName: BodyPartName;
    texture: string;
    scale: number;
}

interface HumanoidBuildOptions {
    staticBody?: boolean;
    health?: number;
    flip?: boolean;
    attackInterval?: number;
    delayAttack?: number;
    showHealthDisplay?: boolean;
    collisionGroupResolver: (partName: BodyPartName) => number;
}

class LooseScene extends Phaser.Scene {
    [key: string]: any;

    constructor(...args: any[]) {
        super(...args);
    }
}
