const game = new Phaser.Game({
    type: Phaser.AUTO,
    backgroundColor: "#2beaff",
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
    scene: [MainMenu, SummaryScene, LevelOne, LevelTwo, LevelThree, TimedLevel, Credits],
    title: "Physics Game"
});
