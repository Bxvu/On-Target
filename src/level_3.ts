class LevelThree extends LevelScene {
    constructor() {
        super("LevelThree");
    }

    preload(): void {
        super.preload();
    }

    create(): void {
        super.create();
        this.currentLevel = "LevelThree";
        this.nextLevel = "MainMenu";
        const bossConfigs: EnemySpawnConfig[] = [
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

        const instructions = this.add.text(
            200,
            200,
            "Extra Stuff:\nPress the Down Arrow to toggle bow stream cheat\nPress the Up Arrow to reset the level\nPress the Right Arrow to have your shots instantly charge\nThere is no Konami Code unfortunately",
            { font: "bold 25px Arial", fill: "#ffffff" }
        );

        this.events.on("levelEnd", () => {
            instructions.setText("");
        });

        this.humanoids.push(...this.spawnEnemies(bossConfigs));

        const weirdAmalgamX = 1700;
        const weirdAmalgamY = 600;
        const weirdAmalgamScale = this.levelScale - 0.6;
        const humanoidCount = 10;
        const amalgamConfigs: EnemySpawnConfig[] = [];

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
