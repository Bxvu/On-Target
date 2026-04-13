const manualLevelScenes = getManualLevelDefinitions().map(
    (definition) => new ManualLevelScene(definition.sceneKey)
);

const game = new Phaser.Game({
    type: Phaser.AUTO,
    backgroundColor: "#2beaff",
    input: {
        activePointers: 3
    },
    physics: {
        default: "matter",
        matter: {
            enableSleeping: true,
            gravity: {
                y: 0.3
            }
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1080
    },
    scene: [MainMenu, SettingsMenu, ShopMenu, PauseScene, SummaryScene, ...manualLevelScenes, TimedLevel, EndlessLevel, Credits],
    title: "Physics Game"
});
