// This code was made based on information from the following:
// - https://www.hoyolab.com/article/497840
// - https://genshin-impact.fandom.com/wiki/Wishes

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

WishCalc.ClickCalculate = function() { WishCalc.DisplayResult(WishCalc.Calculate(WishCalc.GetInputs())); }

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

    function sfnAcceptInputArgument(source, destination)
    {
        if(WishCalc.Utilities.IsObject(destination))
        {
            let keys = Object.keys(destination);
            for(let i = 0; i < keys.length; i++)
            {
                let key = keys[i];
                if(WishCalc.Utilities.IsObject(source[key]))
                {
                    if(source.hasOwnProperty(key) && (typeof source[key]) === (typeof destination[key]))
                    {
                        sfnAcceptInputArgument(source[key], destination[key]);
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

	sfnAcceptInputArgument(args, input);
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

	input.Pulls = Math.floor(input.Pulls.Primogems / 160) + Math.floor(input.Pulls.IntertwinedFates) + Math.floor(input.Pulls.Starglitter / 5);
	input.Pulls = Math.min(args.Target.Character * 180 + args.Target.Weapon * 231, Math.max(0, input.Pulls));

    return input;
}



// Function for getting the probability.
WishCalc.Calculate = function(args)
{
    args = WishCalc.ValidateCalculationArgs(args);
	let result = { Args: args };

	// Do checks if the inputs are right, and output something.
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

	
	// Do pulls for character copies.
	let firstDistCharacter = null;
	let chance = 0.0;
	let remaining = 1.0;
	if(args.Target.Character > 0)
	{
		let firstDist = firstDistCharacter = new Array(180  // 180 pulls is the default maximum.
			- args.Pity.Character                           // Subtract the pity.
			- (args.Guarantee.Character == true ? 90 : 0)); // Subtract some number if it's guaranteed.
		for(let x = 0; x < firstDist.length; x++) { firstDist[x] = 0; }
		for(let x = 0; x < 90 - args.Pity.Character; x++)
		{
			chance = 0.006;
			let pity = args.Pity.Character + x;
			if(pity > 72)
			{
				// Soft pity's effect supposedly starts on the 74th pull.
				// For zero-based counting, the 74th pull is 73, and that is after 72.
				chance = Math.min(1.0, 0.06 * (pity - 72) + 0.006);
			}
			chance *= remaining;
			remaining -= chance;
			if(args.Guarantee.Character == false)
			{
				chance *= 0.5;
				for(let y = 0; y < 90; y++)
				{
					firstDist[x + y + 1] += chance * dataChanceCharArray[y];
				}
			}
			firstDist[x] += chance;
		}
	}

	// Do pulls for weapon copies.
	let firstDistWeapon = null;
	chance = 0.0;
	remaining = 1.0;
	if(args.Target.Weapon > 0)
	{
		let firstDist = firstDistWeapon = new Array(231 // "77 * 3 = 231". 231 is the default maximum.
			- args.Pity.Weapon                          // Subtract the pity.
			- args.EpitomizedPath * 77);                // Subtract some number based on the status of the epitomized path.
		for(let x = 0; x < firstDist.length; x++)
		{
			firstDist[x] = 0.0;
		}

		// Get an array for the first five-star to occur.
		let wepFirstSSRArray = new Array(Math.min(args.Pulls, 77 - args.Pity.Weapon));
		for(let x = 0; x < wepFirstSSRArray.length; x++)
		{
			chance = 0.007;
			let pity = args.Pity.Weapon + x;
			if(pity > 61)
			{
				// 61 is the 62nd pull, so after that is the 63rd pull, where pity is active according to a source.
				chance = Math.min(1.0, 0.07 * (pity - 61) + 0.007);
			}
			wepFirstSSRArray[x] = chance * remaining;
			remaining -= wepFirstSSRArray[x];
		}

		// Get an array for the second five-star to occur (if needed).
		let wepSecondSSRArray = null;
		if(args.EpitomizedPath < 2 && args.Pulls > 1)
		{
			let pullsForThis = Math.min(77, args.Pulls - 1);
			wepSecondSSRArray = new Array(pullsForThis + wepFirstSSRArray.length);
			for(let x = 0; x < wepSecondSSRArray.length; x++)
				wepSecondSSRArray[x] = 0.0;
			for(let x = 0; x < wepFirstSSRArray.length; x++)
				for(let y = 0; y < pullsForThis; y++)
					wepSecondSSRArray[x + y + 1] += wepFirstSSRArray[x] * dataChanceWeapArray[y];
		}
		
		// Get an array for the third five-star to occur (if needed).
		let wepThirdSSRArray = null;
		if(args.EpitomizedPath < 1 && args.Pulls > 2)
		{
			let pullsForThis = Math.min(77, args.Pulls - 2);
			wepThirdSSRArray = new Array(pullsForThis + wepSecondSSRArray.length);
			for(let x = 0; x < wepThirdSSRArray.length; x++)
				wepThirdSSRArray[x] = 0.0;
			for(let x = 0; x < wepSecondSSRArray.length; x++)
				for(let y = 0; y < pullsForThis; y++)
					wepThirdSSRArray[x + y + 1] += wepSecondSSRArray[x] * dataChanceWeapArray[y];
		}

		// Start adding the necessary arrays together.
		for(let x = 0; x < firstDist.length; x++)
		{
			// Add the chance for the first SSR to be the specific five-star weapon.
			let sum = new Array(3);
			if(x < wepFirstSSRArray.length)
			{
				firstDist[x] += wepFirstSSRArray[x] * (args.EpitomizedPath == 2 ? 1.0 : (args.Guarantee.Weapon == true ? 0.5 : 0.375));
			}
			if(wepSecondSSRArray != null && x < wepSecondSSRArray.length)
			{
				// Add the chance for the second SSR to be the specific five-star weapon.
				// For that to happen, the first must not be the specific five-star weapon.
				// Variation A: First has the guarantee, but fails the fifty-fifty.
				// Variation B: First does not have the guarantee, but...
				// Variation BA: First fails the 50/50.
				// Variation BB: First fails to be a featured weapon.
				// "0.5 * 0.375" describes Variation A.
				// "0.625 * (0.6 * 0.375 + 0.4 * 0.5)" describes Variation B.
				firstDist[x] += wepSecondSSRArray[x] * (args.EpitomizedPath == 1 ? (args.Guarantee.Weapon == true ? 0.5 : 0.625) : (args.Guarantee.Weapon == true ? 0.1875 : 0.265625));
			}
			if(wepThirdSSRArray != null && x < wepThirdSSRArray.length)
			{
				// Add the chance for the third SSR to be the specific five-star weapon.
				// For that to happen, the first must not be the specific five-star weapon,
				// and the second must not be the specific five-star weapon.
				// Variation A: First has the guarantee, but fails the fifty-fifty, and then second fails. 
				// Variation B: First does not have the guarantee, but...
				// Variation BA: First fails the 50/50, and then second fails.
				// Variation BB: First fails to be a featured weapon, and then second fails.
				// "0.5 * 0.625" describes Variation A.
				// "0.625 * (0.6 * 0.625 + 0.4 * 0.5)" describes Variation B.
				firstDist[x] += wepThirdSSRArray[x] * (args.Guarantee.Weapon == true ? 0.3125 : 0.359375);
			}
		}
	}

	// The resulting array.
	result.Result = 0.0;
	let resultArray = firstDistCharacter;
	if(firstDistCharacter == null)
	{
		// If the first character copy distribution array is null, then try to switch the result array to the weapon.
		if(firstDistWeapon == null)
		{
			// If the first weapon copy distribution array is also null, then alert and return.
			result.Invalidation = "Nothing computed. No target set?";
			return result;
		}

		// Get the chance for a success at the weapon's refinement rank.
		resultArray = firstDistWeapon;
		let indexRank = args.Target.Weapon - 2;
		for(let x = 0; x < args.Pulls && x < resultArray.length; x++)
		{
			let indexPulls = Math.min((args.Target.Weapon - 1) * 231, args.Pulls - x - 1);
			if(args.Target.Weapon > 1)
			{
				resultArray[x] *= dataChanceWeapFullArray[indexPulls][indexRank];
			}
			result.Result += resultArray[x];
		}
	}
	else if(firstDistWeapon != null)
	{
		// If the first character copy distribution array and the first weapon copy distribution array are both not null,
		// - calculate for a success at both.
		resultArray = new Array(args.Pulls);
		for(let x = 0; x < resultArray.length; x++) resultArray[x] = 0;
		for(let x = 0; x < args.Pulls && x < firstDistCharacter.length; x++)
			for(let y = 0; x + y + 1 < args.Pulls && y < firstDistWeapon.length; y++)
				resultArray[x + y + 1] += firstDistCharacter[x] * firstDistWeapon[y];

		// Get an index in the array (pre-calculated data set) for the character and/or weapon.
		// For the structure, the target number of character/weapon is subtracted by two as
		// (1) the first copy is already calculated, and
		// (2) array indexing is zero-based.
		// For the combined (both character and weapon) index, the character index is multiplied by 4,
		// to skip the five weapon indexes for the prior character index when the target weapon index is added.
		let indexRankCharacter = (args.Target.Character - 2);
		let indexRankWeapon    = (args.Target.Weapon    - 2);
		let indexRank          = indexRankCharacter * 4 + indexRankWeapon;

		let maxIndexCharacterPulls = (args.Target.Character - 1) * 180;
		let maxIndexWeaponPulls    = (args.Target.Weapon - 1) * 231;
		let maxIndexPulls          = Math.max(0, maxIndexCharacterPulls) + Math.max(0, maxIndexWeaponPulls);

		for(let x = 0; x < args.Pulls; x++)
		{
			let indexPulls = Math.min(maxIndexPulls, args.Pulls - x - 1);
			if(args.Target.Character > 1)
			{
				if(args.Target.Weapon > 1)
					resultArray[x] *= dataCombinedArray[indexPulls][indexRank];
				else
					resultArray[x] *= dataChanceCharFullArray[indexPulls][indexRankCharacter];
			}
			else if(args.Target.Weapon > 1)
				resultArray[x] *= dataChanceWeapFullArray[indexPulls][indexRankWeapon];
			result.Result += resultArray[x];
		}
	}
	else for(let x = 0; x < args.Pulls && x < resultArray.length; x++)
	{
		let indexRank = args.Target.Character - 2;
		let indexPulls = Math.min((args.Target.Character - 1) * 180, args.Pulls - x - 1);
		if(args.Target.Character > 1)
			resultArray[x] *= dataChanceCharFullArray[indexPulls][indexRank];
		result.Result += resultArray[x];
	}

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
		description = "Currently on the character banner, "
		+ result.Args.Pity.Character
		+ " pity for the next five star, and "
		+ (result.Args.Guarantee.Character ? "is" : "is not")
		+ " guaranteed the 50/50. ";
	}
	if(result.Args.Target.Weapon > 0)
	{
		if(result.Args.Target.Character < 1)
		{
			description = "";
		}
		description += "Currently on the weapon banner, "
		+ result.Args.Pity.Weapon + " pity, "
		+"\""
		+ (result.Args.EpitomizedPath == 0 ? "0/2" : (result.Args.EpitomizedPath == 1 ? "1/2" : "2/2"))
		+ "\" on the epitomized path"
		+ (result.Args.EpitomizedPath == 2 ? ". " : ", and there " + (result.Args.Guarantee.Weapon == true ? "is a" : "is no" ) + " guarantee for a featured weapon. ");
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