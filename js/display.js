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
var host = getUrlVars()['json'];
//URL

var jsonURL;
var historicalURL;
if(typeof host === 'undefined'){
	jsonURL = 'http://127.0.0.1/data/now.json';
	historicalURL = 'http://127.0.0.1/data/historyByDay.json';
}
else{
	jsonURL = 'http://'+host+'/now.json';
	historicalURL = 'http://'+host+'/historyByDay.json';
}
//historical URL
//sets the conversion rate for kWh to tons of CO2
//rate found at: http://www.miloslick.com/EnergyLogger_files/State_Electricity_and_Emissions_Rates.pdf
var co2_conversion = 1.155;
//variable that holds pageload timestamp
var startTime;
//variable that keeps track of elapsed time since page load
var diffTime;
//stores today timestamp
var today;

/* Inline dependency: 
 * jQuery resize event - v1.1 - 3/14/2010
 * http://benalman.com/projects/jquery-resize-plugin/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function($,h,c){var a=$([]),e=$.resize=$.extend($.resize,{}),i,k="setTimeout",j="resize",d=j+"-special-event",b="delay",f="throttleWindow";e[b]=250;e[f]=true;$.event.special[j]={setup:function(){if(!e[f]&&this[k]){return false}var l=$(this);a=a.add(l);$.data(this,d,{w:l.width(),h:l.height()});if(a.length===1){g()}},teardown:function(){if(!e[f]&&this[k]){return false}var l=$(this);a=a.not(l);l.removeData(d);if(!a.length){clearTimeout(i)}},add:function(l){if(!e[f]&&this[k]){return false}var n;function m(s,o,p){var q=$(this),r=$.data(this,d);r.w=o!==c?o:q.width();r.h=p!==c?p:q.height();n.apply(this,arguments)}if($.isFunction(l)){n=l;return m}else{n=l.handler;l.handler=m}}};function g(){i=h[k](function(){a.each(function(){var n=$(this),m=n.width(),l=n.height(),o=$.data(this,d);if(m!==o.w||l!==o.h){n.trigger(j,[o.w=m,o.h=l])}});g()},e[b])}})(jQuery,this);
//flot plugin
(function ($) {
    var options = { }; // no options

    function init(plot) {
        function onResize() {
            var placeholder = plot.getPlaceholder();
			console.log(placeholder);
            // somebody might have hidden us and we can't plot
            // when we don't have the dimensions
            if (placeholder.width() == 0 || placeholder.height() == 0)
                return;

            plot.resize();
            plot.setupGrid();
            plot.draw();
        }
        
        function bindEvents(plot, eventHolder) {
            plot.getPlaceholder().resize(onResize);
        }

        function shutdown(plot, eventHolder) {
            plot.getPlaceholder().unbind("resize", onResize);
        }
        
        plot.hooks.bindEvents.push(bindEvents);
        plot.hooks.shutdown.push(shutdown);
    }
    
    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'resize',
        version: '1.0'
    });
})(jQuery);

function getUrlVars() {
    var vars = {};
	//console.log(window.location.href);
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,    
    function(m,key,value) {
      vars[key] = value;
    });
    return vars;
  }

//gets data from now.json
function getData(url){
	console.log(url);
	$.getJSON(url, {
		dataType: "application/json",
		cache: false
	  })
		 .done(function(data) {
			//console.log(Date.now());
			//console.log(data);
		
	//if data exists from json
		if(data.data.length > 0){
		//date
			if (typeof data.data[4].time !== "undefined"){	
				newData.date = data.data[4].time;
				diffTime = newData.date - startTime;
				//console.log(newData.date);
			}
		//status
			if(typeof data.data[2].sampleValue !== "undefined"){
				newData.status = checkStatus(parseInt(data.data[2].sampleValue));
				$("#runningState").text(newData.status);

			}
		//ac voltage
			if(typeof data.data[5].avg !== "undefined"){
				newData.acVoltage = data.data[5].avg;
				$("#acVoltage").text(newData.acVoltage+" VAC");

			}
		//ac Frequency
			if(data.data[7].sampleValue != undefined){
				newData.acFrequency = data.data[7].sampleValue;
				$("#acFrequency").text(" @ "+newData.acFrequency+" Hz");	

			}
		//dc current
			if(data.data[6].avg != undefined){
				newData.dcCurrent = data.data[6].avg; 
				$("#dcCurrent").text(" @ "+newData.dcCurrent+" amps");

			}
		//dc voltage
			if(data.data[3].avg != undefined){
				newData.dcVoltage = data.data[3].avg; 
				$("#dcVoltage").text(newData.dcVoltage+" VDC ");

			}
		//output power
			if(data.data[4].avg != undefined){
				newData.outputPower = data.data[4].avg; //data.inverter_output_power;
				
				//update gauge
				gauge.setValue(newData.outputPower/1000);
				
				$("#currentOutput").text(newData.outputPower.toLocaleString()+" watts");
				
				if(data.data[4].time != undefined){
					plotData.updateArray(newData.date, newData.outputPower/1000);
				}
				else{
					plotData.updateArray(Date.now(), newData.outputPower/1000);
				}
	
			}
		//energy produced
			if(data.data[12].sampleValue != undefined){
				newData.energy_produced = data.data[12].sampleValue; //data.inverter_energy_produced;
				plotData.updateTotalKwh(Math.round(newData.energy_produced), co2_conversion);

				$("#total-kWh").html(''+plotData.totalKwHrs.toLocaleString()+" kWh");
				$("#total-co2kg").html('' +plotData.totalCo2kg.toLocaleString()+" kg");
				$("#total-co2").html('' +plotData.totalCo2+" tons");
	
			}
		//soft_grid
			if(data.data[9].sampleValue !=undefined){
				//console.log(gauge);
				
				if(data.data[9].sampleValue != "0.0"){
					$('#softGrid').children().text("active");
					$('#softGrid').show();
					gauge.updateConfig({
					colors:{
						plate      : 'red',
						majorTicks : 'white',
						minorTicks : 'white',
						title      : 'white',
						units      : 'white',
						numbers    : 'white',
						needle     : { start : 'rgba(255, 255, 255, 1)', end : 'rgba(255, 255, 255, .9)' }
					}
					});
				}
				else{
					$('#softGrid').hide();
					gauge.updateConfig({
					colors:{
						plate      : '#eee',
						majorTicks : '#333',
						minorTicks : '#333',
						title      : '#333',
						units      : '#333',
						numbers    : '#333',
						needle     : { start : 'rgba(30, 30, 30, 1)', end : 'rgba(30, 30, 30, .9)' }
					}
					});
				}
			}
		}
		else{
			$("#runningState").text("No Data Received");
			$("#runningState").css("color", "brown");
		}
		//end if data block

			//elapsed time
			//console.log(newData.date-startTime);
		
			//format ticks based on elapsed time - prevents crowding of labels on graph
			formatTicks();
		
			//update flot diagram		
			plot.setData([plotData.plotArray]);
			plot.setupGrid(); 
			plot.draw();
			//console.log(newData);
			//console.log(Date.now());
			data = null;
		 })
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			//console.log( "Request Failed: " + err);
		})
		.always(function() {
			//console.log("completed");
		});
}

//gets historical data from seperate json file
function getHistorical(url){
	$.getJSON(url, {
		dataType: "application/json",
		cache: false
	  })
		 .done(function(data) {
			//gets date in time format of the json field
			today = getToday();
			for(var key in data.summary_stats){
				//console.log(key);
				if(data['summary_stats'][key]['day'] == today){
					$('#historicalEnergy').text(Math.round(data['summary_stats'][key]['output_power_avg']).toLocaleString()+" watts");	
					break;
				}
			}
			//console.log(today);
			//console.log(data);
			
		 })
		.fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			//console.log( "Request Failed: " + err);
		})
		.always(function() {
			//console.log("completed");
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
		//console.log(true);
		plot.getOptions().xaxes[0].tickSize= [10, "second"];
		plot.getOptions().xaxes[0].axisLabel = '10-second intervals';
	}
	else if(diffTime < (5*60000)){
		plot.getOptions().xaxes[0].tickSize= [30, "second"];
		plot.getOptions().xaxes[0].axisLabel = '30-second intervals';
	}
	else if(diffTime < (10*60000)){
		plot.getOptions().xaxes[0].tickSize= [1, "minute"];
		plot.getOptions().xaxes[0].axisLabel = '1-minute intervals';
	}
	else if(diffTime < (60*60000)){
		plot.getOptions().xaxes[0].tickSize= [10, "minute"];
		plot.getOptions().xaxes[0].axisLabel = '10-minute intervals';
	}
	else if(diffTime < (6*60*60000)){
		plot.getOptions().xaxes[0].tickSize= [30, "minute"];
		plot.getOptions().xaxes[0].axisLabel = '30-minute intervals';
	}
	else if(diffTime < (24*60*60000)){
		plot.getOptions().xaxes[0].tickSize= [1, "hour"];
		plot.getOptions().xaxes[0].axisLabel = '1-hour intervals';
	}
	else if(diffTime < (2*24*60*60000)){
		plot.getOptions().xaxes[0].tickSize= [4, "hour"];
		plot.getOptions().xaxes[0].axisLabel = '4-hour intervals';
	}
	else {
		plot.getOptions().xaxes[0].tickSize= [12, "hour"];
		plot.getOptions().xaxes[0].axisLabel = '12-hour intervals';
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
	var height = screen.height*.35;
	gauge = new Gauge({
		renderTo    : 'gauge',
		width       : height,
		height      : height,
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
			{ from : 10, to : 14, color : 'rgba(0,   0, 0, .0)' }
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
		},
		valueBox: {
            visible: false
        }
	});

	gauge.draw();
};


//constructs and draws plot
function constructPlot() {
	startTime = Date.now();
	var height = screen.height;
	$("#flot").height(Math.round(height*.40)+"px");
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
		xaxis: {
			show: true,
			position: 'bottom',
			mode: "time",
			timezone: "browser",
			tickSize: [10, "second"],
			timeformat: "%m/%d/%y <br> %h:%M:%S",
			axisLabel: "",
			axisLabelUseCanvas: true,
			axisLabelFontSizePixels: 12,
			axisLabelFontFamily: 'Verdana, Arial',
			axisLabelPadding: 5
		},
		yaxes: [{
			show: true,
			position: "left",
			axisLabel: "Output Power Kilowatts ",
			axisLabelUseCanvas: true,
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
	//console.log(startTime);
	getData(jsonURL);
	getHistorical(historicalURL)
	setInterval(function() {getData(jsonURL)},10000);
	setInterval(function() {getHistorical(historicalURL)},10000);
	showGauge();
});

//http://mybergey.aprsworld.com/data/jsonMyBergey.php?station_id=A2675&statsHours=24