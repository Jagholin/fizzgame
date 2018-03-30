import { UIScene } from "./uiscene";
import { GameLevel } from "./gamelevel";
import { GameObject } from "./gameobject";

export class LevelEditorScene extends UIScene
{
    private selectedObjects: GameObject[] = [];

    protected _setLevel(aLevel: GameLevel)
    {
        // noop
    }

    protected _animationTick(deltaTime: number)
    {
        // noop
    }

    public initialize()
    {
        let levelBorder = new PIXI.Graphics;
        levelBorder.beginFill(0xaeaeae).drawRect(0, 0, 5000, 5000).endFill();
        this.stage.addChild(levelBorder);
    }

    protected _onMouseClick(event: PIXI.interaction.InteractionEvent)
    {
        const position = event.data.getLocalPosition(this.stage);
        const clickedObjects: GameObject[] = this.level.objectsUnderCursor(position.x, position.y);
        let newSelObjects: GameObject[] = [];
        for (let anObject of clickedObjects)
        {
            console.log(`An object was selected: ${anObject}`);
            anObject.selected = ! anObject.selected;
            if (anObject.selected)
                newSelObjects.push(anObject);
        }
        this.selectedObjects.forEach((anObject: GameObject) => {
            if (anObject.selected)
                newSelObjects.push(anObject);
        });
        this.selectedObjects = newSelObjects;
    }

    public saveToJson()
    {

    }
}
