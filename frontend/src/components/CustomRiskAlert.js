import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Vibration,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function CustomRiskAlert({ visible, riskData, onClose, onViewDetails, language }) {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && riskData) {
      // Vibrate for high risk
      if (riskData.risk_level === 'High' || riskData.risk_level === 'Very High') {
        Vibration.vibrate([500, 300, 500, 300, 1000]);
      } else if (riskData.risk_level === 'Moderate') {
        Vibration.vibrate([300, 200, 300]);
      }
      
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      
      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!visible || !riskData) return null;

  const isHighRisk = riskData.risk_level === 'High' || riskData.risk_level === 'Very High';
  const isModerateRisk = riskData.risk_level === 'Moderate';
  
  const bgColor = isHighRisk ? '#dc2626' : isModerateRisk ? '#f59e0b' : '#16a34a';
  const icon = isHighRisk ? '🚨' : isModerateRisk ? '⚠️' : 'ℹ️';

  const t = (key) => {
    const translations = {
      highRiskAlert: { en: 'HIGH RISK ALERT!', si: 'ඉහළ අවදානම් ඇඟවීම!' },
      moderateRiskAlert: { en: 'MODERATE RISK ALERT', si: 'මධ්‍යස්ථ අවදානම් ඇඟවීම' },
      pestDetected: { en: 'Pest Detected', si: 'පළිබෝධය හඳුනාගෙන ඇත' },
      severity: { en: 'Severity', si: 'දරුණු බව' },
      incidence: { en: 'Incidence', si: 'ප්‍රහාර මට්ටම' },
      takeAction: { en: 'Take Action', si: 'වහාම ක්‍රියා කරන්න' },
      dismiss: { en: 'Dismiss', si: 'වසන්න' },
      viewDetails: { en: 'View Details', si: 'විස්තර බලන්න' },
    };
    return translations[key]?.[language] || key;
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.alertContainer, { transform: [{ scale: scaleAnim }] }]}>
          
          {/* Header */}
          <View style={[styles.alertHeader, { backgroundColor: bgColor }]}>
            <Text style={styles.alertIcon}>{icon}</Text>
            <Text style={styles.alertTitle}>
              {isHighRisk ? t('highRiskAlert') : t('moderateRiskAlert')}
            </Text>
          </View>
          
          {/* Content */}
          <View style={styles.alertContent}>
            {/* Pest Info */}
            <View style={styles.pestInfo}>
              <Text style={styles.pestLabel}>{t('pestDetected')}</Text>
              <Text style={styles.pestName}>{riskData.predicted_pest}</Text>
            </View>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>{t('severity')}</Text>
                <Text style={[styles.detailValue, { color: bgColor }]}>
                  {riskData.severity}
                </Text>
              </View>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>{t('incidence')}</Text>
                <Text style={[styles.detailValue, { color: bgColor }]}>
                  {riskData.incidence_percent}%
                </Text>
              </View>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>District</Text>
                <Text style={[styles.detailValue, { color: bgColor }]}>
                  {riskData.district}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton, { backgroundColor: bgColor }]}
                onPress={() => {
                  onClose();
                  onViewDetails?.(riskData);
                }}
              >
                <Text style={styles.primaryButtonText}>{t('viewDetails')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={onClose}
              >
                <Text style={styles.secondaryButtonText}>{t('dismiss')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    width: width - 40,
    maxWidth: 380,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  alertIcon: {
    fontSize: 28,
  },
  alertTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  alertContent: {
    padding: 20,
  },
  pestInfo: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pestLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  pestName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  detailCard: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#dc2626',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 15,
  },
});