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
        const playerProfile = loadPlayerProfile();
        const selectedWeapon = getWeaponDefinition(playerProfile.selectedWeaponId);

        const fullscreenButton = createTextButton(this, {
            x: 1785,
            y: 60,
            width: 240,
            height: 78,
            label: "Fullscreen",
            backgroundColor: 0x8ecae6,
            depth: 20
        });

        bindFullscreenToggle(this, fullscreenButton);

        const wholeContainer = this.add.container(1920 / 2, -1000);
        const entireBox = this.add.rexRoundRectangle(0, 0, 1800, 920, 30, 0x99b0af, 1);
        entireBox.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        wholeContainer.add(entireBox);

        const title = this.add.text(0, -360, "On Target", { font: "100px Arial", fill: "#000000" }).setOrigin(0.5);
        const bankText = this.add.text(0, -265, `Money: $${playerProfile.currency}`, {
            font: "48px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);
        const weaponText = this.add.text(0, -205, `Equipped: ${selectedWeapon.name}`, {
            font: "36px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);

        wholeContainer.add([title, bankText, weaponText]);

        const buttonConfigs: Array<{
            x: number;
            y: number;
            label: string;
            color: number;
            scene: SceneKey;
            config?: MenuTransitionConfig;
        }> = [
            {
                x: -525,
                y: -40,
                label: "Level 1",
                color: 0x3fafaa,
                scene: "LevelOne",
                config: { scale: 1, canCharge: false }
            },
            {
                x: 0,
                y: -40,
                label: "Level 2",
                color: 0xf0f6af,
                scene: "LevelTwo",
                config: { scale: 1, canCharge: false }
            },
            {
                x: 525,
                y: -40,
                label: "Level 3",
                color: 0x8ff00f,
                scene: "LevelThree",
                config: { scale: 1, canCharge: false }
            },
            {
                x: -525,
                y: 240,
                label: "Timed\nMode",
                color: 0xffafaa,
                scene: "TimedLevel",
                config: { scale: 1, canCharge: false }
            },
            {
                x: 0,
                y: 240,
                label: "Credits",
                color: 0xffffaa,
                scene: "Credits"
            },
            {
                x: 525,
                y: 240,
                label: "Shop",
                color: 0xcdb4db,
                scene: "ShopMenu"
            }
        ];

        buttonConfigs.forEach((buttonConfig) => {
            const button = createTextButton(this, {
                x: buttonConfig.x,
                y: buttonConfig.y,
                width: 300,
                height: 210,
                label: buttonConfig.label,
                backgroundColor: buttonConfig.color,
                font: "bold 46px Arial",
                parent: wholeContainer
            });

            button.background.on("pointerup", () => {
                this.menuLeave(wholeContainer, "MainMenu", buttonConfig.scene, buttonConfig.config);
            });
        });

        this.tweens.add({
            targets: wholeContainer,
            y: 1080 / 2,
            duration: 500,
            ease: "Cubic.out"
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

class ShopMenu extends Menu {
    constructor() {
        super("ShopMenu");
    }

    preload(): void {
        super.preload();
    }

    create(): void {
        this.playerProfile = loadPlayerProfile();
        this.focusedWeaponId = this.playerProfile.selectedWeaponId;

        const wholeContainer = this.add.container(1920 / 2, -1000);
        const panel = this.add.rexRoundRectangle(0, 0, 1820, 960, 30, 0x99b0af, 1);
        panel.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        wholeContainer.add(panel);

        this.shopMoneyText = this.add.text(0, -360, "", {
            font: "52px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);
        const title = this.add.text(0, -425, "Weapon Shop", {
            font: "90px Arial",
            fill: "#000000"
        }).setOrigin(0.5);
        const subtitle = this.add.text(0, -310, "Hover or tap a weapon to inspect it, then buy or equip from the details panel.", {
            font: "30px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);
        this.shopStatusText = this.add.text(0, 385, "", {
            font: "34px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);

        wholeContainer.add([title, this.shopMoneyText, subtitle, this.shopStatusText]);

        const gridPanel = this.add.rexRoundRectangle(-420, 30, 720, 650, 26, 0xe5efe9, 1);
        gridPanel.setStrokeStyle(4, 0x7c8a87, 1);
        const detailPanel = this.add.rexRoundRectangle(380, 30, 760, 650, 26, 0xf8fbf7, 1);
        detailPanel.setStrokeStyle(4, 0x7c8a87, 1);
        wholeContainer.add([gridPanel, detailPanel]);

        const gridTitle = this.add.text(-420, -235, "Weapons", {
            font: "48px Arial",
            fill: "#000000"
        }).setOrigin(0.5);
        const detailTitle = this.add.text(380, -235, "Details", {
            font: "48px Arial",
            fill: "#000000"
        }).setOrigin(0.5);
        wholeContainer.add([gridTitle, detailTitle]);

        this.shopCards = [];
        const gridColumns = WEAPON_CATALOG.length <= 4 ? 2 : 3;
        const gridRows = Math.max(1, Math.ceil(WEAPON_CATALOG.length / gridColumns));
        const tileWidth = gridColumns === 2 ? 235 : 190;
        const tileHeight = gridRows >= 3 ? 170 : 235;
        const gridSpacingX = gridColumns === 2 ? 270 : 220;
        const gridSpacingY = gridRows >= 3 ? 195 : 270;
        const startX = -420 - ((gridColumns - 1) * gridSpacingX) / 2;
        const startY = 30 - ((gridRows - 1) * gridSpacingY) / 2;

        WEAPON_CATALOG.forEach((weapon, index) => {
            const column = index % gridColumns;
            const row = Math.floor(index / gridColumns);
            const tilePosition = {
                x: startX + column * gridSpacingX,
                y: startY + row * gridSpacingY
            };
            const tile = this.add.container(tilePosition.x, tilePosition.y);
            const tileBackground = this.add.rexRoundRectangle(0, 0, tileWidth, tileHeight, 24, 0xfafcf9, 1);
            tileBackground.setStrokeStyle(5, weapon.accentColor, 1);
            tileBackground.setInteractive({ useHandCursor: true });

            const previewBackground = this.add.rexRoundRectangle(0, tileHeight >= 200 ? -22 : -12, tileWidth - 80, tileHeight >= 200 ? 120 : 88, 18, weapon.accentColor, 0.18);
            previewBackground.setStrokeStyle(4, weapon.accentColor, 1);
            const previewLabel = this.add.text(0, tileHeight >= 200 ? -40 : -25, "PLACEHOLDER", {
                font: tileHeight >= 200 ? "bold 18px Arial" : "bold 14px Arial",
                fill: "#1b1b1b"
            }).setOrigin(0.5);
            const previewName = this.add.text(0, tileHeight >= 200 ? -2 : 10, weapon.placeholderLabel, {
                font: tileHeight >= 200 ? "38px Arial" : "28px Arial",
                fill: "#1b1b1b"
            }).setOrigin(0.5);
            const weaponName = this.add.text(0, tileHeight >= 200 ? 72 : 52, weapon.name, {
                font: tileHeight >= 200 ? "bold 26px Arial" : "bold 21px Arial",
                fill: "#000000",
                align: "center",
                wordWrap: { width: tileWidth - 40 }
            }).setOrigin(0.5);
            const stateText = this.add.text(0, tileHeight >= 200 ? 104 : 72, "", {
                font: tileHeight >= 200 ? "20px Arial" : "18px Arial",
                fill: "#1b1b1b",
                align: "center"
            }).setOrigin(0.5);

            tileBackground.on("pointerover", () => {
                this.focusShopWeapon(weapon.id);
            });

            tileBackground.on("pointerup", () => {
                this.focusShopWeapon(weapon.id);
            });

            tile.add([tileBackground, previewBackground, previewLabel, previewName, weaponName, stateText]);
            wholeContainer.add(tile);
            this.shopCards.push({ weapon, tileBackground, stateText });
        });

        this.detailPreviewBackground = this.add.rexRoundRectangle(380, -55, 270, 190, 24, 0xffffff, 1);
        this.detailPreviewBackground.setStrokeStyle(5, 0x8ecae6, 1);
        this.detailPlaceholderLabel = this.add.text(380, -83, "PLACEHOLDER", {
            font: "bold 30px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);
        this.detailPreviewName = this.add.text(380, -28, "", {
            font: "58px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);
        this.detailWeaponName = this.add.text(380, 105, "", {
            font: "bold 50px Arial",
            fill: "#000000"
        }).setOrigin(0.5);
        this.detailDescription = this.add.text(380, 190, "", {
            font: "30px Arial",
            fill: "#1b1b1b",
            align: "center",
            wordWrap: { width: 560 }
        }).setOrigin(0.5);
        this.detailStats = this.add.text(380, 305, "", {
            font: "28px Arial",
            fill: "#1b1b1b",
            align: "center"
        }).setOrigin(0.5);
        this.detailState = this.add.text(380, 395, "", {
            font: "30px Arial",
            fill: "#1b1b1b",
            align: "center"
        }).setOrigin(0.5);

        wholeContainer.add([
            this.detailPreviewBackground,
            this.detailPlaceholderLabel,
            this.detailPreviewName,
            this.detailWeaponName,
            this.detailDescription,
            this.detailStats,
            this.detailState
        ]);

        this.shopActionButton = createTextButton(this, {
            x: 380,
            y: 470,
            width: 300,
            height: 96,
            label: "",
            backgroundColor: 0x8ecae6,
            textColor: "#1b1b1b",
            font: "bold 32px Arial",
            parent: wholeContainer
        });

        this.shopActionButton.background.on("pointerup", () => {
            this.handleShopAction(getWeaponDefinition(this.focusedWeaponId));
        });

        const backButton = createTextButton(this, {
            x: -690,
            y: 385,
            width: 280,
            height: 100,
            label: "Main Menu",
            backgroundColor: 0x3fafaa,
            parent: wholeContainer
        });

        backButton.background.on("pointerup", () => {
            this.menuLeave(wholeContainer, "ShopMenu", "MainMenu");
        });

        this.refreshShopState();

        this.tweens.add({
            targets: wholeContainer,
            y: 1080 / 2,
            duration: 500,
            ease: "Cubic.out"
        });
    }

    handleShopAction(weapon: WeaponDefinition): void {
        if (isWeaponUnlocked(this.playerProfile, weapon.id)) {
            this.playerProfile = selectWeaponForProfile(weapon.id);
            this.focusedWeaponId = weapon.id;
            this.shopStatusText.setText(`${weapon.name} equipped.`);
            this.refreshShopState();
            return;
        }

        const purchaseResult = purchaseWeaponForProfile(weapon.id);
        this.playerProfile = purchaseResult.profile;
        this.focusedWeaponId = this.playerProfile.selectedWeaponId;
        this.shopStatusText.setText(purchaseResult.message);
        this.refreshShopState();
    }

    focusShopWeapon(weaponId: string): void {
        this.focusedWeaponId = weaponId;
        this.refreshShopState();
    }

    refreshShopState(): void {
        this.shopMoneyText.setText(`Money: $${this.playerProfile.currency}`);
        const focusedWeapon = getWeaponDefinition(this.focusedWeaponId);
        const focusedUnlocked = isWeaponUnlocked(this.playerProfile, focusedWeapon.id);
        const focusedSelected = this.playerProfile.selectedWeaponId === focusedWeapon.id;

        this.detailPreviewBackground.setFillStyle(focusedWeapon.accentColor, 0.18);
        this.detailPreviewBackground.setStrokeStyle(5, focusedWeapon.accentColor, 1);
        this.detailPreviewName.setText(focusedWeapon.placeholderLabel);
        this.detailWeaponName.setText(focusedWeapon.name);
        this.detailDescription.setText(focusedWeapon.description);
        this.detailStats.setText([
            `Body Damage: ${focusedWeapon.projectile.damage.body}`,
            `Head Damage: ${focusedWeapon.projectile.damage.head}`,
            `Shot Speed: x${focusedWeapon.powerMultiplier.toFixed(2)}`,
            `Pierce: ${focusedWeapon.projectile.pierceCount ?? 0}`,
            focusedWeapon.cost > 0 ? `Price: $${focusedWeapon.cost}` : "Included from the start"
        ].join("\n"));
        this.detailState.setText(
            focusedSelected
                ? "Currently equipped"
                : focusedUnlocked
                    ? "Unlocked and ready to equip"
                    : `Locked until you buy it for $${focusedWeapon.cost}`
        );

        if (focusedSelected) {
            this.shopActionButton.label.setText("Equipped");
        }
        else if (focusedUnlocked) {
            this.shopActionButton.label.setText("Equip Weapon");
        }
        else {
            this.shopActionButton.label.setText(`Buy for $${focusedWeapon.cost}`);
        }

        this.shopActionButton.background.setFillStyle(focusedWeapon.accentColor, 1);

        this.shopCards.forEach((card: { weapon: WeaponDefinition; tileBackground: any; stateText: GameText }) => {
            const unlocked = isWeaponUnlocked(this.playerProfile, card.weapon.id);
            const selected = this.playerProfile.selectedWeaponId === card.weapon.id;
            const focused = this.focusedWeaponId === card.weapon.id;

            card.tileBackground.setStrokeStyle(focused ? 8 : 5, card.weapon.accentColor, 1);
            card.tileBackground.setFillStyle(focused ? 0xffffff : 0xfafcf9, 1);

            if (selected) {
                card.stateText.setText("Equipped");
                return;
            }

            if (unlocked) {
                card.stateText.setText("Unlocked");
                return;
            }

            card.stateText.setText(`$${card.weapon.cost}`);
        });
    }
}
