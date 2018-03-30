let menuBaseIndex: number = 0;

export function createMenu(menuItems: string[], cbFuncs: (()=>void)[]) 
{
    let menuHtml = "<div class='hidden floatmenu' ><ul class='floatmenu_container'>"
    let menuItemIndex = menuBaseIndex;
    for (let menuItem of menuItems)
    {
        menuHtml += `<li> <a href='#' id='menuitem${menuItemIndex}'> ${menuItem} </a> </li>`;
        ++menuItemIndex;
    }
    menuHtml += "</div>"
    document.body.insertAdjacentHTML("beforeend", menuHtml);
    for (let i = 0; i < cbFuncs.length; ++i)
    {
        let linkElement = document.getElementById(`menuItem${menuBaseIndex+i}`);
        linkElement.onclick = cbFuncs[i];
    }
    menuBaseIndex += menuItems.length;
}