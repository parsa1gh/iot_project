#pragma once
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClient.h>
#include <Arduino.h>
#include "display_module.h"
#include <WiFiUdp.h>
void wifi_init();
String sendDataToServer(
    String code = "",
    String state = "DEFAULT",
    uint8_t *data = nullptr,
    size_t length = 0);