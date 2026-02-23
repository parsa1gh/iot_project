// // #include <iostream>
// // using namespace std;

// // int main() {
// //   cout << "Hello World!";
// //   return 0;
// // }
// #include <Arduino.h>
// #include <list>
// #include "ble_module.h"
// #include <SPI.h>
// #include <MFRC522.h>
// #include <BLEDevice.h>
// #include <BLEScan.h>
// #include <BLEAdvertisedDevice.h>
// #include "display_module.h"
// #include "http_module.h"
// #define SS_PIN 2
// #define SPI_SCK 12
// #define SPI_MOSI 16
// #define SPI_MISO 13

// #define MAX_TAGS 10
// #define RSSI_NEAR -60
// #define UUID_SIZE 40

// struct BleTag
// {
//     char uuid[UUID_SIZE];
//     int seenCount;
//     int lastRssi;
// };

// volatile int tagCount = 0;
// BleTag tags[MAX_TAGS];

// class BleCallback : public BLEAdvertisedDeviceCallbacks
// {
//     void onResult(BLEAdvertisedDevice device) override
//     {
//         int rssi = device.getRSSI();
//         if (rssi < RSSI_NEAR)
//             return;
//         if (!device.haveServiceUUID())
//             return;

//         std::string uuidStd = device.getServiceUUID().toString();
//         char uuidC[UUID_SIZE];
//         strncpy(uuidC, uuidStd.c_str(), UUID_SIZE - 1);
//         uuidC[UUID_SIZE - 1] = '\0';

//         int idx = -1;
//         for (int i = 0; i < tagCount; i++)
//         {
//             if (strncmp(tags[i].uuid, uuidC, UUID_SIZE) == 0)
//             {
//                 idx = i;
//                 break;
//             }
//         }

//         if (idx == -1 && tagCount < MAX_TAGS)
//         {
//             strncpy(tags[tagCount].uuid, uuidC, UUID_SIZE - 1);
//             tags[tagCount].uuid[UUID_SIZE - 1] = '\0';
//             tags[tagCount].seenCount = 1;
//             tags[tagCount].lastRssi = rssi;
//             tagCount++;
//         }
//         else if (idx != -1)
//         {
//             tags[idx].seenCount++;
//             tags[idx].lastRssi = rssi;
//         }
//     }
// };

// MFRC522 rfid(SS_PIN, -1);

// void setup()
// {
//     display_init();
//     BLEDevice::init("esp32_ble");
//     BLEScan *pScan = BLEDevice::getScan();
//     static BleCallback callbacks; // باید static باشه تا از بین نره
//     pScan->setAdvertisedDeviceCallbacks(&callbacks);
//     pScan->setActiveScan(true);
//     pScan->start(5, false); // 5 ثانیه scan اولیه
//     to_display("BlE Initialized.");
//     // Serial.begin(115200);
//     // pinMode(SS_PIN, OUTPUT);
//     // digitalWrite(SS_PIN, HIGH); // غیرفعال کردن موقت RFID
//     // SPI.begin(SPI_SCK, SPI_MISO, SPI_MOSI, SS_PIN);
//     // rfid.PCD_Init();
//     // to_display("RFID Initialized.");
// }
// void loop()
// {
//     // if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial())
//     // {
//     //     String cardUid = "";
//     //     for (byte i = 0; i < rfid.uid.size; i++)
//     //     {
//     //         cardUid += (rfid.uid.uidByte[i] < 0x10 ? "0" : "");
//     //         cardUid += String(rfid.uid.uidByte[i], HEX);
//     //     }
//     //     cardUid.toUpperCase();

//     //     to_display("RFID SCANNED.");

//     //     // متوقف کردن کارت برای جلوگیری از خواندن مکرر
//     //     rfid.PICC_HaltA();
//     //     rfid.PCD_StopCrypto1();
//     //     to_display(cardUid);
//     // }
//     delay(1000);
//     for (int i = 0; i < tagCount; i++)
//     {
//         to_display(tags[i].uuid);
//     }
//     to_display("Loop");
// }