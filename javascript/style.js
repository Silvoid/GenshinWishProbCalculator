// ===== ===== ===== ===== =====
// Size of text.
//

WishCalc.Style.GetTextWidth = function(text, font)
{
    const canvas = text.canvas || (text.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}

WishCalc.Style.GetCSSStyle = function(element, propertyName) { return window.getComputedStyle(element, null).getPropertyValue(propertyName); }

WishCalc.Style.GetCanvasFont = function(element = document.body, properties)
{
    const fontWeight = properties.fontWeight || WishCalc.Style.GetCSSStyle(element, "font-weight") || "normal";
    const fontSize   = properties.fontSize   || WishCalc.Style.GetCSSStyle(element, "font-size")   || "16px";
    const fontFamily = properties.fontFamily || WishCalc.Style.GetCSSStyle(element, "font-family") || "Arial";
    return `${fontWeight} ${fontSize} ${fontFamily}`;
}

WishCalc.Style.FitText = function(containerID)
{
    const maxFontSize = 32;
    const container = document.getElementById(containerID);

    // let fontSize   = Number(String(getCSSStyle(container, "font-size")).slice(0, 2));
    let fontSize   = 32;
    let textWidth  = WishCalc.Style.GetTextWidth(container.textContent, WishCalc.Style.GetCanvasFont(container, { "fontSize": `${fontSize}px` }));
    let sizingRate = textWidth == container.offsetWidth ? 0 : (textWidth < container.offsetWidth ? -1 : 1);

    if(fontSize === NaN || sizingRate === 0) return;
    for(let emergencyCounter = 0; emergencyCounter < 64; emergencyCounter++)
    {
        let textWidth = WishCalc.Style.GetTextWidth(container.textContent, WishCalc.Style.GetCanvasFont(container, { "fontSize": `${fontSize}px` }))
        if(textWidth <= container.offsetWidth) break;
        fontSize -= 1;
    }

    container.style.fontSize = `${fontSize}px`;
}



// ===== ===== ===== ===== =====
// Formatting of text.
//

WishCalc.Style.Round = function(value, decimals = 0)
{
    let rounded = WishCalc.Utilities.Round(value, decimals);
    return `${rounded == value ? "" : "~"}${rounded}`;
}

WishCalc.Style.Write = function(element, text)
{
    if(text)
    {
        element.textContent = text;
        element.style.display = "";
    }
    else
    {
        element.textContent = "";
        element.style.display = "none";
    }
}

WishCalc.Style.UpperCaseOnMissing = function(former, latter) { return `${former}${former ? ' ' + latter : (latter = latter[0].toUpperCase() + latter.slice(1))}`; }
WishCalc.Style.Number = function(quantity, name) { return `${quantity} ${name}${quantity != 1 ? 's' : ""}`; }



// ===== ===== ===== ===== =====
// Add some listeners to call the functions, and execute functions on load.
//

document.defaultView.addEventListener("resize", (e) => { 
    WishCalc.Style.FitText("page-calculator-header");
});

WishCalc.Style.FitText("page-calculator-header");


if(true)
{
    let targetLink = document.getElementById("wc-workings-info-verbose-link");
    if(targetLink) targetLink.addEventListener("click", (e) => {
        e.preventDefault();
        let target = document.getElementById("wc-workings-info-verbose");
        if(target.style.display == "none")
        {
            targetLink.textContent = "to hide the more verbose answer";
            target.style.display = "";
        }
        else
        {
            targetLink.textContent = "to show the more verbose answer";
            target.style.display = "none";
        }
    });
}