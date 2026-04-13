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
        this.playerProfile = loadPlayerProfile();
        const overlay = this.add.rectangle(1920 / 2, 1080 / 2, 1920, 1080, 0x000000, 0.55);
        overlay.setDepth(1000);
        overlay.setInteractive();

        const pauseContainer = this.add.container(1920 / 2, -500);
        pauseContainer.setDepth(1001);
        this.pauseContainer = pauseContainer;
        const panel = this.add.rexRoundRectangle(0, 0, 1320, 760, 30, 0x99b0af, 1);
        panel.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);

        const title = this.add.text(-360, -275, "Paused", { font: "92px Arial", fill: "#000000" }).setOrigin(0.5);
        const subtitle = this.add.text(
            -360,
            -195,
            "Take a breather, then jump right back in.",
            { font: "38px Arial", fill: "#1b1b1b" }
        ).setOrigin(0.5);

        pauseContainer.add([panel, title, subtitle]);

        const controlsPanel = this.add.rexRoundRectangle(-360, 70, 420, 470, 26, 0xe5efe9, 1);
        controlsPanel.setStrokeStyle(4, 0x7c8a87, 1);
        const controlsTitle = this.add.text(-360, -95, "Run Controls", {
            font: "46px Arial",
            fill: "#000000"
        }).setOrigin(0.5);
        pauseContainer.add([controlsPanel, controlsTitle]);

        const resumeButton = createTextButton(this, {
            x: -450,
            y: 20,
            width: 160,
            height: 110,
            label: "Resume",
            backgroundColor: 0x3fafaa,
            font: "bold 30px Arial",
            parent: pauseContainer
        });

        const restartButton = createTextButton(this, {
            x: -270,
            y: 20,
            width: 160,
            height: 110,
            label: "Restart",
            backgroundColor: 0xffd166,
            font: "bold 30px Arial",
            parent: pauseContainer
        });

        const settingsButton = createTextButton(this, {
            x: -450,
            y: 165,
            width: 160,
            height: 110,
            label: "Settings",
            backgroundColor: 0x8ecae6,
            font: "bold 28px Arial",
            parent: pauseContainer
        });

        const mainMenuButton = createTextButton(this, {
            x: -270,
            y: 165,
            width: 160,
            height: 110,
            label: "Main\nMenu",
            backgroundColor: 0xef476f,
            textColor: "#ffffff",
            font: "bold 28px Arial",
            parent: pauseContainer
        });

        const shopPanel = this.add.rexRoundRectangle(255, 40, 720, 610, 26, 0xf8fbf7, 1);
        shopPanel.setStrokeStyle(4, 0x7c8a87, 1);
        const shopTitle = this.add.text(255, -215, "Powerup Shop", {
            font: "58px Arial",
            fill: "#000000"
        }).setOrigin(0.5);
        const shopSubtitle = this.add.text(
            255,
            -155,
            "Spend big money on instant combat boosts before you jump back in.",
            {
                font: "28px Arial",
                fill: "#1b1b1b",
                align: "center",
                wordWrap: { width: 600 }
            }
        ).setOrigin(0.5);
        this.pauseMoneyText = this.add.text(255, -88, "", {
            font: "bold 38px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);
        this.pauseShopStatusText = this.add.text(255, 262, "", {
            font: "28px Arial",
            fill: "#1b1b1b",
            align: "center",
            wordWrap: { width: 600 }
        }).setOrigin(0.5);
        pauseContainer.add([shopPanel, shopTitle, shopSubtitle, this.pauseMoneyText, this.pauseShopStatusText]);

        this.pauseShopButtons = [];
        const offerPositions = [
            { x: 75, y: 20 },
            { x: 435, y: 20 },
            { x: 75, y: 165 },
            { x: 435, y: 165 }
        ];

        PAUSE_POWERUP_SHOP_OFFERS.forEach((offer, index) => {
            const position = offerPositions[index];
            const card = this.add.container(position.x, position.y);
            const cardBackground = this.add.rexRoundRectangle(0, 0, 300, 120, 22, 0xffffff, 1);
            cardBackground.setStrokeStyle(5, offer.definition.color, 1);
            const cardTitle = this.add.text(0, -28, offer.label, {
                font: "bold 28px Arial",
                fill: "#000000"
            }).setOrigin(0.5);
            const cardDescription = this.add.text(0, 10, offer.description, {
                font: "20px Arial",
                fill: "#1b1b1b",
                align: "center",
                wordWrap: { width: 248 }
            }).setOrigin(0.5);
            const actionButton = createTextButton(this, {
                x: 0,
                y: 95,
                width: 240,
                height: 64,
                label: "",
                backgroundColor: offer.definition.color,
                textColor: offer.definition.textColor,
                font: "bold 24px Arial",
                parent: card
            });

            actionButton.background.on("pointerup", () => {
                this.handlePausePowerupAction(offer);
            });

            card.add([cardBackground, cardTitle, cardDescription]);
            pauseContainer.add(card);
            this.pauseShopButtons.push({ offer, cardBackground, actionButton });
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

        settingsButton.background.on("pointerup", () => {
            this.menuLeave(pauseContainer, "PauseScene", "SettingsMenu", {
                returnScene: "PauseScene",
                currentLevel: this.currentLevel,
                levelData: this.levelData
            });
        });

        mainMenuButton.background.on("pointerup", () => {
            this.scene.stop(this.currentLevel);
            this.scene.start("MainMenu");
        });

        this.refreshPauseShopState();

        this.tweens.add({
            targets: pauseContainer,
            y: 1080 / 2,
            duration: 500,
            ease: "Cubic.out"
        });

        this.scene.bringToTop();
    }

    resumeLevel(): void {
        const levelScene = this.getCurrentLevelScene();
        levelScene?.refreshRuntimeProfileSettings();
        this.scene.stop();
        this.scene.resume(this.currentLevel);
    }

    getCurrentLevelScene(): LevelScene | undefined {
        return this.scene.get(this.currentLevel) as LevelScene;
    }

    handlePausePowerupAction(offer: PausePowerupOffer): void {
        const levelScene = this.getCurrentLevelScene();

        if (!levelScene) {
            this.pauseShopStatusText.setText("The level scene is unavailable right now.");
            return;
        }

        const purchaseResult = levelScene.purchasePausePowerupOffer(offer);
        this.playerProfile = levelScene.playerProfile ?? loadPlayerProfile();
        this.pauseShopStatusText.setText(purchaseResult.message);
        this.refreshPauseShopState();
    }

    refreshPauseShopState(): void {
        this.pauseMoneyText.setText(`Money: $${this.playerProfile.currency}`);

        this.pauseShopButtons.forEach((entry: { offer: PausePowerupOffer; cardBackground: any; actionButton: TextButton }) => {
            const affordable = this.playerProfile.currency >= entry.offer.cost;
            entry.cardBackground.setFillStyle(affordable ? 0xffffff : 0xf1e6e7, 1);
            entry.cardBackground.setStrokeStyle(5, entry.offer.definition.color, affordable ? 1 : 0.55);
            entry.actionButton.background.setFillStyle(entry.offer.definition.color, affordable ? 1 : 0.45);
            entry.actionButton.label.setText(affordable ? `Buy $${entry.offer.cost}` : `Need $${entry.offer.cost}`);
        });
    }
}
