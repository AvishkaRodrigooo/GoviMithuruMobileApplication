import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { auth } from '../firebase/firebaseConfig';

const SignInScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ================= SIGN IN =================
  const handleSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Validation Error', 'Please enter your password');
      return;
    }

    setLoading(true);

    try {
      // 🔐 Firebase Authentication
      await auth.signInWithEmailAndPassword(email.trim(), password);

      // ✅ REMOVED manual navigation - App.js handles it automatically
      // The onAuthStateChanged listener in App.js will detect the sign-in
      // and show the appropriate screen based on the user's role

    } catch (error) {
      console.log('Sign in error:', error);

      let message = 'Login failed. Please try again.';

      switch (error.code) {
        case 'auth/user-not-found':
          message = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many attempts. Try again later.';
          break;
      }

      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.innerContainer}>

          {/* ---------- HEADER ---------- */}
          <View style={styles.header}>
            <Text style={styles.appName}>GoviMithuru</Text>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* ---------- FORM ---------- */}
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#999"
            />

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, loading && styles.disabledButton]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            {/* Create Account */}
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={() => navigation.navigate('SignUp')}
            >
              <Text style={styles.createAccountButtonText}>
                Create New Account
              </Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signUpLink}> Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ---------- APP INFO ---------- */}
          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>GoviMithuru App</Text>
            <Text style={styles.versionText}>2025</Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignInScreen;

// ================= STYLES =================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  formContainer: {
    marginBottom: 30,
  },
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: '#16a34a',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#86efac',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 14,
  },
  createAccountButton: {
    backgroundColor: '#fff',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#16a34a',
    marginBottom: 25,
  },
  createAccountButtonText: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  signUpLink: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: 'bold',
  },
  appInfo: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  appInfoText: {
    fontSize: 14,
    color: '#999',
  },
  versionText: {
    fontSize: 12,
    color: '#ccc',
  },
});