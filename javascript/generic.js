// ===== ===== ===== ===== =====
// Namespace object.
// 

var WishCalc = {
	IsInitialized: false, // Variable for knowing if data has been initialized.
	IsResultClean: false, // Variable for knowing if the result area is clean.
	Utilities: {},
    Style:     {},
	Generic:   {},
    Inputs:    {},
}



// ===== ===== ===== ===== =====
// Object and data processing.
// 

WishCalc.Utilities.IsObject = function(target)
{
	if(target == null) return null;
    return target.constructor === ({}).constructor;
}

// A function to just get a number from (grab the numbers in) a string.
WishCalc.Utilities.ParseInt = function(target)
{
	if(typeof target === "string" || (target instanceof String))
	{
		let value = "";
		for(let i = 0; i < target.length && value !== null; i++)
		{
			let char = target.charAt(i)
			let charCode = target.charCodeAt(i);
			if(charCode >= 48 && charCode <= 57 || char === '.')
				value += char;
			else if((char !== ',' || char !== '.') === false)
				value = null;
		}
		return parseInt(value);
	}
	return parseInt(target);
}

// A function to help with making sure there are values where functions are looking for.
WishCalc.Utilities.ValidateArguments = function(source, destination)
{
	if(source && WishCalc.Utilities.IsObject(destination))
	{
		let keys = Object.keys(destination);
		for(let i = 0; i < keys.length; i++)
		{
			let key = keys[i];
			if(WishCalc.Utilities.IsObject(source[key]))
			{
				if(source.hasOwnProperty(key) && (typeof source[key]) === (typeof destination[key]))
				{
					WishCalc.Utilities.ValidateArguments(source[key], destination[key]);
				}
			}
			else if((source[key] instanceof Object) !== true && (source[key] === "N/A" || (typeof source[key]) === (typeof destination[key])))
			{
				destination[key] = source[key];
			}
		}
	}
	return destination;
}



// ===== ===== ===== ===== =====
// Text formatting.
// 

WishCalc.Utilities.Commas = function(targetThing)
{
    return targetThing.toLocaleString('fullwide', {useGrouping:false}).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

WishCalc.Utilities.Round = function(x, y)
{
	let factorOfTen = Math.pow(10, y);
	return Math.round(x * factorOfTen) / factorOfTen;
}



// ===== ===== ===== ===== =====
// Generic input types.
// 

WishCalc.Utilities.NumbersOnly = function(value, withDecimal = false)
{
    let result = "";
    let dotted = false;
    for(let i = 0; i < value.length; i++)
    {
        let char = value.charAt(i)
        let charCode = value.charCodeAt(i);
        if(withDecimal && char === '.')
        {
            if(dotted !== true)
            {
                result += char;
                dotted = true;
            }
        }
        else if(charCode != NaN && charCode >= 48 && charCode <= 57 && (result.length > 0 || char != '0'))
            result += char;
    }

    if(result == null) result = '';
    else if(withDecimal && result.charAt(0) === '.') result = '0' + result;

    return result;
}

WishCalc.Inputs.AsNumberType = function(e)
{
	e.target.value = WishCalc.Utilities.Commas(WishCalc.Utilities.NumbersOnly(e.target.value));
}

WishCalc.Inputs.AsFloatingType = function(e)
{
	e.target.value = WishCalc.Utilities.NumbersOnly(e.target.value, true);
}

if(true)
{
	let numberInputs = document.querySelectorAll(".input-number");
	if(numberInputs) numberInputs.forEach((i) => {
        i.addEventListener("input", WishCalc.Inputs.AsNumberType);
    });
}



// ===== ===== ===== ===== =====
// Specific input and output methods.
// 

// Function for cleaning the results area.
WishCalc.CleanResult = function()
{
	if(WishCalc.IsResultClean !== true)
	{
		document.getElementById("text-wc-results").textContent = "results will be displayed here";
		document.getElementById("text-wc-result-odds-success").style.display = "none";
		document.getElementById("text-wc-result-odds-failure").style.display = "none";
		document.getElementById("text-wc-result-description").style.display = "none";
		WishCalc.IsResultClean = true;
	}
}

// Generic function for the calculator to handle changes to an input.
WishCalc.Generic.InputChange = function()
{
	WishCalc.CleanResult();
}

// Function to call on the loading of the website or at the very start of use.
WishCalc.Initialize = function()
{
	// Attempt to smooth the provided data for base character distribution.
	let sum = 0.0;
	for(let x = 0; x < dataChanceCharArray.length; x++)
	{
		sum += dataChanceCharArray[x];
	}
	for(let x = 0; x < dataChanceCharArray.length; x++)
	{
		dataChanceCharArray[x] /= sum;
	}

	// Attempt to smooth the provided data for base weapon distribution.
	sum = 0.0;
	for(let x = 0; x < dataChanceWeapArray.length; x++)
	{
		sum += dataChanceWeapArray[x];
	}
	for(let x = 0; x < dataChanceWeapArray.length; x++)
	{
		dataChanceWeapArray[x] /= sum;
	}
	
	WishCalc.IsInitialized = true;
	document.getElementById("button-wc-calculate").value = "Calculate";
}

if(true)
{
	let selBgnConLevel = document.getElementById("input-current-rank-character");
	let selEndConLevel = document.getElementById("input-target-rank-character");
	let selBgnRefLevel = document.getElementById("input-current-rank-weapon");
	let selEndRefLevel = document.getElementById("input-target-rank-weapon");

	function sfnUpdateTargetRank(target)
	{
		if(target instanceof HTMLElement !== true)
			return;

		let other = null;
		operation = 0;
		switch(target.id)
		{
		case "input-current-rank-character":
			other = selEndConLevel;
			operation = 1;
			break;
		case "input-target-rank-character":
			other = selBgnConLevel;
			operation = -1;
			break;
		case "input-current-rank-weapon":
			other = selEndRefLevel;
			operation = 1;
			break;
		case "input-target-rank-weapon":
			other = selBgnRefLevel;
			operation = -1;
			break;
		default: return;
		}

		if(other == null || operation == 0) return;
		other.value = operation > 0 ? Math.max(target.value, other.value) : Math.min(target.value, other.value);
	}

	if(selBgnConLevel) selBgnConLevel.addEventListener("input", (e) => { sfnUpdateTargetRank(e.target); });
	if(selEndConLevel) selEndConLevel.addEventListener("input", (e) => { sfnUpdateTargetRank(e.target); });
	if(selBgnRefLevel) selBgnRefLevel.addEventListener("input", (e) => { sfnUpdateTargetRank(e.target); });
	if(selEndRefLevel) selEndRefLevel.addEventListener("input", (e) => { sfnUpdateTargetRank(e.target); });
}

if(true)
{
	document.getElementById("input-character-pity").addEventListener("input", (e) => {
		let parsedValue = WishCalc.Utilities.ParseInt(e.target.value);
		if(isNaN(parsedValue) !== true)
		{
			e.target.value = String(Math.min(89, Math.max(0, parsedValue)));
		}
	});
    document.getElementById("input-weapons-pity").addEventListener("input", (e) => {
		let parsedValue = WishCalc.Utilities.ParseInt(e.target.value);
		if(isNaN(parsedValue) !== true)
		{
			e.target.value = String(Math.min(76, Math.max(0, parsedValue)));
		}
	});
}