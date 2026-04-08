class LevelOne extends LevelScene {
    constructor() {
        super("LevelOne");
    }

    preload(): void {
        super.preload();
    }

    create(): void {
        super.create();
        this.currentLevel = "LevelOne";
        this.nextLevel = "LevelTwo";
        const enemyConfigs: EnemySpawnConfig[] = [
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

        const instructions = this.add.text(
            200,
            150,
            "Hold Click to Charge the Bow\nLet Go to Shoot the Arrow in the direction of your Mouse\n\nEach Arrow does 1 DMG\nHeadshotting Opponents does 3 DMG\nOpponents can shoot at you\nTheir Arm will glow orange when they start throwing arrows\nYou have 10 Health",
            { font: "bold 40px Arial", fill: "#ffffff" }
        );

        this.humanoids.push(...this.spawnEnemies(enemyConfigs));

        this.events.on("levelEnd", () => {
            instructions.setText("");
        });
    }
}
