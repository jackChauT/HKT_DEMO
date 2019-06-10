from robotcontrol import AuboRobotService

AUBO_IP = '10.129.2.30'

aubo = AuboRobotService(AUBO_IP, 8899)

def connect_aubo():
    if aubo.robot_connected != True:
            aubo.connect_robot()


def start():
    if aubo.on_mission:
        print("on mission")
        return

    try:
        connect_aubo()

        result = aubo.start_pick()
        #aubo.get_info()
        print 1
        # test(1)
    except Exception as e:
        print(str(e))
        # i = 0
        # while i < 10:
        #     try:
        #         time.sleep(5.0)
        #         aubo = AuboRobotService('192.168.0.100',8899)
        #         aubo.connect_robot()
        #         aubo.start_pick()
        #         break
        #     except Exception as e:
        #         print(str(e))
        #         i += 1

        # test(1)
    #aubo.robot.robot_shutdown()
    print "="*70
    print("Coffee completed")

start()