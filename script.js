var dir_location = document.getElementById("directory");
var dir_log_table = document.getElementById("dir_log");
var storeDirArray = []; // this array stores the last 3 directory locations
//console.log(localStorage)
var currentTab = 0; // Current tab is set to be the first tab (0)

function handleLog () {
    if (localStorage["comNmonDir"] == undefined) {return} // when comNmonDir is found i.e if the directory location is available
        dir_log_table.innerHTML = '<tr><th>Directory Log:</th></tr>';
        dir_log_table.style = 'display: block;'; // table is made visible
        storeDirArray = JSON.parse(localStorage.getItem("comNmonDir"));

        storeDirArray.forEach(function(val,index){
            var table_length = dir_log_table.rows.length;
            var row = dir_log_table.insertRow(table_length);
            row.setAttribute("id", index);

            var cell1 = row.insertCell(0); // directory location
            var cell2 = row.insertCell(1); // select button
            var cell3 = row.insertCell(2); // delete button

            cell1.innerHTML = val;

            var sel_button = document.createElement("button");
            sel_button.innerText = "SEL";
            sel_button.setAttribute('class','sel'); // class added
            sel_button.setAttribute("onclick", 'selButton(this)'); // select function attribute added
            cell2.appendChild(sel_button);

            var del_button = document.createElement("button");
            del_button.setAttribute('class','del'); // class added
            del_button.setAttribute("onclick", 'delButton(this)'); // delete function attribute added
            del_button.innerText = "DEL";
            cell3.appendChild(del_button);

        });
}; // handle log closed



function selButton (button) {
    getFolder(button.parentNode.parentNode.firstChild.innerText);
};

function delButton (button) {
    var row_container = button.parentNode.parentNode;
    if (row_container.id > -1) { // the value is deleted from the array
        storeDirArray.splice(row_container.id, 1);
    }
    //console.log(storeDirArray);
    if(storeDirArray.length > 0) {
        localStorage.setItem("comNmonDir", JSON.stringify(storeDirArray)); // and the array is overwritten
    } else {
        delete localStorage['comNmonDir'];
    };


    while (dir_log_table.firstChild) {
        dir_log_table.removeChild(dir_log_table.firstChild);
    }

    handleLog();

    /* the function is called again in order to make the rows again, as the rows' ids
        are appended considering the index of the value from the array.
        The delete button removes the selected element from the array, now the array has changed but not
        the rows' ids, so in order to make them sync the handleLog function is called again.
    */
};





dir_location.addEventListener("keydown",function(e){
    if (e.keyCode == 13) {
      e.preventDefault();
        getFolder(dir_location.value);
        console.log(dir_location.value);
    }
})

function fixString(x) { // adds slash at the end of the string also checks for adjacent slashes and removes them
            if(x.charAt(x.length-1) != "/") {
                x+="/";
            };

            for (var i = 0; i < x.length ; i++) {
                if (x.charAt(i) == "/" && x.charAt(i+1) == "/"){
                    x = x.slice(0,i) + x.slice(i+1);
                    i = i-1;
                }
            };
            return x; // returns the value
        };

function getFolder(folderVal) {
    if(folderVal == ""){return}// checks if the value isn't empty

        var location_val = fixString(folderVal); // the fixString function manipulates the string and returns the value

        $.ajax({
            type: "GET",
            url: "./server.php",
            data: {'directory_location': location_val },
            dataType: "text"
            }).done(function(response) {
                if(response == "not_available"){
                    alert("Directory isn't available")
                } else if (response = "available") {
                    // checks the duplication
                    if(!checkDuplication(storeDirArray,location_val)) {
                        if(storeDirArray.length == 3) { // deletes the last element if the length is equal to 3
                            storeDirArray.pop();
                        }
                        storeDirArray.unshift(location_val);
                        localStorage.setItem("comNmonDir", JSON.stringify(storeDirArray));
                    };

                    // redirecting to the page that opens the directory
                    //window.location = "./nmonDirectory.php?nmonDirectory="+location_val;
                    nextPrev(1,location_val);

            }

        });
} // folder closed

// this function checks if any of the array's element is equal to the value
function checkDuplication(array,value) {
    return (array.some(function(e){
            return value == e;
    }));
}



function showTab(n) {
    // This function will display the specified tab of the form...
    var x = document.getElementsByClassName("tab");
    x[n].style.display = "block";


    //... and run a function that will display the correct step indicator:
    fixStepIndicator(n)
}

function nextPrev(n,value) {
    // This function will figure out which tab to display
    var x = document.getElementsByClassName("tab");
    // change the step color
    if(n === 1){
        document.getElementsByClassName("step")[currentTab].className += " finish";
    }
    // Hide the current tab:
    x[currentTab].style.display = "none";
    // Increase or decrease the current tab by 1:
    currentTab = currentTab + n;
    console.log(currentTab)
    // hanlde the current tab data
    handleCurrentTab(currentTab,n,value);
    // Display the correct tab:
    showTab(currentTab);
}


function fixStepIndicator(n) {
    // This function removes the "active" class of all steps...
    var i, x = document.getElementsByClassName("step");
    for (i = 0; i < x.length; i++) {
    x[i].className = x[i].className.replace(" active", "");
    }
    //... and adds the "active" class on the current step:
    x[n].className += " active";
}

function handleCurrentTab(currentTab,n,directory_path) {
    // inputs the value
    if(currentTab == 1 && n === 1) {
        document.getElementById("selected_directory").innerText = directory_path;
    }
    // toggle the display
    if(currentTab > 0 && currentTab < 3){
        document.getElementsByClassName("header")[0].style = "display:block;";
        document.getElementsByClassName("button top")[0].style = "display:block";    
        document.getElementsByClassName("button bottom")[0].style = "display:block";
    } else if (currentTab == 0 || currentTab==3) {
    document.getElementsByClassName("header")[0].style = "display:none;";
    document.getElementsByClassName("button top")[0].style = "display:none";
    document.getElementsByClassName("button bottom")[0].style = "display:none";
    };
};