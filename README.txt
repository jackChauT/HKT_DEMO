Open 4 Server sequentally:

Uno Server
1. fms_base_mark4
python C:\UNO\hkcustoms\hkcustom_fms_base_mark4\teks_tms_uno_fms_base_service.py

2. hkcustom_tms_msg_broker
python C:\UNO\hkcustoms\hkcustom_tms_msg_broker\teks_tms_server.py

3. Robot Arm Server
python C:\Users\User\Desktop\DEMO\HKT_DEMO\arm_robot\app.py

4. Main Server
	a. go to C:\Users\User\Desktop\DEMO\HKT_DEMO
	b. node indexMain.js



If Arm Robot ip is changed,
1. Open Advanced Port Scanner
2. Scan and find Name "user-desktop"' IP.
3. Open app.py and update AUBO_IP IP to "user-desktop"' IP.