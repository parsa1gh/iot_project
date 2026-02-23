#pragma once
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
// #include <ArduinoJson.h>
void display_init();
void display_loop();
// show single-line (or wrapped) message for duration (ms). Defaults to 1500ms.
void to_display(String data, int duration_ms = 500);
// show two lines for duration
void to_display_lines(String line1, String line2, int duration_ms = 500);
// show error message (prefixed with ERR:) for longer duration by default
void to_display_error(String data, int duration_ms = 3000);
