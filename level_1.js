class LevelOne extends LevelScene
{
    constructor(){
        super("LevelOne");
    }
    preload ()
    {   
        super.preload();
    }

    create ()
    {   
        super.create();
        this.currentLevel = "LevelOne";
        this.nextLevel = "LevelTwo";
        

        let instructions = this.add.text(200, 150, "Hold Click to Charge the Bow\nLet Go to Shoot the Arrow in the direction of your Mouse\n\nEach Arrow does 1 DMG\nHeadshotting Opponents does 3 DMG\nOpponents can shoot at you\nTheir Arm will glow orange when they start throwing arrows\nYou have 10 Health", {font: "bold 40px Arial", fill: "#ffffff"});

        this.humanoids.push(this.constructHumanoid(1300, 600, this.levelScale, false, 3, true, 3000, 2));

        this.events.on("levelEnd", (param) => {
            instructions.setText("");
          });

    }

}
