class SummaryScene extends Menu {
    constructor() {
        super("SummaryScene");
    }

    init(data: SummarySceneData): void {
        this.arrowsHit = data.arrowsHit;
        this.arrowsShot = data.arrowsShot;
        this.health = data.health;
        this.maxHealth = data.maxHealth;
        this.timeTaken = data.duration;
        this.currentLevel = data.currentLevel;
        this.nextLevel = data.nextLevel;
        this.kills = data.kills;
        this.currencyEarned = data.currencyEarned;
        this.totalCurrency = data.totalCurrency;
    }

    preload(): void {
        super.preload();
    }

    isTimedModeResult(): boolean {
        return this.currentLevel === "TimedLevel";
    }

    isReplayOnlyResult(): boolean {
        return this.currentLevel === "TimedLevel" || this.currentLevel === "EndlessLevel";
    }

    create(): void {
        const summaryBox = this.add.container(1920 / 2, -1000);
        const entireBox = this.add.rexRoundRectangle(0, 0, 820, 820, 30, 0x99b0af, 1);
        entireBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);

        summaryBox.add([entireBox]);

        const summaryTitle = this.health <= 0
            ? this.add.text(0, -310, "You Died...", { font: "100px Arial", fill: "#000000" })
            : this.add.text(0, -310, "Summary", { font: "100px Arial", fill: "#000000" });
        summaryTitle.setOrigin(0.5);

        const accuracyValue = this.arrowsShot > 0
            ? ((this.arrowsHit / this.arrowsShot) * 100).toFixed(3)
            : "0.000";
        const accuracy = `Accuracy: ${accuracyValue}%`;
        const accuracyText = this.add.text(0, -180, accuracy, { font: "50px Arial", fill: "#a0ffa0" });
        accuracyText.setOrigin(0.5);

        const health = `Health Remaining: ${this.health} / ${this.maxHealth}`;
        const healthText = this.add.text(0, -80, health, { font: "50px Arial", fill: "#a0ffa0" });
        healthText.setOrigin(0.5);

        let duration = "";

        if (this.isTimedModeResult()) {
            duration = `Time Survived: ${(this.timeTaken / 1000).toFixed(3)}s`;
        }
        else if (this.currentLevel === "EndlessLevel") {
            duration = `Kills: ${this.kills}`;
        }
        else if (this.kills) {
            duration = `Kills: ${this.kills}`;
        }
        else {
            duration = `Time Taken: ${(this.timeTaken / 1000).toFixed(3)}s`;
        }

        const durationText = this.add.text(0, 10, duration, { font: "50px Arial", fill: "#a0ffa0" });
        durationText.setOrigin(0.5);

        const currencyText = this.add.text(
            0,
            105,
            `Currency: +$${this.currencyEarned}   Total: $${this.totalCurrency}`,
            { font: "42px Arial", fill: "#ffd166" }
        ).setOrigin(0.5);

        summaryBox.add([summaryTitle, accuracyText, healthText, durationText, currencyText]);

        const nextLevelBox = this.add.rexRoundRectangle((750 / 2) - (750 / 4), 250, 275, 200, 30, 0xffafaa, 1);
        nextLevelBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        nextLevelBox.setInteractive();

        const mainMenuBox = this.add.rexRoundRectangle(-(750 / 4), 250, 275, 200, 30, 0xffffaa, 1);
        mainMenuBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        mainMenuBox.setInteractive();

        summaryBox.add([nextLevelBox, mainMenuBox]);

        const mainMenuText = this.add.text(-(750 / 4), 250, " Main\nMenu", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);
        const nextLevelText = (this.health <= 0 || this.isReplayOnlyResult())
            ? this.add.text((750 / 2) - (750 / 4), 250, "Retry", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5)
            : this.add.text((750 / 2) - (750 / 4), 250, " Next\nLevel", { font: "50px Arial", fill: "#af00af" }).setOrigin(0.5);

        summaryBox.add([mainMenuText, nextLevelText]);

        this.tweens.add({
            targets: summaryBox,
            y: 1080 / 2,
            duration: 1000,
            ease: "Cubic.out",
            onComplete: () => {
                mainMenuBox.on("pointerdown", () => {
                    this.menuLeave(summaryBox, this.currentLevel, "MainMenu");
                });

                nextLevelBox.on("pointerdown", () => {
                    if (this.health <= 0 || this.isReplayOnlyResult()) {
                        this.menuLeave(summaryBox, this.currentLevel, this.currentLevel);
                    }
                    else {
                        this.menuLeave(summaryBox, this.currentLevel, this.nextLevel);
                    }
                });
            }
        });
    }

    update(): void {
    }
}
