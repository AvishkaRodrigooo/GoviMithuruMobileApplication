import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function StageIdentificationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stage Identooification</Text>

      <Text>🌾 Current Stage: Tillering</Text>
      <Text>⏳ Next Stage: Panicle Initiation</Text>

      <Pressable style={styles.button}>
        <Text style={styles.btnText}>Analyze Another Plant</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  button: {
    marginTop: 20,
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
