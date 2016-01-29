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
}
extend(historicalValues, valuesElement);

historicalValues.prototype.updateArray = function(xVal, yVal) {
	console.log(xVal+ " "+yVal);
	this.plotArray.push([xVal/1000, yVal]);
	console.log(this.plotArray);
}

historicalValues.prototype.updateTotalKw = function(){
	
}