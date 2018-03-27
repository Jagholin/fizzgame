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

export function observable(observers: string)
{
    return function (construct, key)
    {
        Object.defineProperty(construct, "_" + key, {
            writable: true
        });
        Object.defineProperty(construct, key, {
            set(aValue) {
                this["_" + key] = aValue;
                for (let f of this[observers])
                {
                    f(aValue);
                }
            },
            get() {
                let proxy = {};
                let realObj = this;
                for (let aKey of Object.keys(this["_" + key]))
                {
                    Object.defineProperty(proxy, aKey, {
                        set: (aValue)=>{
                            realObj["_" + key][aKey] = aValue;
                            for (let f of realObj[observers])
                            {
                                f(realObj["_" + key]);
                            }
                        },
                        get: () => {
                            return realObj["_" + key][aKey];
                        }
                    })
                }
                return proxy;
            }
        })
    }
}