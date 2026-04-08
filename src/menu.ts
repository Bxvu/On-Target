class Menu extends LooseScene {
    init(data?: unknown): void {
    }

    preload(): void {
    }

    create(): void {
    }

    update(): void {
    }

    closeMenu(originalScene: SceneKey, nextScene: SceneKey, config?: MenuTransitionConfig): void {
        this.scene.stop("SummaryScene");
        this.scene.start(nextScene, config);

        if (nextScene !== originalScene) {
            this.scene.stop(originalScene);
        }
    }

    menuLeave(target: GameObject, originalScene: SceneKey, nextScene: SceneKey, config?: MenuTransitionConfig): void {
        this.tweens.add({
            targets: target,
            x: 3550,
            duration: 500,
            ease: "Cubic.in",
            onComplete: () => {
                this.time.delayedCall(250, () => {
                    this.closeMenu(originalScene, nextScene, config);
                });
            }
        });
    }
}
