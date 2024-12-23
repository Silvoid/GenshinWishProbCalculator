WishCalc.Data = {};
WishCalc.Arrays = {};

// The database approach seems to be unsustainable. File size reaches past 10MB for pairs.
// Instead, recalculating is reasonably fast, and accurate.
// You may observe some `if(true)`s here and elsewhere, but that's intended for scoping, to not let variable name pollution occur,
// and it's a way to visually group code together.

if(true)
{
    let initiationTimeStart = new Date();

    // Aliases.
    // Note, changes may not be as easy as just simply changing the values here.
    let basePullLimitCharacter = 90;
    let basePullLimitWeapon    = 77;
    let basePullLimitPair      = 2 * basePullLimitCharacter + 2 * basePullLimitWeapon;
    
    WishCalc.Data.CharacterPullLimit = [ 2 * basePullLimitCharacter ];
    WishCalc.Data.WeaponPullLimit    = [ 2 * basePullLimitWeapon ];
    WishCalc.Data.PairPullLimit      = [ WishCalc.Data.CharacterPullLimit + WishCalc.Data.WeaponPullLimit ];
    
    
    // Set base distribution for characters.
    WishCalc.GetFirstCharacterBaseDistribution = function(startPulls = 0)
    {
        startPulls = Math.max(0, Math.min(89, startPulls));

        let result = new Array(basePullLimitCharacter - startPulls);
        let chance = 0.006;
        let chanceIncrement = 0.06;
        let population = 1.0;

        // "iP" is to mean an iterator for pull number.
        for(let iP = startPulls; iP < basePullLimitCharacter; iP++)
        {
            let pullPercent = Math.min(1.0, chance + chanceIncrement * Math.max(0, iP - 72)) * population;
            result[iP - startPulls] = pullPercent;
            population -= pullPercent;
        }

        return result;
    };

    WishCalc.Data.CharacterBaseDistribution = WishCalc.GetFirstCharacterBaseDistribution(0);

    // Set base distribution for weapons.
    WishCalc.GetFirstWeaponBaseDistribution = function(startPulls = 0)
    {
        let result = new Array(basePullLimitWeapon - startPulls);
        let chance = 0.007;
        let chanceIncrement = 0.07;
        let population = 1.0;

        for(let iP = startPulls; iP < basePullLimitWeapon; iP++)
        {
            let pullPercent = Math.min(1.0, chance + chanceIncrement * Math.max(0, iP - 61)) * population;
            result[iP - startPulls] = pullPercent;
            population -= pullPercent;
        }

        return result;
    };
    WishCalc.Data.WeaponBaseDistribution = WishCalc.GetFirstWeaponBaseDistribution(0);

    // Set distribution for first character copy.
    WishCalc.GetFirstCharacterDistribution = function(pity = 0, featureGuarantee = false, radiance = 0)
    {
        radiance = Math.max(0, Math.min(3, radiance));
        let baseContextDistribution = WishCalc.GetFirstCharacterBaseDistribution(pity);
        let baseDistribution = WishCalc.Data.CharacterBaseDistribution;
        
        // Originally, there was some code to try and optimize memory allocation,
        // but to accomodate a quick fix for a featured character guarantee letting the radiance iterator stay, instead of being reset,
        // just allocate for all the spots. May also help with reducing headache for other code accounting for that attempt at optimization.
        let pullLimit = WishCalc.Data.CharacterPullLimit[0];
        let distribution = [
            new Array(pullLimit),
            new Array(pullLimit),
            new Array(pullLimit),
            new Array(pullLimit)
        ];
        for(let iP = 0; iP < pullLimit; iP++)
        {
            distribution[0][iP] = 0.0;
            distribution[1][iP] = 0.0;
            distribution[2][iP] = 0.0;
            distribution[3][iP] = 0.0;
        }

        let radianceDistribution = [ 0.0, 0.025, 0.25, 0.5 ];
        let featureWinRate  = (featureGuarantee == true ? 1.0 : (0.5 + radianceDistribution[radiance]));
        let featureLoseRate = 1.0 - featureWinRate;
        for(let iPa = 0; iPa < baseContextDistribution.length; iPa++)
        {
            // Win the rate-up attempt.
            distribution[featureGuarantee == true ? radiance : 0][iPa] += featureWinRate * baseContextDistribution[iPa];

            // Lose the rate-up attempt.
            if((featureWinRate < 1.0) && (radiance < 3)) for(let iPb = 0; iPb < baseDistribution.length; iPb++)
            {
                distribution[radiance + 1][iPa + iPb + 1] += featureLoseRate * baseContextDistribution[iPa] * baseDistribution[iPb];
            }
        }

        return distribution;
    }

    // Structure:
    //   distribution[iC][iRa][iRb][iP] where:
    //   iC is the iterator for copies.
    //   iRa is the iterator for the starting radiance.
    //   iRb is the iterator for the ending radiance.
    //   iP is the iterator for pull counts.
    WishCalc.Data.CharacterDistribution = [[
        WishCalc.GetFirstCharacterDistribution(0, false, 0), //
        WishCalc.GetFirstCharacterDistribution(0, false, 1), //
        WishCalc.GetFirstCharacterDistribution(0, false, 2), //
        WishCalc.GetFirstCharacterDistribution(0, false, 3)  //
    ]];

    WishCalc.GetCharacterDistributionForAddition = function(radianceStart)
    {
        let pullLimit = WishCalc.Data.CharacterPullLimit[0];

        // Initiate an array containing only ending radiance values.
        let distribution = new Array(4); for(let iR = 0; iR < 4; iR++)
        {
            distribution[iR] = new Array(pullLimit);
            for(let iP = 0; iP < pullLimit; iP++) distribution[iR][iP] = 0.0;
        }

        // Copy values.
        for(let iR = 0; iR < 4; iR++) for(let iP = 0; iP < pullLimit; iP++) if(WishCalc.Data.CharacterDistribution[0][radianceStart][iR] != null)
            distribution[iR][iP] = WishCalc.Data.CharacterDistribution[0][radianceStart][iR][iP];

        return distribution;
    };

    // This function adds a character copy to a distribution for character copies.
    // Expects "originSource" to be a result from "WishCalc.GetCharacterDistributionForAddition",
    // or something compliant to its structure, "an array of pulls grouped up for pure ending radiance iterators".
    WishCalc.Arrays.AddCharacterCopy = function(originPullLimit, originSource)
    {
        let characterPullLimit = WishCalc.Data.CharacterPullLimit[0]
        let extensionPullLimit = originPullLimit + characterPullLimit;
        let distribution = new Array(4);
        for(let iR = 0; iR < 4; iR++)
        {
            distribution[iR] = new Array(extensionPullLimit);
            for(let iP = 0; iP < extensionPullLimit; iP++) distribution[iR][iP] = 0.0;
        }

        // Add a copy by considering where the first branches end, and where the next branches will end when starting from them.
        // NOTE: Some loop unrolling was done. Apparently, it's faster this way.
        let characterDistribution = WishCalc.Data.CharacterDistribution[0];
        for(let iPa = 0; iPa < originPullLimit; iPa++) for(let iPb = 0; iPb < characterPullLimit; iPb++)
        {
            let iPO = iPa + iPb + 1;
            let originFactorA = ((originSource[0] != null) ? originSource[0][iPa] : 0);
            let originFactorB = ((originSource[1] != null) ? originSource[1][iPa] : 0);
            let originFactorC = ((originSource[2] != null) ? originSource[2][iPa] : 0);
            let originFactorD = ((originSource[3] != null) ? originSource[3][iPa] : 0);

            // Chance to win and reset radiance pity.
            distribution[0][iPO] += originFactorA * characterDistribution[0][0][iPb];
            distribution[0][iPO] += originFactorB * characterDistribution[1][0][iPb];
            distribution[0][iPO] += originFactorC * characterDistribution[2][0][iPb];
            distribution[0][iPO] += originFactorD * characterDistribution[3][0][iPb];

            // Chance to lose and increment radiance pity.
            distribution[1][iPO] += originFactorA * characterDistribution[0][1][iPb];
            distribution[2][iPO] += originFactorB * characterDistribution[1][2][iPb];
            distribution[3][iPO] += originFactorC * characterDistribution[2][3][iPb];
        }

        return distribution;
    };
    
    WishCalc.Arrays.AddSSRCharacterCopy = WishCalc.Arrays.AddCharacterCopy;

    // NOTE: This function is kept here just for reference. Not in actual use.
    WishCalc.Arrays.AddCharacterCopies = function(aPullLimit, aArray, bPullLimit, bArray)
    {
        let timeStart = new Date();
        let pullLimit = aPullLimit + bPullLimit; 
        let distribution = [
            new Array(pullLimit),
            new Array(pullLimit),
            new Array(pullLimit),
            new Array(pullLimit)
        ];
        for(let iR = 0; iR < 4; iR++) for(let iP = 0; iP < pullLimit; iP++) distribution[iR][iP] = 0;

        // To maintain speed, choose how to loop based on what should be a safe assumption for how an undefined slot in an array
        // tells what calculations have been done for the other array.
        if(bArray[3][3] != null) for(let iPa = 0; iPa < aPullLimit; iPa++) for(let iPb = 0; iPb < bPullLimit; iPb++)
        {
            let iPO = iPa + iPb + 1;
            distribution[0][iPO] += aArray[0][iPa] * bArray[0][0][iPb];
            distribution[1][iPO] += aArray[0][iPa] * bArray[0][1][iPb];
            distribution[2][iPO] += aArray[0][iPa] * bArray[0][2][iPb];
            distribution[3][iPO] += aArray[0][iPa] * bArray[0][3][iPb];
            distribution[0][iPO] += aArray[1][iPa] * bArray[1][0][iPb];
            distribution[1][iPO] += aArray[1][iPa] * bArray[1][1][iPb];
            distribution[2][iPO] += aArray[1][iPa] * bArray[1][2][iPb];
            distribution[3][iPO] += aArray[1][iPa] * bArray[1][3][iPb];
            distribution[0][iPO] += aArray[2][iPa] * bArray[2][0][iPb];
            distribution[1][iPO] += aArray[2][iPa] * bArray[2][1][iPb];
            distribution[2][iPO] += aArray[2][iPa] * bArray[2][2][iPb];
            distribution[3][iPO] += aArray[2][iPa] * bArray[2][3][iPb];
            distribution[0][iPO] += aArray[3][iPa] * bArray[3][0][iPb];
            distribution[1][iPO] += aArray[3][iPa] * bArray[3][1][iPb];
            distribution[2][iPO] += aArray[3][iPa] * bArray[3][2][iPb];
            distribution[3][iPO] += aArray[3][iPa] * bArray[3][3][iPb];
        }
        else if(bArray[3][2] != null) for(let iPa = 0; iPa < aPullLimit; iPa++) for(let iPb = 0; iPb < bPullLimit; iPb++)
        {
            let iPO = iPa + iPb + 1;
            distribution[0][iPO] += aArray[0][iPa] * bArray[0][0][iPb];
            distribution[1][iPO] += aArray[0][iPa] * bArray[0][1][iPb];
            distribution[2][iPO] += aArray[0][iPa] * bArray[0][2][iPb];
            distribution[3][iPO] += aArray[0][iPa] * bArray[0][3][iPb];
            distribution[0][iPO] += aArray[1][iPa] * bArray[1][0][iPb];
            distribution[1][iPO] += aArray[1][iPa] * bArray[1][1][iPb];
            distribution[2][iPO] += aArray[1][iPa] * bArray[1][2][iPb];
            distribution[0][iPO] += aArray[2][iPa] * bArray[2][0][iPb];
            distribution[1][iPO] += aArray[2][iPa] * bArray[2][1][iPb];
            distribution[2][iPO] += aArray[2][iPa] * bArray[2][2][iPb];
            distribution[0][iPO] += aArray[3][iPa] * bArray[3][0][iPb];
            distribution[1][iPO] += aArray[3][iPa] * bArray[3][1][iPb];
            distribution[2][iPO] += aArray[3][iPa] * bArray[3][2][iPb];
        }
        else if(bArray[3][1] != null) for(let iPa = 0; iPa < aPullLimit; iPa++) for(let iPb = 0; iPb < bPullLimit; iPb++)
        {
            // Had some trouble understanding the ending iterator.
            // Just had to realize that it "moves up".
            let iPO = iPa + iPb + 1;
            distribution[0][iPO] += aArray[0][iPa] * bArray[0][0][iPb];
            distribution[1][iPO] += aArray[0][iPa] * bArray[0][1][iPb];
            distribution[2][iPO] += aArray[0][iPa] * bArray[0][2][iPb];
            distribution[0][iPO] += aArray[1][iPa] * bArray[1][0][iPb];
            distribution[1][iPO] += aArray[1][iPa] * bArray[1][1][iPb];
            distribution[3][iPO] += aArray[1][iPa] * bArray[1][3][iPb];
            distribution[0][iPO] += aArray[2][iPa] * bArray[2][0][iPb];
            distribution[1][iPO] += aArray[2][iPa] * bArray[2][1][iPb];
            distribution[0][iPO] += aArray[3][iPa] * bArray[3][0][iPb];
            distribution[1][iPO] += aArray[3][iPa] * bArray[3][1][iPb];
        }
        else if(bArray[3][0] != null) for(let iPa = 0; iPa < aPullLimit; iPa++) for(let iPb = 0; iPb < bPullLimit; iPb++)
        {
            let iPO = iPa + iPb + 1;
            distribution[0][iPO] += aArray[0][iPa] * bArray[0][0][iPb];
            distribution[1][iPO] += aArray[0][iPa] * bArray[0][1][iPb];
            distribution[0][iPO] += aArray[1][iPa] * bArray[1][0][iPb];
            distribution[2][iPO] += aArray[1][iPa] * bArray[1][2][iPb];
            distribution[0][iPO] += aArray[2][iPa] * bArray[2][0][iPb];
            distribution[3][iPO] += aArray[2][iPa] * bArray[2][3][iPb];
            distribution[0][iPO] += aArray[3][iPa] * bArray[3][0][iPb];
        }
        return { "Result": distribution, "TimeTaken": (new Date() - timeStart) };
    }
    
    // Set distribution for first weapon copy.
    WishCalc.GetFirstWeaponDistribution = function(startPulls = 0, featureGuarantee = false, epitomizedPath = 0)
    {
        startPulls = Math.max(0, Math.min(76, startPulls));
        featureGuarantee = featureGuarantee == true;
        epitomizedPath = Math.max(0, Math.min(1, epitomizedPath));

        let baseContextDistribution = WishCalc.GetFirstWeaponBaseDistribution(startPulls);
        let baseDistribution = WishCalc.Data.WeaponBaseDistribution;
        let distribution = new Array(baseContextDistribution.length + baseDistribution.length);
        for(let iP = 0; iP < distribution.length; iP++) distribution[iP] = 0.0;

        let featureWinRate  = (epitomizedPath == 1 ? 1.0 : (featureGuarantee == true ? 0.5 : 0.375));
        let featureLoseRate = 1.0 - featureWinRate;
        
        for(let iPa = 0; iPa < baseContextDistribution.length; iPa++)
        {
            // Win the rate-up attempt.
            distribution[iPa] += featureWinRate * baseContextDistribution[iPa];
            
            // Lost the rate-up attempt.
            for(let iPb = 0; iPb < baseDistribution.length; iPb++)
            {
                distribution[iPa + iPb + 1] += featureLoseRate * baseContextDistribution[iPa] * baseDistribution[iPb];
            }
        }

        return distribution;
    }
    WishCalc.Data.WeaponDistribution = [ WishCalc.GetFirstWeaponDistribution(0, false, 0) ];

    // Pre-calculate distribution for first pair copy.
    // Disabled while unused.
    if(false)
    {
        let characterDistribution = WishCalc.Data.CharacterDistribution;
        let weaponDistribution = WishCalc.Data.WeaponDistribution;
        let pairDistribution = WishCalc.Data.PairDistribution = [[[
            [[],[],[],[]],
            [[],[],[],[]],
            [[],[],[],[]],
            [[],[],[],[]]
        ]]];

        for(let iR = 0; iR < 4; iR++)
        {
            pairDistribution[0][0][iR][0] = new Array(basePullLimitPair);
            if(iR < 3) pairDistribution[0][0][iR][iR + 1] = new Array(basePullLimitPair);
            for(let iP = 0; iP < basePullLimitPair; iP++)
            {
                pairDistribution[0][0][iR][0][iP] = 0.0;
                if(iR < 3) pairDistribution[0][0][iR][iR + 1][iP] = 0.0;
            }
        }
        
        for(let iPa = 0; iPa < 2 * basePullLimitCharacter; iPa++) for(let iR = 0; iR < 4; iR++) for(let iPb = 0; iPb < 2 * basePullLimitWeapon; iPb++)
        {
            pairDistribution[0][0][iR][0][iPa + iPb + 1] += characterDistribution[0][iR][0][iPa] * weaponDistribution[0][iPb];
            if(iR < 3) pairDistribution[0][0][iR][iR + 1][iPa + iPb + 1] += characterDistribution[0][iR][iR + 1][iPa] * weaponDistribution[0][iPb];
        }
    }

    // This function adds another copy to a distribution for weapon copies.
    // NOTE: This is not to add a weapon copy to any other type of distribution.
    WishCalc.Arrays.AddWeaponCopy = function(sourceDistribution) {
        let result = Array(sourceDistribution.length + WishCalc.Data.WeaponPullLimit[0])
        
        for(let iP = 0; iP < result.length; iP++) result[iP] = 0.0;

        for(let iPa = 0; iPa < sourceDistribution.length; iPa++) for(let iPb = 0; iPb < WishCalc.Data.WeaponPullLimit[0]; iPb++)
        {
            result[1 + iPa + iPb] += sourceDistribution[iPa] * WishCalc.Data.WeaponDistribution[0][iPb];
        }

        return result;
    };

    // NOTE: This function was written, but currently it isn't flexible enough for usage. Kept here for reference.
    WishCalc.InitialGetCharacterAndWeapon = function(radianceStart, characterCount, weaponCount) {
        if((characterCount == 0) || (characterCount == null) || (weaponCount == 0) || (weaponCount == null))
            return null;
        let timeStart = new Date();
        
        let characterDistribution = WishCalc.GetCharacterDistributionForAddition(radianceStart);
        for(let iC = 1; iC < characterCount; iC++) characterDistribution = WishCalc.Arrays.AddCharacterCopy(iC * WishCalc.Data.CharacterPullLimit[0], characterDistribution);
        let characterPullLimit = (characterCount) * WishCalc.Data.CharacterPullLimit[0];

        let resultPullLimit = characterCount * characterPullLimit + weaponCount * WishCalc.Data.WeaponPullLimit[0];

        let resultDistribution = [
            new Array(resultPullLimit),
            new Array(resultPullLimit),
            new Array(resultPullLimit),
            new Array(resultPullLimit)
        ];
        for(let iP = 0; iP < resultPullLimit; iP++)
        {
            resultDistribution[0][iP] = 0.0;
            resultDistribution[1][iP] = 0.0;
            resultDistribution[2][iP] = 0.0;
            resultDistribution[3][iP] = 0.0;
        }

        let weaponDistribution = WishCalc.Data.WeaponDistribution[0];
        for(let iC = 1; iC < weaponCount; iC++) weaponDistribution = WishCalc.AddWeaponCopy(weaponDistribution);

        for(let iPa = 0; iPa < characterPullLimit; iPa++) for(let iPb = 0; iPb < weaponDistribution.length; iPb++)
        {
            resultDistribution[0][1 + iPa + iPb] += characterDistribution[0][iPa] * weaponDistribution[iPb];
            resultDistribution[1][1 + iPa + iPb] += characterDistribution[1][iPa] * weaponDistribution[iPb];
            resultDistribution[2][1 + iPa + iPb] += characterDistribution[2][iPa] * weaponDistribution[iPb];
            resultDistribution[3][1 + iPa + iPb] += characterDistribution[3][iPa] * weaponDistribution[iPb];
        }

        return { "Distribution": resultDistribution, "TimeTaken": Number(new Date() - timeStart) };
    };

    console.log(`[WishCalc]: Initiation took ${(new Date() - initiationTimeStart).toLocaleString()}ms.`)
}

