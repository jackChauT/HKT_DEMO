const WebSocket = require('ws');
const fs = require('fs');
const axios = require('axios');

let count = 0
let timeout = 3 //second

let last_is_charging = ""

let locationRawData = fs.readFileSync('location.json');  
let locationJson = JSON.parse(locationRawData)
const point_home = "85eb913f ec51b8be f704353f f70435bf" // Home
const point_drink_area_1 = "46b66340 39b468bf ea7b393f 0d71303f" // Sofa
const point_drink_area_2 = "6de7bbbe 9cc4e0be ebc8353f 2940343f" //85eb51be 4260653f 4a093d3f 6aa12c3f Mirror

let location_home = JSON.parse(JSON.stringify(locationJson));
location_home.msg_data.data.waypoint_coord = point_home
location_home.msg_data.data.waypoint_name = "Home"

let location_chargingPoint = JSON.parse(JSON.stringify(locationJson));
location_chargingPoint.msg_data.api_path = "missions/gorecharge"
location_chargingPoint.msg_data.data.waypoint_name = "Charging Point"

let location_drink_area_1 = JSON.parse(JSON.stringify(locationJson));
location_drink_area_1.msg_data.data.waypoint_coord = point_drink_area_1
location_drink_area_1.msg_data.data.waypoint_name = "Drink Area 0"

let location_drink_area_2 = JSON.parse(JSON.stringify(locationJson));
location_drink_area_2.msg_data.data.waypoint_coord = point_drink_area_2
location_drink_area_2.msg_data.data.waypoint_name = "Drink Area 1"

module.exports = class UnoServer { 
    constructor(host, port) {
        this.host = host;
        this.port = port;   
        this.ws = new WebSocket('ws://127.0.0.1:8125/tmsmsg');
        this.timer = null;
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
                    that.clearTimer()
                    var completed_point = result.msg_data.data.status_data;
                    console.log("[Uno Server] Arrived", completed_point == point_drink_area_1 ? "Drink Area 1" : "Drink Area 2")
                    if (completed_point == point_drink_area_1 || completed_point == point_drink_area_2) {
                        setTimeout(function() {
                            // go to charging point
                            that.goToChargingPoint()
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
                        if (last_is_charging == "False") {
                            // set to busy
                            that.setUnoState(0)
                        }                        
                    } else {
                        if (is_charge != last_is_charging) {
                            // from Charge to not charge
                            if (last_is_charging == "True" && is_charge == "False") {
                                // set to busy
                                that.setUnoState(0)
                            } else {
                                that.clearTimer()
                                that.setUnoState(1)
                            }
                            last_is_charging = is_charge;
                        }
                    }
                    break
                default:
                    console.log(`[Uno Server] ${result.msg_data.api_path}`)
            }
            console.log("[Uno Server] ======================*===================\n")
        });
    }

    gotoLocation(location) {
        this.clearTimer()
        count += 1;
        this.isFinishGetDrink = true;
        var lp = location == 0 ? location_drink_area_1 : location_drink_area_2;
        this.ws.send(JSON.stringify(lp));
        this.timer = setInterval(function(ws,lp) {
            ws.send(JSON.stringify(lp));
        }, 10 * 1000, this.ws, lp);
    }

    goToHome() {
        this.ws.send(JSON.stringify(location_home));
    }

    goToChargingPoint() {
        this.clearTimer()
        // missions/gorecharge
        var that = this;
        this.ws.send(JSON.stringify(location_chargingPoint));
        this.timer = setInterval(function(ws,lp) {
            ws.send(JSON.stringify(lp));
        }, 10 * 1000, this.ws, location_chargingPoint);
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

    clearTimer() {
        if (this.timer != null) {
            clearInterval(this.timer);
        }
    }
}
