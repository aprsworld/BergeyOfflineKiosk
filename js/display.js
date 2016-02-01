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

//url
var jsonURL = 'http://192.168.6.100:8080/data/now.json';

function getData(url){
	console.log('blah'); 
	$.getJSON(url, {
		dataType: "application/json",
		cache: false
	  })
		 .done(function(data) {
			console.log(data);
			newData.date = Date.now();
			newData.status = checkStatus(parseInt(data.data[2].sampleValue));
			newData.acVoltage = data.data[5].avg; //data.inverter_ac_voltage;
			newData.acFrequency = data.inverter_ac_frequency;
			newData.dcCurrent = data.data[6].avg; //data.inverter_dc_current;
			newData.dcVoltage = data.inverter_dc_voltage;
			newData.outputPower = data.data[4].avg; //data.inverter_output_power;
			newData.energy_produced = data.data[12].sampleValue; //data.inverter_energy_produced;

			//update gauge
			gauge.setValue(newData.outputPower/1000);
		
			//update historical object		
			plotData.updateArray(Date.now(), newData.outputPower/1000);
			plotData.updateTotalKwh(Math.round(newData.energy_produced));
						
		
			//load values into page 
			$("#total-kWh").text(plotData.totalKwHrs.toLocaleString()+" kWh");
			$("#total-co2").text(plotData.totalCo2+" tons");
			$("#currentOutput").text(newData.outputPower.toLocaleString());

			$("#runningState").text(newData.status);
		
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

function updateTables(){
	
}

function checkStatus(systemState){
	switch(systemState) {
		case 5:
			$("#runningState").css("color", "orange");
			return "Waiting For Wind";
			break;
		case 9:
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

function showGauge() {

	gauge = new Gauge({
		renderTo    : 'gauge',
		width       : 300,
		height      : 300,
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
			{ from : 10, to : 14, color : 'rgba(0, 255,  0, .85)' }
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

function constructPlot() {
	var data = [ ];
	var options = {
		xaxis: {
			lines: {
				show: true,
				fill: 1,
				lineWidth: 0
			},
			points: {
                show: true
            },
			color: '#00ff00',
			threshold: [{
				below: 0,
				color: '#f04040'
			}, {
				below: (14000 / 1000), //watts to kW
				color: '#008000'
			}],
			mode: "time",
			tickSize: [1, "hour"],
			tickFormatter: function (v, axis) {
				var date = new Date(v);
				console.log((date.getSeconds() % 20)+"");
				if (date.getSeconds() % 2 == 0) {
					var hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
					var minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
					var seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();

					return hours + ":" + minutes + ":" + seconds;
				} else {
					return "";
				}
			 },
			axisLabel: "Time",
			axisLabelUseCanvas: true,
			axisLabelFontSizePixels: 12,
			axisLabelFontFamily: 'Verdana, Arial',
			axisLabelPadding: 10
		},
		yaxes: [{
			show: true,
			position: "left",
			axisLabelFontSizePixels: 12,
			axisLabelFontFamily: 'Verdana, Arial',
			max: 14,
			min: 0,
			yaxis: 1
		},{
			show: true,
			position: "right",
			axisLabelFontSizePixels: 12,
			axisLabelFontFamily: 'Verdana, Arial',
			max: 14,
			min: 0,
		 	yaxis: 1	
		}]
	}
	
	plot = $.plot($("#flot"), data, options);
}

$(document).ready(function() {
	constructPlot();

	getData(jsonURL)
	setInterval(function() {getData(jsonURL)},10000);
	showGauge();
	//$.plot($("#flot"), [ [[0, 0], [1, 14], [2, 5]] ], { yaxis: { max: 14 } });
});

//http://mybergey.aprsworld.com/data/jsonMyBergey.php?station_id=A2675&statsHours=24