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
        // deselect all selected objects
        for (let anObject of this.selectedObjects )
        {
            anObject.selected = false;
        }
        let newSelObjects: GameObject[] = [];
        for (let anObject of clickedObjects)
        {
            console.log(`An object was selected: ${anObject}`);
            anObject.selected = ! anObject.selected;
            if (anObject.selected)
                newSelObjects.push(anObject);
        }
        this.selectedObjects = newSelObjects;
    }

    protected _mouseGrab(x: number, y: number)
    {
        if (this.selectedObjects.length === 0)
        {
            console.log("mouse grab2");
            console.log(`dx: ${x}, dy: ${y}`);
            // Moving the view around
            this.stage.position.set(this.stage.position.x + x, this.stage.position.y + y);
        }
        else
        {
            // TODO: Move selected objects
        }
    }

    public saveToJson()
    {

    }
}
