// src/screens/profileScreen.js
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        fetchUserData(currentUser.uid,  currentUser);
      } else {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

 const fetchUserData = async (userId, currentUser) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();

      setUser({
        id: userId,
        fullName: data.fullName || currentUser.displayName || 'User',
        email: data.email || currentUser.email,
        phone: data.phone || '',
        role: data.role || 'Farmer',
        createdAt: data.createdAt || currentUser.metadata.creationTime,
      });
    } else {
      // No Firestore document, fallback to auth data
      setUser({
        id: userId,
        fullName: currentUser.displayName || 'User',
        email: currentUser.email,
        phone: '',
        role: 'Farmer',
        createdAt: currentUser.metadata.creationTime,
      });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  } finally {
    setLoading(false);
  }
};

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              console.log('User logged out successfully');
              // Navigation will be handled by App.js auth listener
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Edit');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.buttonText}>Go to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user.fullName || 'User'}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditProfile}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Info Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.label}>full Name</Text>
            <Text style={styles.value}>{user.fullName || 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.label}>Phone Number</Text>
            <Text style={styles.value}>{user.phone || 'Not set'}</Text>
          </View>
        </View>

       
      </View>

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.label}>Account Created</Text>
            <Text style={styles.value}>
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.label}>Role</Text>
            <Text style={[styles.value, styles.roleText]}>
              {user.role || 'Farmer'}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.supportButton]}
          onPress={() => Alert.alert('Support', 'Contact support at: support@govimithuru.com')}
        >
          <Text style={styles.actionButtonText}>📞 Contact Support</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.aboutButton]}
          onPress={() => Alert.alert('About', 'GoviMithuru - FarmerApp 2026')}
        >
          <Text style={styles.actionButtonText}>ℹ️ About App</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={[styles.actionButtonText, styles.logoutButtonText]}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>GoviMithuru © 2024</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#16a34a',
    fontSize: 16,
  },
  container: {
    padding: 20,
    backgroundColor: '#f9fafb',
    minHeight: '100%',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 15,
  },
  editButton: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  editButtonText: {
    color: '#16a34a',
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 15,
    paddingLeft: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: '60%',
  },
  smallText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  roleText: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 10,
  },
  supportButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  aboutButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  logoutButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  footerText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 20,
    marginBottom: 30,
    fontSize: 12,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#16a34a',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});