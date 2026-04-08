class LevelThree extends LevelScene
{
    constructor(){
        super("LevelThree");
    }
    preload ()
    {   
        super.preload();
    }

    create ()
    {   
        super.create();
        this.currentLevel = "LevelThree";
        this.nextLevel = "MainMenu";


        let instructions = this.add.text(200, 200, "Extra Stuff:\nPress the Down Arrow to toggle bow stream cheat\nPress the Up Arrow to reset the level\nPress the Right Arrow to have your shots instantly charge\nThere is no Konami Code unfortunately", {font: "bold 25px Arial", fill: "#ffffff"});
        this.events.on("levelEnd", (param) => {
            instructions.setText("");
          });

        this.humanoids.push(this.constructHumanoid(850+400, 400, this.levelScale+0.5, false, 9, true, 5000, 5));
        
        let weirdAmalgamX = 1700;
        let weirdAmalgamY = 600;
        let weirdAmalgamScale = this.levelScale-0.6;
        let humanoidCount = 10;
        for (let count = 0; count < humanoidCount; count++) {
            this.humanoids.push(this.constructHumanoid(weirdAmalgamX-count, weirdAmalgamY, weirdAmalgamScale, false, 1, true, Math.random()*500 + 750, Math.random()*2+10));
        }
    }
}
