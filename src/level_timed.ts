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
}
