class PauseScene extends Menu {
    constructor() {
        super("PauseScene");
    }

    init(data: PauseSceneData): void {
        this.currentLevel = data.currentLevel;
        this.levelData = data.levelData ?? { scale: 1 };
    }

    preload(): void {
        super.preload();
    }

    create(): void {
        const overlay = this.add.rectangle(1920 / 2, 1080 / 2, 1920, 1080, 0x000000, 0.55);
        overlay.setDepth(1000);
        overlay.setInteractive();

        const pauseContainer = this.add.container(1920 / 2, -500);
        pauseContainer.setDepth(1001);
        const panel = this.add.rexRoundRectangle(0, 0, 900, 650, 30, 0x99b0af, 1);
        panel.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);

        const title = this.add.text(0, -220, "Paused", { font: "100px Arial", fill: "#000000" }).setOrigin(0.5);
        const subtitle = this.add.text(
            0,
            -130,
            "Take a breather, then jump right back in.",
            { font: "38px Arial", fill: "#1b1b1b" }
        ).setOrigin(0.5);

        pauseContainer.add([panel, title, subtitle]);

        const resumeButton = createTextButton(this, {
            x: 0,
            y: 10,
            width: 320,
            height: 110,
            label: "Resume",
            backgroundColor: 0x3fafaa,
            parent: pauseContainer
        });

        const restartButton = createTextButton(this, {
            x: -185,
            y: 170,
            width: 290,
            height: 110,
            label: "Restart",
            backgroundColor: 0xffd166,
            parent: pauseContainer
        });

        const mainMenuButton = createTextButton(this, {
            x: 185,
            y: 170,
            width: 290,
            height: 110,
            label: "Main Menu",
            backgroundColor: 0xef476f,
            textColor: "#ffffff",
            parent: pauseContainer
        });

        const escape = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        escape.on("down", () => {
            this.resumeLevel();
        });

        resumeButton.background.on("pointerup", () => {
            this.resumeLevel();
        });

        restartButton.background.on("pointerup", () => {
            this.scene.stop(this.currentLevel);
            this.scene.start(this.currentLevel, this.levelData);
        });

        mainMenuButton.background.on("pointerup", () => {
            this.scene.stop(this.currentLevel);
            this.scene.start("MainMenu");
        });

        this.tweens.add({
            targets: pauseContainer,
            y: 1080 / 2,
            duration: 500,
            ease: "Cubic.out"
        });

        this.scene.bringToTop();
    }

    resumeLevel(): void {
        this.scene.stop();
        this.scene.resume(this.currentLevel);
    }
}
