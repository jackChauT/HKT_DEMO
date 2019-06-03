/* README
*   status/completed: 55 77 03 03 03 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
*
*/
const fs = require('fs');
const http = require('http')
const WebSocket = require('ws');

const host = "10.129.2.91"
const port = 3333

const ws = new WebSocket('ws://127.0.0.1:8125/tmsmsg');

let count = 0
let timeout = 5 //second
let isRunning = false;
let locationRawData = fs.readFileSync('location.json');  
let locationJson = JSON.parse(locationRawData)
const point_home = "0ad70b40 b6f3a940 5ea232bf 915f373f" // Home
const point_drink_area = "ae471140 8b6c0f40 024633bf a9bf363f" // Drink Area
let location_home = JSON.parse(JSON.stringify(locationJson));
location_home.msg_data.data.waypoint_coord = point_home
location_home.msg_data.data.waypoint_name = "Home"

let location_drink_area = JSON.parse(JSON.stringify(locationJson));
location_drink_area.msg_data.data.waypoint_coord = point_drink_area
location_drink_area.msg_data.data.waypoint_name = "Drink Area"


// Uno Server
ws.on('open', function open() {
    console.log('connected');
    ws.send(Date.now());
  });
  
ws.on('close', function close() {
    console.log('disconnected');
});

ws.on('message', function incoming(data) {
    // console.log(`Roundtrip time: ${Date.now() - data} ms`);
    let result = JSON.parse(data);
    console.log("=============  ",result.msg_data.api_path,"  =============")
    switch(result.msg_data.api_path) {
        case "fullstatus":
            console.log("from_waypoint_info: ", result.msg_data.data.from_waypoint_info.waypoint_name," ",result.msg_data.data.from_waypoint_info.waypoint_coord ,
            "\ntarget_waypoint_info: ", result.msg_data.data.target_waypoint_info.waypoint_name , result.msg_data.data.target_waypoint_info.waypoint_coord,
            "\nreached_waypoint_info: ",result.msg_data.data.reached_waypoint_info.waypoint_name," ", result.msg_data.data.reached_waypoint_info.waypoint_coord,
            "\nlast_target_waypoint_info: ", result.msg_data.data.last_target_waypoint_info.waypoint_name," ", result.msg_data.data.last_target_waypoint_info.waypoint_coord)
            break;
        case "missions/started":
            console.log("Mission Start")
                break;    
        case "missions/status":
            // console.log(result)
            console.log("Mission Status: ", result.msg_data.data.status_detail, result.msg_data.data.status_data)            
            break;
        case "missions/completed":
            console.log("Arrived", result.msg_data.data.status_data == point_home ? "Home" : "Drink Area", result.msg_data.data.status_data)
            if (result.msg_data.data.status_data == point_drink_area) {
                setTimeout(function() {
                    ws.send(JSON.stringify(location_home));
                }, timeout * 1000)
            } else {
                console.log("Finish Count", ++count)
            }
            break
        case "gotolocation":
            console.log("Going to", result.msg_data.data.waypoint_coord == point_home ? "Home" : "Drink Area", result.msg_data.data.waypoint_coord)
            break
        default:
            console.log(result.msg_data.api_path)
    }
    console.log("======================*===================\n")
});

// Web Server
const server = http.createServer(function(request, response) {
// console.dir(request.param)
// console.log(request.url) // drink.html
    switch(request.method) {
        case "POST":
            switch(request.url) {
                case "status":
                    break;
                case "option":
                    break;
                default:
            }
            if(request.url == "/drink_type.html") {
            var isValidResponse = true
            request.on('data', function(data) {
                console.log(JSON.parse(data))
                var json = JSON.parse(data)
                isValidResponse = isValidAndDrinkHandler(json.type)
                // send "gotolocation" to Uno server 
            })
            request.on('end', function() {
                // console.log('Body: ' + body)
                if (isValidResponse) {
                    response.writeHead(200, {'Content-Type': 'text/html'})
                    response.end('success')
                    ws.send(JSON.stringify(location_drink_area));
                } else {
                    errorResponse(response,'Param error, Param must be <= 2 and Integer')
                }
            })
            } else {
                errorResponse(response,'URL Error, must be drink.html')
            }
        break;
        case "GET":
            errorResponse(response,'Only Accept Post')
        break;
        default:
            errorResponse(response,'Error on Method')
    }
})

function isValidAndDrinkHandler(type) {
    if (!isNaN(type)) {
        var bool = true
        switch(parseInt(type)) {
            case 1:
                console.log("Get Can");
            break;
            case 2:
                console.log("Get Soft Drink");
            break;
            default:
                bool = false
        }
        return bool
    } else {
        return false
    }
}

function errorResponse(response, responseString) {
    console.log("errorResponse: " + responseString)
    response.writeHead(200, {'Content-Type': 'text/html'})
    response.end(responseString)
}


server.listen(port, host)
console.log(`Listening at http://${host}:${port} \n`)