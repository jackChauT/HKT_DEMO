Open 4 Server sequentally (CMD):

Uno Server
1. hkcustom_tms_msg_broker
python C:\UNO\hkcustoms\hkcustom_tms_msg_broker\teks_tms_server.py

2. fms_base_mark4
python C:\UNO\hkcustoms\hkcustom_fms_base_mark4\teks_tms_uno_fms_base_service.py


3. Robot Arm Server (check arm robot ip first)
python C:\Users\User\Desktop\DEMO\HKT_DEMO\arm_robot\app.py

4. Main Server
	a. go to cd C:\Users\User\Desktop\DEMO\HKT_DEMO
	b. node indexMain.js



If Arm Robot ip is changed,
1. Open Advanced Port Scanner
2. Scan and find Name "user-desktop"' IP.
3. Open arm_robot/app.py and update AUBO_IP IP to "user-desktop"' IP.

Reminder:
drink_type: 0 -> Blue, 1 = green
location:0 -> sofa, 1 = Mirror