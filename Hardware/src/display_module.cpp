#include "display_module.h"
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
// #define SCREEN_WIDTH 100
// #define SCREEN_HEIGHT 60
#define OLED_RESET -1
#define SDA_PIN 1
#define SCL_PIN 3
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
void display_init()
{
    // for oled lcd
    Wire.begin(SDA_PIN, SCL_PIN);
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C))
    {
        while (true)
            ;
    }
    display.clearDisplay();
}

void display_loop()
{
    // just blink a dot to show loop works
    display.fillCircle(64, 50, 5, SSD1306_WHITE);
    display.display();
    delay(500);
    display.fillCircle(64, 50, 5, SSD1306_BLACK);
    display.display();
    delay(500);
}

void to_display(String data, int duration_ms)
{
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);

    // Simple wrap: show up to ~21 chars per line (depends on font)
    const int maxCols = 21;
    int len = data.length();
    int row = 0;
    for (int i = 0; i < len; i += maxCols)
    {
        String part = data.substring(i, min(i + maxCols, len));
        display.setCursor(0, row * 10);
        display.println(part);
        row++;
        if (row >= 6)
            break; // avoid overflowing screen
    }
    display.display();
    delay(duration_ms);
    display.clearDisplay();
}

void to_display_lines(String line1, String line2, int duration_ms)
{
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println(line1);
    display.setCursor(0, 12);
    display.println(line2);
    display.display();
    delay(duration_ms);
    display.clearDisplay();
}

void to_display_error(String data, int duration_ms)
{
    String msg = "ERR: ";
    msg += data;
    to_display(msg, duration_ms);
}
