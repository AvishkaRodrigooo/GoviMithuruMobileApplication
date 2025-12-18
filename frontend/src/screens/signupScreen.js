import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

export default function SignUpScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account 🌾</Text>

      <TextInput placeholder="Full Name" style={styles.input} />
      <TextInput placeholder="Email" style={styles.input} />
      <TextInput placeholder="Phone" keyboardType="phone-pad" style={styles.input} />
      <TextInput placeholder="Password" secureTextEntry style={styles.input} />

      <Pressable style={styles.button} onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.btnText}>Sign Up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#ccc',
    padding: 12, borderRadius: 8, marginBottom: 15
  },
  button: {
    backgroundColor: '#15803d',
    padding: 15, borderRadius: 8, alignItems: 'center'
  },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
