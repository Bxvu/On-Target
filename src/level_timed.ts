const TIMED_LEVEL_POWERUP_SPAWN_DELAY_MS = 6500;
const TIMED_LEVEL_POWERUP_SPAWN_CHANCE = 0.55;
const TIMED_LEVEL_MAX_ACTIVE_POWERUPS = 2;

class TimedLevel extends LevelScene {
    constructor() {
        super("TimedLevel");
    }

    preload(): void {
        super.preload();
    }

    create(): void {
        super.create();
        this.currentLevel = "TimedLevel";
        this.nextLevel = "MainMenu";

        this.totaltime = 90;
        this.timerDisplay = this.add.text(
            1920 / 2,
            100,
            `Time: ${(this.totaltime - this.sceneDuration / 1000).toFixed(2)}s`,
            { font: "40px Arial", fill: "#FFFFFF" }
        );
        this.timerDisplay.setOrigin(0.5, 0.5);

        this.events.on("nextWave", () => {
            this.totaltime += 5;
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
            this.time.delayedCall(5000, () => {
                this.showSummary();
            });
        }
    }

    nextWave(): void {
        let humanoidCount = Math.random() * 4 + 5;
        const amalgamSpawned = Math.random() < 0.3;
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

    trySpawnTimedPowerup(): void {
        if (
            this.isLevelEnding ||
            this.player.health <= 0 ||
            this.timedPowerups.length >= TIMED_LEVEL_MAX_ACTIVE_POWERUPS ||
            Math.random() >= TIMED_LEVEL_POWERUP_SPAWN_CHANCE
        ) {
            return;
        }

        const definition = Phaser.Utils.Array.GetRandom(TIMED_POWERUP_DEFINITIONS);
        const spawnX = Math.random() * 1200 + 550;
        const spawnY = Math.random() * 760 + 140;

        this.spawnTimedPowerup(definition, spawnX, spawnY);
    }
}
