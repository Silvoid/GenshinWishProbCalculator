// Things unoptimized:
// (1) Calculating beyond what gets used.
// 

var initialized = false;
var resultClean = true;

var targetCon = Number(0); // C0 is 0. C6 is 6.
var targetRef = Number(1); // R1 is 1. R5 is 5.
var inputPullsToDo = Number(1);
var maxPullsToDo = Number(420);

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

function genericOnChange()
{
	DoCleanResults();
}

function Initialize()
{
	// Attempt to smooth the provided data for base character distribution.
	var sum = 0.0;
	for(let x = 0; x < dataChanceCharArray.length; x++)
	{
		sum += dataChanceCharArray[x];
	}
	for(let x = 0; x < dataChanceCharArray.length; x++)
	{
		dataChanceCharArray[x] /= sum;
	}

	// Attempt to smooth the provided data for base weapon distribution.
	
	for(let i = 0; i < 10; i++)
	{
		var sum = 0.0;
		for(let x = 0; x < dataChanceWeapArray.length; x++)
		{
			sum += dataChanceWeapArray[x];
		}
		for(let x = 0; x < dataChanceWeapArray.length; x++)
		{
			dataChanceWeapArray[x] /= sum;
		}
		dataChanceWeapArray
	}

	initialized = true;
	document.getElementById("theButton").value = "Calculate";
}

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

function UpdateLevels(x)
{
	if(x == 1 || x == 3)
	{
		var selBgnConLevel = document.getElementById("select_beginConLevel");
		var selTarConLevel = document.getElementById("select_targetConLevel");
		if(x == 1)
		{
			if(selTarConLevel.selectedIndex <= selBgnConLevel.selectedIndex)
			{
				if(selTarConLevel.selectedIndex < 7)
				{
					selTarConLevel.selectedIndex = Math.min(7,selBgnConLevel.selectedIndex + 1);
				}
				if(selTarConLevel.selectedIndex >= 7)
				{
					selBgnConLevel.selectedIndex = 6;
				}
			}
		}
		else if(x == 3)
		{
			if(selTarConLevel.selectedIndex <= selBgnConLevel.selectedIndex)
			{
				if(selBgnConLevel.selectedIndex != 0)
				{
					selBgnConLevel.selectedIndex = Math.max(0, selTarConLevel.selectedIndex - 1);
				}
			}
		}
		targetCon = Number(selTarConLevel.value) - Number(selBgnConLevel.value) - 1;
	}
	else if(x == 2 || x == 4)
	{
		var selBgnRefLevel = document.getElementById("select_beginRefLevel");
		var selTarRefLevel = document.getElementById("select_targetRefLevel");
		if(x == 2)
		{
			if(selTarRefLevel.selectedIndex <= selBgnRefLevel.selectedIndex)
			{
				if(selTarRefLevel.selectedIndex < 5)
				{
					selTarRefLevel.selectedIndex = Math.min(5,selBgnRefLevel.selectedIndex + 1);
				}
				if(selTarRefLevel.selectedIndex >= 5)
				{
					selBgnRefLevel.selectedIndex = 4;
				}
			}
		}
		else if(x == 4)
		{
			if(selTarRefLevel.selectedIndex <= selBgnRefLevel.selectedIndex)
			{
				if(selBgnRefLevel.selectedIndex != 0)
				{
					selBgnRefLevel.selectedIndex = Math.max(0, selTarRefLevel.selectedIndex - 1);
				}
			}
		}
		targetRef = Number(selTarRefLevel.value) - Number(selBgnRefLevel.value);
	}

	maxPullsToDo = (targetCon + 1) * 180 + (targetRef) * 240;

	genericOnChange();
}

function Calculate()
{
	if(initialized == false)
	{
		Initialize();
	}

	var initCharPity = Math.min(89,Math.max(0,parseInt(document.getElementById('tBox_CharPullsDone').value)));
	var initWeapPity = Math.min(76,Math.max(0,parseInt(document.getElementById('tBox_WeapPullsDone').value)));
	var charGuaranteed = Number(document.getElementById('select_CharGuaranteed').value) != 0;
	var weapFiftyFifty = Number(document.getElementById('select_WeapFiftyFifty').value) != 0;
	var weapEpitomPath = Number(document.getElementById('select_EpitomPath').value);

	var textBoxForPullsToDo = document.getElementById("tBox_PullsToDo");
	maxPullsToDo = (targetCon + 1) * 180 + targetRef * 231;
	//if() TODO: check if textbox is blank.
	inputPullsToDo = Math.min(maxPullsToDo,Math.max(0,parseInt(textBoxForPullsToDo.value)));

	// Do pulls for character.
	var charSuccessArray = null;
	var chance = 0.0;
	var remaining = 1.0;
	if(targetCon >= 0)
	{
		charSuccessArray = new Array(180 - initCharPity - (charGuaranteed == true ? 90 : 0));
		for(let x = 0; x < charSuccessArray.length; x++)
		{
			charSuccessArray[x] = 0;
		}
		for(let x = 0; x < 90 - initCharPity; x++)
		{
			chance = 0.006;
			var pity = x + initCharPity;
			if(pity > 72)
			{
				chance = Math.min(1.0, 0.06 * (pity - 72) + 0.006);
			}
			chance *= remaining;
			remaining -= chance;
			if(charGuaranteed == false)
			{
				chance *= 0.5;
				for(let y = 0; y < 90; y++)
				{
					charSuccessArray[x + y + 1] += chance * dataChanceCharArray[y];
				}
			}
			charSuccessArray[x] += chance;
		}
	}

	// Do pulls for weapon.
	var weapSuccessArray = null;
	chance = 0.0;
	remaining = 1.0;
	if(targetRef > 0)
	{
		weapSuccessArray = new Array(231 - weapEpitomPath * 77);
		for(let x = 0; x < weapSuccessArray.length; x++)
		{
			weapSuccessArray[x] = 0.0;
		}

		// Get an array for the first five-star to occur.
		var firstSSRArray = new Array(77 - initWeapPity);		
		for(let x = 0; x < firstSSRArray.length; x++)
		{
			chance = 0.007;
			var pity = initWeapPity + x;
			if(pity > 61) // 61 is the 62nd pull, so after that is the 73rd pull, where pity is active.
				chance = Math.min(1, 0.07 * (pity - 61) + 0.007);
			firstSSRArray[x] = chance * remaining;
			remaining -= firstSSRArray[x];
		}

		// Get an array for the second five-star to occur (if needed).
		var secondSSRArray = null;
		if(weapEpitomPath < 2)
		{
			secondSSRArray = new Array(77 + firstSSRArray.length);
			for(let x = 0; x < secondSSRArray.length; x++)
			{
				secondSSRArray[x] = 0.0;
			}
			for(let x = 0; x < firstSSRArray.length; x++)
			{
				for(let y = 0; y < 77; y++)
				{
					secondSSRArray[x + y + 1] += firstSSRArray[x] * dataChanceWeapArray[y];
				}
			}
		}

		// Get an array for the third five-star to occur (if needed).
		var thirdSSRArray = null;
		if(weapEpitomPath < 1)
		{
			thirdSSRArray = new Array(77 + secondSSRArray.length);
			for(let x = 0; x < thirdSSRArray.length; x++)
			{
				thirdSSRArray[x] = 0.0;
			}
			for(let x = 0; x < secondSSRArray.length; x++)
			{
				for(let y = 0; y < 77; y++)
				{
					thirdSSRArray[x + y + 1] += secondSSRArray[x] * dataChanceWeapArray[y];
				}
			}
		}

		for(let x = 0; x < weapSuccessArray.length; x++)
		{
			// Add the chance for the first SSR to be the specific five-star weapon.
			if(x < firstSSRArray.length)
			{
				weapSuccessArray[x] += firstSSRArray[x] * (weapEpitomPath == 2 ? 1.0 : (weapFiftyFifty == true ? 0.5 : 0.375));
			}
			if(secondSSRArray != null && x < secondSSRArray.length)
			{
				// Add the chance for the second SSR to be the specific five-star weapon.
				// For that to happen, the first must not be the specific five-star weapon.
				// Variation A: First has the guarantee, but fails the fifty-fifty.
				// Variation B: First does not have the guarantee, but...
				// Variation BA: First fails the 50/50.
				// Variation BB: First fails to be a featured weapon.
				// "0.5 * 0.375" describes Variation A.
				// "0.625 * (0.6 * 0.375 + 0.4 * 0.5)" describes Variation B.
				weapSuccessArray[x] += secondSSRArray[x] * (weapEpitomPath == 1 ? (weapFiftyFifty == true ? 0.5 : 0.625) : (weapFiftyFifty == true ? 0.1875 : 0.265625));
			}
			if(thirdSSRArray != null && x < thirdSSRArray.length)
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
				weapSuccessArray[x] += thirdSSRArray[x] * (weapFiftyFifty == true ? 0.3125 : 0.359375);
			}
		}
	}

	var result = 0.0;
	var resultArray = charSuccessArray;
	if(charSuccessArray == null)
	{
		if(weapSuccessArray == null)
		{
			alert("Nothing computed. No target set?");
			return;
		}

		// Get the chance for a success at the weapon's refinement rank level.
		resultArray = weapSuccessArray;
		for(let x = 0; x < inputPullsToDo &&  x < resultArray.length; x++)
		{
			if(targetRef > 1)
			{
				resultArray[x] *= dataChanceWeapFullArray[Math.min((targetRef - 1) * 231, inputPullsToDo - x - 1)][targetRef - 2];
			}
			result += resultArray[x];
		}
	}
	else if(weapSuccessArray != null)
	{
		resultArray = new Array(inputPullsToDo);
		for(let x = 0; x < resultArray.length; x++)
		{
			resultArray[x] = 0;
		}
		// Start calculating for the probability of both the character constellation level and weapon refinement rank.
		for(let x = 0; x < inputPullsToDo && x < charSuccessArray.length; x++)
		{
			for(let y = 0; x + y + 1 < inputPullsToDo && y < weapSuccessArray.length; y++)
			{
				resultArray[x + y + 1] += charSuccessArray[x] * weapSuccessArray[y];
			}
		}

		var targetConExtra = targetCon * 180;
		var targetRefExtra = (targetRef - 1) * 231;
		var targetPos = (targetCon - 1) * 4 + Number(targetRef - 2);
		var maxPullsForThis = Math.max(0, targetConExtra) + Math.max(0, targetRefExtra);
		for(let x = 0; x < inputPullsToDo; x++)
		{
			if(targetCon > 0)
			{
				if(targetRef > 1)
				{
					
					resultArray[x] *= dataCombinedArray[Math.min(maxPullsForThis, inputPullsToDo - x - 1)][targetPos];
				}
				else
				{
					resultArray[x] *= dataChanceCharFullArray[Math.min(maxPullsForThis, inputPullsToDo - x - 1)][targetCon - 1];
				}
			}
			else if(targetRef > 1)
			{
				resultArray[x] *= dataChanceWeapFullArray[Math.min(maxPullsForThis, inputPullsToDo - x - 1)][targetRef - 2];
			}
			result += resultArray[x];
		}
	}
	else
	{
		for(let x = 0; x < inputPullsToDo && x < resultArray.length; x++)
		{
			if(targetCon > 0)
			{
				resultArray[x] *= dataChanceCharFullArray[Math.min(targetCon * 180, inputPullsToDo - x - 1)][targetCon - 1];
			}
			result += resultArray[x];
		}
	}
	
	var roundedResult = DoRound(result, 12);
	var resultString = '~'+String(DoRound(roundedResult*100, 4))+ "%";
	document.getElementById('result').innerHTML = "result: &quot;"+resultString+"&quot;";
	var outTextSuccessObj = document.getElementById('result_OddsSuccess');
	var outTextFailureObj = document.getElementById('result_OddsFailure');
	var outTextDescripObj = document.getElementById('result_Description');
	outTextSuccessObj.innerHTML = "odds for success: "+((roundedResult == 0 || roundedResult >= 0.5) ? "-" : "1 in ~" + addCommas(String(Math.round(1 / roundedResult))));
	outTextFailureObj.innerHTML = "odds for failure: "+((roundedResult == 1 || (1 - roundedResult) >= 0.5) ? "-" : "1 in ~" + addCommas(Math.round(1 / (1 - roundedResult))));

	var description = "";
	if(inputPullsToDo < targetCon + targetRef + 1)
	{
		if(roundedResult != 0)
		{
			description = "... Something that shouldn't happen happened.";
		}
		description = "Unable to acquire the target levels with the number of pulls to do. "
			+ inputPullsToDo + " pull"+(inputPullsToDo == 1 ? "" : "s")+" for "
			+ String(targetCon + 1 + targetRef) + " items.";
	}
	else
	{
		// "On the character banner, currently x pity, y guaranteed. On the weapon banner, currently x1 on the epitome path and y1 guaranteed to be a featured weapon."
		// "x2 single pulls, z chance."
		if(targetCon >= 0)
		{
			description = "On the character banner, currently "
			+ initCharPity
			+ " pity for the next five star, and "
			+ (charGuaranteed == true ? "is" : "is not")
			+ " guaranteed the 50/50. ";
		}
		if(targetRef > 0)
		{
			if(targetCon < 0)
			{
				description = "";
			}
			description += "On the weapon banner, currently "
			+ initWeapPity + " pity, "
			+"&quot;"
			+ (weapEpitomPath == 0 ? "0/2" : (weapEpitomPath == 1 ? "1/2" : "2/2"))
			+ "&quot; on the epitome path"
			+ (weapEpitomPath == 2 ? ". " : ", and there "+(weapFiftyFifty == true ? "is a" : "is no")+" guarantee for a featured weapon. ");
		}
		description += inputPullsToDo + " single pulls has a &quot;" + resultString + "&quot; chance for success at ";
		if(targetCon >= 0)
		{
			description += String(targetCon + 1) + " specific featured five-star character"
				+ (targetCon == 0 ? "" : "s");
			if(targetRef > 0)
			{
				description += ", and ";
			}
			else
			{
				description += ".";
			}
		}
		if(targetRef > 0)
		{
			description += String(targetRef)
				+ " specific featured five-star weapon"
				+ (targetRef == 1 ? "":"s")
				+ ".";
		}
	}

	outTextDescripObj.innerHTML = "Description: "+description;

	if(resultClean == true)
	{
		outTextSuccessObj.style.display = "block";
		outTextFailureObj.style.display = "block";
		outTextDescripObj.style.display = "block";

		resultClean = false;
	}
}
