/***********************************************************************************
* Function that extends parent object prototype to a child object
************************************************************************************/
function extend(ChildClass, ParentClass) {
	ChildClass.prototype = new ParentClass();
	ChildClass.prototype.constructor = ChildClass;
}

/***********************************************************************************
* GENERAL OBJECT
************************************************************************************/
var valuesElement = function(){
	this.elementType = 'generalElement';
}

valuesElement.prototype = {
	setType: function(elementType) {
		this.elementType = elementType;	
	}	
}

/***********************************************************************************
* CURRENT VALUES OBJECT
************************************************************************************/

var currentValues = function() {
	this.setType('currentValues');
	this.date;
	this.status;
	this.acVoltage;
	this.dcCurrent;
	this.acFrequency;
	this.outputPower; //watts
	this.energy_produced; //watts
	
	
}
extend(currentValues, valuesElement);
/***********************************************************************************
* HISTORICAL VALUES OBJECT
************************************************************************************/

var historicalValues = function() {
	this.setType('historicalValues');
	this.plotArray = [];
	this.totalKwHrs;
	this.totalKw;
	this.totalCo2;
	this.kwhSinceLoad = 0;
}
extend(historicalValues, valuesElement);

historicalValues.prototype.updateArray = function(xVal, yVal) {
	console.log(xVal+ " "+yVal);
	this.plotArray.push([xVal, yVal]);
	console.log(this.plotArray);
}

historicalValues.prototype.updateTotalKwh = function(kwh, conversion){
	this.totalKwHrs = kwh;
	this.totalCo2 = Math.round(kwh*conversion/2204.62*100)/100;
}

historicalValues.prototype.updateSinceLoad = function(time){
	time = time/1000/60/60;
	console.log(time);
	this.kwhSinceLoad = this.plotArray.map(function(v) { return v[1] }) // second value of each
    			.reduce(function(a,b) { console.log(a + b); return a + b })/this.plotArray.length*time;  // kwh
	console.log(this.kwhSinceLoad);
	
}