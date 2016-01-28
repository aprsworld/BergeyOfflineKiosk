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
}
extend(currentValues, valuesElement);
/***********************************************************************************
* HISTORICAL VALUES OBJECT
************************************************************************************/

var historicalValues = function() {
	this.setType('historicalValues');
}
extend(historicalValues, valuesElement);