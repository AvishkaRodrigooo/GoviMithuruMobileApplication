import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

export default function SignInScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back 🌱</Text>

      <TextInput placeholder="Email" style={styles.input} />
      <TextInput placeholder="Password" secureTextEntry style={styles.input} />

      <Pressable style={styles.button} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.btnText}>Sign In</Text>
      </Pressable>

      <Text onPress={() => navigation.navigate('SignUp')} style={styles.link}>
        Don’t have an account? Sign Up
      </Text>
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
    backgroundColor: '#16a34a',
    padding: 15, borderRadius: 8, alignItems: 'center'
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
  link: { marginTop: 20, textAlign: 'center', color: '#16a34a' }
});
