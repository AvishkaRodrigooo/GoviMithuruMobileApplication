import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageSelector = ({ visible, onClose }) => {
  const [selected, setSelected] = useState('en');

  const languages = [
    { code: 'en', name: 'English', icon: 'flag-variant' },
    { code: 'si', name: 'සිංහල', icon: 'flag-variant' },
    { code: 'ta', name: 'தமிழ்', icon: 'flag-variant' },
  ];

  const handleSelect = async (code) => {
    setSelected(code);
    await AsyncStorage.setItem('appLanguage', code);
    // You can add app reload logic here if needed
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Language</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageItem,
                selected === lang.code && styles.selectedItem,
              ]}
              onPress={() => handleSelect(lang.code)}
            >
              <MaterialCommunityIcons
                name={lang.icon}
                size={24}
                color={selected === lang.code ? '#16a34a' : '#6b7280'}
              />
              <Text
                style={[
                  styles.languageName,
                  selected === lang.code && styles.selectedText,
                ]}
              >
                {lang.name}
              </Text>
              {selected === lang.code && (
                <MaterialCommunityIcons
                  name="check"
                  size={20}
                  color="#16a34a"
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  selectedItem: {
    backgroundColor: '#f0fdf4',
  },
  languageName: {
    fontSize: 16,
    marginLeft: 12,
    color: '#4b5563',
    flex: 1,
  },
  selectedText: {
    color: '#16a34a',
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 10,
  },
});

export default LanguageSelector;