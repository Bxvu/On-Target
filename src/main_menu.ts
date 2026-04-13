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
        const manualLevels = getManualLevelDefinitions();

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

        const manualColumns = Math.max(1, Math.min(3, manualLevels.length));
        const manualRows = Math.ceil(manualLevels.length / manualColumns);
        const manualSpacingX = 320;
        const manualSpacingY = 195;
        const manualStartX = -((manualColumns - 1) * manualSpacingX) / 2;
        const manualStartY = manualRows > 1 ? -80 : 0;

        manualLevels.forEach((level, index) => {
            const column = index % manualColumns;
            const row = Math.floor(index / manualColumns);
            const button = createTextButton(this, {
                x: manualStartX + column * manualSpacingX,
                y: manualStartY + row * manualSpacingY,
                width: 280,
                height: 160,
                label: level.label,
                backgroundColor: level.menuColor,
                font: "bold 42px Arial",
                parent: wholeContainer
            });

            button.background.on("pointerup", () => {
                this.menuLeave(wholeContainer, "MainMenu", level.sceneKey);
            });
        });

        const utilityButtonConfigs: Array<{
            x: number;
            label: string;
            color: number;
            scene: SceneKey;
        }> = [
            {
                x: -700,
                label: "Timed\nMode",
                color: 0xffafaa,
                scene: "TimedLevel"
            },
            {
                x: -350,
                label: "Endless",
                color: 0xff7b7b,
                scene: "EndlessLevel"
            },
            {
                x: 0,
                label: "Credits",
                color: 0xffffaa,
                scene: "Credits"
            },
            {
                x: 350,
                label: "Shop",
                color: 0xcdb4db,
                scene: "ShopMenu"
            },
            {
                x: 700,
                label: "Settings",
                color: 0x8ecae6,
                scene: "SettingsMenu"
            }
        ];

        utilityButtonConfigs.forEach((buttonConfig) => {
            const button = createTextButton(this, {
                x: buttonConfig.x,
                y: 300,
                width: 240,
                height: 170,
                label: buttonConfig.label,
                backgroundColor: buttonConfig.color,
                font: "bold 40px Arial",
                parent: wholeContainer
            });

            button.background.on("pointerup", () => {
                this.menuLeave(wholeContainer, "MainMenu", buttonConfig.scene);
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

class SettingsMenu extends Menu {
    constructor() {
        super("SettingsMenu");
    }

    init(data: SettingsMenuData = {}): void {
        this.settingsReturnScene = data.returnScene ?? "MainMenu";
        this.settingsReturnLabel = this.settingsReturnScene === "PauseScene" ? "Back to\nPause" : "Main Menu";
        this.settingsReturnData = this.settingsReturnScene === "PauseScene" && data.currentLevel != null
            ? {
                currentLevel: data.currentLevel,
                levelData: data.levelData
            } as PauseSceneData
            : undefined;
    }

    preload(): void {
        super.preload();
    }

    create(): void {
        this.playerProfile = loadPlayerProfile();
        const offlineModeStatus = getOfflineModeStatus();
        const overlay = this.add.rectangle(1920 / 2, 1080 / 2, 1920, 1080, 0x000000, 0.55);
        overlay.setDepth(1000);
        overlay.setInteractive();

        const wholeContainer = this.add.container(1920 / 2, -1000);
        wholeContainer.setDepth(1001);
        const panel = this.add.rexRoundRectangle(0, 0, 1200, 880, 30, 0x99b0af, 1);
        panel.postFX.addShadow(-1, 1, 0.02, 1, 0x000000, 12, 1);
        wholeContainer.add(panel);

        const title = this.add.text(0, -280, "Settings", {
            font: "100px Arial",
            fill: "#000000"
        }).setOrigin(0.5);
        const subtitle = this.add.text(
            0,
            -200,
            "Tune the display and control style here, then jump straight back into the run.",
            {
                font: "34px Arial",
                fill: "#1b1b1b",
                align: "center",
                wordWrap: { width: 900 }
            }
        ).setOrigin(0.5);

        const displayPanel = this.add.rexRoundRectangle(-290, 35, 430, 360, 26, 0xe5efe9, 1);
        displayPanel.setStrokeStyle(4, 0x7c8a87, 1);
        const displayTitle = this.add.text(-290, -110, "Display", {
            font: "bold 40px Arial",
            fill: "#000000",
            align: "center"
        }).setOrigin(0.5);
        const offlineStatusTitle = this.add.text(-290, 82, offlineModeStatus.title, {
            font: "bold 28px Arial",
            fill: "#000000",
            align: "center",
            wordWrap: { width: 320 }
        }).setOrigin(0.5);
        const offlineStatusText = this.add.text(-290, 145, offlineModeStatus.detail, {
            font: "22px Arial",
            fill: "#1b1b1b",
            align: "center",
            wordWrap: { width: 340 }
        }).setOrigin(0.5);

        const gameplayPanel = this.add.rexRoundRectangle(250, 90, 570, 520, 26, 0xf8fbf7, 1);
        gameplayPanel.setStrokeStyle(4, 0x7c8a87, 1);
        const gameplayTitle = this.add.text(250, -125, "Gameplay", {
            font: "bold 40px Arial",
            fill: "#000000",
            align: "center"
        }).setOrigin(0.5);
        this.touchControlsStatusText = this.add.text(
            250,
            40,
            "",
            {
                font: "24px Arial",
                fill: "#1b1b1b",
                align: "center",
                wordWrap: { width: 430 }
            }
        ).setOrigin(0.5);
        const cleanupTitle = this.add.text(250, 145, "Enemy corpse cleanup", {
            font: "bold 36px Arial",
            fill: "#000000",
            align: "center"
        }).setOrigin(0.5);
        const cleanupDescription = this.add.text(
            250,
            202,
            "When enabled, enemy body parts and stuck arrows get removed after their fade-out finishes.",
            {
                font: "24px Arial",
                fill: "#1b1b1b",
                align: "center",
                wordWrap: { width: 430 }
            }
        ).setOrigin(0.5);
        this.corpseCleanupStatusText = this.add.text(250, 345, "", {
            font: "24px Arial",
            fill: "#1b1b1b",
            align: "center",
            wordWrap: { width: 430 }
        }).setOrigin(0.5);
        wholeContainer.add([
            title,
            subtitle,
            displayPanel,
            displayTitle,
            offlineStatusTitle,
            offlineStatusText,
            gameplayPanel,
            gameplayTitle,
            this.touchControlsStatusText,
            cleanupTitle,
            cleanupDescription,
            this.corpseCleanupStatusText
        ]);

        const fullscreenButton = createTextButton(this, {
            x: -290,
            y: -22,
            width: 300,
            height: 100,
            label: "Fullscreen",
            backgroundColor: 0x8ecae6,
            font: "bold 34px Arial",
            parent: wholeContainer
        });
        bindFullscreenToggle(this, fullscreenButton);

        this.touchControlsButton = createTextButton(this, {
            x: 250,
            y: -40,
            width: 360,
            height: 92,
            label: "",
            backgroundColor: 0x8ecae6,
            font: "bold 30px Arial",
            parent: wholeContainer
        });
        this.refreshTouchControlsSetting();

        this.touchControlsButton.background.on("pointerup", () => {
            this.playerProfile = updatePlayerProfile((profile) => {
                profile.touchControlsEnabled = !profile.touchControlsEnabled;
            });
            this.refreshTouchControlsSetting();
        });

        this.corpseCleanupButton = createTextButton(this, {
            x: 250,
            y: 275,
            width: 360,
            height: 92,
            label: "",
            backgroundColor: 0x8ecae6,
            font: "bold 32px Arial",
            parent: wholeContainer
        });
        this.refreshCorpseCleanupSetting();

        this.corpseCleanupButton.background.on("pointerup", () => {
            this.playerProfile = updatePlayerProfile((profile) => {
                profile.removeFadedEnemyCorpses = !profile.removeFadedEnemyCorpses;
            });
            this.refreshCorpseCleanupSetting();
        });

        const backButton = createTextButton(this, {
            x: 0,
            y: 365,
            width: 320,
            height: 96,
            label: this.settingsReturnLabel,
            backgroundColor: 0x3fafaa,
            font: "bold 32px Arial",
            parent: wholeContainer
        });

        const escape = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        escape.on("down", () => {
            this.leaveSettingsMenu(wholeContainer);
        });

        backButton.background.on("pointerup", () => {
            this.leaveSettingsMenu(wholeContainer);
        });

        this.tweens.add({
            targets: wholeContainer,
            y: 1080 / 2,
            duration: 500,
            ease: "Cubic.out"
        });

        this.scene.bringToTop();
    }

    refreshCorpseCleanupSetting(): void {
        const cleanupEnabled = this.playerProfile.removeFadedEnemyCorpses;

        this.corpseCleanupButton.label.setText(cleanupEnabled ? "Cleanup: On" : "Cleanup: Off");
        this.corpseCleanupButton.background.setFillStyle(cleanupEnabled ? 0x52b788 : 0x8ecae6, 1);
        this.corpseCleanupStatusText.setText(
            cleanupEnabled
                ? "Faded enemy ragdolls will be destroyed to keep long runs running smoother."
                : "Enemy ragdolls will stay behind after fading so the battlefield keeps the full carnage."
        );
    }

    refreshTouchControlsSetting(): void {
        const touchControlsEnabled = this.playerProfile.touchControlsEnabled;

        this.touchControlsButton.label.setText(touchControlsEnabled ? "Touch Controls: On" : "Touch Controls: Off");
        this.touchControlsButton.background.setFillStyle(touchControlsEnabled ? 0x52b788 : 0x8ecae6, 1);
        this.touchControlsStatusText.setText(
            touchControlsEnabled
                ? "Runs show a left thumb aim circle and a right hold-to-fire button for touchscreen play."
                : "Runs keep the current pointer aim and hold-to-charge firing controls."
        );
    }

    leaveSettingsMenu(target: GameObject): void {
        if (this.settingsReturnScene === "PauseScene" && this.settingsReturnData) {
            this.menuLeave(target, "SettingsMenu", "PauseScene", this.settingsReturnData);
            return;
        }

        this.menuLeave(target, "SettingsMenu", "MainMenu");
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
        this.shopWholeContainer = wholeContainer;
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
        this.shopStatusText = this.add.text(0, 370, "", {
            font: "34px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);

        wholeContainer.add([title, this.shopMoneyText, subtitle, this.shopStatusText]);

        const gridPanelBounds = {
            x: -420,
            y: 60,
            width: 720,
            height: 690
        };
        const gridViewport = {
            x: -420,
            y: 108,
            width: 652,
            height: 548
        };
        const detailPanelBounds = {
            x: 380,
            y: 60,
            width: 760,
            height: 690
        };

        this.shopGridViewport = gridViewport;

        const gridPanel = this.add.rexRoundRectangle(
            gridPanelBounds.x,
            gridPanelBounds.y,
            gridPanelBounds.width,
            gridPanelBounds.height,
            26,
            0xe5efe9,
            1
        );
        gridPanel.setStrokeStyle(4, 0x7c8a87, 1);
        const detailPanel = this.add.rexRoundRectangle(
            detailPanelBounds.x,
            detailPanelBounds.y,
            detailPanelBounds.width,
            detailPanelBounds.height,
            26,
            0xf8fbf7,
            1
        );
        detailPanel.setStrokeStyle(4, 0x7c8a87, 1);
        wholeContainer.add([gridPanel, detailPanel]);

        this.shopCards = [];
        const gridColumns = WEAPON_CATALOG.length <= 4 ? 2 : 3;
        const gridRows = Math.max(1, Math.ceil(WEAPON_CATALOG.length / gridColumns));
        const tileWidth = gridColumns === 2 ? 235 : 190;
        const tileHeight = gridColumns === 2 ? 196 : 188;
        const gridSpacingX = gridColumns === 2 ? 270 : 220;
        const gridSpacingY = gridColumns === 2 ? 225 : 210;
        const gridPaddingY = 12;
        const visibleGridHeight = gridViewport.height - gridPaddingY * 2;
        const contentHeight = tileHeight + Math.max(0, gridRows - 1) * gridSpacingY;
        const startX = -((gridColumns - 1) * gridSpacingX) / 2;

        this.shopGridBaseY = gridViewport.y - gridViewport.height / 2 + gridPaddingY + tileHeight / 2;
        this.shopGridMaxScroll = Math.max(0, contentHeight - visibleGridHeight);
        this.shopGridScroll = 0;

        this.shopGridContent = this.add.container(gridViewport.x, this.shopGridBaseY);
        wholeContainer.add(this.shopGridContent);

        WEAPON_CATALOG.forEach((weapon, index) => {
            const column = index % gridColumns;
            const row = Math.floor(index / gridColumns);
            const tilePosition = {
                x: startX + column * gridSpacingX,
                y: row * gridSpacingY
            };
            const tile = this.add.container(tilePosition.x, tilePosition.y);
            const tileBackground = this.add.rexRoundRectangle(0, 0, tileWidth, tileHeight, 24, 0xfafcf9, 1);
            tileBackground.setStrokeStyle(5, weapon.accentColor, 1);
            tileBackground.setInteractive({ useHandCursor: true });

            const previewBackground = this.add.rexRoundRectangle(0, -36, tileWidth - 86, 72, 18, weapon.accentColor, 0.18);
            previewBackground.setStrokeStyle(4, weapon.accentColor, 1);
            const previewLabel = this.add.text(0, -51, "PLACEHOLDER", {
                font: "bold 13px Arial",
                fill: "#1b1b1b"
            }).setOrigin(0.5);
            const previewName = this.add.text(0, -19, weapon.placeholderLabel, {
                font: "28px Arial",
                fill: "#1b1b1b"
            }).setOrigin(0.5);
            const weaponName = this.add.text(0, 13, weapon.name, {
                font: "bold 18px Arial",
                fill: "#000000",
                align: "center",
                wordWrap: { width: tileWidth - 34 }
            }).setOrigin(0.5, 0);
            const stateText = this.add.text(0, 68, "", {
                font: "18px Arial",
                fill: "#1b1b1b",
                align: "center"
            }).setOrigin(0.5, 0);

            tileBackground.on("pointerover", () => {
                if (this.shopGridDragPointerId !== undefined) {
                    return;
                }

                this.focusShopWeapon(weapon.id);
            });

            tileBackground.on("pointerup", () => {
                if ((this.shopGridSuppressTapUntil ?? 0) > this.time.now) {
                    return;
                }

                this.focusShopWeapon(weapon.id);
            });

            tile.add([tileBackground, previewBackground, previewLabel, previewName, weaponName, stateText]);
            this.shopGridContent.add(tile);
            this.shopCards.push({ weapon, tile, tileBackground, stateText, tileHeight });
        });

        const gridPanelTop = gridPanelBounds.y - gridPanelBounds.height / 2;
        const gridPanelBottom = gridPanelBounds.y + gridPanelBounds.height / 2;
        const gridPanelLeft = gridPanelBounds.x - gridPanelBounds.width / 2;
        const gridPanelRight = gridPanelBounds.x + gridPanelBounds.width / 2;
        const gridViewportTop = gridViewport.y - gridViewport.height / 2;
        const gridViewportBottom = gridViewport.y + gridViewport.height / 2;
        const gridViewportLeft = gridViewport.x - gridViewport.width / 2;
        const gridViewportRight = gridViewport.x + gridViewport.width / 2;
        const gridCoverColor = 0xe5efe9;

        const gridTopCover = this.add.rectangle(
            gridPanelBounds.x,
            (gridPanelTop + gridViewportTop) / 2,
            gridPanelBounds.width - 8,
            gridViewportTop - gridPanelTop,
            gridCoverColor,
            1
        );
        const gridBottomCover = this.add.rectangle(
            gridPanelBounds.x,
            (gridPanelBottom + gridViewportBottom) / 2,
            gridPanelBounds.width - 8,
            gridPanelBottom - gridViewportBottom,
            gridCoverColor,
            1
        );
        const gridLeftCover = this.add.rectangle(
            (gridPanelLeft + gridViewportLeft) / 2,
            gridViewport.y,
            gridViewportLeft - gridPanelLeft,
            gridViewport.height,
            gridCoverColor,
            1
        );
        const gridRightCover = this.add.rectangle(
            (gridPanelRight + gridViewportRight) / 2,
            gridViewport.y,
            gridPanelRight - gridViewportRight,
            gridViewport.height,
            gridCoverColor,
            1
        );
        wholeContainer.add([gridTopCover, gridBottomCover, gridLeftCover, gridRightCover]);

        const gridTitle = this.add.text(gridPanelBounds.x, -230, "Weapons", {
            font: "48px Arial",
            fill: "#000000"
        }).setOrigin(0.5);
        const detailTitle = this.add.text(detailPanelBounds.x, -230, "Details", {
            font: "48px Arial",
            fill: "#000000"
        }).setOrigin(0.5);
        wholeContainer.add([gridTitle, detailTitle]);

        this.shopGridTrack = this.add.rexRoundRectangle(
            gridPanelBounds.x + gridPanelBounds.width / 2 - 18,
            gridViewport.y,
            10,
            gridViewport.height,
            5,
            0x1b1b1b,
            0.12
        );
        this.shopGridThumb = this.add.rexRoundRectangle(
            gridPanelBounds.x + gridPanelBounds.width / 2 - 18,
            gridViewport.y - gridViewport.height / 2 + Math.max(70, gridViewport.height * (gridViewport.height / Math.max(contentHeight, gridViewport.height))) / 2,
            10,
            Math.max(70, gridViewport.height * (gridViewport.height / Math.max(contentHeight, gridViewport.height))),
            5,
            0x3fafaa,
            1
        );
        wholeContainer.add([this.shopGridTrack, this.shopGridThumb]);

        this.detailPreviewBackground = this.add.rexRoundRectangle(380, -70, 270, 170, 24, 0xffffff, 1);
        this.detailPreviewBackground.setStrokeStyle(5, 0x8ecae6, 1);
        this.detailPlaceholderLabel = this.add.text(380, -96, "PLACEHOLDER", {
            font: "bold 28px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);
        this.detailPreviewName = this.add.text(380, -44, "", {
            font: "50px Arial",
            fill: "#1b1b1b"
        }).setOrigin(0.5);
        this.detailWeaponName = this.add.text(380, 44, "", {
            font: "bold 40px Arial",
            fill: "#000000",
            align: "center",
            wordWrap: { width: 560 }
        }).setOrigin(0.5, 0);
        this.detailDescription = this.add.text(380, 108, "", {
            font: "28px Arial",
            fill: "#1b1b1b",
            align: "center",
            wordWrap: { width: 560 },
            lineSpacing: 4
        }).setOrigin(0.5, 0);
        this.detailStats = this.add.text(380, 184, "", {
            font: "22px Arial",
            fill: "#1b1b1b",
            align: "center",
            wordWrap: { width: 560 },
            lineSpacing: 4
        }).setOrigin(0.5, 0);
        this.detailState = this.add.text(380, 334, "", {
            font: "24px Arial",
            fill: "#1b1b1b",
            align: "center",
            wordWrap: { width: 560 }
        }).setOrigin(0.5, 0);

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
            y: 430,
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
            y: 430,
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
        this.setShopGridScroll(0);

        const handleShopWheel = (pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
            if (this.shopGridMaxScroll <= 0 || !this.isPointerInsideShopGrid(pointer)) {
                return;
            }

            this.setShopGridScroll(this.shopGridScroll + deltaY * 0.6);
        };

        const handleShopPointerDown = (pointer: any) => {
            if (!this.isPointerInsideShopGrid(pointer)) {
                return;
            }

            this.shopGridDragPointerId = pointer.id;
            this.shopGridDragStartY = pointer.y;
            this.shopGridDragStartScroll = this.shopGridScroll;
            this.shopGridDidDrag = false;
        };

        const handleShopPointerMove = (pointer: any) => {
            if (this.shopGridDragPointerId !== pointer.id || !pointer.isDown) {
                return;
            }

            const dragDistance = pointer.y - this.shopGridDragStartY;

            if (Math.abs(dragDistance) > 8) {
                this.shopGridDidDrag = true;
            }

            this.setShopGridScroll(this.shopGridDragStartScroll - dragDistance);
        };

        const endShopPointerDrag = (pointer: any) => {
            if (this.shopGridDragPointerId !== pointer.id) {
                return;
            }

            if (this.shopGridDidDrag) {
                this.shopGridSuppressTapUntil = this.time.now + 120;
            }

            this.shopGridDragPointerId = undefined;
            this.shopGridDidDrag = false;
        };

        this.input.on("wheel", handleShopWheel);
        this.input.on("pointerdown", handleShopPointerDown);
        this.input.on("pointermove", handleShopPointerMove);
        this.input.on("pointerup", endShopPointerDrag);
        this.events.once("shutdown", () => {
            this.input.off("wheel", handleShopWheel);
            this.input.off("pointerdown", handleShopPointerDown);
            this.input.off("pointermove", handleShopPointerMove);
            this.input.off("pointerup", endShopPointerDrag);
        });

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
        const detailStatLines = this.getShopDetailStatLines(focusedWeapon);

        this.detailPreviewBackground.setFillStyle(focusedWeapon.accentColor, 0.18);
        this.detailPreviewBackground.setStrokeStyle(5, focusedWeapon.accentColor, 1);
        this.detailPreviewName.setText(focusedWeapon.placeholderLabel);
        this.detailWeaponName.setText(focusedWeapon.name);
        this.detailDescription.setText(focusedWeapon.description);
        this.detailStats.setFontSize(detailStatLines.length >= 7 ? 18 : detailStatLines.length >= 5 ? 20 : 22);
        this.detailStats.setText(detailStatLines.join("\n"));
        this.detailState.setText(
            focusedSelected
                ? "Currently equipped"
                : focusedUnlocked
                    ? "Unlocked and ready to equip"
                    : `Locked until you buy it for $${focusedWeapon.cost}`
        );

        this.detailDescription.setY(this.detailWeaponName.y + this.detailWeaponName.height + 12);
        this.detailStats.setY(this.detailDescription.y + this.detailDescription.height + 12);
        this.detailState.setY(this.detailStats.y + this.detailStats.height + 12);

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

        this.shopCards.forEach((card: { weapon: WeaponDefinition; tile: GameContainer; tileBackground: any; stateText: GameText; tileHeight: number }) => {
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

    getShopDetailStatLines(weapon: WeaponDefinition): string[] {
        const lines = [
            `Shot Speed: x${weapon.powerMultiplier.toFixed(2)} | Charge: x${weapon.chargeRateMultiplier.toFixed(2)}`
        ];
        const pushEffectLines = (effects?: EnemyStatusEffectConfig[], prefix = ""): void => {
            effects?.forEach((effect: EnemyStatusEffectConfig) => {
                switch (effect.kind) {
                case "bounty":
                    lines.push(`${prefix}Bounty: +${formatModifierPercent(effect.rewardMultiplierPerStack ?? 0)} per stack`);
                    break;
                case "burn":
                    lines.push(`${prefix}Burn: ${effect.damagePerTick} every ${Math.round(effect.tickIntervalMs / 100) / 10}s`);
                    break;
                case "scatter":
                    lines.push(`${prefix}Scatter: +${formatModifierPercent(effect.aimSpreadMultiplierPerStack)} spread per stack`);
                    break;
                case "jam":
                    lines.push(`${prefix}Slow: +${formatModifierPercent(effect.attackIntervalMultiplierPerStack)} fire delay per stack`);
                    break;
                }
            });
        };

        if (weapon.projectile.explosionRadius && weapon.projectile.explosionMaxDamage != null && weapon.projectile.explosionMinDamage != null) {
            lines.push(
                `Explosion: ${weapon.projectile.explosionMaxDamage} center -> ${weapon.projectile.explosionMinDamage} edge`,
                `Radius: ${Math.round(weapon.projectile.explosionRadius)} | Pierce scales edge damage`
            );
        }
        else {
            lines.push(`Damage: B ${weapon.projectile.damage.body} | H ${weapon.projectile.damage.head}`);
        }

        if ((weapon.projectile.pierceCount ?? 0) > 0) {
            lines.push(`Pierce: ${weapon.projectile.pierceCount ?? 0}`);
        }

        const shrapnelBursts = weapon.projectile.shrapnelBursts?.length
            ? weapon.projectile.shrapnelBursts
            : (weapon.projectile.shrapnelCount && weapon.projectile.shrapnelProjectileKind
                ? [{
                    projectileKind: weapon.projectile.shrapnelProjectileKind,
                    count: weapon.projectile.shrapnelCount
                }]
                : []);

        if (shrapnelBursts.length > 0) {
            lines.push(`Burst: ${shrapnelBursts.map((burst: ShrapnelBurstConfig) => `${burst.count} ${burst.projectileKind}s`).join(" | ")}`);

            shrapnelBursts.forEach((burst: ShrapnelBurstConfig) => {
                const burstLabel = burst.projectileKind === "grenade"
                    ? "Mini Grenade "
                    : `${burst.projectileKind.charAt(0).toUpperCase()}${burst.projectileKind.slice(1)} `;

                pushEffectLines(burst.statusEffects, burstLabel);
                pushEffectLines(burst.explosionStatusEffects, `${burstLabel}Blast `);
            });
        }

        if (weapon.projectile.healPlayerOnHit && weapon.projectile.healPlayerOnHit > 0) {
            lines.push(`Heal: +${weapon.projectile.healPlayerOnHit} on hit`);
        }

        if (weapon.projectile.healPlayerOnKill && weapon.projectile.healPlayerOnKill > 0) {
            lines.push(`Heal: +${weapon.projectile.healPlayerOnKill} on kill`);
        }

        if (weapon.shotCurrencyCost > 0) {
            lines.push(`Shot Cost: $${weapon.shotCurrencyCost} per shot`);
        }

        pushEffectLines(weapon.projectile.statusEffects);
        pushEffectLines(weapon.projectile.explosionStatusEffects, "Blast ");

        lines.push(weapon.cost > 0 ? `Price: $${weapon.cost}` : "Included from the start");

        return lines;
    }

    isPointerInsideShopGrid(pointer: any): boolean {
        if (!this.shopWholeContainer || !this.shopGridViewport) {
            return false;
        }

        const left = this.shopWholeContainer.x + this.shopGridViewport.x - this.shopGridViewport.width / 2;
        const top = this.shopWholeContainer.y + this.shopGridViewport.y - this.shopGridViewport.height / 2;

        return pointer.x >= left
            && pointer.x <= left + this.shopGridViewport.width
            && pointer.y >= top
            && pointer.y <= top + this.shopGridViewport.height;
    }

    setShopGridScroll(nextScroll: number): void {
        this.shopGridScroll = Phaser.Math.Clamp(nextScroll, 0, this.shopGridMaxScroll ?? 0);

        if (this.shopGridContent) {
            this.shopGridContent.y = this.shopGridBaseY - this.shopGridScroll;
        }

        if (this.shopGridViewport && this.shopCards) {
            const viewportTop = this.shopGridViewport.y - this.shopGridViewport.height / 2;
            const viewportBottom = this.shopGridViewport.y + this.shopGridViewport.height / 2;

            this.shopCards.forEach((card: { tile: GameContainer; tileHeight: number }) => {
                const tileCenterY = this.shopGridContent.y + card.tile.y;
                card.tile.setVisible(
                    tileCenterY + card.tileHeight / 2 >= viewportTop
                    && tileCenterY - card.tileHeight / 2 <= viewportBottom
                );
            });
        }

        if (!this.shopGridTrack || !this.shopGridThumb) {
            return;
        }

        const thumbVisible = (this.shopGridMaxScroll ?? 0) > 0;
        this.shopGridTrack.setVisible(thumbVisible);
        this.shopGridThumb.setVisible(thumbVisible);

        if (!thumbVisible) {
            return;
        }

        const travelDistance = this.shopGridTrack.height - this.shopGridThumb.height;
        const progress = this.shopGridScroll / this.shopGridMaxScroll;
        const trackTop = this.shopGridTrack.y - this.shopGridTrack.height / 2;
        this.shopGridThumb.y = trackTop + this.shopGridThumb.height / 2 + travelDistance * progress;
    }
}
