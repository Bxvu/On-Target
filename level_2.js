class LevelTwo extends LevelScene
{
    constructor(){
        super("LevelTwo");
    }
    preload ()
    {   
        super.preload();
    }

    create ()
    {   
        super.create();
        this.currentLevel = "LevelTwo";
        this.nextLevel = "LevelThree";


        let instructions = this.add.text(200, 300, "There is no lore to this game,\nidk why these guys are floating\n(other than making it so \nyou have to aim in the air)", {font: "bold 40px Arial", fill: "#ffffff"});
        this.events.on("levelEnd", (param) => {
            instructions.setText("");
          });


        this.humanoids.push(this.constructHumanoid(700+600, 700, this.levelScale+0.2, false, 5, true, 2000, 2));
        this.humanoids.push(this.constructHumanoid(800+200, 500, this.levelScale-0.3, false, 2, true, 3000, 3));
        this.humanoids.push(this.constructHumanoid(900+700, 300, this.levelScale-0.5, false, 1, true, 4000, 1));


    }

}
