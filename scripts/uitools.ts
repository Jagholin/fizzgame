import * as _ from "lodash"

export function createMenu(menuItems: string[], cbFuncs: (()=>void)[]) 
{
    let menuElement: HTMLDivElement = document.createElement("div");
    menuElement.className = "hidden floatmenu";
    let menuHtml = "<ul class='floatmenu_container'>"
    for (let menuItem of menuItems)
    {
        menuHtml += `<li> <a href='#'>  </a> </li>`;
    }
    menuHtml += "</ul>";
    menuElement.innerHTML = menuHtml;
    let menuLinks = menuElement.querySelectorAll("a");
    for (let [menuLink, menuStr, func] of _.zip(menuLinks, menuItems, cbFuncs))
    {
        menuLink.innerText = menuStr;
        menuLink.addEventListener("click", func);
    }
    document.body.insertAdjacentElement("beforeend", menuElement);
    return menuElement;
}

export function addClassName(elem: HTMLElement, className: string)
{
    const classNames = elem.className.split(" ");
    for (let aName of classNames)
    {
        if (aName === className) // already have it
            return;
    }

    elem.className += " " + className;
}

export function removeClassName(elem: HTMLElement, className: string)
{
    const classNames = elem.className.split(" ");
    let myNames: string[] = [];
    for (let aName of classNames)
    {
        if (aName === className)
            continue;
        myNames.push(aName);
    }
    elem.className = myNames.join(" ");
}