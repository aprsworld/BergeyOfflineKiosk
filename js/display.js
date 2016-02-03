/*
	object created from structure.js
	keeps track of new data values updated every 10 seconds
*/
var newData = new currentValues();

/*
	object created from structure.js
	keeps track of historical data over the cource of the session
*/
var plotData = new historicalValues();

//guage object
var gauge = {};

//plot object
var plot = {};

//URL
var jsonURL = 'http://192.168.6.100:8080/data/now.json';
//historical URL
var historicalURL = 'http://192.168.6.100:8080/data/historyByDay.json';
//sets the conversion rate for kWh to tons of CO2
var co2_conversion = 1.155;
//variable that holds pageload timestamp
var startTime;
//variable that keeps track of elapsed time since page load
var diffTime;
//stores today timestamp
var today;

//gets data from now.json
function getData(url){
	$.getJSON(url, {
		dataType: "application/json",
		cache: false
	  })
		 .done(function(data) {
			console.log(data);
			newData.date = data.data[4].time;//Date.now();
			newData.status = checkStatus(parseInt(data.data[2].sampleValue));
			newData.acVoltage = data.data[5].avg; //data.inverter_ac_voltage;
			newData.acFrequency = data.data[7].sampleValue;
			newData.dcCurrent = data.data[6].avg; //data.inverter_dc_current;
			newData.dcVoltage = data.inverter_dc_voltage;
			newData.outputPower = data.data[4].avg; //data.inverter_output_power;
			newData.energy_produced = data.data[12].sampleValue; //data.inverter_energy_produced;
			diffTime = newData.date - startTime;
			console.log(newData.date);
			//update gauge
			gauge.setValue(newData.outputPower/1000);
		
			//update historical object		
			plotData.updateArray(Date.now(), newData.outputPower/1000);
			plotData.updateTotalKwh(Math.round(newData.energy_produced), co2_conversion);
						
			/*var total = plotData.plotArray.map(function(v) { return v[1] })         // second value of each
    			.reduce(function(a,b) { return a + b });  // sum*/
			//plotData.updateSinceLoad(diffTime);
			//console.log(total);
			//load values into page 
			$("#total-kWh").html('<i class="fa fa-leaf"></i> '+plotData.totalKwHrs.toLocaleString()+" kWh");
			$("#total-co2").html('<i class="fa fa-trash"></i> ' +plotData.totalCo2+" tons");
			$("#currentOutput").text(newData.outputPower.toLocaleString());
			$("#runningState").text(newData.status);
			$("#acFrequency").text(" @ "+newData.acFrequency+" Hz");	
			$("#acVoltage").text(newData.acVoltage+" VAC");
			$("#dcCurrent").text(" @ "+newData.dcCurrent+" amps");
		
			console.log(newData.date-startTime);
			formatTicks();
			//update flot diagram		
			plot.setData([plotData.plotArray]);
			plot.setupGrid(); 
			plot.draw();
			console.log(newData);
		 })
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err);
		})
		.always(function() {
			console.log("completed");
		});
}

//gets historical data from seperate json file
function getHistorical(url){
	$.getJSON(url, {
		dataType: "application/json",
		cache: false
	  })
		 .done(function(data) {
			today = getToday();
			for(var key in data.summary_stats){
				console.log(key);
				if(data['summary_stats'][key]['day'] == today){
					$('#historicalEnergy').text(Math.round(data['summary_stats'][key]['output_power_avg']).toLocaleString()+" watts");	
						break;
				}
			}
			console.log(today);
			console.log(data);
			
		 })
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log( "Request Failed: " + err);
		})
		.always(function() {
			console.log("completed");
		});
}
Date.prototype.yyyymmdd = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
};


function getToday(){
	var d = new Date();
	return d.yyyymmdd();	
}


//function that modifies ticks on flot chart so that they do not overcrowd
function formatTicks(){
	if(diffTime < 60000){
		console.log(true);
		plot.getOptions().xaxes[0].tickSize= [10, "second"];
	}
	else if(diffTime < (5*60000)){
		plot.getOptions().xaxes[0].tickSize= [30, "second"];
	}
	else if(diffTime < (10*60000)){
		plot.getOptions().xaxes[0].tickSize= [1, "minute"];
	}
	else if(diffTime < (60*60000)){
		plot.getOptions().xaxes[0].tickSize= [10, "minute"];
	}
	else if(diffTime < (6*60*60000)){
		plot.getOptions().xaxes[0].tickSize= [30, "minute"];
	}
	else if(diffTime < (24*60*60000)){
		plot.getOptions().xaxes[0].tickSize= [1, "hour"];
	}
	else if(diffTime < (2*24*60*60000)){
		plot.getOptions().xaxes[0].tickSize= [4, "hour"];
	}
	else {
		plot.getOptions().xaxes[0].tickSize= [12, "hour"];
	}
}

//gets status integer from json and decodes into appropriate string
function checkStatus(systemState){
	$("#runningState").css("color", "red");
	switch(systemState) {
		case 5:
			$("#runningState").css("color", "brown");
			return "Waiting For Wind";
			break;
		case 9:
			$("#runningState").css("color", "green");
			return "Running";
			break;
		case 0:
			return "INIT_PROCESSOR";
			break;
		case 1:
			return "INIT_PARAMS";
			break;
		case 2:
			return "RESET";
			break;
		case 3:
			return "WAITING INITIALIZING (STARTING COUNTDOWN)";
			break;
		case 4:
			return "WAITING INITIALIZING (COUNTDOWN DELAY)";
			break;
		case 6:
			return "AC_RUN_INIT";
			break;
		case 7:
			return "AC_RUNNING";
			break;
		case 8:
			return "DC_RUN_INIT";
			break;
		case 10:
			return "FAULT_INIT";
			break;
		case 11:
			return "FAULT";
			break;
		case 12:
			return "MANUAL STOP (PRESS RESET)";
			break;
		case 13:
			return "MANRESET";
			break;	
		case 14:
			return "FAULT LIMIT (PRESS RESET)";
			break;
	}
}

//Constructs and draws the gauge
function showGauge() {

	gauge = new Gauge({
		renderTo    : 'gauge',
		width       : 400,
		height      : 400,
		glow        : false,
		units       : 'kW',
		title       : 'Output Power',
		minValue    : 0,
		maxValue    : 14,
		majorTicks  : ['0','2','4','6','8','10','12','14'],
		minorTicks  : 4,
		strokeTicks : true,
		highlights  : [
			{ from : 0,   to : 10, color : 'rgba(0,   0, 0, .0)' },
			{ from : 10, to : 14, color : 'green' }
		],
		animation : {
			delay    : 0,
			duration : 200,
			fn       : 'cycle'
		},
		colors      : {
			plate      : '#eee',
			majorTicks : '#333',
			minorTicks : '#333',
			title      : '#333',
			units      : '#333',
			numbers    : '#333',
			needle     : { start : 'rgba(30, 30, 30, 1)', end : 'rgba(30, 30, 30, .9)' }
		}
	});

	gauge.draw();
};


//constructs and draws plot
function constructPlot() {
	startTime = Date.now();
	var height = $("#flot").parent().height();
	$("#flot").height(height-50+"px");
	var data = [ ];
	var options = {
		colors: ["green"],
		lines: {
			show: true,
			fill: 1,
			color: "green",
			fillColor: 'rgba(0, 255, 0, 0.60)',
			lineWidth: 3
		},
		points: {
			show: true,
			fill: 1,
			fillColor: "green"
		},
		xaxis: {
			show: true,
			position: 'bottom',
			mode: "time",
			timezone: "browser",
			tickSize: [10, "second"],
			timeformat: "%m/%d/%y <br> %h:%M:%S",
			axisLabel: "Elapsed Time",
			axisLabelUseCanvas: false,
			axisLabelFontSizePixels: 12,
			axisLabelFontFamily: 'Verdana, Arial',
			axisLabelPadding: 3
		},
		yaxes: [{
			show: true,
			position: "left",
			axisLabel: "Kilowatts",
			axisLabelUseCanvas: false,
			axisLabelFontSizePixels: 16,
			axisLabelFontFamily: 'sans-serif',
			max: 14,
			min: 0,
			yaxis: 1
		},{
			show: true,
			position: "right",
			axisLabelFontSizePixels: 12,
			axisLabelFontFamily: 'sans-serif',
			max: 14,
			min: 0,
		 	yaxis: 2	
		}]
	}
	startTime = Date.now();
	plot = $.plot($("#flot"), data, options);
}


$(document).ready(function() {
	constructPlot();
	console.log(startTime);
	getData(jsonURL);
	getHistorical(historicalURL)
	setInterval(function() {getData(jsonURL)},10000);
	setInterval(function() {getHistorical(historicalURL)},10000);
	showGauge();
});

//http://mybergey.aprsworld.com/data/jsonMyBergey.php?station_id=A2675&statsHours=24