// This code was made based on information from the following:
// - https://www.hoyolab.com/article/497840
// - https://genshin-impact.fandom.com/wiki/Wishes


// NOTES:
// [1] You can observe that there's some code just to handle validation of arguments passed into the functions.
//     Normally, these argument validations may be unnecessary, but there was a push towards providing some ease in using this independently,
//     such as just calling the functions through the browser console instead of through the user interface.



WishCalc.GetInputs = function()
{
	let inputCollection = {
		Current: {
			Character: document.getElementById("input-current-rank-character"),
			Weapon: document.getElementById("input-current-rank-weapon")
		},
		Target: {
			Character: document.getElementById("input-target-rank-character"),
			Weapon: document.getElementById("input-target-rank-weapon")
		},
		Guarantee:
		{
			Character: document.getElementById("input-guaranteed-character"),
			Weapon: document.getElementById("input-guaranteed-featured-weapon")
		},
		Pity: 
		{
			Character: document.getElementById("input-character-pity"),
			Radiance: document.getElementById("input-radiance-pity"),
			Weapon: document.getElementById("input-weapons-pity")
		},
		EpitomizedPath: document.getElementById("input-guaranteed-specific-weapon"),
		Pulls: {
			Primogems: document.getElementById("input-primogems"),
			IntertwinedFates: document.getElementById("input-intertwined-fates"),
			Starglitter: document.getElementById("input-starglitter")
		}
	}
    
    function sfnToValue(target)
    {
        if((target instanceof HTMLInputElement) || (target instanceof HTMLSelectElement))
        {
            if(target.value === "true" || target.value === "false")
                return target.value === "true";

			let parsedValue = WishCalc.Utilities.ParseInt(target.value);
            if(isNaN(parsedValue) !== true)
                return parsedValue;

            return target.value;
        }

        if(WishCalc.Utilities.IsObject(target))
        {
            let keys = Object.keys(target);
            for(let i = 0; i < keys.length; i++)
            {
                let key = keys[i];
                target[key] = sfnToValue(target[key]);
            }
        }

        return target;
    }

	return sfnToValue(inputCollection);
}

WishCalc.ClickCalculate = function(e) {
	let calculateButton = e.currentTarget;
	calculateButton.textContent = "CALCULATING"
	calculateButton.setAttribute("disabled", "");
	setTimeout(() => {
		WishCalc.DisplayResult(WishCalc.Calculate(WishCalc.GetInputs()));
		calculateButton.textContent = "Calculate";
		calculateButton.removeAttribute("disabled");
	}, 1);
};

WishCalc.ValidateCalculationArgs = function(args)
{
	let input = {
		Current: {
			Character: 0,
			Weapon: 0
		},
		Target: {
			Character: 0,
			Weapon: 0
		},
		Guarantee:
		{
			Character: false,
			Weapon: false
		},
		Pity:
		{
			Character: 0,
			Radiance: 0,
			Weapon: 0
		},
		EpitomizedPath: 0,
		Pulls:
        {
			Primogems: 0,
			IntertwinedFates: 0,
			Starglitter: 0
		}
	};

	WishCalc.Utilities.ValidateArguments(args, input);
	input.Initial = {
		Current: {
			Character: input.Current.Character,
			Weapon:    input.Current.Weapon
		},
		Target: {
			Character: input.Target.Character,
			Weapon:    input.Target.Weapon
		},
		Pulls: {
			Primogems:        input.Pulls.Primogems,
			IntertwinedFates: input.Pulls.IntertwinedFates,
			Starglitter:      input.Pulls.Starglitter
		}
	};

	input.Target.Character = input.Target.Character - input.Current.Character; input.Current.Character = 0;
	input.Target.Weapon    = input.Target.Weapon    - input.Current.Weapon;    input.Current.Weapon    = 0;

	input.Pity.Character = Math.min(89, Math.max(0, args.Pity.Character));
	input.Pity.Weapon    = Math.min(76, Math.max(0, args.Pity.Weapon));
	input.Pity.Radiance  = Math.min(3,  Math.max(0, args.Pity.Radiance));
	input.EpitomizedPath = Math.min(1,  Math.max(0, args.EpitomizedPath));

	input.Pulls = Math.floor(input.Pulls.Primogems / 160) + Math.floor(input.Pulls.IntertwinedFates) + Math.floor(input.Pulls.Starglitter / 5);
	input.Pulls = Math.min(args.Target.Character * 180 + args.Target.Weapon * 154, Math.max(0, input.Pulls));

    return input;
}


// Function for getting the probability.
WishCalc.Calculate = function(args)
{
	let infoTimeStart = new Date();

    args = WishCalc.ValidateCalculationArgs(args);
	let result = { Args: args };

	// Do checks if the inputs are right, and output something if not.
	if(args.Pulls < args.Target.Character + args.Target.Weapon)
	{
		result.Invalidation = `${WishCalc.Style.Number(args.Pulls, "pull")} for ${args.Target.Character + args.Target.Weapon} items is not enough.`;
		return result;
	}
	else if(args.Target.Character + args.Target.Weapon < 1)
	{
		result.Invalidation = "Nothing to look for.";
		return result;
	}
	else if(args.Pulls < 1)
	{
		result.Invalidation = "Less than one pull to do?";
		return result;
	}
	
	// Get the first distribution, with character and weapon copies separated.
	let firstDistribution = { };
	if(args.Target.Character > 0)
	{
		// Calculate character distribution.
		firstDistribution.Character = WishCalc.GetFirstCharacterDistribution(args.Pity.Character, args.Guarantee.Character, args.Pity.Radiance);
		
		// Just keep adding as needed.
		for(let iCa = 1; iCa < args.Target.Character; iCa++)
			firstDistribution.Character = WishCalc.Arrays.AddCharacterCopy(firstDistribution.Character[0].length, firstDistribution.Character);
	}
	if(args.Target.Weapon > 0)
	{
		// Calculate weapon distribution.
		firstDistribution.Weapon = WishCalc.GetFirstWeaponDistribution(args.Pity.Weapon, args.Guarantee.Weapon, args.EpitomizedPath);
		for(let iCb = 1; iCb < args.Target.Weapon; iCb++)
			firstDistribution.Weapon = WishCalc.Arrays.AddWeaponCopy(firstDistribution.Weapon);
	}
	
	let characterPullLimit = firstDistribution.Character != null ? firstDistribution.Character[0].length : 0;
	let weaponPullLimit    = firstDistribution.Weapon    != null ? firstDistribution.Weapon.length : 0;
	let pairPullLimit      = characterPullLimit + weaponPullLimit;

	// Get result, perhaps by combining the character and weapon distributions.
	result.Result = 0.0;
	if(args.Target.Character > 0 && args.Target.Weapon > 0)
	{
		let resultDistribution = result.Distribution = new Array(4);
		for(let iR = 0; iR < 4; iR++)
		{
			if(firstDistribution.Character[iR] != null)
			{
				resultDistribution[iR] = new Array(pairPullLimit);
				for(let iP = 0; iP < pairPullLimit; iP++)
				{
					resultDistribution[iR][iP] = 0.0;
				}
			}
			else
			{
				resultDistribution[iR] = null;
			}
		}

		for(let iPa = 0; iPa < characterPullLimit; iPa++)
		{
			for(let iPb = 0; iPb < weaponPullLimit; iPb++)
			{
				if(resultDistribution[0] != null) resultDistribution[0][1 + iPa + iPb] += firstDistribution.Character[0][iPa] * firstDistribution.Weapon[iPb];
				if(resultDistribution[1] != null) resultDistribution[1][1 + iPa + iPb] += firstDistribution.Character[1][iPa] * firstDistribution.Weapon[iPb];
				if(resultDistribution[2] != null) resultDistribution[2][1 + iPa + iPb] += firstDistribution.Character[2][iPa] * firstDistribution.Weapon[iPb];
				if(resultDistribution[3] != null) resultDistribution[3][1 + iPa + iPb] += firstDistribution.Character[3][iPa] * firstDistribution.Weapon[iPb];
			}
		}

		let sum1 = 0.0;
		let sum2 = 0.0;
		let sum3 = 0.0;
		let sum4 = 0.0;
		for(let iP = Math.min(pairPullLimit, args.Pulls) - 1; iP >= 0; iP--)
		{
			if(resultDistribution[0] != null) sum1 += resultDistribution[0][iP];
			if(resultDistribution[1] != null) sum2 += resultDistribution[1][iP];
			if(resultDistribution[2] != null) sum3 += resultDistribution[2][iP];
			if(resultDistribution[3] != null) sum4 += resultDistribution[3][iP];
		}
		result.Result += sum1 + sum2 + sum3 + sum4;
	}
	else if(args.Target.Character > 0)
	{
		let resultDistribution = result.Distribution = firstDistribution.Character;
		for(let iP = 0; (iP < characterPullLimit) && (iP < args.Pulls); iP++)
		{
			if(resultDistribution[0] != null) result.Result += resultDistribution[0][iP];
			if(resultDistribution[1] != null) result.Result += resultDistribution[1][iP];
			if(resultDistribution[2] != null) result.Result += resultDistribution[2][iP];
			if(resultDistribution[3] != null) result.Result += resultDistribution[3][iP];
		}
	}
	else if(args.Target.Weapon > 0)
	{
		let resultDistribution = result.Distribution = firstDistribution.Weapon;
		for(let iP = 0; (iP < weaponPullLimit) && (iP < args.Pulls); iP++) result.Result += resultDistribution[iP];
	}

	result.TimeTaken = (new Date() - infoTimeStart);
	return result;
}

WishCalc.DisplayResult = function(result)
{
	let resultElements = {
		Result:      document.getElementById("text-wc-results"),
		OddsSuccess: document.getElementById("text-wc-result-odds-success"),
		OddsFailure: document.getElementById("text-wc-result-odds-failure"),
		Description: document.getElementById("text-wc-result-description")
	};

	if(result.hasOwnProperty("Invalidation") && result.Invalidation != null)
	{
		WishCalc.CleanResult();
		resultElements.Result.textContent = result.Invalidation;
		return;
	}

	let roundedResult = WishCalc.Utilities.Round(result.Result, 12); // 12 digits seem to be most stable enough.
	let resultString  = '"' + WishCalc.Style.Round(100 * roundedResult, 4) + "%\"";
	resultElements.Result.textContent      = "Result: " + resultString + "";
	resultElements.OddsSuccess.textContent = "Odds for success: " + ((roundedResult <= 0.5 && roundedResult > 0) ? (" 1 in " + WishCalc.Utilities.Commas(WishCalc.Style.Round(1 /      roundedResult)))  : "-");
	resultElements.OddsFailure.textContent = "Odds for failure: " + ((roundedResult >= 0.5 && roundedResult < 1) ? (" 1 in " + WishCalc.Utilities.Commas(WishCalc.Style.Round(1 / (1 - roundedResult)))) : "-");

	let description = "";
	if(result.Args.Target.Character > 0)
	{
		description = "Starting the character banner with "
		+ result.Args.Pity.Character
		+ " pity for the next five star, "
		+ result.Args.Pity.Radiance
		+ " radiance pity, and "
		+ (result.Args.Guarantee.Character ? "is" : "is not")
		+ " guaranteed the 50/50. ";
	}
	if(result.Args.Target.Weapon > 0)
	{
		if(result.Args.Target.Character < 1)
		{
			description = "";
		}
		description += "Starting the weapon banner with "
		+ result.Args.Pity.Weapon + " pity, "
		+"\""
		+ (result.Args.EpitomizedPath == 1 ? "1/1" : "0/1")
		+ "\" on the epitomized path"
		+ (result.Args.EpitomizedPath == 1 ? ". " : (", and " + (result.Args.Guarantee.Weapon == true ? "with" : "without" ) + " a guarantee for a featured weapon. "));
	}
	description += WishCalc.Utilities.Commas(result.Args.Pulls) + " single pull" + (result.Args.Pulls == 1 ? " has" : "s have") + " a " + resultString + " chance for success at ";
	if(result.Args.Target.Character > 0)
	{
		description += WishCalc.Style.Number(result.Args.Target.Character, " limited five-star character");
		if(result.Args.Target.Weapon > 0)
			description += ", and ";
		else description += ".";
	}
	if(result.Args.Target.Weapon > 0)
	{
		description += `${WishCalc.Style.Number(result.Args.Target.Weapon, "limited five-star weapon")}.`;
	}
	resultElements.Description.textContent = "Description: " + description;

	if(WishCalc.IsResultClean == true)
	{
		resultElements.OddsSuccess.style.removeProperty("display");
		resultElements.OddsFailure.style.removeProperty("display");
		resultElements.Description.style.removeProperty("display");

		WishCalc.IsResultClean = false;
	}
}

document.getElementById("button-wc-calculate").addEventListener("click", WishCalc.ClickCalculate);

if(true)
{
	let inputs = document.querySelectorAll(".wc-form input, .wc-form select");
	for(let i = 0; i < inputs.length; i++)
		inputs[i].addEventListener("input", WishCalc.Generic.InputChange);
}