function addCommas(targetThing) {
    return String(targetThing).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

function DoRound(x, y)
{
	var factorOfTen = Math.pow(10, y);
	return Math.round(x * factorOfTen) / factorOfTen;
}

function genericNumOnly(theTextBox)
{
	return (event.charCode == 8 || event.charCode == 0 || event.charCode == 13) ? null : event.charCode >= 48 && event.charCode <= 57;
}