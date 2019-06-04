from flask import Flask, flash, redirect, render_template, request, session, abort, jsonify
from flask_cors import CORS
import os
import json
import urllib2
from robotcontrol import AuboRobotService
import time

tmpl_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
app = Flask(__name__, template_folder=tmpl_dir)
CORS(app)
on_mission = False

PC_IP = '10.129.2.88'
AUBO_IP = '10.129.2.30'

aubo = AuboRobotService(AUBO_IP, 8899)

def connect_aubo():
    if aubo.robot_connected != True:
            aubo.connect_robot()

def start(drinkType):
    if aubo.on_mission:
        print("on mission")
        return

    try:
        connect_aubo()
        print("drinkType")
        print(drinkType)
        print("drinkType")
        
        result = aubo.start_pick(drinkType)
        #aubo.get_info()
        print 1
        # test(1)
    except Exception as e:
        print(str(e))

    print "="*70
    print("Coffee completed")

def stop():
    connect_aubo()
    aubo.stop_robot_arm()

@app.route("/")
def index():
        return render_template('index.html')
    
 
@app.route("/hello")
def hello():
    return "Hello World!"

@app.route("/action", methods=['GET', 'POST'])
def action():
    if request.method == 'POST':
        print(request)
        data = request.json
        print(data)
        actionType = data['type']
        if actionType == "start":
            drinkType = data['drinkType']
            start(drinkType)
        elif actionType == "stop":
            stop()
            print "="*70
            print("################################ STOP ################################")
            print "="*70
        elif actionType == "get_status":
            if aubo.on_mission: 
                return "on_mission" 
            else: 
                return "not_on_mission"
        else:
            print("#################### Do nothing ####################")
        return "success"
    else:
        return "Not accept Get method"

@app.route('/<string:page_name>/')
def render_static(page_name):
    print("----- Loading Page -----")
    print(page_name)
    return render_template('%s.html' % page_name)
 
if __name__ == "__main__":
    try:
        app.run(
            host=PC_IP,
            port=int("5566")
        )
    except Exception as e:
        print "="*70
        print "Error: ##################### Please connect to same Wi-fi network #####################"
        print e
        print "="*70
    # aubo = AuboRobotService('192.168.0.100', 8899) 
    