class TimedLevel extends LevelScene
{
    constructor(){
        super("TimedLevel");
    }
    preload ()
    {   
        super.preload();
    }

    create ()
    {   
        super.create();
        this.currentLevel = "TimedLevel";
        this.nextLevel = "MainMenu";

        this.totaltime = 90;
        this.timerDisplay = this.add.text(1920/2, 100, "Time: " + (this.totaltime-this.sceneDuration/1000).toFixed(2) + "s", {font: "40px Arial", fill: "#FFFFFF"});
        this.timerDisplay.setOrigin(0.5, 0.5);

        this.events.on("nextWave", (param) => {
            this.totaltime += 5;
            this.nextWave();
          });
        this.events.emit("nextWave", {victory:true});
        
    }

    update(time, delta){
        super.update(time, delta);
        this.timerDisplay.setText("Time: " + (this.totaltime-this.sceneDuration/1000).toFixed(2) + "s");
        if (this.totaltime-this.sceneDuration/1000 < 0 && !this.isLevelEnding) {
            this.events.emit("levelEnd", {victory:true});
            this.isLevelEnding = true;
            let count = 0
            this.humanoids.forEach(humanoid => {
                if (humanoid.health <= 0) {
                    count = count + 1;
                }
            });
            this.kills = count;
            this.addSlowdown();
            this.time.delayedCall(5000, ()=>{
                this.showSummary();
            });
        }
        let remaining = 0;
        this.humanoids.forEach(humanoid => {
            if (humanoid.health > 0) {
                remaining = remaining + 1;
            }
        });
    }

    nextWave() {
        let humanoidCount = Math.random()*4+5;
        let amalgamSpawned = Math.random() < 0.3;
        if (amalgamSpawned) {
            let weirdAmalgamX = Math.random()*1400 +500;
            let weirdAmalgamY = Math.random()*900 +100;
            let weirdAmalgamScale = Math.random()+0.2;
            for (let count = 0; count < humanoidCount; count++) {
                this.humanoids.push(this.constructHumanoid(weirdAmalgamX-count, weirdAmalgamY, weirdAmalgamScale, false, 1, true, Math.random()*2500 + 750, Math.random()*10+15));
            }
        }

        humanoidCount = amalgamSpawned ? Math.random()*4+1 : Math.random()*6+2;
        for (let count = 0; count < humanoidCount; count++) {
            let difficulty = Math.random();
            this.humanoids.push(this.constructHumanoid(Math.random()*1400+500, Math.random()*900+100, this.levelScale+(difficulty-0.5), false, Math.floor(difficulty*5)+1, true, Math.random()*5000 + 750, Math.random()*9+1));
        }

    }
}
