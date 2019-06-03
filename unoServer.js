const WebSocket = require('ws');
const fs = require('fs');
const axios = require('axios');

let count = 0
let timeout = 10 //second

let locationRawData = fs.readFileSync('location.json');  
let locationJson = JSON.parse(locationRawData)
const point_home = "0ad70b40 b6f3a940 5ea232bf 915f373f" // Home
const point_drink_area_1 = "ae471140 8b6c0f40 024633bf a9bf363f" // Drink Area
const point_drink_area_2 = "ae471140 8b6c0f40 024633bf a9bf474g" // Drink Area

let location_home = JSON.parse(JSON.stringify(locationJson));
location_home.msg_data.data.waypoint_coord = point_home
location_home.msg_data.data.waypoint_name = "Home"

let location_drink_area_1 = JSON.parse(JSON.stringify(locationJson));
location_drink_area_1.msg_data.data.waypoint_coord = point_drink_area_1
location_drink_area_1.msg_data.data.waypoint_name = "Drink Area 1"

let location_drink_area_2 = JSON.parse(JSON.stringify(locationJson));
location_drink_area_2.msg_data.data.waypoint_coord = point_drink_area_2
location_drink_area_2.msg_data.data.waypoint_name = "Drink Area 2"

module.exports = class UnoServer { 
    constructor() {
        this.ws = new WebSocket('ws://127.0.0.1:8125/tmsmsg');
    }

    initServer() {
        var that = this;
        this.ws.on('open', function open() {
            console.log('[Uno Server] connected');
            that.ws.send(Date.now());
          });
          
        this.ws.on('close', function close() {
            console.log('[Uno Server] disconnected');
        });
        
        this.ws.on('message', function incoming(data) {
            // console.log(`Roundtrip time: ${Date.now() - data} ms`);
            let result = JSON.parse(data);
            console.log("[Uno Server] =============  ",result.msg_data.api_path,"  =============")
            switch(result.msg_data.api_path) {
                case "fullstatus":
                    console.log("[Uno Server] from_waypoint_info: ", result.msg_data.data.from_waypoint_info.waypoint_name," ",result.msg_data.data.from_waypoint_info.waypoint_coord ,
                    "\ntarget_waypoint_info: ", result.msg_data.data.target_waypoint_info.waypoint_name , result.msg_data.data.target_waypoint_info.waypoint_coord,
                    "\nreached_waypoint_info: ",result.msg_data.data.reached_waypoint_info.waypoint_name," ", result.msg_data.data.reached_waypoint_info.waypoint_coord,
                    "\nlast_target_waypoint_info: ", result.msg_data.data.last_target_waypoint_info.waypoint_name," ", result.msg_data.data.last_target_waypoint_info.waypoint_coord)
                    break;
                case "missions/started":
                    console.log("[Uno Server] Mission Start")
                        break;    
                case "missions/status":
                    // console.log(result)
                    console.log("[Uno Server] Mission Status: ", result.msg_data.data.status_detail, result.msg_data.data.status_data)            
                    break;
                case "missions/completed":
                    console.log("[Uno Server] Arrived", result.msg_data.data.waypoint_coord == point_home ? "Home" : result.msg_data.data.waypoint_coord == point_drink_area_1 ? "Drink Area 1" : "Drink Area 2")
                    if (result.msg_data.data.status_data == point_drink_area) {
                        setTimeout(function() {
                            this.ws.send(JSON.stringify(location_home));
                        }, timeout * 1000)
                    } else {
                        console.log("[Uno Server] Finish Count", ++count)

                        axios.post('http://' + this.host + ':' + this.port + '/action', {
                            type: 'start',
                            drinkType: drinkType
                        })
                        .then((res) => {
                            resolve(res)
                        })
                        .catch((error) => {
                            reject(error)
                        })
                    }
                    break
                case "gotolocation":
                    console.log("[Uno Server] Going to", result.msg_data.data.waypoint_coord == point_home ? "Home" : result.msg_data.data.waypoint_coord == point_drink_area_1 ? "Drink Area 1" : "Drink Area 2")
                    break
                default:
                    console.log(`[Uno Server] ${result.msg_data.api_path}`)
            }
            console.log("[Uno Server] ======================*===================\n")
        });
    }

    gotoLocation(location) {
        this.ws.send(JSON.stringify(location == 0 ? location_drink_area_1 : location_drink_area_2));
    }
}
