const axios = require('axios');

module.exports = class ArmRobotServer {
    constructor(host,port) {
        this.host = host;
        this.port = port;        
    }
    init() {
        console.log("Init arm robot class")
    }

    startPickDrink(drinkType) {
        return new Promise((resolve, reject) => {
            axios.post('http://' + this.host + ':' + this.port + '/action', {
                type: 'start',
                drinkType: drinkType
              })
              .then((res) => {
                  resolve(res)
              })
              .catch((error) => {
                reject(error)
                // console.error(error)
              })
        })
    }

    getStatus() {
        return new Promise((resolve, reject) => {
            axios.post('http://' + this.host + ':' + this.port + '/action', {
                type: 'get_status' 
              })
              .then((res) => {
                  console.log("getstatus res")
                  resolve(res)
              })
              .catch((error) => {
                console.log("getstatus error")
                reject(error)
                // console.error(error)
              })
        });
    }
}