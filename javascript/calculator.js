// This code was made based on information from the following:
// - https://www.hoyolab.com/article/497840
// - https://genshin-impact.fandom.com/wiki/Wishes


// NOTES:
// [1] You can observe that there's some code just to handle validation of arguments passed into the functions.
//     Normally, these argument validations may be unnecessary, but there was a push towards providing some ease in using this independently,
//     such as just calling the functions through the browser console instead of through the user interface.

WishCalc.Direct = { };



WishCalc.Direct.GetSpecificChance = function(targetCon, targetRef, targetPull)
{
	if(targetPull < 1) return 0;
	if(targetCons > 0 && targetRefs > 0)
		return WishCalc.Data.PairDistribution[targetCon][targetRef][targetPull];
	if(targetCons > 0) return WishCalc.Data.CharacterDistribution[targetCon];
	if(targetRefs > 0) return WishCalc.Data.WeaponDistribution[targetPull];
}

WishCalc.GetSpecificChance = function(args)
{
	let targetCons = 0;
	let targetRefs = 0;
	let targetPull = 0;
	let vArgs = {};
	
	// Validating arguments.
	if(args && WishCalc.Utilities.IsObject(args) && args.BypassArgumentsValidation !== true)
	{
		vArgs = {
			Target: {
				Character: 0,
				Weapon:    0,
				Pull:      0
			}
		}
		WishCalc.Utilities.ValidateArguments(args, vArgs);
		targetCons = vArgs.Target.Character;
		targetRefs = vArgs.Target.Weapon;
		targetPull = vArgs.Target.Pull - 1;
	}
	else
	{
		targetCons = args.Target.Character;
		targetRefs = args.Target.Weapon;
		targetPull = args.Target.Pull - 1;
	}

	return WishCalc.Direct.GetSpecificChance(targetCons, targetRefs, targetPull);
}



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

	input.Pulls = Math.floor(input.Pulls.Primogems / 160) + Math.floor(input.Pulls.IntertwinedFates) + Math.floor(input.Pulls.Starglitter / 5);
	input.Pulls = Math.min(args.Target.Character * 180 + args.Target.Weapon * 154, Math.max(0, input.Pulls));

    return input;
}



// Function for getting the average (mean) pulls to get targets.
WishCalc.GetAverageByMean = function(args)
{
	let input = {
		Target: {
			Character: 0,
			Weapon:    0,
		}
	};

	WishCalc.Utilities.ValidateArguments(args, input);
	let targetCons = input.Target.Weapon;
	let targetRefs = input.Target.Weapon;

	let dataSource = null;
	if(targetCons > 0 && targetRefs > 0) dataSource = WishCalc.Data.PairDistribution[targetCons][targetRefs];
	else if(targetCons > 0)              dataSource = WishCalc.Data.CharacterDistribution[targetCons][targetRefs];
	else if(targetRefs > 0)              dataSource = WishCalc.Data.WeaponDistribution[targetCons][targetRefs];
	
	let sum = 0.0;
	if(dataSource instanceof Array) for(let pullNumber = 0; pullNumber < dataSource.length; pullNumber++)
	{
		sum += pullNumber * dataSource[pullNumber];
	}

	input.Result = sum;
	return input;
}

WishCalc.GetFirstDistribution = function(args)
{
	let result = {};

	let vArgs = WishCalc.Utilities.ValidateArguments(args, {
		Target:    { Character: 0,     Weapon: 0 },
		Pity:      { Character: 0,     Weapon: 0 },
		Guarantee: { Character: false, Weapon: false },
		Pulls:          0,
		EpitomizedPath: 0
	});

	// Do pulls for character copies.
	let chance    = 0.0;
	let remaining = 1.0;
	if(vArgs.Target.Character > 0)
	{
		// Aliases.
		let baseDistribution = WishCalc.Data.CharacterBaseDistribution;
		let firstDistribution = result.Character = new Array(180 - vArgs.Pity.Character - (vArgs.Guarantee.Character == true ? 90 : 0));

		for(let x = 0; x < firstDistribution.length; x++) { firstDistribution[x] = 0.0; }
		for(let x = 0; x < 90 - vArgs.Pity.Character; x++)
		{
			chance = 0.006;
			let pity = vArgs.Pity.Character + x;
			if(pity > 72)
			{
				// Soft pity's effect supposedly starts on the 74th pull.
				// For zero-based counting, the 74th pull is 73, and that is after 72.
				chance = Math.min(1.0, 0.06 * (pity - 72) + 0.006);
			}

			// Get the chance for this pull to get the character, and subtract those who won.
			chance *= remaining; remaining -= chance;
			if(vArgs.Guarantee.Character == false)
			{
				// When there is no guarantee, consider the chance of how the first or second can be the target.
				// At first, there was a 50% chance for the first 5-star to be the target rate-up character.
				// By Genshin 5.0, there is a consolidated chance of 55% for the first to be the target.
				// A cause for that consolidated chance was described as the 50/50 loss having a chance at still winning.
				// Just using the consolidated chance directly for ease for now.
				let firstWinRate = 0.55;
				for(let y = 0; y < 90; y++)
					firstDistribution[x + y + 1] += (1.0 - firstWinRate) * chance * baseDistribution[y];
				chance *= firstWinRate;
			}
			firstDistribution[x] += chance;
		}
	}

	// Do pulls for weapon copies.
	chance = 0.0;
	remaining = 1.0;
	if(vArgs.Target.Weapon > 0)
	{
		let baseDistribution = WishCalc.Data.WeaponBaseDistribution;

		// With how the pity works, the weapon banner caps out at 77 pulls for a 5-star.
		// There is therefore a maximum of (77 * 2 or) 154 pulls to consider.
		let firstDistribution = result.Weapon = new Array(154 - vArgs.Pity.Weapon - vArgs.EpitomizedPath * 77);
		for(let x = 0; x < firstDistribution.length; x++) firstDistribution[x] = 0.0;

		// Get an array for the first five-star to occur.
		let wepFirstSSRArray = new Array(Math.min(vArgs.Pulls, 77 - vArgs.Pity.Weapon));
		for(let x = 0; x < wepFirstSSRArray.length; x++)
		{
			chance = 0.007;
			let pity = vArgs.Pity.Weapon + x;
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
		if(vArgs.EpitomizedPath < 1 && vArgs.Pulls > 1)
		{
			let pullsForThis = Math.min(77, vArgs.Pulls - 1);

			wepSecondSSRArray = new Array(pullsForThis + wepFirstSSRArray.length);
			for(let x = 0; x < wepSecondSSRArray.length; x++) wepSecondSSRArray[x] = 0.0;

			for(let x = 0; x < wepFirstSSRArray.length; x++)
				for(let y = 0; y < pullsForThis; y++)
					wepSecondSSRArray[x + y + 1] += wepFirstSSRArray[x] * baseDistribution[y];
		}

		// Start adding the necessary arrays together.
		for(let x = 0; x < firstDistribution.length; x++)
		{
			if(x < wepFirstSSRArray.length)
			{
				// Add the chance for the first 5-star to be the specific 5-star weapon.
				firstDistribution[x] += wepFirstSSRArray[x] * (vArgs.EpitomizedPath == 1 ? 1.0 : (vArgs.Guarantee.Weapon == true ? 0.5 : 0.375));
			}
			if(wepSecondSSRArray != null && x < wepSecondSSRArray.length)
			{
				// Add the chance for the second SSR to be the specific five-star weapon.
				// For that to happen, the first must not be the specific five-star weapon.
				firstDistribution[x] += wepSecondSSRArray[x] * (vArgs.Guarantee.Weapon == true ? 0.5 : 0.625);
			}
		}
	}

	return result;
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
	
	let firstDistribution = WishCalc.GetFirstDistribution(args);

	// The resulting array.
	result.Result = 0.0;
	let resultArray = firstDistribution.Character;
	if(firstDistribution.Character == null)
	{
		// If the first character copy distribution array is null, then try to switch the result array to the weapon.
		if(firstDistribution.Weapon == null)
		{
			// If the first weapon copy distribution array is also null, then alert and return.
			result.Invalidation = "Nothing computed. No target set?";
			return result;
		}
		
		// Prepare to get more copies when necessary.
		let moreIndexRank = args.Target.Weapon - 2;
		let maxIndexPull = 154 * (args.Target.Weapon - 1);
		
		// Get the chance for a success at the weapon's refinement rank.
		resultArray = firstDistribution.Weapon;
		for(let x = 0; x < args.Pulls && x < resultArray.length; x++)
		{
			if(args.Target.Weapon > 1)
			{
				// Combine with chance of more copies, by getting the cumulative chance for the remaining copies with the remaining pulls when the first copy happens at this pull.
				// A subtraction of two while getting the first copy has already spent one pull, and will be accessing via zero-based counting.
				let indexPull = Math.min(maxIndexPull - 1, args.Pulls - x - 2);
				if(indexPull < 0) resultArray[x] *= 0.0;
				else resultArray[x] *= WishCalc.Data.WeaponAccumulation[moreIndexRank][indexPull];
			}
			result.Result += resultArray[x];
		}
	}
	else if(firstDistribution.Weapon != null)
	{
		// If the first character copy distribution array and the first weapon copy distribution array are both not null, calculate for a success at both.
		resultArray = new Array(args.Pulls);
		for(let x = 0; x < resultArray.length; x++) resultArray[x] = 0;
		for(let x = 0; x < args.Pulls && x < firstDistribution.Character.length; x++)
			for(let y = 0; x + y + 1 < args.Pulls && y < firstDistribution.Weapon.length; y++)
				resultArray[x + y + 1] += firstDistribution.Character[x] * firstDistribution.Weapon[y];

		// Prepare to calculate for more copies.
		// Get an index in the pre-calculated data set for the character and/or weapon.
		// For the structure, the target number of character/weapon is subtracted by two as
		// (1) the first copy is already calculated, and
		// (2) array indexing is zero-based.
		let indexRankCharacter = (args.Target.Character - 2);
		let indexRankWeapon    = (args.Target.Weapon    - 2);

		let maxIndexCharacterPull = (args.Target.Character - 1) * 180;
		let maxIndexWeaponPull    = (args.Target.Weapon    - 1) * 154;

		for(let x = 0; x < args.Pulls; x++)
		{
			if(args.Target.Character > 1)
			{
				if(args.Target.Weapon > 1)
				{
					let indexPull = Math.min(maxIndexCharacterPull + maxIndexWeaponPull - 1, args.Pulls - x - 2);
					if(indexPull < 0) resultArray[x] *= 0.0;
					else resultArray[x] *= WishCalc.Data.PairAccumulation[indexRankCharacter][indexRankWeapon][indexPull];
				}
				else
				{
					let indexPull = Math.min(maxIndexCharacterPull - 1, args.Pulls - x - 2);
					if(indexPull < 0) resultArray[x] *= 0.0;
					else resultArray[x] *= WishCalc.Data.CharacterAccumulation[indexRankCharacter][indexPull];
				}
			}
			else if(args.Target.Weapon > 1)
			{
				let indexPull = Math.min(maxIndexWeaponPull - 1, args.Pulls - x - 2);
				if(indexPull < 0) resultArray[x] *= 0.0;
				else resultArray[x] *= WishCalc.Data.WeaponAccumulation[indexRankWeapon][indexPull];
			}
			result.Result += resultArray[x];
		}
	}
	else
	{
		let indexRank = args.Target.Character - 2;
		for(let x = 0; x < args.Pulls && x < resultArray.length; x++)
		{
			if(args.Target.Character > 1)
			{
				let indexPull = Math.min((args.Target.Character - 1) * 180 - 1, args.Pulls - x - 2);
				if(indexPull < 0) resultArray[x] *= 0.0;
				else resultArray[x] *= WishCalc.Data.CharacterAccumulation[indexRank][indexPull];
			}
			result.Result += resultArray[x];
		}
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
		+ (result.Args.EpitomizedPath == 1 ? "1/1" : "0/1")
		+ "\" on the epitomized path"
		+ (result.Args.EpitomizedPath == 1 ? ". " : (", and there " + (result.Args.Guarantee.Weapon == true ? "is a" : "is no" ) + " guarantee for a featured weapon. "));
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