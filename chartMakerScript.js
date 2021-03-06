var chartTypes = ["CPU_UTIL"];



// charts object data
var chartsObject;
// stores the keys of the object or heading so the charts
var chartIds = []
// stores the chart id for the chart being processed
var currentChartId;
// pointer to iterate the charts
var pointer = 0;

// keeps all the chart data object used to make the graph
var googleChartData = [];



// ajax call function
function ajaxCall(task,filesObj,data,viewType) {

    var ajaxResponse;
    var postData;
    var pyurl;

    if(task == "readFile") { // read the files to make the chart data for individual files
        nmonDir = data;
        postData = {'filesObj': JSON.stringify(filesObj), 'nmonDir': nmonDir, 'chartIds': JSON.stringify(chartTypes)};
        pyurl = "./chartDataArray.py";
    
    } else { // make the chart lines to make average or group the files together
        chartDataArray = data;
        postData = {'filesObj': JSON.stringify(filesObj), 'chartDataArray': JSON.stringify(chartDataArray), 'viewType': viewType};
        pyurl = "./chartLines.py";
    
    };


    // run the ajax request
    $.ajax({
        type: "POST",
        async: false,
        url: pyurl,
        data: postData, 
        dataType: "text"
    }).done(function(response) {
         ajaxResponse = response;
    }); 
    
    // return the ajaxResponse
    return ajaxResponse;
};




function chartMaker(viewType="A",chartType="CPU_UTIL") {
    
    // disable the handlers
    $("#viewDropDown").prop("disabled",true);

    // disable the display
    display("disable");


    // call chartView to make the chartObject
    chartView(viewType,chartType);

    
    // prepare the html structure for the charts
    prepareHTML()


    // prepare the charts 
    prepareCharts()


    // enable the handlers
    display("enable")

};



function chartView(viewType,chartType) {

    // create the sorted chartData to send only the relevant data corresponding to the current chart id
    var sortedChartData = {}
    //console.log(chartType)

    //console.log(filesChartData)
    // return data array of only the current chart id
    Object.keys(JSON.parse(filesChartData)).filter(function (k) { return RegExp(chartType).test(k); }).forEach(function (k) { return sortedChartData[k] = JSON.parse(filesChartData)[k]; });


    var chartFileDetails = filesDetails.typewise;

    if(viewType == "D" || viewType == "B"){ // for chart view type D and B make send the runwise sorted selected files
        chartFileDetails = filesDetails.runwise;
    }


    // call ajaxCall to make the chartsLines obj for chart formation
    chartsObject = (ajaxCall("chartlines",chartFileDetails,sortedChartData,viewType));
    
    console.log(chartsObject)
    
    // update the chartIds that are the headings or the charts
    chartIds = Object.keys(JSON.parse(chartsObject))
};







// prepares the html base for all chart types
function prepareHTML(){

    // clear the charts
    $("#comNmonCharts").empty()

    googleChartData = [];

    var chartDiv = $("#comNmonCharts")[0];

    var bootstrapClassName = "col-sm-6";
    if(chartIds.length == 1){
        bootstrapClassName = "col-sm-12"
    }


    // update the html page with the div for chart and the respective heading
    for(var heading in JSON.parse(chartsObject)){

        var chartHeading;
        // check if the heading is a string then add the suffix "s"
        isNaN(heading.slice(0,13))? chartHeading = heading + "s": chartHeading = heading;
        
        if(JSON.parse(chartsObject)[heading].blacklist != undefined && JSON.parse(chartsObject)[heading].blacklist.length != 0) {
            alert("for chart: " + heading + "\n File(s) couldn't be processed: " + JSON.parse(chartsObject)[heading].blacklist);
        }
        
        var chartHTML = `<div class="${bootstrapClassName} charts">
        <h3>${chartHeading}</h3>
        <div id=${heading} style="width:100%; height:75%;"></div>
      </div>`;
    

      chartDiv.innerHTML += chartHTML;
      
    };

};


// prepares the charts
function prepareCharts(){

    if(chartIds[pointer] == undefined){
        // reset the pointer
        pointer = 0;

        syncCursors();

        return;
    }

    currentChartId = chartIds[pointer];

    google.charts.setOnLoadCallback(drawChart);

};




// draws the selected chart
function drawChart() {


    var options_CPU_UTIL = {
        chartArea: {left: "5%", width: "85%", top: "10%", height: "80%"},
        title: "CPU Utilisation Percentages",
        focusTarget: "category",
        legend: {position: 'top', textStyle: {color: 'black'}},
        tooltip: {trigger: 'selection'},
        hAxis: {
          gridlines: {
            color: "lightgrey",
            count: (JSON.parse(chartsObject)[currentChartId].chart.length - 1),
          }
        },
        vAxis: {
          gridlines: {
            color: "lightgrey",
            count: 11
          }
        },
        explorer: { actions: [/*"dragToZoom", "rightClickToReset"*/],
          axis: "horizontal",
          keepInBounds: true,
          maxZoomIn: 20.0
        },
        isStacked:  1
      };

      // color the servers from the same run:
      // 
      console.log(JSON.parse(chartsObject)[currentChartId].chart)

      var data_CPU_UTIL = google.visualization.arrayToDataTable(JSON.parse(chartsObject)[currentChartId].chart);


      if($("#viewDropDown")[0].value == "C" || $("#viewDropDown")[0].value == "D") {
          var viewType = $("#viewDropDown")[0].value;
        // add the color array
        options_CPU_UTIL.colors = [];
        // add colors to differentiate the server runwise
        chartColors(data_CPU_UTIL,options_CPU_UTIL,(JSON.parse(chartsObject)[currentChartId].chart),viewType);
      };



      chart = new google.visualization.AreaChart(document.getElementById(currentChartId));
      chart.draw( data_CPU_UTIL, options_CPU_UTIL);



    googleChartData.push(chart);


    // update pointer index
    pointer++;
    // make the next chart
    prepareCharts();

};



function chartColors(data,options,label,viewType) {

    // get the legend names from the labels
    var label = (JSON.parse(chartsObject)[currentChartId].chart)[0]
    label.shift();
    var colors = ['blue','red','yellow','green','purple','orange','seagreen'];

    // previous run
    var preVal;
    // sorting method
    var stringCom;
    viewType == "C" ? stringCom = "/" : stringCom = "_";


    label.forEach(function(val){

        var curVal = val.slice(0,val.indexOf(stringCom))

        if(preVal == undefined || preVal != curVal ) {
            // push the color
            options.colors.push(colors[0]);
            // shift the color
            colors.push(colors.shift());
            
        } else {
            options.colors.push(colors[colors.length-1]);
        }
        preVal = curVal;

    })

};












function syncCursors() {
    
    googleChartData.forEach(function(chart){            
        google.visualization.events.addListener(chart,'select',function(){
                var selectedPoint = chart.getSelection();
                // return if the selected point is none
                if(!selectedPoint.length){return;}
                // get the selectedRow
                var selectedRow = selectedPoint[0].row;

                googleChartData.forEach(function(element){

                    // current chart row length
                    var currentChartRowLength = element.J.hc.length-1;

                    // comparing the selected row with the number of rows of the chart selected
                    // if it is greater
                    if(selectedRow > currentChartRowLength){
                        // copy the selectedPoint
                        var lastSelectedPoint = selectedPoint;
                        // set the selection to the last row
                        lastSelectedPoint[0].row = currentChartRowLength;

                        // update the position
                        element.setSelection(lastSelectedPoint);
                    } else {
                        // select/update the new point as the selected one
                        element.setSelection(chart.getSelection());
                    };

                })
        })

    });


    // google.visualization.events.addListener(googleChartData[0], 'onmouseover', function(entry) {
    //     chart.setSelection([{row: entry.row}]);
    //     //console.log("hey");
    //     //console.log(entry)
    //  });


};












// handler for selected chart type
$("#chartbuttons>button").on("click",function(){
    // store the chart type and view type
    var chartType = this.id.slice(5);
    var viewType = $("#viewDropDown")[0].value;

    // handler
    if(chartType !="CPU_UTIL") {
        alert("wip for: " + chartType + " chart type");
        return;
    };

    // make the charts with respect to the view type and selected chart type
    chartMaker(viewType,chartType);
})




// handler for the selected view type
$("#viewDropDown").on("change",function(){
    
    // make the charts with respect to the select view type and the default chart type
    chartMaker(this.value);

    //console.log(this.value)

})




function display(prop){
    if(prop == "enable") { // enable the drop down and buttons
        $("#viewDropDown").attr("disabled",false);
        $("#chartbuttons>button").attr("disabled",false);
    } else if (prop == "disable") { // disable the drop down and button
        $("#viewDropDown").prop("disabled",true);
        $("#chartbuttons>button").prop("disabled",true);
    };
};