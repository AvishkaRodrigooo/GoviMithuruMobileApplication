import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';


const PestRiskCard = ({ forecast }) => {
  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'alert';
      case 'low':
        return 'check-circle';
      default:
        return 'help-circle';
    }
  };

  const riskColor = getRiskColor(forecast?.risk_level);
  const riskIcon = getRiskIcon(forecast?.risk_level);

  return (
    <View style={[styles.card, { borderLeftColor: riskColor }]}>
      <View style={styles.header}>
        <View style={[styles.riskBadge, { backgroundColor: riskColor + '20' }]}>
          <MaterialCommunityIcons name={riskIcon} size={20} color={riskColor} />
          <Text style={[styles.riskText, { color: riskColor }]}>
            {forecast?.risk_level || t('unknown')} {t('riskLevel')}
          </Text>
        </View>
        <Text style={styles.confidence}>
          {Math.round((forecast?.confidence || 0.85) * 100)}% {t('confidence')}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <MaterialCommunityIcons name="bug" size={20} color="#4b5563" />
          <Text style={styles.label}>{t('predictedPest')}:</Text>
          <Text style={styles.value}>{forecast?.predicted_pest || 'Unknown'}</Text>
        </View>

        <View style={styles.row}>
          <MaterialCommunityIcons name="thermometer" size={20} color="#4b5563" />
          <Text style={styles.label}>{t('severity')}:</Text>
          <Text style={styles.value}>{forecast?.severity || 'Medium'}</Text>
        </View>

        <View style={styles.row}>
          <MaterialCommunityIcons name="percent" size={20} color="#4b5563" />
          <Text style={styles.label}>{t('predictedIncidence')}:</Text>
          <Text style={styles.value}>
            {forecast?.predicted_incidence?.toFixed(1) || '0'}%
          </Text>
        </View>
      </View>

      {forecast?.expected_timeline && (
        <View style={styles.footer}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
          <Text style={styles.timeline}>
            {forecast.expected_timeline.warning_period}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  riskText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  confidence: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  content: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    marginRight: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  timeline: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
  },
});

export default PestRiskCard;