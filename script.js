// This code was made based on information from the following:
// - https://www.hoyolab.com/article/497840
// - https://genshin-impact.fandom.com/wiki/Wishes

var initialized = false; // Variable for knowing if data has been initialized.
var resultClean = true;  // Variable for knowing if the result area is clean.

// Generic function for cleaning the results area.
function DoCleanResults()
{
	if(resultClean == false)
	{
		document.getElementById('result').innerHTML = "results will be displayed here";
		document.getElementById('result_OddsSuccess').style.display = "none";
		document.getElementById('result_OddsFailure').style.display = "none";
		document.getElementById('result_Description').style.display = "none";
		resultClean = true;
	}
}

// Generic function to handle changes to the input.
function genericOnChange()
{
	DoCleanResults();
}

// Generic function for enforcing that a numerical input is neither too low or too large.
function genericNumCheck(theObject, maxNumberType)
{	
	if(theObject.value != null && theObject.value != "")
	{
		if(theObject.value.length > 9)
		{
			theObject.value = "999999999";
		}

		var objValueAsNum = parseInt(theObject.value);
		if(theObject.value[0] = '0')
		{
			theObject.value = String(objValueAsNum);
		}
	}
	else
	{
		theObject.value = "0";
	}

	if(maxNumberType == 0)
	{
		// Do nothing.
	}
	else if(maxNumberType == 1)
	{
		// Character pity.
		if(parseInt(theObject.value) > 89)
		{
			theObject.value = "89";
		}
	}
	else if(maxNumberType == 2)
	{
		// Weapon pity.
		if(parseInt(theObject.value) > 76)
		{
			theObject.value = "76";
		}
	}
	else if(maxNumberType == 3)
	{
		// Pulls to do.
		if(parseInt(theObject.value) < 1)
		{
			theObject.value = "1";
		}
	}

	genericOnChange();
}

// Function for checking and correcting the inputs for five-star copies.
function UpdateLevels(x)
{
	if(x == 1 || x == 3)
	{
		// Update for the target number of character copies.
		let selBgnConLevel = document.getElementById("select_beginConLevel");
		let selTarConLevel = document.getElementById("select_targetConLevel");
		if(x == 1)
		{
			selTarConLevel.selectedIndex = Math.max(
				selBgnConLevel.selectedIndex,
				selTarConLevel.selectedIndex);
		}
		else if(x == 3)
		{
			selBgnConLevel.selectedIndex = Math.min(
				selBgnConLevel.selectedIndex,
				selTarConLevel.selectedIndex);
		}
		
	}
	else if(x == 2 || x == 4)
	{
		// Update for the target number of weapon copies.
		let selBgnRefLevel = document.getElementById("select_beginRefLevel");
		let selTarRefLevel = document.getElementById("select_targetRefLevel");
		if(x == 2)
		{
			selTarRefLevel.selectedIndex = Math.max(
				selBgnRefLevel.selectedIndex,
				selTarRefLevel.selectedIndex);
		}
		else if(x == 4)
		{
			selBgnRefLevel.selectedIndex = Math.min(
				selBgnRefLevel.selectedIndex,
				selTarRefLevel.selectedIndex);
		}
	}

	genericOnChange();
}

// Function to call on the loading of the website or at the very start of use.
function Initialize()
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
	
	initialized = true;
	document.getElementById("theButton").value = "Calculate";
}

// Function for getting the probability.
function Calculate()
{
	if(initialized == false)
	{
		Initialize();
	}

	// Determine what the inputs are.
	let inputCharPity = Math.min(89,Math.max(0,parseInt(document.getElementById('tBox_CharPullsDone').value)));
	let inputWeapPity = Math.min(76,Math.max(0,parseInt(document.getElementById('tBox_WeapPullsDone').value)));
	let inputCharGuaranteed = (Number(document.getElementById('select_CharGuaranteed').value) != 0);
	let inputWeapFiftyFifty = (Number(document.getElementById('select_WeapFiftyFifty').value) != 0);
	let inputWeapEpitomPath = Number(document.getElementById('select_EpitomPath').value);

	// Determine the target number of copies.
	let selBgnConLevel = document.getElementById("select_beginConLevel");
	let selTarConLevel = document.getElementById("select_targetConLevel");
	let selBgnRefLevel = document.getElementById("select_beginRefLevel");
	let selTarRefLevel = document.getElementById("select_targetRefLevel");
	let inputTargetCharCopies = Number(selTarConLevel.value) - Number(selBgnConLevel.value);
	let inputTargetWeapCopies = Number(selTarRefLevel.value) - Number(selBgnRefLevel.value);

	// Determine the maximum pulls needed and the pulls to do for the target character and/or weapon copies.
	let textBoxForPullsToDo = document.getElementById("tBox_PullsToDo");
	let maxPullsToDo = inputTargetCharCopies * 180 + inputTargetWeapCopies * 231;
	let inputPullsToDo = Math.min(maxPullsToDo,Math.max(0,parseInt(textBoxForPullsToDo.value)));

	let elemResult = document.getElementById('result');

	// Do checks if the inputs are right, and output something.
	if(inputPullsToDo < inputTargetCharCopies + inputTargetWeapCopies)
	{
		elemResult.innerHTML = inputPullsToDo + " pull"+(inputPullsToDo == 1 ? "" : "s")+" for "
			+ String(inputTargetCharCopies + inputTargetWeapCopies) + " items is not enough.";
		return;
	}
	else if(inputTargetWeapCopies + inputTargetCharCopies < 1)
	{
		elemResult.innerHTML = "Nothing to look for.";
		return;
	}
	else if(inputPullsToDo < 1)
	{
		elemResult.innerHTML = "Less than one pull to do?";
		return;
	}

	// Do pulls for character copies.
	let arrFirstCharCopyDist = null; // Array for the distribution for the first copy of a specific featured five-star character.
	let chance = 0.0;
	let remaining = 1.0;
	if(inputTargetCharCopies > 0)
	{
		arrFirstCharCopyDist = new Array(180       // 180 pulls is the default maximum.
			- inputCharPity                          // Subtract the pity.
			- (inputCharGuaranteed == true ? 90 : 0) // Subtract some number if it's guaranteed.
		);
		for(let x = 0; x < arrFirstCharCopyDist.length; x++)
		{
			arrFirstCharCopyDist[x] = 0;
		}
		for(let x = 0; x < 90 - inputCharPity; x++)
		{
			chance = 0.006;
			var pity = inputCharPity + x;
			if(pity > 72)
			{
				// According to a source of information, soft pity's effect starts on pull number 74.
				// For zero-based counting, the 74th pull is 73, and that is after 72.
				chance = Math.min(1.0, 0.06 * (pity - 72) + 0.006);
			}
			chance *= remaining;
			remaining -= chance;
			if(inputCharGuaranteed == false)
			{
				chance *= 0.5;
				for(let y = 0; y < 90; y++)
				{
					arrFirstCharCopyDist[x + y + 1] += chance * dataChanceCharArray[y];
				}
			}
			arrFirstCharCopyDist[x] += chance;
		}
	}

	// Do pulls for weapon copies.
	let arrFirstWeapCopyDist = null;
	chance = 0.0;
	remaining = 1.0;
	if(inputTargetWeapCopies > 0)
	{
		arrFirstWeapCopyDist = new Array(231 // "77 * 3 = 231". 231 is the default maximum.
			- inputWeapPity                    // Subtract the pity.
			- inputWeapEpitomPath * 77);       // Subtract some number based on the status of the epitomized path.
		for(let x = 0; x < arrFirstWeapCopyDist.length; x++)
		{
			arrFirstWeapCopyDist[x] = 0.0;
		}

		// Get an array for the first five-star to occur.
		let wepFirstSSRArray = new Array(Math.min(inputPullsToDo, 77 - inputWeapPity));
		for(let x = 0; x < wepFirstSSRArray.length; x++)
		{
			chance = 0.007;
			let pity = inputWeapPity + x;
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
		if(inputWeapEpitomPath < 2 && inputPullsToDo > 1)
		{
			let pullsForThis = Math.min(77, inputPullsToDo - 1);
			wepSecondSSRArray = new Array(pullsForThis + wepFirstSSRArray.length);
			for(let x = 0; x < wepSecondSSRArray.length; x++)
			{
				wepSecondSSRArray[x] = 0.0;
			}
			for(let x = 0; x < wepFirstSSRArray.length; x++)
			{
				for(let y = 0; y < pullsForThis; y++)
				{
					wepSecondSSRArray[x + y + 1] += wepFirstSSRArray[x] * dataChanceWeapArray[y];
				}
			}
		}
		
		// Get an array for the third five-star to occur (if needed).
		let wepThirdSSRArray = null;
		if(inputWeapEpitomPath < 1 && inputPullsToDo > 2)
		{
			let pullsForThis = Math.min(77, inputPullsToDo - 2);
			wepThirdSSRArray = new Array(pullsForThis + wepSecondSSRArray.length);
			for(let x = 0; x < wepThirdSSRArray.length; x++)
			{
				wepThirdSSRArray[x] = 0.0;
			}
			for(let x = 0; x < wepSecondSSRArray.length; x++)
			{
				for(let y = 0; y < pullsForThis; y++)
				{
					wepThirdSSRArray[x + y + 1] += wepSecondSSRArray[x] * dataChanceWeapArray[y];
				}
			}
		}

		// Start adding the necessary arrays together.
		for(let x = 0; x < arrFirstWeapCopyDist.length; x++)
		{
			// Add the chance for the first SSR to be the specific five-star weapon.
			let sum = new Array(3);
			if(x < wepFirstSSRArray.length)
			{
				arrFirstWeapCopyDist[x] += wepFirstSSRArray[x] * (inputWeapEpitomPath == 2 ? 1.0 : (inputWeapFiftyFifty == true ? 0.5 : 0.375));
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
				arrFirstWeapCopyDist[x] += wepSecondSSRArray[x] * (inputWeapEpitomPath == 1 ? (inputWeapFiftyFifty == true ? 0.5 : 0.625) : (inputWeapFiftyFifty == true ? 0.1875 : 0.265625));
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
				arrFirstWeapCopyDist[x] += wepThirdSSRArray[x] * (inputWeapFiftyFifty == true ? 0.3125 : 0.359375);
			}
		}
	}

	// Output the result.
	let result = 0.0;
	let resultArray = arrFirstCharCopyDist;
	if(arrFirstCharCopyDist == null)
	{
		// If the first character copy distribution array is null, then try to switch the result array to the weapon.
		if(arrFirstWeapCopyDist == null)
		{
			// If the first weapon copy distribution array is also null, then alert and return.
			alert("Nothing computed. No target set?");
			return;
		}

		// Get the chance for a success at the weapon's refinement rank.
		resultArray = arrFirstWeapCopyDist;
		for(let x = 0; x < inputPullsToDo &&  x < resultArray.length; x++)
		{
			if(inputTargetWeapCopies > 1)
			{
				resultArray[x] *= dataChanceWeapFullArray[Math.min((inputTargetWeapCopies - 1) * 231, inputPullsToDo - x - 1)][inputTargetWeapCopies - 2];
			}
			result += resultArray[x];
		}
	}
	else if(arrFirstWeapCopyDist != null)
	{
		// If the first character copy distribution array and the first weapon copy distribution array are both not null,
		// - calculate for a success at both.
		resultArray = new Array(inputPullsToDo);
		for(let x = 0; x < resultArray.length; x++)
		{
			resultArray[x] = 0;
		}
		for(let x = 0; x < inputPullsToDo && x < arrFirstCharCopyDist.length; x++)
		{
			for(let y = 0; x + y + 1 < inputPullsToDo && y < arrFirstWeapCopyDist.length; y++)
			{
				resultArray[x + y + 1] += arrFirstCharCopyDist[x] * arrFirstWeapCopyDist[y];
			}
		}

		let pullsForMoreCharCopies = (inputTargetCharCopies - 1) * 180;
		let pullsForMoreWeapCopies = (inputTargetWeapCopies - 1) * 231;
		let targetPos = (inputTargetCharCopies - 2) * 4 + Number(inputTargetWeapCopies - 2);
		let maxPullsForMoreCopies = Math.max(0, pullsForMoreCharCopies) + Math.max(0, pullsForMoreWeapCopies);
		for(let x = 0; x < inputPullsToDo; x++)
		{
			if(inputTargetCharCopies > 1)
			{
				if(inputTargetWeapCopies > 1)
				{
					resultArray[x] *= dataCombinedArray[Math.min(maxPullsForMoreCopies, inputPullsToDo - x - 1)][targetPos];
				}
				else
				{
					resultArray[x] *= dataChanceCharFullArray[Math.min(maxPullsForMoreCopies, inputPullsToDo - x - 1)][inputTargetCharCopies - 2];
				}
			}
			else if(inputTargetWeapCopies > 1)
			{
				resultArray[x] *= dataChanceWeapFullArray[Math.min(maxPullsForMoreCopies, inputPullsToDo - x - 1)][inputTargetWeapCopies - 2];
			}
			result += resultArray[x];
		}
	}
	else
	{
		for(let x = 0; x < inputPullsToDo && x < resultArray.length; x++)
		{
			if(inputTargetCharCopies > 1)
			{
				resultArray[x] *= dataChanceCharFullArray[Math.min((inputTargetCharCopies - 1) * 180, inputPullsToDo - x - 1)][inputTargetCharCopies - 2];
			}
			result += resultArray[x];
		}
	}
	
	let roundedResult = DoRound(result, 12); // 12 digits seem to be most stable enough.
	let resultString = '~' + String(DoRound(roundedResult * 100, 4))+ "%";
	elemResult.innerHTML = "result: &quot;"+resultString+"&quot;";
	let outTextSuccessObj = document.getElementById('result_OddsSuccess');
	let outTextFailureObj = document.getElementById('result_OddsFailure');
	let outTextDescripObj = document.getElementById('result_Description');
	outTextSuccessObj.innerHTML = "odds for success: "+((roundedResult == 0 || roundedResult >= 0.5) ? "-" : "1 in ~" + addCommas(String(Math.round(1 / roundedResult))));
	outTextFailureObj.innerHTML = "odds for failure: "+((roundedResult == 1 || (1 - roundedResult) >= 0.5) ? "-" : "1 in ~" + addCommas(Math.round(1 / (1 - roundedResult))));

	let description = "";
	// "On the character banner, currently x pity, y guaranteed. On the weapon banner, currently x1 on the epitome path and y1 guaranteed to be a featured weapon."
	// "x2 single pulls, z chance."
	if(inputTargetCharCopies > 0)
	{
		description = "Currently on the character banner, "
		+ inputCharPity
		+ " pity for the next five star, and "
		+ (inputCharGuaranteed == true ? "is" : "is not")
		+ " guaranteed the 50/50. ";
	}
	if(inputTargetWeapCopies > 0)
	{
		if(inputTargetCharCopies < 1)
		{
			description = "";
		}
		description += "Currently on the weapon banner, "
		+ inputWeapPity + " pity, "
		+"&quot;"
		+ (inputWeapEpitomPath == 0 ? "0/2" : (inputWeapEpitomPath == 1 ? "1/2" : "2/2"))
		+ "&quot; on the epitomized path"
		+ (inputWeapEpitomPath == 2 ? ". " : ", and there "+(inputWeapFiftyFifty == true ? "is an" : "is no")+" immediate guarantee for a featured weapon. ");
	}
	description += inputPullsToDo + " single pull" + (inputPullsToDo == 1 ? " has" : "s have") + " a &quot;" + resultString + "&quot; chance for success at ";
	if(inputTargetCharCopies > 0)
	{
		description += String(inputTargetCharCopies) + " specific featured five-star character"
			+ (inputTargetCharCopies == 1 ? "" : "s");
		if(inputTargetWeapCopies > 0)
		{
			description += ", and ";
		}
		else
		{
			description += ".";
		}
	}
	if(inputTargetWeapCopies > 0)
	{
		description += String(inputTargetWeapCopies)
			+ " specific featured five-star weapon"
			+ (inputTargetWeapCopies == 1 ? "":"s")
			+ ".";
	}
	outTextDescripObj.innerHTML = "Description: " + description;

	if(resultClean == true)
	{
		outTextSuccessObj.style.display = "block";
		outTextFailureObj.style.display = "block";
		outTextDescripObj.style.display = "block";

		resultClean = false;
	}
}
