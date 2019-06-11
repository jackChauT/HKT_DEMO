const WebSocket = require('ws');
const fs = require('fs');
const axios = require('axios');

let count = 0
let timeout = 2 //second

let last_is_charging = ""

let locationRawData = fs.readFileSync('location.json');  
let locationJson = JSON.parse(locationRawData)
const point_home = "85eb913f ec51b8be f704353f f70435bf" // Home
const point_drink_area_1 = "cdcc4cbf 6666a63f f704353f f704353f" // Drink Area 1
const point_drink_area_2 = "f6285cbf c3f54840 ec79883c e4f67f3f" // Drink Area 2

let location_home = JSON.parse(JSON.stringify(locationJson));
location_home.msg_data.data.waypoint_coord = point_home
location_home.msg_data.data.waypoint_name = "Home"

let location_chargingPoint = JSON.parse(JSON.stringify(locationJson));
location_chargingPoint.msg_data.api_path = "missions/gorecharge"
location_chargingPoint.msg_data.data.waypoint_name = "Charging Point"

let location_drink_area_1 = JSON.parse(JSON.stringify(locationJson));
location_drink_area_1.msg_data.data.waypoint_coord = point_drink_area_1
location_drink_area_1.msg_data.data.waypoint_name = "Drink Area 1"

let location_drink_area_2 = JSON.parse(JSON.stringify(locationJson));
location_drink_area_2.msg_data.data.waypoint_coord = point_drink_area_2
location_drink_area_2.msg_data.data.waypoint_name = "Drink Area 2"

module.exports = class UnoServer { 
    constructor(host, port) {
        this.host = host;
        this.port = port;   
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
                    // console.log("[Uno Server] from_waypoint_info: ", result.msg_data.data.from_waypoint_info.waypoint_name,
                    console.log("[Uno Server] target_waypoint_info: ", result.msg_data.data.target_waypoint_info.waypoint_name,
                    // "\n[Uno Server] reached_waypoint_info: ",result.msg_data.data.reached_waypoint_info.waypoint_name,
                    "\n[Uno Server] last_target_waypoint_info: ", result.msg_data.data.last_target_waypoint_info.waypoint_name)
                    break;
                case "missions/started":
                    console.log("[Uno Server] Mission Start")
                        break;    
                case "missions/status":
                    // console.log(result)
                    console.log("[Uno Server] Mission Status: ", result.msg_data.data.status_detail, result.msg_data.data.status_data)            
                    break;
                case "missions/completed":
                    var completed_point = result.msg_data.data.status_data;
                    console.log("[Uno Server] Arrived", completed_point == point_drink_area_1 ? "Drink Area 1" : "Drink Area 2")
                    if (completed_point == point_drink_area_1 || completed_point == point_drink_area_2) {
                        setTimeout(function() {
                            // go to charging point
                            that.goToChargingPoint()
                            // that.goToChargingPoint()
                        }, timeout * 1000)
                    } else {
                        that.notifyFinish()
                    }
                    break
                case "gotolocation":

                    console.log("[Uno Server] Going to", result.msg_data.data.waypoint_coord == point_home ? "Home" : result.msg_data.data.waypoint_coord == point_drink_area_1 ? "Drink Area 1" : "Drink Area 2")
                    break
                case "missions/cancel":
                    break
                case "status/charging":
                    console.log("[Uno Server] Finish")
                    var is_charge = result.msg_data.data.state;
                    if (last_is_charging == "") {
                        last_is_charging = is_charge;                        
                    } else {
                        if (is_charge != last_is_charging) {
                            // from Charge to not charge
                            if (last_is_charging == "True" && is_charge == "False") {
                                // set to busy
                                that.setUnoState(0)
                            } else {
                                that.setUnoState(1)
                            }
                            last_is_charging = is_charge;
                        }

                    }
                    // if (result.msg_data.data.state == "True") {
                    //     that.setUnoState(1)
                    // } else {
                    //     that.setUnoState(0);
                    // }
                    break
                default:
                    console.log(`[Uno Server] ${result.msg_data.api_path}`)
            }
            console.log("[Uno Server] ======================*===================\n")
        });
    }

    gotoLocation(location) {
        count += 1;
        this.isFinishGetDrink = true;
        this.ws.send(JSON.stringify(location == 0 ? location_drink_area_1 : location_drink_area_2));
    }

    goToHome() {
        this.ws.send(JSON.stringify(location_home));
    }

    goToChargingPoint() {
        // missions/gorecharge
        var that = this;
        this.ws.send(JSON.stringify(location_chargingPoint));
        // setTimeout(function() {
        //     that.notifyFinish()
        // }, 65 * 1000)
    }

    notifyFinish() {
        console.log("[Uno Server] Finish Count", count)
        axios.post('http://' + this.host + ':' + this.port + '/setUnoStatus', {
            status: 1 
        })
        .then((res) => {
            console.log("[Uno Server] setUnoStatus success")
        })
        .catch((error) => {
            console.log("[Uno Server] setUnoStatus Error")
        })
    }

    setUnoState(status) {
        console.log("[Uno Server] Set to ", status == 0 ? "busy" : "ready")
        axios.post('http://' + this.host + ':' + this.port + '/setUnoStatus', {
            status: status
        })
        .then((res) => {
            console.log("[Uno Server] setUnoStatus success")
        })
        .catch((error) => {
            console.log("[Uno Server] setUnoStatus Error")
        })
    }
}
