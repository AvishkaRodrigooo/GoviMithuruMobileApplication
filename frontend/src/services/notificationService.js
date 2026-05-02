
// import OneSignal from 'react-native-onesignal';
// import { Platform } from 'react-native';
// import { pestForecastApi } from './api';
// import Constants from 'expo-constants';

// class NotificationService {
//   constructor() {
//     this.initialized = false;
//     this.userId = null;
//     this.deviceId = null;
//     this.onNotificationOpen = null;
//     // Get App ID from app.json extra config
//     this.ONESIGNAL_APP_ID = Constants.expoConfig?.extra?.onesignalAppId || '6cb7c5f2-a038-4ceb-9eb5-e76fb4ab0dfc';
//   }

//   initialize(userId) {
//     if (this.initialized) return;
    
//     this.userId = userId;
    
//     console.log('Initializing OneSignal with App ID:', this.ONESIGNAL_APP_ID);
    
//     // OneSignal initialization
//     OneSignal.setAppId(this.ONESIGNAL_APP_ID);
    
//     // Set external user ID for targeting
//     OneSignal.setExternalUserId(userId);
    
//     // iOS Only - request permission
//     if (Platform.OS === 'ios') {
//       OneSignal.promptForPushNotificationsWithUserResponse((response) => {
//         console.log('Prompt response:', response);
//       });
//     }
    
//     // Get device ID
//     OneSignal.getDeviceState().then((deviceState) => {
//       console.log('OneSignal Device ID:', deviceState?.userId);
//       this.deviceId = deviceState?.userId;
      
//       // Send tags with user info
//       this.sendTags({
//         user_id: userId,
//         platform: Platform.OS,
//         app_version: '1.0.0',
//         language: 'en' // Will be updated later
//       });
      
//       // Get initial notification status from backend
//       this.getStatus().then(status => {
//         console.log('Initial notification status:', status);
//       });
//     });
    
//     // Handle notification opened
//     OneSignal.setNotificationOpenedHandler((notification) => {
//       console.log('Notification opened:', notification);
//       this.handleNotificationOpen(notification);
//     });
    
//     // Handle notification received in foreground
//     OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent) => {
//       console.log('Notification received in foreground');
//       let notification = notificationReceivedEvent.getNotification();
      
//       // You can modify notification here if needed
//       // Complete with notification to show it
//       notificationReceivedEvent.complete(notification);
//     });
    
//     this.initialized = true;
//   }

//   handleNotificationOpen(notification) {
//     const data = notification?.notification?.additionalData || {};
    
//     console.log('Notification data:', data);
    
//     if (this.onNotificationOpen) {
//       this.onNotificationOpen(data);
//     }
//   }

//   // Set callback for notification open
//   setNotificationOpenHandler(callback) {
//     this.onNotificationOpen = callback;
//   }

//   async enableNotifications() {
//     if (!this.userId || !this.deviceId) {
//       console.log('Missing userId or deviceId');
//       return false;
//     }
    
//     try {
//       // Call your API to toggle notifications
//       const result = await pestForecastApi.toggleNotifications(
//         this.userId,
//         true,
//         this.deviceId
//       );
      
//       console.log('Notification enable result:', result);
      
//       if (result.success) {
//         // Send a welcome notification via OneSignal
//         OneSignal.postNotification({
//           contents: { 
//             en: 'You will now receive pest alerts for your selected districts',
//             si: 'ඔබ තෝරාගත් දිස්ත්‍රික්ක සඳහා පළිබෝධ ඇඟවීම් ලැබෙනු ඇත'
//           },
//           headings: { 
//             en: '✅ Notifications Enabled',
//             si: '✅ දැනුම්දීම් සක්‍රීයයි'
//           },
//           data: { type: 'welcome' },
//           include_player_ids: [this.deviceId]
//         });
//       }
      
//       return result.success;
//     } catch (error) {
//       console.error('Failed to enable notifications:', error);
//       return false;
//     }
//   }

//   async disableNotifications() {
//     if (!this.userId) return false;
    
//     try {
//       const result = await pestForecastApi.toggleNotifications(
//         this.userId,
//         false,
//         null
//       );
//       return result.success;
//     } catch (error) {
//       console.error('Failed to disable notifications:', error);
//       return false;
//     }
//   }

//   async getStatus() {
//     if (!this.userId) return { enabled: false };
    
//     try {
//       const result = await pestForecastApi.getNotificationStatus(this.userId);
//       return result.data || { enabled: false };
//     } catch (error) {
//       console.error('Failed to get notification status:', error);
//       return { enabled: false };
//     }
//   }

//   // Send tags to OneSignal for segmentation
//   sendTags(tags) {
//     OneSignal.sendTags(tags);
//   }

//   // Send location-based tags
//   sendLocationTags(district, season, paddyType, language = 'en') {
//     this.sendTags({
//       current_district: district,
//       current_season: season,
//       paddy_type: paddyType,
//       language: language,
//       last_active: new Date().toISOString()
//     });
//   }

//   // Update language tag
//   updateLanguage(language) {
//     this.sendTags({ language });
//   }

//   // Send test notification (for debugging)
//   sendTestNotification() {
//     if (!this.deviceId) {
//       console.log('No device ID available');
//       return false;
//     }
    
//     try {
//       OneSignal.postNotification({
//         contents: { 
//           en: 'Test notification from GoviMithuru',
//           si: 'ගොවිමිතුරු වෙතින් පරීක්ෂණ දැනුම්දීමක්'
//         },
//         headings: { 
//           en: '🌾 Pest Forecast',
//           si: '🌾 පළිබෝධ අනාවැකිය'
//         },
//         data: { 
//           type: 'test',
//           timestamp: new Date().toISOString()
//         },
//         include_player_ids: [this.deviceId]
//       });
//       console.log('Test notification sent');
//       return true;
//     } catch (error) {
//       console.error('Failed to send test notification:', error);
//       return false;
//     }
//   }

//   // Get device ID
//   getDeviceId() {
//     return this.deviceId;
//   }

//   // Check if initialized
//   isInitialized() {
//     return this.initialized;
//   }
// }

// export default new NotificationService();