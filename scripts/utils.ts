import * as PIXI from "pixi.js"
import * as _ from "lodash";

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

// TODO: implement observable for arrays 

export function observable(observers: string)
{
    return function (construct, key)
    {
        Object.defineProperty(construct, "_" + key, {
            writable: true
        });
        Object.defineProperty(construct, key, {
            set(aValue) {
                if (!_.isUndefined(aValue.data) && !_.isUndefined(aValue.muted))
                {
                    this["_" + key] = aValue.data;
                    if (aValue.muted) return;
                }
                else
                    this["_" + key] = aValue;

                for (let f of this[observers])
                {
                    let realFunc = typeof(f) === "function" ? f : f.f;
                    realFunc(aValue);
                }
            },
            get() {
                let proxy = {};
                let realObj = this;
                if (_.isArray(this["_" + key]))
                {
                    // this object is an array so we must return a proxy that implements iterable
                    proxy = {
                        currentI : 0,
                        [Symbol.iterator] : function () {
                            this.currentI = 0;
                            return this;
                        },
                        next() {
                            if (realObj["_"+key].length <= this.currentI)
                                return {
                                    done: true
                                };
                            let result = {
                                done: false,
                                value: realObj["_" + key][this.currentI]
                            };
                            ++this.currentI;
                            return result;
                        },
                        map(aFunction) {
                            let result = realObj["_" + key].map(aFunction);
                            return result;
                        },
                        splice: Object.getPrototypeOf(realObj["_"+key]).splice.bind(realObj["_"+key]),
                        push(anObject) {
                            let result = realObj["_" + key].push(anObject);
                            this.length ++;
                            // Massive changed have to trigger the listeners/observers
                            for (let f of realObj[observers])
                            {
                                let realFunc = typeof(f) === "function" ? f : f.f;
                                realFunc(realObj["_" + key]);
                            }
                            return result;
                        },
                        length : realObj["_" + key].length
                    }
                }

                proxy.toString = this["_" + key].toString.bind(this["_" + key]);

                for (let aKey of Object.keys(this["_" + key]))
                {
                    Object.defineProperty(proxy, aKey, {
                        set: (aValue)=>{
                            realObj["_" + key][aKey] = aValue;
                            for (let f of realObj[observers])
                            {
                                let realFunc = typeof(f) === "function" ? f : f.f;
                                realFunc(realObj["_" + key]);
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