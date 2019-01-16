module.exports = {
	elapsedTime: elapsedTime,
	findInArray: findInArray
}

function elapsedTime(millis) {
	var milliseconds = Math.round(millis % 60000);
	var minutes = Math.floor(millis / 60000);
	var seconds = ((millis % 60000) / 1000).toFixed(0);
	return pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3);
}

function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

function findInArray(arrayName, toSearch, caseInsensitive = false){
    let result = false;
    if(caseInsensitive){
        for(let i = 0; i < arrayName.length; i++) {
            if(arrayName[i].toLowerCase() === toSearch.toLowerCase()) {
                result = true;
                break;
            }
        }
    }
    else{
        for(let i = 0; i < arrayName.length; i++) {
            if(arrayName[i] === toSearch) {
                result = true;
                break;
            }
        }
    }
    return result;
}