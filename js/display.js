/*
	object created from structure.js
	keeps track of new data values updated every 10 seconds
*/
var newData = new currentValues();
var plotData = new historicalValues();
var gauge;
var plot;

function getData(url){
	console.log('blah'); 
	$.getJSON(url, {
		dataType: "json",
		cache: false
	  })
		 .done(function(data) {
			  //$('#content').html('The artist is: ' + data.query.results.json.artist + '<br/><br/>');
			console.log(data);
			newData.date = Date.now();
			newData.status = data.inverter_systemStateTest;
			newData.acVoltage = data.inverter_ac_voltage;
			newData.acFrequency = data.inverter_ac_frequency;
			newData.dcCurrent = data.inverter_dc_current;
			newData.dcVoltage = data.inverter_dc_voltage;
			newData.outputPower = data.inverter_output_power;
			newData.energy_produced = data.inverter_energy_produced;
		
			//update gauge
			gauge.setValue(newData.outputPower/1000);
		
			//update historical object		
			plotData.updateArray(Date.now(), newData.outputPower/1000);
		
			//update flot diagram		
			plot.setData(plotData.plotArray);
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
		mode: "time",
		tickSize: [2, "second"],
		tickFormatter: function (v, axis) {
			var date = new Date(v);
			console.log((date.getSeconds() % 20)+"");
			if (date.getSeconds() % 20 == 0) {
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

	getData('http://mybergey.aprsworld.com/data/jsonMyBergey.php?station_id=A2675')
	setInterval(function() {getData('http://mybergey.aprsworld.com/data/jsonMyBergey.php?station_id=A2675')},10000);
	showGauge();
	//$.plot($("#flot"), [ [[0, 0], [1, 14], [2, 5]] ], { yaxis: { max: 14 } });
});

//http://mybergey.aprsworld.com/data/jsonMyBergey.php?station_id=A2675&statsHours=24