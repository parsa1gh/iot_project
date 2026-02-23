#include "rfid_module.h"
#include "display_module.h"

#define SS_PIN 14
#define SPI_SCK 12
#define SPI_MOSI 15
#define SPI_MISO 13

MFRC522 rfid(SS_PIN, -1);

void rfidInit()
{
    // تنظیم پین SS به عنوان خروجی
    pinMode(SS_PIN, OUTPUT);
    digitalWrite(SS_PIN, HIGH); // غیرفعال کردن موقت RFID

    SPI.begin(SPI_SCK, SPI_MISO, SPI_MOSI, SS_PIN);
    rfid.PCD_Init();

    to_display("RFID Initialized.");
}

String rfidLoop()
{
    String cardUid = "";

    // Check card presence
    if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial())
    {
        return cardUid;
    }

    for (byte i = 0; i < rfid.uid.size; i++)
    {
        cardUid += (rfid.uid.uidByte[i] < 0x10 ? "0" : "");
        cardUid += String(rfid.uid.uidByte[i], HEX);
    }

    cardUid.toUpperCase();

    to_display("RFID SCANNED.");

    // Stop card to prevent repeated reads
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();

    return cardUid;
}