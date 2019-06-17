/* README
*   status/completed: 55 77 03 03 03 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
*
*/
const http = require('http')
const ARServer = require('./armRobotServer');
const UNOServer = require('./unoServer');

const host = "192.168.66.221"
const port = 3333
const armRobotHost = 5566
const isTesting = false;
const armRobotServer = new ARServer(host, armRobotHost);
const unoServer = new UNOServer(host, port);
let robotArmTimer;
let onMission = false;
let armRobotOnMission = false;

let drinkType = 0;
let location = 0;

// Web Server
const server = http.createServer(function(request, response) {
    console.log(`\n${request.method} ${request.url}`)
    switch(request.method) {
        case "POST":
            switch(request.url) {
                case "/option":
                    if (isOnMission(response)) return;
                    if (isArmRobotOnMission(response)) return;

                    var isEmptyInput = true
                    request.on('data', function(data) {
                        isEmptyInput = false;
                        var json = JSON.parse(data)
                        console.log("Data: ", json)
                        if (!isValidResult(response, json)) return
                        drinkType = json.drink_type
                        location = json.location
                        drinkAndLocationHandler(drinkType, true)
                    })

                    request.on('end', function() {
                        if (isEmptyInput) {
                            errorResponse(response, "Input is Empty")
                        }
                        
                        successResponse(response, 'success')
                    })
                    break;
                case "/pick":
                    if (isArmRobotOnMission(response)) return;
                    request.on('data', function(data) {
                        var json = JSON.parse(data)
                        console.log("Data: ", json)
                        if (typeof json.drink_type == "undefined") {
                            errorResponse(response, "drink_type is empty")
                            return false;
                        }
                        drinkAndLocationHandler(json.drink_type, false)
                        successResponse(response, "success")
                    })
                    break
                case "/setUnoStatus":
                    request.on('data', function(data) {
                        var json = JSON.parse(data)
                        console.log("Data: ", json)
                        if (typeof json.status == "undefined") {
                            errorResponse(response, "status is empty")
                            return false;
                        }
                        if(json.status == 0) {
                            onMission = true;
                        } else {
                            onMission = false;
                        }
                        successResponse(response, "success")
                    })
                    break;
                default:
                    successResponse(response, 'wrong api url, maybe GET')
            }
        break;
        case "GET":
            switch(request.url) {
                case "/status":
                    // ready or busy
                    successResponse(response, onMission == true ? 'busy' : 'ready')
                    break;
                case "/armRobotStatus":
                    successResponse(response, armRobotOnMission == true ? 'busy' : 'ready')                    
                    break;
                case "/finish":
                    onMission = false;
                    successResponse(response, "success")
                    break;
                case "/backToCharge":
                    goToChargingPoint()
                    successResponse(response, "success")
                    break
                case "/goPoint0":
                    goPoint(0)
                    successResponse(response, "success")
                break
                case "/goPoint1":
                    goPoint(1)
                    successResponse(response, "success")
                break
                default:
                    successResponse(response, 'wrong api url, maybe POST')
            }
        break;
        default:
            errorResponse(response,'Error on Method')
    }
})

function isOnMission(response) {
    if (onMission) {
        successResponse(response, 'Mission is on going')
        return true
    }
}

function isArmRobotOnMission(response) {
    if (armRobotOnMission) {
        successResponse(response, 'Mission is on going')
        return true
    }
}

function successResponse(response, content) {
    response.writeHead(200, {'Content-Type': 'text/html'})
    console.log("[Main] Response: ",content)
    response.end(content)
}

function drinkAndLocationHandler(drink, isGoToLocation) {
    armRobotOnMission = true;
    if (isTesting) {
        setTimeout(function() {
            console.log("Testing")
            armRobotOnMission = false;
        }, 2 * 1000);
        return
    }
    if (isGoToLocation) { onMission = true };
    armRobotServer.startPickDrink(drink).then((res, err) => {
        if (typeof err == "undefined") {
            if (res.status == "200") {
                if (isGoToLocation) {
                    robotArmTimer = setInterval(getPickDrinkResult, 1000);
                } else {
                    armRobotOnMission = false;
                }
            }
        } else {

        }
        
    })
}

function getPickDrinkResult() {
    onMission = true;
    armRobotServer.getStatus().then((res, err) => {
        if (typeof err == "undefined") {
            if (res.status == "200") {
                if(res.data == "not_on_mission") {
                    armRobotOnMission = false;
                    clearInterval(robotArmTimer)
                    console.log(`location: ${location}`)
                    unoServer.gotoLocation(location)
                }
            }
        } else {

        }
    })
}

function goPoint(location) {
    unoServer.gotoLocation(location)
}
function goToChargingPoint() {
    unoServer.goToChargingPoint()
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