#include <Arduino.h>
#include <list>
#include "ble_module.h"
#include "rfid_module.h"
#include "http_module.h"
#include "display_module.h"
#include "cam_module.h"

const int buttonPin = 2;
int buttonState = 0;
bool lastButtonState = HIGH;
unsigned long lastPress = 0;

void setup()
{
  display_init();

  rfidInit();
  bleInit();

  pinMode(buttonPin, INPUT_PULLUP);

  if (!camera_init())
  {
    to_display("Camera init failed");
    while (true)
    {
      delay(1000);
    }
  }

  wifi_init();
  to_display("Ready");
}

void loop()
{
  String uuid = "";
  String uid = "";
  String response = "";
  camera_fb_t *picture = nullptr;

  bool buttonState = digitalRead(buttonPin);
  if (lastButtonState == HIGH && buttonState == LOW && millis() - lastPress > 300)
  {
    to_display("Button pressed");
    lastPress = millis();

    picture = camera_capture();
    if (picture != nullptr)
    {
      to_display("_Picture_");
      response = sendDataToServer("", "CAM", picture->buf, picture->len);
      to_display(response, 1500);
      esp_camera_fb_return(picture);
    }
    else
    {
      to_display("CAM FAIL");
    }
  }

  lastButtonState = buttonState;

  // Poll both
  uid = rfidLoop();
  uuid = bleLoop();

  if (uid.length() > 0)
  {
    String resp = sendDataToServer(uid, "RFID");
    to_display(resp, 1500);
  }
  else if (uuid.length() > 0)
  {
    String resp = sendDataToServer(uuid, "BLE");
    to_display(resp, 1500);
  }

  delay(1);
  to_display("Looping");
}
