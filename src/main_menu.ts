class MainMenu extends Menu {
    constructor() {
        super("MainMenu");
    }

    init(data?: unknown): void {
    }

    preload(): void {
        super.preload();
    }

    create(): void {
        const wholeContainer = this.add.container(1920 / 2, -1000);
        const entireBox = this.add.rexRoundRectangle(0, 0, 1800, 1080 - 120, 30, 0x99b0af, 1);
        entireBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);

        wholeContainer.add([entireBox]);
        const title = this.add.text(0, -310, "On Target", { font: "100px Arial", fill: "#000000" });
        title.setOrigin(0.5);
        wholeContainer.add([title]);

        const level1Box = this.add.rexRoundRectangle(-450, -90, 275, 200, 30, 0x3fafaa, 1);
        level1Box.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        level1Box.setInteractive();

        const level2Box = this.add.rexRoundRectangle(0, -90, 275, 200, 30, 0xf0f6af, 1);
        level2Box.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        level2Box.setInteractive();

        const level3Box = this.add.rexRoundRectangle(450, -90, 275, 200, 30, 0x8ff00f, 1);
        level3Box.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        level3Box.setInteractive();

        const timedBox = this.add.rexRoundRectangle((750 / 2) - (750 / 4), 200, 275, 200, 30, 0xffafaa, 1);
        timedBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        timedBox.setInteractive();

        const creditsBox = this.add.rexRoundRectangle(-(750 / 4), 200, 275, 200, 30, 0xffffaa, 1);
        creditsBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        creditsBox.setInteractive();

        wholeContainer.add([level1Box, level2Box, level3Box, timedBox, creditsBox]);

        const level1Text = this.add.text(-450, -90, "Level 1", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
        const level2Text = this.add.text(0, -90, "Level 2", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
        const level3Text = this.add.text(450, -90, "Level 3", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
        const timedLevelText = this.add.text(-(750 / 4), 200, "Timed\n Mode", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
        const creditsText = this.add.text((750 / 2) - (750 / 4), 200, "Credits", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);

        wholeContainer.add([creditsText, timedLevelText, level1Text, level2Text, level3Text]);

        this.tweens.add({
            targets: wholeContainer,
            y: 1080 / 2,
            duration: 500,
            ease: "Cubic.out",
            onComplete: () => {
                level1Box.on("pointerdown", () => {
                    this.menuLeave(wholeContainer, "MainMenu", "LevelOne", { scale: 1, canCharge: false });
                });

                level2Box.on("pointerdown", () => {
                    this.menuLeave(wholeContainer, "MainMenu", "LevelTwo", { scale: 1, canCharge: false });
                });

                level3Box.on("pointerdown", () => {
                    this.menuLeave(wholeContainer, "MainMenu", "LevelThree", { scale: 1, canCharge: false });
                });

                // This keeps the original scene mapping behavior intact.
                timedBox.on("pointerdown", () => {
                    this.menuLeave(wholeContainer, "MainMenu", "Credits");
                });

                creditsBox.on("pointerdown", () => {
                    this.menuLeave(wholeContainer, "MainMenu", "TimedLevel", { scale: 1, canCharge: false });
                });
            }
        });
    }

    update(): void {
    }
}

class Credits extends Menu {
    constructor() {
        super("Credits");
    }

    preload(): void {
        super.preload();
    }

    create(): void {
        const wholeContainer = this.add.container(1920 / 2, -1000);
        const entireBox = this.add.rexRoundRectangle(0, 0, 750, 750, 30, 0x99b0af, 1);
        entireBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);

        wholeContainer.add([entireBox]);
        const title = this.add.text(0, -310, "Credits", { font: "100px Arial", fill: "#000000" });
        title.setOrigin(0.5);
        wholeContainer.add([title]);

        const mainMenuBox = this.add.rexRoundRectangle(0, 200, 275, 200, 30, 0x3fafaa, 1);
        mainMenuBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        mainMenuBox.setInteractive();
        wholeContainer.add([mainMenuBox]);

        const mainMenuText = this.add.text(0, 200, "Main\nMenu", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
        const creditsText = this.add.text(0, -90, "Everything By Benthan Vu \n(except Phaser Library)", { font: "50px Arial", fill: "#000000" }).setOrigin(0.5);
        wholeContainer.add([creditsText, mainMenuText]);

        this.tweens.add({
            targets: wholeContainer,
            y: 1080 / 2,
            duration: 500,
            ease: "Cubic.out",
            onComplete: () => {
                mainMenuBox.on("pointerdown", () => {
                    this.menuLeave(wholeContainer, "Credits", "MainMenu");
                });
            }
        });
    }
}
