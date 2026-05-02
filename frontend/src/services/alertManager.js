// services/alertManager.js
import { AppState, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AlertManager {
  constructor() {
    this.listeners = [];
    this.pendingAlerts = [];
    this.lastAlertTime = null;
    this.minAlertInterval = 60000; // 1 minute between same type alerts
    this.checkAppState();
  }

  checkAppState() {
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Show any pending alerts when app comes to foreground
        this.showPendingAlerts();
      }
    });
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  emitAlert(alert) {
    this.listeners.forEach(callback => callback(alert));
  }

  async showAlert(riskData) {
    // Check if we should show this alert
    const shouldShow = await this.shouldShowAlert(riskData);
    
    if (!shouldShow) {
      console.log('Alert suppressed (rate limited):', riskData.risk_level);
      return;
    }

    // Store in pending alerts
    const alert = {
      id: Date.now(),
      ...riskData,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Save to AsyncStorage
    await this.saveAlert(alert);
    
    // Emit to listeners
    this.emitAlert(alert);
    
    // Update last alert time
    this.lastAlertTime = Date.now();
    await AsyncStorage.setItem('lastAlertTime', this.lastAlertTime.toString());
    
    // Vibration
    if (riskData.risk_level === 'High' || riskData.risk_level === 'Very High') {
      Vibration.vibrate([500, 500, 500, 1000, 500]);
    }
    
    return alert;
  }

  async shouldShowAlert(riskData) {
    // Don't show if user disabled alerts
    const enabled = await AsyncStorage.getItem('notificationsEnabled');
    if (enabled === 'false') return false;
    
    // Rate limiting for same pest/district
    const lastAlertTime = await AsyncStorage.getItem('lastAlertTime');
    if (lastAlertTime && (Date.now() - parseInt(lastAlertTime)) < this.minAlertInterval) {
      return false;
    }
    
    // Check user preferences for high risk only
    const highRiskOnly = await AsyncStorage.getItem('highRiskOnly');
    if (highRiskOnly === 'true' && riskData.risk_level === 'Moderate') {
      return false;
    }
    
    return true;
  }

  async saveAlert(alert) {
    try {
      const existing = await AsyncStorage.getItem('pestAlerts');
      const alerts = existing ? JSON.parse(existing) : [];
      alerts.unshift(alert);
      // Keep only last 50 alerts
      const trimmed = alerts.slice(0, 50);
      await AsyncStorage.setItem('pestAlerts', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Save alert error:', error);
    }
  }

  async getAlerts() {
    try {
      const alerts = await AsyncStorage.getItem('pestAlerts');
      return alerts ? JSON.parse(alerts) : [];
    } catch (error) {
      return [];
    }
  }

  async markAlertRead(alertId) {
    try {
      const alerts = await this.getAlerts();
      const updated = alerts.map(a => 
        a.id === alertId ? { ...a, read: true } : a
      );
      await AsyncStorage.setItem('pestAlerts', JSON.stringify(updated));
    } catch (error) {
      console.error('Mark read error:', error);
    }
  }

  async showPendingAlerts() {
    const alerts = await this.getAlerts();
    const unread = alerts.filter(a => !a.read);
    if (unread.length > 0) {
      // Show the most recent unread alert
      this.emitAlert(unread[0]);
    }
  }

  async clearAllAlerts() {
    await AsyncStorage.removeItem('pestAlerts');
  }
}

export default new AlertManager();