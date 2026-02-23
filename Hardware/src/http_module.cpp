#include "http_module.h"

WiFiUDP udp;
const int UDP_PORT = 41234;

String serverIp = "";
int serverPort = 0;
bool serverDiscovered = false;

// const char *ssid = "Fragezeichnen";
// const char *password = "D@yo$K9b?";
const char *ssid = "Fragezeichnen mobil";
const char *password = "parsa123";
String serverUrl = "";
int counter;
String wifiMessage = "Connecting WiFi";

void discoverServer()
{
    int packetSize = udp.parsePacket();
    if (!packetSize)
        return;

    char buffer[256];
    int len = udp.read(buffer, sizeof(buffer) - 1);
    if (len <= 0)
        return;
    buffer[len] = '\0';

    String msg = String(buffer);

    if (msg.indexOf("project-server") == -1)
        return;

    int ipStart = msg.indexOf("\"ip\":\"") + 6;
    int ipEnd = msg.indexOf("\"", ipStart);
    serverIp = msg.substring(ipStart, ipEnd);

    int portStart = msg.indexOf("\"port\":") + 7;
    int portEnd = msg.indexOf("}", portStart);
    serverPort = msg.substring(portStart, portEnd).toInt();

    serverDiscovered = true;
    // to_display("Server found: " + serverIp);
}

void wifi_init()
{
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        wifiMessage += ".";
        delay(500);
        to_display(wifiMessage);
    }
    to_display("WiFi Connected");
    udp.begin(UDP_PORT);
}

String getEndpoint(const String state)
{
    if (state == "BLE")
        return "/recognition/ble";
    if (state == "RFID")
        return "/recognition/rfid";
    if (state == "CAM")
        return "/recognition/fr";
    return "";
}

String sendDataToServer(String code, String state, uint8_t *data, size_t length)
{
    String response;
    String req;
    int httpResponseCode;
    if (WiFi.status() != WL_CONNECTED)
    {
        return "network connection error";
    }
    if (!serverDiscovered)
    {
        discoverServer();
    }

    HTTPClient http;
    serverUrl = "http://" + serverIp + ":3000" + getEndpoint(state);
    to_display(serverUrl);
    http.begin(serverUrl);
    if (state == "CAM")
    {
        http.addHeader("Content-Type", "image/jpeg");
        httpResponseCode = http.POST(data, length);
    }
    else
    {
        http.addHeader("Content-Type", "application/json");
        req = "{\"data\":\"" + code + "\"}";
        httpResponseCode = http.POST(req);
    }

    if (httpResponseCode != 200)
    {
        counter++;
        response += " (" + http.errorToString(httpResponseCode) + " | " + String(counter) + ")";
    }
    else
    {
        counter = 0;
        response = http.getString();
    }
    http.end();
    return response;
}
