// Mock Notification Service to prevent crashes
class NotificationService {
  initialize() { console.log("NotificationService initialized (mock)"); }
  enableNotifications() { return true; }
  disableNotifications() { return true; }
  getStatus() { return Promise.resolve({ enabled: false }); }
  setNotificationOpenHandler() { console.log("setNotificationOpenHandler (mock)"); }
  getDeviceId() { return Promise.resolve("mock_device_id"); }
  sendTags() { console.log("sendTags (mock)"); }
  sendTestNotification() { console.log("sendTestNotification (mock)"); return true; }
}
export default new NotificationService();