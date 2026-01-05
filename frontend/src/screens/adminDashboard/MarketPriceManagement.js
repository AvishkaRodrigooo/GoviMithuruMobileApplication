import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { db, storage } from '../../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function MarketPriceManagement({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const unsubscribe = db
      .collection('marketReports')
      .orderBy('uploadedAt', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(data);
        setLoading(false);
      });

    return unsubscribe;
  }, []);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        Alert.alert('File Selected', `${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadPDF = async () => {
    if (!reportTitle.trim()) {
      Alert.alert('Error', 'Please enter a report title');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Error', 'Please select a PDF file first');
      return;
    }

    setUploading(true);

    try {
      // Create a reference to Firebase Storage
      const timestamp = Date.now();
      const fileName = `market-reports/${timestamp}_${selectedFile.name}`;
      const storageRef = ref(storage, fileName);

      // Upload file
      const response = await fetch(selectedFile.uri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Save metadata to Firestore
      await db.collection('marketReports').add({
        title: reportTitle.trim(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        downloadURL: downloadURL,
        uploadedAt: new Date(),
        uploadedBy: 'Admin',
      });

      Alert.alert('Success', 'Market report uploaded successfully!');
      setReportTitle('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload report. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const deleteReport = (id, title) => {
    Alert.alert(
      'Delete Report',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.collection('marketReports').doc(id).delete();
              Alert.alert('Success', 'Report deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete report');
            }
          },
        },
      ]
    );
  };

  const renderReport = ({ item }) => (
    <View style={styles.reportCard}>
      <View style={styles.pdfIcon}>
        <MaterialCommunityIcons name="file-pdf-box" size={36} color="#ef4444" />
      </View>
      <View style={styles.reportDetails}>
        <Text style={styles.reportTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.reportMetaRow}>
          <MaterialCommunityIcons name="calendar" size={14} color="#64748b" />
          <Text style={styles.reportMeta}>
            {new Date(item.uploadedAt.seconds * 1000).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Text>
        </View>
        <View style={styles.reportMetaRow}>
          <MaterialCommunityIcons name="file" size={14} color="#64748b" />
          <Text style={styles.reportMeta}>
            {(item.fileSize / 1024).toFixed(2)} KB
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteIconBtn}
        onPress={() => deleteReport(item.id, item.title)}
      >
        <MaterialCommunityIcons name="trash-outline" size={22} color="#dc2626" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Upload Section */}
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.uploadSection}>
          <View style={styles.uploadHeader}>
            <MaterialCommunityIcons name="cloud-upload" size={28} color="#16a34a" />
            <Text style={styles.sectionTitle}>Upload New Report</Text>
          </View>
          
          <Text style={styles.inputLabel}>Report Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Weekly Market Prices - January 2025"
            value={reportTitle}
            onChangeText={setReportTitle}
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.inputLabel}>PDF File</Text>
          <TouchableOpacity
            style={styles.selectFileButton}
            onPress={pickDocument}
          >
            <MaterialCommunityIcons name="file-pdf-box" size={24} color="#16a34a" />
            <View style={{ flex: 1 }}>
              <Text style={styles.selectFileText}>
                {selectedFile ? selectedFile.name : 'Select PDF File'}
              </Text>
              {selectedFile && (
                <Text style={styles.fileSizeText}>
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </Text>
              )}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={uploadPDF}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={styles.uploadButtonText}>Uploading...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="upload" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Reports List */}
        <View style={styles.reportsSection}>
          <View style={styles.reportsSectionHeader}>
            <MaterialCommunityIcons name="file-document-multiple" size={24} color="#16a34a" />
            <Text style={styles.sectionTitle}>
              Uploaded Reports ({reports.length})
            </Text>
          </View>

          {reports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="file-document-outline" size={80} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Reports Yet</Text>
              <Text style={styles.emptyText}>Upload your first market price report to get started</Text>
            </View>
          ) : (
            <FlatList
              data={reports}
              keyExtractor={item => item.id}
              renderItem={renderReport}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  uploadSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    marginBottom: 20,
    color: '#0f172a',
  },
  selectFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    gap: 12,
  },
  selectFileText: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
  fileSizeText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 2,
  },
  uploadButtonDisabled: {
    backgroundColor: '#86efac',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  reportsSection: {
    padding: 20,
  },
  reportsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  reportCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  pdfIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  reportDetails: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    lineHeight: 20,
  },
  reportMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reportMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  deleteIconBtn: {
    padding: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
});