const TIMED_LEVEL_POWERUP_SPAWN_DELAY_MS = 6500;
const TIMED_LEVEL_POWERUP_SPAWN_CHANCE = 0.55;
const TIMED_LEVEL_MAX_ACTIVE_POWERUPS = 2;
const TIMED_HARD_ATTACK_DELAY_REDUCTION_PER_KILL = 0.25;
const TIMED_HARD_MELEE_SPAWN_CHANCE = 0.4;
const TIMED_HARD_MAX_MELEE_PER_WAVE = 2;
const TIMED_STARFISH_SPAWN_CHANCE = 0.2;
const ENDLESS_MAX_ALTERNATE_PROJECTILE_CHANCE = 0.9;
const ENDLESS_ALTERNATE_PROJECTILE_RAMP_KILLS = 100;
const ENDLESS_MAX_TIMED_POWERUP_SPAWN_CHANCE = 0.85;
const ENDLESS_MAX_TIMED_POWERUP_DROP_CHANCE = 0.45;
const ENDLESS_MAX_AMALGAM_SPAWN_CHANCE = 0.65;
const ENDLESS_MAX_STARFISH_SPAWN_CHANCE = 0.55;

class TimedLevel extends LevelScene {
    timedSceneKey: SceneKey;

    constructor(sceneKey: SceneKey = "TimedLevel") {
        super(sceneKey);
        this.timedSceneKey = sceneKey;
    }

    getTimeLimitSeconds(): number | null {
        return 90;
    }

    getWaveRewardTimeSeconds(): number {
        return 5;
    }

    getScaledEnemyHealth(baseHealth: number): number {
        return baseHealth;
    }

    getScaledAmalgamHealth(baseHealth: number): number {
        return this.getScaledEnemyHealth(baseHealth);
    }

    getAmalgamBodyCount(): number {
        return Phaser.Math.Between(5, 9);
    }

    getAmalgamSpawnChance(): number {
        return 0.3;
    }

    getTimedPowerupSpawnChance(): number {
        return TIMED_LEVEL_POWERUP_SPAWN_CHANCE;
    }

    getStarfishSpawnChance(): number {
        return TIMED_STARFISH_SPAWN_CHANCE;
    }

    preload(): void {
        super.preload();
    }

    create(): void {
        super.create();
        this.currentLevel = this.timedSceneKey;
        this.nextLevel = "MainMenu";
        const timeLimitSeconds = this.getTimeLimitSeconds();

        if (timeLimitSeconds != null) {
            this.totaltime = timeLimitSeconds;
            this.timerDisplay = this.add.text(
                1920 / 2,
                100,
                `Time: ${(this.totaltime - this.sceneDuration / 1000).toFixed(2)}s`,
                { font: "40px Arial", fill: "#FFFFFF" }
            );
            this.timerDisplay.setOrigin(0.5, 0.5);
        }

        this.events.on("nextWave", () => {
            if (timeLimitSeconds != null) {
                this.totaltime += this.getWaveRewardTimeSeconds();
            }
            this.nextWave();
        });

        this.time.addEvent({
            delay: TIMED_LEVEL_POWERUP_SPAWN_DELAY_MS,
            loop: true,
            callback: () => {
                this.trySpawnTimedPowerup();
            }
        });

        this.events.emit("nextWave", { victory: true });
    }

    update(time: number, delta: number): void {
        super.update(time, delta);

        if (!this.timerDisplay || this.totaltime == null) {
            return;
        }

        this.timerDisplay.setText(`Time: ${(this.totaltime - this.sceneDuration / 1000).toFixed(2)}s`);

        if (this.totaltime - this.sceneDuration / 1000 < 0 && !this.isLevelEnding) {
            this.events.emit("levelEnd", { victory: true });
            this.isLevelEnding = true;

            let count = 0;
            this.humanoids.forEach((humanoid: RagdollPerson) => {
                if (humanoid.health <= 0) {
                    count += 1;
                }
            });

            this.kills = count;
            this.addSlowdown();
            this.scheduleSummary(5000);
        }
    }

    nextWave(): void {
        let humanoidCount = this.getAmalgamBodyCount();
        const amalgamSpawned = Math.random() < this.getAmalgamSpawnChance();
        const waveConfigs: EnemySpawnConfig[] = [];

        if (amalgamSpawned) {
            const weirdAmalgamX = Math.random() * 1400 + 500;
            const weirdAmalgamY = Math.random() * 900 + 100;
            const weirdAmalgamScale = Math.random() + 0.2;

            for (let count = 0; count < humanoidCount; count++) {
                waveConfigs.push(createEnemySpawnConfig({
                    x: weirdAmalgamX - count,
                    y: weirdAmalgamY,
                    scale: weirdAmalgamScale,
                    health: this.getScaledAmalgamHealth(1),
                    flip: true,
                    archetype: AMALGAM_ENEMY_ARCHETYPE,
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
                health: this.getScaledEnemyHealth(Math.floor(difficulty * 5) + 1),
                flip: true,
                attackInterval: Math.random() * 5000 + 750,
                attackDelay: Math.random() * 9 + 1
            }));
        }

        if (Math.random() < this.getStarfishSpawnChance()) {
            const difficulty = Math.random();
            waveConfigs.push(createEnemySpawnConfig({
                x: Math.random() * 900 + 700,
                y: Math.random() * 520 + 220,
                scale: Math.max(0.6, this.levelScale + (difficulty * 0.35) - 0.1),
                health: this.getScaledEnemyHealth(Math.floor(difficulty * 3) + 4),
                flip: true,
                attackInterval: Math.random() * 1400 + 3200,
                attackDelay: Math.random() * 3 + 1,
                archetype: SWIRL_STARFISH_ARCHETYPE
            }));
        }

        this.humanoids.push(...this.spawnEnemies(waveConfigs));
    }

    trySpawnTimedPowerup(): void {
        if (
            this.isLevelEnding ||
            this.player.health <= 0 ||
            this.timedPowerups.length >= TIMED_LEVEL_MAX_ACTIVE_POWERUPS ||
            Math.random() >= this.getTimedPowerupSpawnChance()
        ) {
            return;
        }

        const definition = Phaser.Utils.Array.GetRandom(TIMED_POWERUP_DEFINITIONS);
        const spawnX = Math.random() * 1200 + 550;
        const spawnY = Math.random() * 760 + 140;

        this.spawnTimedPowerup(definition, spawnX, spawnY);
    }
}

class EndlessLevel extends TimedLevel {
    constructor() {
        super("EndlessLevel");
    }

    getEndlessDifficultyProgress(): number {
        return Phaser.Math.Clamp(this.kills / ENDLESS_ALTERNATE_PROJECTILE_RAMP_KILLS, 0, 1);
    }

    getTimeLimitSeconds(): null {
        return null;
    }

    getEnemyAlternateProjectileChance(): number {
        const killProgress = this.getEndlessDifficultyProgress();
        return Phaser.Math.Linear(
            ENEMY_ALTERNATE_PROJECTILE_CHANCE,
            ENDLESS_MAX_ALTERNATE_PROJECTILE_CHANCE,
            killProgress
        );
    }

    getScaledEnemyHealth(baseHealth: number): number {
        const killProgress = this.getEndlessDifficultyProgress();
        const minBonus = Math.floor(Phaser.Math.Linear(0, 2, killProgress));
        const maxBonus = Math.floor(Phaser.Math.Linear(0, 5, killProgress));
        const bonus = maxBonus > minBonus
            ? Phaser.Math.Between(minBonus, maxBonus)
            : maxBonus;
        return baseHealth + bonus;
    }

    getScaledAmalgamHealth(baseHealth: number): number {
        const killProgress = this.getEndlessDifficultyProgress();
        const minBonus = Math.floor(Phaser.Math.Linear(0, 1, killProgress));
        const maxBonus = Math.floor(Phaser.Math.Linear(0, 2, killProgress));
        const bonus = maxBonus > minBonus
            ? Phaser.Math.Between(minBonus, maxBonus)
            : maxBonus;
        return baseHealth + bonus;
    }

    getAmalgamBodyCount(): number {
        const killProgress = this.getEndlessDifficultyProgress();
        const minBodies = Math.round(Phaser.Math.Linear(5, 7, killProgress));
        const maxBodies = Math.round(Phaser.Math.Linear(9, 14, killProgress));
        return Phaser.Math.Between(minBodies, maxBodies);
    }

    getAmalgamSpawnChance(): number {
        return Phaser.Math.Linear(
            0.3,
            ENDLESS_MAX_AMALGAM_SPAWN_CHANCE,
            this.getEndlessDifficultyProgress()
        );
    }

    getTimedPowerupSpawnChance(): number {
        return Phaser.Math.Linear(
            TIMED_LEVEL_POWERUP_SPAWN_CHANCE,
            ENDLESS_MAX_TIMED_POWERUP_SPAWN_CHANCE,
            this.getEndlessDifficultyProgress()
        );
    }

    getTimedPowerupDropChance(): number {
        return Phaser.Math.Linear(
            TIMED_POWERUP_DROP_CHANCE,
            ENDLESS_MAX_TIMED_POWERUP_DROP_CHANCE,
            this.getEndlessDifficultyProgress()
        );
    }

    getStarfishSpawnChance(): number {
        return Phaser.Math.Linear(
            TIMED_STARFISH_SPAWN_CHANCE,
            ENDLESS_MAX_STARFISH_SPAWN_CHANCE,
            this.getEndlessDifficultyProgress()
        );
    }

    nextWave(): void {
        super.nextWave();

        const meleeSpawnChance = Math.min(0.8, TIMED_HARD_MELEE_SPAWN_CHANCE + (this.kills * 0.01));

        if (Math.random() >= meleeSpawnChance) {
            return;
        }

        const meleeCount = Math.floor(Math.random() * TIMED_HARD_MAX_MELEE_PER_WAVE) + 1;
        const meleeConfigs: EnemySpawnConfig[] = [];

        for (let count = 0; count < meleeCount; count++) {
            meleeConfigs.push(createEnemySpawnConfig({
                x: Math.random() * 520 + 1220,
                y: Math.random() * 70 + 860,
                scale: Math.max(0.65, this.levelScale + (Math.random() * 0.45) - 0.15),
                health: this.getScaledEnemyHealth(Math.floor(Math.random() * 4) + 5),
                flip: true,
                attackInterval: 0,
                attackDelay: 0,
                archetype: GROUND_BRUISER_ARCHETYPE
            }));
        }

        this.humanoids.push(...this.spawnEnemies(meleeConfigs));
    }

    getEnemyAttackDelayCycles(humanoid: RagdollPerson): number {
        const baseDelay = humanoid.baseDelayAttack ?? humanoid.delayAttack ?? 0;
        return Math.max(0, baseDelay - (this.kills * TIMED_HARD_ATTACK_DELAY_REDUCTION_PER_KILL));
    }
}
