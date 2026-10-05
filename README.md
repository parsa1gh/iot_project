
# Smart Patient Finder (بیماریاب هوشمند)

An IoT system that helps nurses identify a patient and open their electronic record quickly. A patient is identified by **RFID card**, **BLE tag (iTag)** or **face recognition**. An ESP32-CAM device does the scanning, a Node.js backend manages data and users, and a Python service turns face photos into embeddings.

> Associate degree project (Computer Engineering, Software), National University of Skills, Khorasan Razavi, 2025. Prototype, not tested with real patient data.

![Demo](docs/demo.gif)
<img width="896" height="658" alt="photo_2026-10-05_11-23-11" src="https://github.com/user-attachments/assets/2f2ae714-9240-4be5-ae19-14737dac4c48" />

## Features
- Three ways to identify a patient: RFID card (MFRC522), BLE iTag, face photo
- Web dashboard with live updates over Socket.IO; scan results appear in the registration form immediately
- Two roles: **admin** (manages nurses, sees their patients) and **nurse** (registers, searches, edits and deletes patients)
- A button press on the iTag signals that a patient needs help
- OLED display on the device shows status, errors and results

## Architecture
```
 ESP32-CAM (C++)                Node.js / Express backend              Flask service (Python)
 ├─ MFRC522 RFID  ──┐           ├─ REST API + EJS views               └─ DeepFace (Facenet)
 ├─ BLE scanner   ──┼─ HTTP /   ├─ Socket.IO (live updates)              POST /recognize
 ├─ OV2640 camera ──┤  UDP /    ├─ JWT auth, role-based access           image → face embeddings
 ├─ OLED + button ──┘  Serial   └─ MongoDB (Mongoose)  ←──── HTTP ─────→
```

## Tech Stack
| Part | Technology |
|---|---|
| Embedded | C++ (Arduino framework, PlatformIO), ESP32-CAM (AI Thinker pin map) |
| Backend | Node.js, Express.js, Mongoose, Joi, Socket.IO, jsonwebtoken, bcrypt, EJS, SerialPort |
| Face recognition | Python, Flask, OpenCV, NumPy, DeepFace (Facenet) |
| Database | MongoDB |
| Device ↔ server | HTTP (ESP32 HTTPClient), UDP (server discovery), serial port |

## Hardware
| Component | Role |
|---|---|
| ESP32-CAM (OV2640) | Main controller, camera, Wi-Fi, BLE |
| MFRC522 (13.56 MHz, SPI) | Reads the UID of RFID cards and tags |
| BLE iTag | Patient tag, detected by BLE scanning |
| SSD1306 OLED 128×64 (I²C, address 0x3C) | Status and messages |
| Push button (GPIO2, input pull-up) | Takes a photo |
| Power switch | Turns the device on/off |

**Note:** the OLED uses GPIO1 (SDA) and GPIO3 (SCL), which are also the UART0 pins. While the display is in use, the Serial Monitor is not available.



## How it works
The firmware (`Hardware/src/main.cpp`) polls three inputs in a loop and sends each result to the server over HTTP with a type label (`RFID`, `BLE` or `CAM`). The server's response is shown on the OLED.

1. **RFID:** the card UID is read over SPI and sent as type `RFID`.
2. **BLE:** the ESP32 scans in 2-second intervals. A tag counts as present when it is seen at least **2 times within 6 seconds** with a signal stronger than **−60 dBm**. Up to 10 tags are tracked at once. Its UUID is sent as type `BLE`. The tag's own button can raise a "needs help" signal.
3. **Face:** pressing the button captures a JPEG (QVGA) and sends it as type `CAM`. The backend passes it to the Flask service (`POST /recognize`), which returns a Facenet embedding and a bounding box for each detected face. Face matching: [one sentence, e.g. "embeddings are compared with cosine distance and a threshold of X"].
4. **Nurse workflow:** during registration the nurse scans RFID, BLE and face directly into the form. Later, any of the three identifies the patient.

## Data model (MongoDB)
- `personals`: firstName, lastName, birthday, phoneNumber, password (bcrypt hash), role (nurse/admin), patientsCount
- `patients`: firstName, lastName, birthday, phoneNumber, nurseId, rfId, ble, fr (embedding array)

## Project Structure
```
├── FR/        # Flask face-embedding service
├── Hardware/  # ESP32-CAM firmware (PlatformIO, src/)
└── Web/       # Express backend, modules (admin, nurse, patient, recognition), views
```
The backend is modular: each module has its own model, controller and router. Authentication uses a JWT in a cookie, with middleware for token check, personnel check and admin check (role-based access control).

## Getting Started

### 1. Face recognition service
```bash
cd FR
pip install flask numpy opencv-python deepface
python app.py            # listens on port 5000
```

### 2. Backend
```bash
cd Web
npm install
```
Create a `.env` file with your own values:
```
JWT_secretKey=<your secret>
[DB_URL]=mongodb://localhost:27017/<db_name>
[PORT]=<port>
```
```bash
node [entry file, e.g. app.js]
```
Create the first admin user, then change its password immediately. Never commit credentials.

### 3. Firmware
Open `Hardware/` in VS Code with PlatformIO. Set your Wi-Fi credentials and server address in the firmware configuration (keep them out of Git), then upload to the ESP32-CAM.

## Screenshots
| Login | Admin dashboard |
|---|---|
| ![](docs/login.png) <img width="2560" height="1600" alt="Screenshot (78)" src="https://github.com/user-attachments/assets/0f491753-03ae-46ed-af90-ed1f93305f7c" /> | ![](docs/admin.png) <img width="2560" height="1600" alt="Screenshot (79)" src="https://github.com/user-attachments/assets/8e1d942a-ca94-4035-9586-ba052021f6ea" /> |
| **Nurse dashboard** | **Patient registration** |
| ![](docs/nurse.png) <img width="2560" height="1600" alt="Screenshot (82)" src="https://github.com/user-attachments/assets/54798dac-be9e-4922-a7ad-c0c153c38f7c" /> | ![](docs/register.png) |

## Limitations and Next Steps
- Prototype: no formal accuracy or speed measurements yet
- Face matching could use a stricter threshold and liveness detection
- Planned: HTTPS, audit log, integration with a hospital information system (HIS)

## Team and Contribution
Developed with a friend ([Benjamin Karimi](https://github.com/Benjamin-Karimi)) and under the guidance of my thesis supervisor, Eng. Davood Sotoudeh.

## Contact
Parsa Ghorbani · [LinkedIn](https://www.linkedin.com/in/parsa-ghorbani-26086b3b9/) · [ghorbanip809@gmail.com]
