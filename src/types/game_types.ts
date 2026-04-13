type ManualLevelKey =
    | "LevelOne"
    | "LevelTwo"
    | "LevelThree"
    | "LevelFour"
    | "LevelFive"
    | "LevelSix";

type SceneKey =
    | "MainMenu"
    | "SettingsMenu"
    | "ShopMenu"
    | "PauseScene"
    | "SummaryScene"
    | ManualLevelKey
    | "TimedLevel"
    | "EndlessLevel"
    | "Credits";

type MatterBody = any;
type MatterConstraint = any;
type MatterImage = any;
type GameContainer = any;
type GameSprite = any;
type GameText = any;
type GameObject = any;
type ProjectileOwner = "player" | "enemy";
type ProjectileHitboxShape = "rectangle" | "circle";
type ShrapnelProjectileKind = "rock" | "arrow" | "grenade";
type ShopItemCategory = "bow" | "arrow" | "utility";
type EnemyArchetypeId = "standard";
type EnemyStatusEffectKind = "bounty" | "burn" | "scatter" | "jam";
type TimedPowerupKind = "rapidCharge" | "heal" | "damage" | "pierce";
type WeaponAttackStyle = "bow" | "throw";
type EnemyBehaviorKind = "ranged" | "melee";
type CombatActionKind = "idle" | "charge" | "throw" | "walk" | "telegraph" | "meleeWindup" | "meleeRecover" | "dead";
type HumanoidBodyProfile = "default" | "amalgam" | "player" | "melee" | "starfish";
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

interface SettingsMenuData {
    returnScene?: SceneKey;
    currentLevel?: SceneKey;
    levelData?: LevelInitData;
}

type MenuTransitionConfig = LevelInitData | PauseSceneData | SettingsMenuData;

interface TextButton {
    container: GameContainer;
    background: GameObject;
    label: GameText;
}

interface LinkedSprite extends GameSprite {
    linkedBody: MatterBody;
    localOffsetX?: number;
    localOffsetY?: number;
    rotationOffset?: number;
}

interface MatterArrow extends MatterImage {
    alreadyHit: boolean;
    bodyConstraint?: MatterConstraint;
    projectileConfig: ProjectileConfig;
    sourceCombatId?: string;
    body: MatterBody;
    active: boolean;
    hitLivingTarget: boolean;
    hitTargetIds: string[];
    piercesRemaining: number;
}

interface ArrowCollection extends Array<MatterArrow> {
    owner: ProjectileOwner;
    fromplayer: boolean;
}

interface TimedPowerupDefinition {
    id: string;
    kind: TimedPowerupKind;
    label: string;
    shortLabel: string;
    color: number;
    textColor: string;
    durationMs?: number;
    healAmount?: number;
    chargeRateMultiplier?: number;
    instantCharge?: boolean;
    damageBonus?: number;
    pierceBonus?: number;
}

interface PausePowerupOffer {
    id: string;
    label: string;
    description: string;
    cost: number;
    definition: TimedPowerupDefinition;
}

interface ActiveTimedPowerupState {
    definition: TimedPowerupDefinition;
    remainingMs: number;
}

interface CombatActionState {
    kind: CombatActionKind;
    elapsedMs: number;
    durationMs: number;
}

interface TimedPowerupPickup extends MatterImage {
    powerupDefinition: TimedPowerupDefinition;
    labelText?: GameText;
    active: boolean;
    maxLifetimeMs: number;
    remainingLifetimeMs: number;
}

interface RagdollPerson {
    combatId: string;
    bodies: MatterBody[];
    constraints: MatterConstraint[];
    parts: RagdollPartMap;
    bodyProfile?: HumanoidBodyProfile;
    health: number;
    dead: boolean;
    ignoresProjectileCollisions?: boolean;
    linkedSprites: LinkedSprite[];
    linkedSpritesByPart: RagdollSpriteMap;
    linkedArrows: MatterArrow[];
    throwingArm: MatterBody;
    attackTelegraphSprite?: LinkedSprite;
    healthDisplay?: GameText;
    statusDisplay?: GameText;
    attackInterval?: number;
    baseAttackInterval?: number;
    timer?: number;
    currentDelay?: number;
    delayAttack?: number;
    baseDelayAttack?: number;
    triggered?: boolean;
    activeStatusEffects?: Partial<Record<EnemyStatusEffectKind, EnemyStatusState>>;
    rewardMultiplier?: number;
    aimSpreadMultiplier?: number;
    throwForceMultiplier?: number;
    chargeRateMultiplier?: number;
    meleeAttackRateMultiplier?: number;
    moveSpeedMultiplier?: number;
    behaviorKind?: EnemyBehaviorKind;
    facingDirection?: number;
    actionState?: CombatActionState;
    meleeHitApplied?: boolean;
    meleeAttackCount?: number;
    behaviorDelayRemainingMs?: number;
    archetype?: EnemyArchetype;
    loadout?: PlayerLoadout;
    spawnConfig?: EnemySpawnConfig;
}

interface DamageProfile {
    body: number;
    head: number;
}

interface BaseEnemyStatusEffectConfig {
    kind: EnemyStatusEffectKind;
    durationMs?: number;
    maxStacks?: number;
}

interface BountyStatusEffectConfig extends BaseEnemyStatusEffectConfig {
    kind: "bounty";
    rewardMultiplierPerStack?: number;
    currencyLossOnHit?: number;
}

interface BurnStatusEffectConfig extends BaseEnemyStatusEffectConfig {
    kind: "burn";
    damagePerTick: number;
    tickIntervalMs: number;
    minHealthAfterTicks?: number;
}

interface ScatterStatusEffectConfig extends BaseEnemyStatusEffectConfig {
    kind: "scatter";
    aimSpreadMultiplierPerStack: number;
    throwForceReductionPerStack: number;
}

interface JamStatusEffectConfig extends BaseEnemyStatusEffectConfig {
    kind: "jam";
    attackIntervalMultiplierPerStack: number;
    throwForceReductionPerStack: number;
}

type EnemyStatusEffectConfig =
    | BountyStatusEffectConfig
    | BurnStatusEffectConfig
    | ScatterStatusEffectConfig
    | JamStatusEffectConfig;

interface EnemyStatusState {
    effect: EnemyStatusEffectConfig;
    stacks: number;
    remainingMs?: number;
    tickTimerMs: number;
}

interface ShrapnelBurstConfig {
    projectileKind: ShrapnelProjectileKind;
    count: number;
    speedMin?: number;
    speedMax?: number;
    statusEffects?: EnemyStatusEffectConfig[];
    explosionStatusEffects?: EnemyStatusEffectConfig[];
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
    statusEffects?: EnemyStatusEffectConfig[];
    hitboxShape?: ProjectileHitboxShape;
    sticksToTargets?: boolean;
    minImpactSpeed?: number;
    healPlayerOnHit?: number;
    healPlayerOnKill?: number;
    healOwnerOnHit?: number;
    explosionRadius?: number;
    explosionMaxDamage?: number;
    explosionMinDamage?: number;
    explosionStatusEffects?: EnemyStatusEffectConfig[];
    shrapnelProjectileKind?: ShrapnelProjectileKind;
    shrapnelCount?: number;
    shrapnelSpeedMin?: number;
    shrapnelSpeedMax?: number;
    shrapnelBursts?: ShrapnelBurstConfig[];
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

interface EnemyMeleeTuning {
    moveSpeed: number;
    preferredRange: number;
    attackRange: number;
    damage: number;
    windupMs: number;
    recoverMs: number;
    startupDelayMs?: number;
    telegraphColor: number;
    telegraphThickness: number;
    telegraphOuterStrength: number;
}

interface EnemyPulseTuning {
    range: number;
    powerupDrainMs: number;
    fallbackDamage: number;
    visualColor: number;
    visualDurationMs: number;
}

interface EnemyArchetype {
    id: EnemyArchetypeId | string;
    behavior: EnemyBehaviorKind;
    bodyProfile?: HumanoidBodyProfile;
    projectile?: ProjectileConfig;
    attack?: EnemyAttackTuning;
    melee?: EnemyMeleeTuning;
    pulse?: EnemyPulseTuning;
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

interface ManualLevelInstructionConfig {
    x: number;
    y: number;
    text: string;
    font?: string;
    fill?: string;
}

interface ManualLevelDefinition {
    sceneKey: ManualLevelKey;
    label: string;
    menuColor: number;
    nextLevel: SceneKey;
    instructions?: ManualLevelInstructionConfig;
    createEnemyConfigs: (levelScale: number) => EnemySpawnConfig[];
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
    shotCurrencyCost: number;
    bowTexture: string;
    bowTint: number;
    attackStyle: WeaponAttackStyle;
    chargeRateMultiplier: number;
    projectile: ProjectileConfig;
    powerMultiplier: number;
    accentColor: number;
    placeholderLabel: string;
}

interface PlayerProfile {
    currency: number;
    unlockedWeaponIds: string[];
    selectedWeaponIds: string[];
    activeWeaponIndex: number;
    selectedWeaponId: string;
    removeFadedEnemyCorpses: boolean;
    touchControlsEnabled: boolean;
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
    angle?: number;
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
    bodyProfile?: HumanoidBodyProfile;
    collisionGroupResolver: (partName: BodyPartName) => number;
}

class LooseScene extends Phaser.Scene {
    [key: string]: any;

    constructor(...args: any[]) {
        super(...args);
    }
}
