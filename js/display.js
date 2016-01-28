function getData(url){
	console.log('blah'); 
	$.getJSON(url, {
		dataType: "jsonp"
	  })
		 .done(function(data) {
			  //$('#content').html('The artist is: ' + data.query.results.json.artist + '<br/><br/>');
			console.log(data);
		 });
}

$(document).ready(function() {
	setInterval(getData('http://mybergey.aprsworld.com/data/jsonMyBergey.php?station_id=A2675&statsHours=24'),10000);
});

//http://mybergey.aprsworld.com/data/jsonMyBergey.php?station_id=A2675&statsHours=24