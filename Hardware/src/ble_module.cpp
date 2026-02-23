#include "ble_module.h"
#include "display_module.h"

#define MAX_TAGS 10
#define RSSI_NEAR -60
#define REQUIRED_SEEN 2
#define TIME_WINDOW 6000
#define SCAN_TIME 2
#define UUID_SIZE 40

static BLEScan *pScan = nullptr;

struct BleTag
{
    char uuid[UUID_SIZE];
    int seenCount;
    int lastRssi;
    unsigned long firstSeen;
    unsigned long lastSeen;
};

static BleTag tags[MAX_TAGS];
static volatile int tagCount = 0;

int findTag(const char *input)
{
    for (int i = 0; i < tagCount; i++)
    {
        if (strncmp(tags[i].uuid, input, UUID_SIZE) == 0)
            return i;
    }
    return -1;
}

void removeTag(int index)
{
    for (int i = index; i < tagCount - 1; i++)
        tags[i] = tags[i + 1];
    tagCount--;
}

class BleCallback : public BLEAdvertisedDeviceCallbacks
{
    void onResult(BLEAdvertisedDevice device) override
    {
        int rssi = device.getRSSI();
        if (rssi < RSSI_NEAR)
            return;
        if (!device.haveServiceUUID())
            return;

        // UUID از BLE
        std::string uuidStd = device.getServiceUUID().toString();

        // ✅ تبدیل std::string به char[] ثابت
        char uuidC[UUID_SIZE];
        strncpy(uuidC, uuidStd.c_str(), UUID_SIZE - 1);
        uuidC[UUID_SIZE - 1] = '\0';

        unsigned long now = millis();

        // پیدا کردن UUID
        int idx = -1;
        for (int i = 0; i < tagCount; i++)
        {
            if (strncmp(tags[i].uuid, uuidC, UUID_SIZE) == 0)
            {
                idx = i;
                break;
            }
        }

        // اضافه کردن یا بروزرسانی tag
        if (idx == -1)
        {
            if (tagCount < MAX_TAGS)
            {
                strncpy(tags[tagCount].uuid, uuidC, UUID_SIZE - 1);
                tags[tagCount].uuid[UUID_SIZE - 1] = '\0';
                tags[tagCount].seenCount = 1;
                tags[tagCount].lastRssi = rssi;
                tags[tagCount].firstSeen = now;
                tags[tagCount].lastSeen = now;
                tagCount++;
            }
        }
        else
        {
            tags[idx].seenCount++;
            tags[idx].lastRssi = rssi;
            tags[idx].lastSeen = now;
        }
    }
};

BleCallback callbacks;

void bleInit()
{
    BLEDevice::init("esp32_ble");
    pScan = BLEDevice::getScan();
    pScan->setAdvertisedDeviceCallbacks(&callbacks);
    pScan->setActiveScan(true);
    to_display("BLE Initialized.");
}

String bleLoop()
{
    pScan->start(SCAN_TIME, false);
    unsigned long now = millis();
    String qualifiedUuid = "";

    for (int i = 0; i < tagCount; i++)
    {
        if (now - tags[i].firstSeen > TIME_WINDOW)
        {
            for (int j = i; j < tagCount - 1; j++)
            {
                tags[j] = tags[j + 1];
            }
            tagCount--;
            i--;
            continue;
        }

        if (tags[i].seenCount >= REQUIRED_SEEN)
        {
            to_display("BLE Device Found.");
            qualifiedUuid = String(tags[i].uuid); // فقط اینجا String میسازیم
            pScan->stop();
            pScan->clearResults();

            // حذف tag بعد از استفاده
            for (int j = i; j < tagCount - 1; j++)
            {
                tags[j] = tags[j + 1];
            }
            tagCount--;
            i--;
        }
    }
    return qualifiedUuid;
}
