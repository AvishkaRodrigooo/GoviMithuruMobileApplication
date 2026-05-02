#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>
#include "addons/TokenHelper.h"

// Initialize web server on port 80 and preferences for saving WiFi credentials
WebServer server(80);
Preferences preferences;

// Your Firebase Config
#define API_KEY "AIzaSyDTVeqoAeQWj-_rn2bn6I3Pxz6VGescDW4"
#define PROJECT_ID "govimithuru-88543"

// Dummy user for Firebase Auth
#define USER_EMAIL "esp32_device@govimithuru.com"
#define USER_PASSWORD "esp32password123"

// DHT Sensor Setup
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

String ssid = "";
String password = "";
bool isConfigured = false;
unsigned long dataMillis = 0;
String deviceId = "";

// Handle the HTTP request from the React Native app
void handleConfig() {
  // Allow cross-origin requests
  server.sendHeader("Access-Control-Allow-Origin", "*");
  
  if (server.hasArg("ssid") && server.hasArg("password")) {
    String newSsid = server.arg("ssid");
    String newPass = server.arg("password");
    
    // Save to non-volatile memory
    preferences.begin("wifi", false);
    preferences.putString("ssid", newSsid);
    preferences.putString("password", newPass);
    preferences.end();
    
    server.send(200, "application/json", "{\"status\":\"success\",\"message\":\"Credentials saved. ESP32 rebooting to connect...\"}");
    delay(1000);
    ESP.restart(); // Reboot to connect to home WiFi
  } else {
    server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"Missing ssid or password parameter.\"}");
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  
  // Generate Device ID from MAC Address automatically
  String mac = WiFi.macAddress();
  mac.replace(":", "");
  deviceId = "ESP_" + mac;
  
  Serial.println("\n--- AgroMind IoT Sensor ---");
  Serial.println("Device ID: " + deviceId);
  Serial.println("MAC Address: " + WiFi.macAddress());
  
  // Read saved WiFi credentials
  preferences.begin("wifi", true);
  ssid = preferences.getString("ssid", "");
  password = preferences.getString("password", "");
  preferences.end();
  
  if (ssid == "") {
    // NO WIFI SAVED -> Start Access Point Mode
    Serial.println("No WiFi config found. Starting AP Mode for provisioning...");
    WiFi.mode(WIFI_AP);
    String apName = "AgroMind_Sensor_" + mac.substring(mac.length() - 4);
    WiFi.softAP(apName.c_str()); 
    
    server.on("/config", HTTP_GET, handleConfig);
    server.begin();
    
    Serial.println("Please connect your phone to WiFi network: " + apName);
    Serial.println("AP IP address: " + WiFi.softAPIP().toString());
    
  } else {
    // WIFI SAVED -> Try to connect to Home Network
    Serial.println("Connecting to saved WiFi: " + ssid);
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), password.c_str());
    
    int tries = 0;
    while (WiFi.status() != WL_CONNECTED && tries < 20) {
      delay(500);
      Serial.print(".");
      tries++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nConnected to Home WiFi!");
      isConfigured = true;
      
      // Initialize Firebase
      config.api_key = API_KEY;
      auth.user.email = USER_EMAIL;
      auth.user.password = USER_PASSWORD;
      config.token_status_callback = tokenStatusCallback;
      
      Firebase.begin(&config, &auth);
      Firebase.reconnectWiFi(true);
    } else {
      Serial.println("\nFailed to connect. The saved WiFi details might be wrong.");
      Serial.println("Clearing old credentials and restarting into AP mode...");
      preferences.begin("wifi", false);
      preferences.clear();
      preferences.end();
      ESP.restart();
    }
  }
}

void loop() {
  // If we are in AP Mode (waiting for user to send credentials from phone)
  if (!isConfigured) {
    server.handleClient();
    return;
  }
  
  // If we are connected to WiFi (Station Mode), push data to Firebase every 10 seconds
  if (Firebase.ready() && (millis() - dataMillis > 10000 || dataMillis == 0)) {
    dataMillis = millis();
    
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    
    if (isnan(h) || isnan(t)) {
      Serial.println("Failed to read from DHT sensor!");
      return;
    }
    
    // Create Firebase JSON Payload
    FirebaseJson content;
    content.set("fields/temperature/doubleValue", t);
    content.set("fields/humidity/doubleValue", h);
    
    String documentPath = "sensors/" + deviceId;
    
    Serial.printf("Sending -> Temp: %.1f C, Hum: %.1f %%\n", t, h);
    
    // Patch to Firestore
    if (Firebase.Firestore.patchDocument(&fbdo, PROJECT_ID, "", documentPath.c_str(), content.raw(), "temperature,humidity")) {
        Serial.println("Successfully pushed to Firestore.");
    } else {
        Serial.println("Failed to push: " + fbdo.errorReason());
    }
  }
}
