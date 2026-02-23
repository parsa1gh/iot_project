#include <BLEDevice.h>
#include <BLEScan.h>
#include <Arduino.h>
#include <BLEAdvertisedDevice.h>
#include "http_module.h"
extern bool bleRequested;
void bleInit();
String bleLoop();
int findTag(String input);
void removeTag(int index);