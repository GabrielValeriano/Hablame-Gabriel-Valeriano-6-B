import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, View, Text } from 'react-native';
import { Audio } from 'expo-av';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const VisibilidadDelTexto = useRef(new Animated.Value(1)).current;

  async function UtilizamosElMicrofono() {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') return;

    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

    await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
      (status) => {
        if (status.metering !== undefined) {
          // Si el ruido es fuerte (mayor a -30), desvanecer
          const NivelDeRuido = status.metering > -30 ? 0 : 1;
          
          Animated.timing(VisibilidadDelTexto, {
            toValue: NivelDeRuido,
            duration: 200, // Suavidad de la transición
            useNativeDriver: true,
          }).start();
        }
      },
      100
    );
  }

  useEffect(() => {
    UtilizamosElMicrofono();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Animated.View style={[ { opacity: VisibilidadDelTexto }]}>
          <Text style={styles.texto}>¡Grita!</Text>
        </Animated.View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1,backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  texto: { color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center' }
});