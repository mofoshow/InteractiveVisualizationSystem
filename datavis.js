//data vis js, reads in data, combines with geojson, colors the map based on selection, all graph functions
$( document ).ready(function() {
	//////////////////////////////////////////////////////
	//					 Indiana Map					//
	//////////////////////////////////////////////////////
	
	var attributes = []; //array of property keys
	var educationFull = ["No High School", "Some High School", "High School", "Some College", "Associate", "Bachelor's", "Graduate Level"];
	var width, height, svg, path, a, overlay, color, legend, regionLabelSvg, key; //dimensions for svg, creating an instance of svg and path
	var ctrigger, rtrigger, visible = 0; //to be used as the index for the attributes array
	var expressed;
	var overlaydata = 3;
	var overlayEdu = 0;
	var overlayAtt = [];
	var educationAttributes = [];
	var version = "population";
	var w = 140, h = 400;
	var datatograph = [];
	var rCentroids = [];
	var centroids = [];
	var regioncolors = { "1" : "#F8B195",
						 "2" : "#547980",
						 "3" : "#2A52BE",
						 "4" : "#6C5B7B",
						 "5" : "#355C7D",
						 "6" : "#9DE0AD",
						 "7" : "#FF847C",
						 "8" : "#7851A9",
					     "9" : "#FF4E50",
						"10" : "#FC913A",
					    "11" : "#F9D423",
						"12" : "#66B032",
						"13" : "#99B898",
						"14" : "#45ADA8",
						"15" : "#83AF9B " };
	
	//draw map 
	function setMap() {
		//Width and height of svg
		width = 500;
		height = 700;
	
		//Define map projection
		var projection = d3.geo.albers()
								.scale(8500)
								.translate([-850, 530]);

		//Define path generator
		path = d3.geo.path()
						 .projection(projection);	 
							
		//Create SVG element
		svgBase = d3.select("#indiana")
					.append("svg")
					.attr("id","baseSvg")
					.attr("width", width)
					.attr("height", height);
		svg = svgBase.append("g")
					.attr("id", "primary");
					
		//make new svg		
 		overlay = d3.select("#indiana") //to be placed inside #indiana
					.append("svg") //actually adding the svg
					.attr("width", width) //assigning same dimensions as indiana map
					.attr("height", height)
					.attr("id", "overlay");
 		regionLabelSvg = svgBase //to be placed inside #indiana
					.append("g") //actually adding the svg
					.attr("width", width) //assigning same dimensions as indiana map
					.attr("height", height)
					.attr("id", "regionLabelSvg");					
							
		loadData();
	}//end of setMap()
	
	function loadData() {
		//Begin a queue to asynchronously load data and color map			
		queue() 
			.defer(d3.json, "php/extractdata.php")
			.defer(d3.json, "php/extractdata_education.php")
			.defer(d3.json, "data/indiana.json")
			.await(processData);
	}//end of loadData()
	
	function processData(error, data, education, json) {
		console.log("processData"); 
		console.log(json);	
		for (var i in json.features) {    // for each geometry object
			centroids.push(path.centroid(json.features[i])); //push centroid of each county into centroids array
   			json.features[i].properties["centroid"] = path.centroid(json.features[i]);
   			for (var j in data) {	//for each row in data file
				if (data[j].name == json.features[i].properties.name) { //if the county names match in sets of data
					for(var k in data[i]) {   // for each column in the a row within the CSV
         				 if(k != "gender" && k != "county_id" && k != "description") {  // let"s not add the name or id as props since we already have them
          					  if(attributes.indexOf(k) == -1) { //if k is not in the attributes array already
               						attributes.push(k);  // add new column headings to our array for later
          					  }  
          			     	  
          			     	  if(k == "name") { //if attribute is equal to name
          			     	  		json.features[i].properties[k] = data[j][k]; //assign to JSON normally 
          			     	  } else {
          			     	  		json.features[i].properties[k] = Number(data[j][k]);// otherwise cast value as a number value and assign to JSON
          			     	  }
          			     }
          			}
					break;	
				}	
			}
		}
		
		attributes.splice(0, 1);
		attributes.splice(attributes.length - 3, 3);
		overlayAtt = attributes.slice();
		overlayAtt.splice(0,1);
				
		for (var i in json.features) {    // for each geometry object
   			for (var j in education) {	//for each row in data file
				if (education[j].county_id == json.features[i].properties.id) { //if the county names match in sets of data
					for(var k in education[i]) {   // for each column in the a row within the CSV
         				 if(k != "county_id" && k != "year") {  // let"s not add the name or id as props since we already have them
          					  if(educationAttributes.indexOf(k) == -1) { //if k is not in the attributes array already
               						educationAttributes.push(k);  // add new column headings to our array for later
          					  }  
          			     	  		json.features[i].properties[k] = Number(education[j][k]);// otherwise cast value as a number value and assign to JSON
          			     }
          			}
					break;	
				}	
			}
		}
		
		//set up the drop down based on the attributes gathered from the data 							
		d3.selectAll("#primarydata").selectAll("input") //select drop down and its inputs
			.data(attributes) //bind attributes to the inputs
			.enter() //create the inputs
			.append("p")
			.attr("class", "radios")
				.append("label") //add labels 
					.attr("for",function(d,i){ return attributes[i]; }) //with each being for their respective input
					.text(function(d) { 
						if(!d.match(/^[a-zA-Z]+$/)){
							return "Ages " + d;
						} else {
							return d.ucfirst();
						} }) //with text of their respective attribute
					.append("input") //add the inputs
						.attr("name", "data") //with the name data 
						.attr("type", "radio") //as radio buttons
						.style("margin-left", "5px")
						.attr("id", function(d,i){ return attributes[i]; }); //and class of their respective attribute
		
		d3.select("#" + attributes[0]).property("checked", true);
		
		//set up the drop down based on the attributes gathered from the data 							
		d3.selectAll("#secondarydata").selectAll("input") //select drop down and its inputs
			.data(overlayAtt) //bind attributes to the inputs
			.enter() //create the inputs
			.append("p")
			.attr("class", "radios")
				.append("label") //add labels 
					.attr("for",function(d,i){ return overlayAtt[i]; }) //with each being for their respective input
					.text(function(d) { 
						if(!d.match(/^[a-zA-Z]+$/)){
							return "Ages " + d;
						}
				     }) //with text of their respective attribute
				.append("input") //add the inputs
					.attr("name", "data") //with the name data
					.attr("type", "radio") //as radio buttons
					.style("margin-left", "5px") 
					.attr("id", function(d,i){ return overlayAtt[i]; }); //and class of their respective attribute
		
		//set up the drop down based on the attributes gathered from the data 							
		d3.select("#tertiarydata").selectAll("input") //select drop down and its inputs
			.data(educationAttributes) //bind attributes to the inputs
			.enter() //create the inputs
			.append("p")
			.attr("class", "radios")
				.append("label") //add labels 
					.attr("for",function(d,i){ return educationAttributes[i]; }) //with each being for their respective input
					.text(function(d, i) { return educationFull[i]; }) //with text of their respective attribute
				.append("input") //add the inputs
					.attr("name", "data") //with the name data
					.attr("type", "radio") //as radio buttons 
					.style("margin-left", "5px")
					.attr("id", function(d,i){ return educationAttributes[i]; }); //and class of their respective
		
		//first dropdown, set for the choropleth map
		d3.select("#primarydata") //select primary data dropdown
			.selectAll("input") //and its inputs
				.on("click", function(){ //on click
						expressed = $.inArray(d3.select(this).attr("id"), attributes); //expressed becomes the index correlating to the button clicked
						sequenceMap(); //the map is updated
						datatograph.push($(this).attr('id')); //and that value is added to datatograph
				});	
			
		//second dropdown, set for overlay
		d3.select("#secondarydata") //select secondary data dropdown
			.selectAll("input") //and its inputs
				.on("click", function(){ //on click
						version = "population";
						overlaydata =  $.inArray(d3.select(this).attr("id"), attributes); //overlay data becomes the index correlating to the button clicked
						visible = 1; //the overlay should now be visible
						sequenceOverlay(json, overlaydata, overlayEdu, version, visible); //and all that data is passed to update the overlay
				});	
				
		d3.select("#tertiarydata") //select thertiary data dropdown
			.selectAll("input") //and its inputs
				.on("click", function(){ //on click
						version = "education";
						overlayEdu =  $.inArray(d3.select(this).attr("id"), educationAttributes); //overlay data becomes the index correlating to the button clicked
						visible = 1; //the overlay should now be visible
						sequenceOverlay(json, overlaydata, overlayEdu, version, visible); //and all that data is passed to update the overlay
				});	
		
		drawMap(json, data); //draw the first rendition of the map
		setOverlay(json, overlaydata, overlayEdu, version, visible);	//draw the first rendition of the overlay
		regionLabels(json);
		$("#regionLabelSvg").hide();
	}//end of processData()
	
	function drawMap(json, data) {
		expressed = 0;
		svg.selectAll(".county")   // select country objects (which don"t exist yet)
      		.data(json.features)  // bind data to these non-existent objects
      		.enter().append("path") // prepare data to be appended to paths
     		.attr("class", "county") // give them a class for styling and access later
     		.attr("id", function(d){ return d.properties.name;})
      		.attr("d", path) // create them using the svg path generator defined above
      		.attr("align","left")
      		.style("opacity", "1")
			.on("mouseover", function(d){
				d3.select(this).style("cursor", "pointer");
								
				//Update the tooltip position and value
				//Original County Tooltip
				d3.select("#tooltip")
				  .transition()
				  .style("left",(d3.event.pageX + 5) + "px")
				  .style("top", (d3.event.pageY + 5) + "px")
				  .select("#countyName")
				  .text(d.properties.name.ucfirst());
				  
				if(attributes[expressed] != null) {
					d3.select("#attribute")
					  .text(attributes[expressed].ucfirst() + " Year-Olds: ");
				
					d3.select("#value")
					  .text(d3.format(",r")(d.properties[attributes[expressed]]));
				}

				if(!rtrigger) {
					//Show the tooltip
					d3.select("#tooltip").classed("hidden", false);
					d3.select(this)
					.style("stroke", "orange")
					.style("stroke-width", "2px");
				} else {
					d3.select("#tooltip").classed("hidden", true);
					var currentRegion = d.properties.region;
				
					hoverRegion(currentRegion, json);
				}
			 })
			.on("mouseout", function(){
					d3.select(this)
						.style("stroke", "gray")
						.style("stroke-width", "1px");
				
				d3.select("#tooltip").classed("hidden", true);
			 })
			 .on("click", function(d){ 
				if(rtrigger && !ctrigger) {
					if(d.properties.region != 0) {
						window.location = "regions/index.php?id=" + d.properties.region;
					}
				}
				if(!ctrigger && !rtrigger) {
					window.location = "counties/index.php?id=" + d.properties.name;
				}		 	
			 });
		   			
		var dataRange = getDataRange(); // get the min/max values from the data's range of data values
		if(rtrigger) {
			d3.selectAll(".county").transition()  // select all the counties
				.duration(750)
				.attr("fill", function(d, i) {//fill county function
					if(d.properties.region == Object.keys(regioncolors[i]))  { //if region in json matches a key in region colors
						return regioncolors[i]; //fill the county with that respective key's value
					}
					
					if(d.properties.region == Object.keys(regioncolors[i])) {
						return "#A1A1A1";
					}
					
					regionLabels(json);
				});
		} else {
			d3.selectAll(".county").transition()  //select all the counties and prepare for a transition to new values
			  .duration(750)  // give it a smooth time period for the transition
			  .attr("fill", function(d) {
				return getColor(d.properties[attributes[expressed]], dataRange)  // the end color value
			  });
		}
		  
		 if(!rtrigger && (expressed != null)) { //if region view is clicked and a value is picked in the dropdown
		  d3.select("#legend").remove(); //remove the old legend if there is one
		  
		  key = d3.select("body") //create a placeholder for the legend
		  			 .append("svg")
		  			 .attr("id", "legend")
		  			 .attr("width", w)
		  			 .attr("height", h);
		  
		  legend = key.append("defs") //create a gradient for the scale
		  				  .append("svg:linearGradient")
		  				  .attr("id", "gradient")
		  				  .attr("x1", "100%")
		  				  .attr("y1", "0%")
		  				  .attr("x2", "100%")
		  				  .attr("y2", "100%")
		  				  .attr("spreadMethod", "pad");
		  				  
		  legend.append("stop") //create the stop for what color to start the gradient at
		  		.attr("offset", "0%")
		  		.attr("stop-color", "#08306b")
		  		.attr("stop-opacity", 1);

		  legend.append("stop") //create the stop for what color to end the gradient at
		  		.attr("offset", "100%")
		  		.attr("stop-color", "#d6fbff")
		  		.attr("stop-opacity", 1);
		 
		  key.append("rect") //append the actual gradient scale to the key
		  	  .attr("width", w - 100)
		  	  .attr("height", h - 100)
		  	  .style("fill", "url(#gradient)")
		  	  .attr("transform", "translate(0,10)");
		  	  
		  var y = d3.scale.linear()
		  			.range([300, 0])
		  			.domain([dataRange[0], dataRange[1]]);

		  var yAxis = d3.svg.axis()
		  				.scale(y)
		  				.orient("right")
		  				.ticks(8);

		  //Legend Label
		  key.append("g")
		  	 .attr("class", "y axis")
		  	 .attr("transform", "translate(41,10)")
		  	 .call(yAxis)
		  	 .append("text")
				 .attr("y", -75)
				 .attr("x", 80)
				 .attr("dy", ".71em")
				 .attr("transform", "rotate(90)")
				 .style("text-anchor", "end")
				 .style("font-weight", "bold")
				 .style("font-size", "12pt")
				 .text("Population");
		}
		
		if(rtrigger && (expressed != null)) {
			d3.select("#legend").remove();
		}
		 
    }//end of drawMap()
	
	function sequenceMap() {
		console.log("Show Region Map");
		//regionLabels(json);
  		var dataRange = getDataRange(); // get the min/max values from the data's range of data values
		var regions = Object.keys(regioncolors);
		if(rtrigger) {
			d3.selectAll(".county").transition()  // select all the counties
				.duration(750)
				.attr("fill", function(d) {//fill county function
					for(var i = 0; i < 92; i++ ) {
						if(d.properties.region == regions[i])  { //if region in json matches a key in region colors
							return regioncolors[i]; //fill the county with that respective key's value
						}
					
						else if(!regions.indexOf(d.properties.region)) {
							return "#A1A1A1";
						}
					}
				})
				.style("opacity", "0.85");
		} else {
			d3.selectAll(".county").transition()  //select all the counties and prepare for a transition to new values
			  .duration(750)  // give it a smooth time period for the transition
			  .attr("fill", function(d) {
				return getColor(d.properties[attributes[expressed]], dataRange)  // the end color value
			  });
		}
		 
		  //create the legend
		  if(!rtrigger && (expressed != null)) { //if region view is clicked and a value is picked in the dropdown
		  d3.select("#legend").remove(); //remove the old legend if there is one
		  
		  key = d3.select("body") //create a placeholder for the legend
		  			 .append("svg")
		  			 .attr("id", "legend")
		  			 .attr("width", w)
		  			 .attr("height", h);
		  
		  legend = key.append("defs") //create a gradient for the scale
		  				  .append("svg:linearGradient")
		  				  .attr("id", "gradient")
		  				  .attr("x1", "100%")
		  				  .attr("y1", "0%")
		  				  .attr("x2", "100%")
		  				  .attr("y2", "100%")
		  				  .attr("spreadMethod", "pad");
		  				  
		  legend.append("stop") //create the stop for what color to start the gradient at
		  		.attr("offset", "0%")
		  		.attr("stop-color", "#08306b")
		  		.attr("stop-opacity", 1);

		  legend.append("stop") //create the stop for what color to end the gradient at
		  		.attr("offset", "100%")
		  		.attr("stop-color", "#d6fbff")
		  		.attr("stop-opacity", 1);
		 
		  key.append("rect") //append the actual gradient scale to the key
		  	  .attr("width", w - 100)
		  	  .attr("height", h - 100)
		  	  .style("fill", "url(#gradient)")
		  	  .attr("transform", "translate(0,10)");
		  	  
		  var y = d3.scale.linear()
		  			.range([300, 0])
		  			.domain([dataRange[0], dataRange[1]]);

		  var yAxis = d3.svg.axis()
		  				.scale(y)
		  				.orient("right")
		  				.ticks(8);

		  //secondary legend label
		  key.append("g")
		  	 .attr("class", "y axis")
		  	 .attr("transform", "translate(41,10)")
		  	 .call(yAxis)
		  	 .append("text")
				 .attr("y", -75)
				 .attr("x", 80)
				 .attr("dy", ".71em")
				 .attr("transform", "rotate(90)")
				 .style("text-anchor", "end")
				 .style("font-weight", "bold")
				 .style("font-size", "12pt")
				 .text("Population");
		}
		
		//if the region button is triggered, remove the legend
		if(rtrigger && (expressed != null)) {
			d3.select("#legend").remove();
		}
	}//end of sequenceMap()
	
	//find the color of the county based on data pulled in and set to a color scale
	function getColor(valueIn, valuesIn) {
	  color = d3.scale.log() 
		 .domain([valuesIn[0],valuesIn[1]])  // input uses min and max values
		 .range(["#d6fbff","#08306b"]); //use #d2f7fc","#bbffcc" here instead!!
	  
	  return color(valueIn);  // return that color to the caller
	}//end of getColor()
	
	function getDataRange() {
  	// function loops through all the data values from the current data attribute
 	// and returns the min and max values
	  var min = Infinity, max = -Infinity;  
	  d3.selectAll(".county")
		.each(function(d,i) {
			  var currentValue = d.properties[attributes[expressed]];
			  if(currentValue <= min && currentValue != -99 && currentValue != 'undefined') {
				min = currentValue;
			  }
			  if(currentValue >= max && currentValue != -99 && currentValue != 'undefined') {
				max = currentValue;
			  }
		  });
		  
		  return [min, max]; 
	}//end of getDataRange()

	
	// $("#selectCountyButton").click(function() {
// 		!ctrigger ? (ctrigger = 1, $(this).css("background-color", "orange")) : (ctrigger = 0, $(this).css("background-color", "gray"));
// 	});//end of selectCountyButton click function
// 	
// 	function selectCounties() {
// 		$(".county").hover(function() {
// 		  $(this).css("pointer","crosshair")
// 		});
// 	}//end of selectCounties()

	$("#region").click(function() {
		!rtrigger ? (rtrigger = 1, $(this).css("background-color", "orange"), 		$("#regionLabelSvg").show()) : (rtrigger = 0, $(this).css("background-color", "white"), $("#regionLabelSvg").hide());
		sequenceMap();
	});
	
	$("#clearOverlay").click(function() {
		clearOverlay();
	});
	
	function hoverRegion(currentRegion, json) {
		for(var i = 0; i < json.features.length; i++) {
			if(currentRegion == json.features[i].properties.region && (json.features[i].properties.region != 0)) {
				$("#" + json.features[i].properties.name).addClass("hoverRegion");
			}
		}
		
		$(".hoverRegion").mouseover(function() {
			$(".hoverRegion").css("opacity", "1");
		}).mouseout(function() {
			$(".hoverRegion").css("opacity", "0.75");
			$(".hoverRegion").removeClass("hoverRegion");
		});
	}
	
	function regionLabels(json) {
		console.log(json);
		var regions = Object.keys(regioncolors);
		var x=0, y=0, numRegions = 0;
		
		for(var j = 1; j < 15; j++) {
			for(var i = 0; i < json.features.length; i++) {
				if(json.features[i].properties.region == regions[j]) {
					x += json.features[i].properties.centroid[0];
					
					y += json.features[i].properties.centroid[1];
					numRegions++;
				}
			}
			 
			rCentroids.push(x/numRegions + "," + y/numRegions);
			numRegions = 0;
			x = 0; 
			y = 0;
		}	
		
		//console.log(rCentroids);

		for(var m = 0; m < rCentroids.length; m++) {
			var circle = makeSVG('circle', {
						cx: Number(rCentroids[m].substring(0, rCentroids[m].indexOf(","))), 
						cy: Number(rCentroids[m].substring(rCentroids[m].indexOf(",") + 1, rCentroids[m].length)), 
						r: 10, 
						stroke: '#666666', 
						'stroke-width': 1, 
						fill: '#cccccc'});
			$(circle).addClass("regionLabel");
			 $("#regionLabelSvg").append(circle);
			
			var label = d3.select("#regionLabelSvg").append("text")
						.attr("x", Number(rCentroids[m].substring(0, rCentroids[m].indexOf(",")))-3)
						.attr("y", Number(rCentroids[m].substring(rCentroids[m].indexOf(",") + 1, rCentroids[m].length))+4)
						.attr("font-size", "10px")
						.attr("fill", "black")
						.text(m+1);
						
		  		
			
/*		    var label = document.createElement("div");
		    label.innerHTML = '<span>' + m + '</span>';
		    label.className = "regNum";
		    label.style.width = "10px";
		    label.style.height = "10px";
		    label.style.left = rCentroids[m].substring(0, rCentroids[m].indexOf(",")) +'px';
			label.style.top = rCentroids[m].substring(rCentroids[m].indexOf(",") + 1, rCentroids[m].length) +'px';
*/		   
			
			//$("#regionLabelSvg").append(label);

			console.log(label);		
			
		}
	}
	
	function makeSVG(tag, attrs) {
            var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
            for (var k in attrs)
                el.setAttribute(k, attrs[k]);
            return el;
    }
        
	setMap();
		
	//////////////////////////////////////////////////////
	//					   Overlay					    //
	//////////////////////////////////////////////////////

 	//overlay on Indiana map, secondary visualization of data
 	function setOverlay(json, overlaydata, overlayEdu, version, visible) { 		
 		var min = Infinity, max = -Infinity;  
	  	
	  	//goes through each county finding the min and max values of the secondary data selected
		for(var i = 0; i < 92; i++) {
			  var currentValue;
			  if(version == "population") {
			  	currentValue = json.features[i].properties[overlayAtt[overlaydata]] / json.features[i].properties.total;
			  } else {
			  	currentValue = json.features[i].properties[educationAttributes[overlayEdu]];
			  }
			  
			  if(currentValue <= min && currentValue != -99 && currentValue != 'undefined') {
				min = currentValue;
			  }
			  if(currentValue >= max && currentValue != -99 && currentValue != 'undefined') {
				max = currentValue;
			  }
		}
		
		var dataRange = getRangeOverlay();
					
 		overlay.selectAll(".secondary") //selecting circles with class secondary
			.data(centroids) //binding centroid data to them
			.enter() //actually creating the elements
			.append("circle") //and appending the circles
			.attr("class", "secondary") //and actually assigning the classes
			.attr("cx", function(d) { //returns x value of each centroid, in exact order as json data
				return d[0];
			})
			.attr("cy", function(d) { //returns y value of each centroid, in exact order as json data
				return d[1];
			})
			.attr("r", function(d, i) {
				var valueIn;
				if(version == "population") {
					valueIn = json.features[i].properties[overlayAtt[overlaydata]] / json.features[i].properties.total;
				} else {
					valueIn =  json.features[i].properties[educationAttributes[overlayEdu-1]];
				}
				
				return getOverlayValue(valueIn, dataRange);
			})
			.attr("fill", "#ffffcc")
			.style("opacity", "0.7")
			.attr("stroke", "#810E12")
			.style("stroke-width", "1px")
			.on("mouseover", function(d, i){
				if(ctrigger) {
					d3.select(this).style("cursor", "crosshair");
				} else {
					d3.select(this).style("cursor", "pointer");
				}
												
				//Update the tooltip position and value
				//Primary population tooltip
				d3.select("#tooltip")
				  .transition()
				  .style("left",(d3.event.pageX + 5) + "px")
				  .style("top", (d3.event.pageY + 5) + "px")
				  .select("#countyName")
				  .text(json.features[i].properties.name.ucfirst());
				  
				if(version == "population") {
					d3.select("#attribute")
					  .text("Ratio of " + overlayAtt[overlaydata] + " to Total" + ": ");
					  
					d3.select("#value")
				  	  .text(((json.features[i].properties[overlayAtt[overlaydata]] / json.features[i].properties.total) * 100).toFixed(2)  + "%");
				} else {
					d3.select("#attribute")
					  .text("Ratio of " + educationAttributes[overlayEdu-1] + " to Total" + ": ");
					  
					d3.select("#value")
				  	  .text(d3.format(",r")(json.features[i].properties[educationAttributes[overlayEdu-1]]));
				}
				
				//Show the tooltip
				d3.select("#tooltip").classed("hidden", false);
			 })
			.on("mouseout", function(){				
				d3.select("#tooltip").classed("hidden", true);
			 });	
			 
			 if(!visible) {
			 	$("#overlay").hide();
			 }
	}//end of setOverlay()
	
	function sequenceOverlay(json, overlaydata, overlayEdu, version, visible) {
		var dataRange = getRangeOverlay();
		if(visible) {
			$("#overlay").show();
			$("#overlay").css("height", 700);
			$("#overlay").css("width", 500);
			overlay.selectAll(".secondary") 
				.attr("r", function(d, i) {
					var valueIn;
					if(version == "population") {
						valueIn = json.features[i].properties[overlayAtt[overlaydata-1]] / json.features[i].properties.total;
					} else {
						valueIn =  json.features[i].properties[educationAttributes[overlayEdu]];
					}
					
					return getOverlayValue(valueIn, dataRange);
				})
				.on("mouseover", function(d, i){
				if(ctrigger) {
					d3.select(this).style("cursor", "crosshair");
				} else {
					d3.select(this).style("cursor", "pointer");
				}
				
				d3.select(this).style("opacity", 1);
								
				//Update the tooltip position and value
				//Secondary Population overlay
				d3.select("#tooltip")
				  .transition()
				  .style("left",(d3.event.pageX + 5) + "px")
				  .style("top", (d3.event.pageY + 5) + "px")
				  .select("#countyName")
				  .text(json.features[i].properties.name.ucfirst());
				  
				  
				if(version == "population") {
					d3.select("#attribute")
					  .text("Ratio of " + overlayAtt[overlaydata-1] + " Year-Olds to Total" + ": ");
					  
					d3.select("#value")
				  	  .text(((json.features[i].properties[overlayAtt[overlaydata-1]] / json.features[i].properties.total) * 100).toFixed(2)  + "%");
				} else {
					d3.select("#attribute")
					  .text(educationFull[overlayEdu] + ": ");
					  
					d3.select("#value")
				  	  .text(d3.format(",r")((json.features[i].properties[educationAttributes[overlayEdu]]).toFixed(0)));
				}
				
				//Show the tooltip
				d3.select("#tooltip").classed("hidden", false);
			 })
			.on("mouseout", function(){
				d3.select(this)
					.style("opacity", 0.7);
				
				d3.select("#tooltip").classed("hidden", true);
			 });	
		}
	}//end of sequenceOverlay()
	
	function getRangeOverlay() {
  	// function loops through all the data values from the current data attribute
 	// and returns the min and max values
	  var min = Infinity, max = -Infinity;  
	  d3.selectAll(".county")
		.each(function(d,i) {
			  var currentValue;
			  if(version == "population") {
			  	currentValue = d.properties[overlayAtt[overlaydata-1]] / d.properties.total;
			  } else {
			  	currentValue = d.properties[educationAttributes[overlaydata]];
			  }
			  
			  if(currentValue <= min && currentValue != -99 && currentValue != 'undefined') {
				min = currentValue;
			  }
			  if(currentValue >= max && currentValue != -99 && currentValue != 'undefined') {
				max = currentValue;
			  }
		  });
				  
		  return [min, max]; 
	}//end of getRangeOverlay()
	
	function getOverlayValue(valueIn, valuesIn) {
	 //new linear scale for the radii of circles 
	  var rscale = d3.scale.linear()
					.domain([valuesIn[0],valuesIn[1]])
					.range([7, 12]);
	  
	  return rscale(valueIn);  // return that number to the caller
	}//end of getOverlayValue()
	
	function clearOverlay() {
		d3.selectAll(".secondary")
			.attr("r", 0); //removes all elements inside of overlay svg	
		$("#overlay").css("width", 0);	
		$("#overlay").css("height", 0);
	} //end of clearOverlay
	
	String.prototype.ucfirst = function() {
    	return this.charAt(0).toUpperCase() + this.substr(1);
	}
	
	//window.onload = checkRegion;
	setTimeout(checkRegion, 1000);
	
	function checkRegion() {
		var check = "/regions/";
		var prevURL = document.referrer.toString();
		if(prevURL.indexOf(check) != -1) {
			rtrigger = 1;
			$("#region").css("background-color", "orange")
			sequenceMap();
		}
	}
});
