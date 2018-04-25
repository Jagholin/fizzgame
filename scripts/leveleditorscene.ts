import { UIScene } from "./uiscene";
import { GameLevel } from "./gamelevel";
import { PropertyMeta, GameObject } from "./gameobject";
import * as UI from "./uitools";

export class LevelEditorScene extends UIScene
{
    private selectedObjects: GameObject[] = [];
    private editorMode: "edit"|"object" = "object";
    private activeObject: GameObject; // = undefined;
    private activeMenu: HTMLElement;
    private readonly propContainer: HTMLElement = document.getElementById("properties_container");
    private readonly viewerTypes = {
        "string": this.stringViewer.bind(this)
    };

    protected _setLevel(aLevel: GameLevel)
    {
        // noop
    }

    protected _animationTick(deltaTime: number)
    {
        // noop
    }

    constructor() 
    {
        super();
        this.keymappings.set("m", this.onSwitchMode.bind(this));
    }

    private updateStatusText()
    {
        let editModeSpan = document.getElementById("editor_mode");
        editModeSpan.innerHTML = `<p style="font: 1.2em bold; color: red; text-shadow: 2px 2px black; margin-right: 20px" class="collapse_border">${this.editorMode}</p>`;
    }

    private onSwitchMode(e: KeyboardEvent, type: string)
    {
        if (type !== "down")
            return;

        if (this.editorMode === "object" && this.activeObject)
            this.editorMode = "edit";
        else 
            this.editorMode = "object";

        this.updateStatusText();
    }

    public stringViewer(meta: PropertyMeta): HTMLElement
    {
        let viewElem: HTMLTableDataCellElement = document.createElement("td");
        viewElem.innerHTML = `<p>${meta.getter().toString()}</p>`;
        let editElem: HTMLInputElement = document.createElement("input");
        editElem.type = "text";
        UI.addClassName(editElem, "hidden");
        viewElem.appendChild(editElem);
        viewElem.addEventListener("click", (mouseEvent: MouseEvent)=>{
            // Replace text with an <input> item
            viewElem.firstElementChild.innerHTML = "";
            UI.removeClassName(editElem, "hidden");
        })
        editElem.addEventListener("change", (ev: Event)=>{
            meta.setter(editElem.value);
            viewElem.firstElementChild.innerHTML = editElem.value;
            UI.addClassName(editElem, "hidden");
        });
        editElem.addEventListener("blur", (event: FocusEvent)=>{
            viewElem.innerHTML = `<p>${meta.getter().toString()}</p>`;
            UI.addClassName(editElem, "hidden");
        });
        return viewElem;
    }

    public showProperties()
    {
        if (this.selectedObjects.length === 0)
            return;

        const propTable: HTMLTableSectionElement = this.propContainer.getElementsByTagName("tbody")[0];
        propTable.innerHTML = "";
        if (this.selectedObjects.length === 1)
        {
            // only 1 selected object, list its properties
            const myObject: GameObject = this.selectedObjects[0];
            const objectPropertyMeta = myObject.propertiesMeta();
            for (let propMeta of objectPropertyMeta)
            {
                let propHtml = `<td>${propMeta.name}</td>`;
                let newRow: HTMLTableRowElement = propTable.insertRow();
                newRow.innerHTML = propHtml;
                newRow.insertAdjacentElement("beforeend", this.viewerTypes[propMeta.type](propMeta));
            }
        }
        else
        {
            // todo
        }

        UI.removeClassName(this.propContainer, "hidden");
    }

    public hideProperties()
    {
        UI.addClassName(this.propContainer, "hidden");
    }

    public initialize()
    {
        let levelBorder = new PIXI.Graphics;
        levelBorder.beginFill(0xaeaeae).drawRect(0, 0, 5000, 5000).endFill();
        this.stage.addChild(levelBorder);
    }

    private objectClick(position: PIXI.Point)
    {
        const clickedObjects: GameObject[] = this.level.objectsUnderCursor(position.x, position.y);
        // deselect all selected objects
        for (let anObject of this.selectedObjects)
        {
            anObject.selected = false;
        }
        let newSelObjects: GameObject[] = [];
        for (let anObject of clickedObjects)
        {
            //console.log(`An object was selected: ${anObject}`);
            anObject.selected = ! anObject.selected;
            if (anObject.selected)
                newSelObjects.push(anObject);
        }
        this.selectedObjects = newSelObjects;
        if (this.selectedObjects.length === 0)
        {
            if (this.activeObject)
                this.activeObject.editorActive = false;
            this.activeObject = undefined;
            this.hideProperties();
        }
        else
        {
            if (this.activeObject && this.activeObject !== this.selectedObjects[0])
                this.activeObject.editorActive = false;
            this.activeObject = this.selectedObjects[0];
            this.activeObject.editorActive = true;
            this.showProperties();
        }
    }

    private editClick(position: PIXI.Point)
    {
        this.activeObject.editCursorAt(position);
        if (this.activeObject.editCursor.type === "vertex")
        {

        }
        else if (this.activeObject.editCursor.type === "edge")
        {

        }
        else
        {

        }
    }

    private editMove(position: PIXI.Point)
    {
        this.activeObject.editCursorAt(position);
    }

    protected _onMouseClick(event: PIXI.interaction.InteractionEvent)
    {
        const position = event.data.getLocalPosition(this.stage);
        if (this.editorMode === "object")
            this.objectClick(position);
        else if (this.editorMode === "edit")
            this.editClick(position);
    }

    private objectMouseGrab(x: number, y: number)
    {
        if (this.selectedObjects.length === 0)
        {
            this.stage.position.set(this.stage.position.x + x, this.stage.position.y + y);
        }
        else
        {
            for (let anObject of this.selectedObjects)
                anObject.move(x, y);
        }
    }

    private editMouseGrab(x: number, y: number)
    {
        if (this.activeObject.editCursor.type === "vertex")
        {
            this.activeObject.moveVertex(this.activeObject.editCursor.index, x, y);
        }
    }

    protected _mouseGrab(x: number, y: number)
    {
        if (this.editorMode === "object")
            this.objectMouseGrab(x, y);
        else if (this.editorMode === "edit")
            this.editMouseGrab(x, y);
    }

    protected _onContextMenu(event: PointerEvent)
    {
        if (this.activeMenu)
            this.activeMenu.remove();
        let menuCommands: string[] = ["Create Polygon here", "Switch to game mode"];
        let menuFunctions: (()=>void)[] = [()=>{
            //console.log("Create polygon calls");
            this.activeMenu = undefined;
            menuElement.remove();

            let newObj: GameObject = new GameObject;
            this.level.addObject(newObj);
            newObj.initAsNGonAt(5, 30, event.x, event.y);
            newObj.setGraphicsParent(this.stage);
        }, () => {
            //onsole.log("Switch to gamemode calls");
            this.activeMenu = undefined;
            menuElement.remove();
        }];
        if (this.selectedObjects.length > 0)
        {
            menuCommands.push("Delete selected");
            menuFunctions.push(()=>{
                this.activeMenu = undefined;
                menuElement.remove();

                for (let aGameObject of this.selectedObjects)
                {
                    this.level.removeObject(aGameObject);
                }
                this.selectedObjects.splice(0);
            });
        }
        let menuElement = UI.createMenu(menuCommands, menuFunctions);

        menuElement.style.left = `${event.x}px`;
        menuElement.style.top = `${event.y}px`;
        UI.removeClassName(menuElement, "hidden");
        this.activeMenu = menuElement;
    }

    public setScene(app: PIXI.Application)
    {
        super.setScene(app);
        let editModeSpan = document.getElementById("editor_mode");
        this.updateStatusText();
        UI.removeClassName(editModeSpan, "hidden");
    }

    public unsetScene()
    {
        super.unsetScene();
        if (this.selectedObjects.length > 0)
            this.hideProperties();
        let editModeSpan = document.getElementById("editor_mode");
        UI.addClassName(editModeSpan, "hidden");
    }

    protected _onMouseDown(eve: PIXI.interaction.InteractionEvent)
    {
        if (this.activeMenu)
        {
            this.activeMenu.remove();
            this.activeMenu = undefined;
        }
    }

    protected _onMouseMove(eve: PIXI.interaction.InteractionEvent)
    {
        if (this.editorMode === "edit")
            this.editMove(eve.data.getLocalPosition(this.stage));
    }

    public saveToJson()
    {

    }
}
