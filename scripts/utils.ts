import * as PIXI from "pixi.js"

export class AsyncLoader extends PIXI.loaders.Loader
{
    public asyncLoad(): Promise<any>
    {
        return new Promise((resolve, reject)=>{
            this.load((loader, resources)=>{
                resolve(resources);
            });
        })
    }
}