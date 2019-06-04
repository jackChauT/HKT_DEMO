/* README
*   status/completed: 55 77 03 03 03 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
*
*/
const http = require('http')
const ARServer = require('./armRobotServer');
const UNOServer = require('./unoServer');

const host = "10.129.2.88"
const port = 3333
const armRobotHost = 5566

const armRobotServer = new ARServer(host, armRobotHost)
const unoServer = new UNOServer(host, port);
let robotArmTimer;
let onMission = false;

let drinkType = 0;
let location = 0;

// Web Server
const server = http.createServer(function(request, response) {
    console.log(`\n${request.method} ${request.url}`)
    switch(request.method) {
        case "POST":
            switch(request.url) {
                case "/option":
                    if (onMission) {
                        console.log("Option")
                        successResponse(response, 'Mission is on going')
                        break;
                    }

                    var isEmptyInput = true
                    request.on('data', function(data) {
                        isEmptyInput = false;
                        var json = JSON.parse(data)
                        console.log("Data: ", json)
                        if (!isValidResult(response, json)) return
                        this.drinkType = json.drink_type
                        this.location = json.location
                        drinkAndLocationHandler(this.drinkType, this.location)
                    })

                    request.on('end', function() {
                        if (isEmptyInput) {
                            errorResponse(response, "Input is Empty")
                        }
                        onMission = true;
                        successResponse(response, 'success')
                    })
                    break;
                default:
            }

        break;
        case "GET":
            switch(request.url) {
                case "/status":
                    // ready or busy
                    successResponse(response, onMission == true ? 'busy' : 'ready')
                    break;
                case "/finish":
                    this.onMission = false;
                    break;
                default:
            }
        break;
        default:
            errorResponse(response,'Error on Method')
    }
})

function successResponse(response, content) {
    response.writeHead(200, {'Content-Type': 'text/html'})
    console.log("[Main] Response: ",content)
    response.end(content)
}

function drinkAndLocationHandler(drink) {
    armRobotServer.startPickDrink(drink).then((res, err) => {
        if (typeof err == "undefined") {
            if (res.status == "200") {
                robotArmTimer = setInterval(getPickDrinkResult, 1000);
            }
        } else {

        }
    })
}

function getPickDrinkResult() {
    // var that = this;
    armRobotServer.getStatus().then((res, err) => {
        if (typeof err == "undefined") {
            if (res.status == "200") {
                if(res.data == "not_on_mission") {
                    clearInterval(robotArmTimer)
                    unoServer.gotoLocation(location)
                }
            }
        } else {

        }
    })
}

function isValidResult(response, data) {
        let drinkType = data.drink_type
        let location = data.location
        if (typeof drinkType == "undefined" || typeof location == "undefined") {
            errorResponse(response, "drink_type or location is empty")
            return false;
        }
        if (drinkType > 1 || location > 1) {
            errorResponse(response, "drink_type or location must be 0 or 1")
            return false;
        }
        
        return true
}

function errorResponse(response, responseString) {
    console.log("[Main] [Error] errorResponse: " + responseString)
    response.writeHead(200, {'Content-Type': 'text/html'})
    response.end(responseString)
}


try {
    server.listen(port, host)
    unoServer.initServer();
    console.log(`[Main] Listening at http://${host}:${port}`)
} catch(e) {
    console.log('[Main] Error: ' + e)
}