class LevelTwo extends LevelScene {
    constructor() {
        super("LevelTwo");
    }

    preload(): void {
        super.preload();
    }

    create(): void {
        super.create();
        this.currentLevel = "LevelTwo";
        this.nextLevel = "LevelThree";
        const enemyConfigs: EnemySpawnConfig[] = [
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

        const instructions = this.add.text(
            200,
            300,
            "There is no lore to this game,\nidk why these guys are floating\n(other than making it so \nyou have to aim in the air)",
            { font: "bold 40px Arial", fill: "#ffffff" }
        );

        this.events.on("levelEnd", () => {
            instructions.setText("");
        });

        this.humanoids.push(...this.spawnEnemies(enemyConfigs));
    }
}
