import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, StatusBar, Easing } from 'react-native';
import { Audio } from 'expo-av';

const NIVELES_GRITO = [
  { 
    umbral: -100, 
    texto: "Aunque te digan", 
    colorT: "#555", // Un gris medio que se funde
    colorF: "#000", 
    style: {
    fontFamily: 'sans-serif-thin',
    fontSize: 38,
    fontWeight: '100',
    lineHeight: 50,
    fontStyle: 'italic',
    textTransform: 'lowercase', // El susurro nunca grita, siempre en minúsculas
    transform: [
      { scaleY: 0.85 }, // Ligeramente achatado
      { skewX: '5deg' } // Una leve inclinación extra para dar inestabilidad
    ]
  }
  },
  { 
    umbral: -40, 
    texto: "Que hagas 'SILENCIO'\nPodes pedir", 
    colorT: "#000", 
    colorF: "#fff",
    style: { fontFamily: 'serif', fontWeight: '300', letterSpacing: -1, lineHeight: 55 } 
  },
  { 
    umbral: -20, 
    texto: "¡¡AYUDA!!", 
    colorT: "#fff", 
    colorF: "#FF4500",
    style: {fontFamily: 'sans-serif-condensed', // El estilo Serif se ve más rígido y tenso
      fontWeight: '900', 
      letterSpacing: -2.5, // Letras chocándose para dar ANSIEDAD
      transform: [{ skewX: '-15deg' }, { scaleY: 1.2 }], // Inclinación y estiramiento "incómodo"
      textTransform: 'uppercase'
    } 
  },
];

const TEXTO_REPOSO = {
  umbral: -160,
  texto: "¿Porque no Gritas?",
  colorF: "#888", 
  colorT: "#050505",
  style: { fontWeight: '200', letterSpacing: 8 }
};

export default function App() {
  const [estado, setEstado] = useState<any>(TEXTO_REPOSO);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const volAnim = useRef(new Animated.Value(-100)).current;

  const startMonitoring = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      await recording.setProgressUpdateInterval(50);

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.canRecord && status.metering !== undefined) {
          const vol = status.metering;
          volAnim.setValue(vol);

          if (vol > -100) {
            const nivel = [...NIVELES_GRITO].reverse().find(n => vol >= n.umbral);
            if (nivel) setEstado(nivel);
          } else {
            setEstado(TEXTO_REPOSO);
          }
        }
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    startMonitoring();
    return () => { recordingRef.current?.stopAndUnloadAsync(); };
  }, []);

  const opacidadSusurro = volAnim.interpolate({
    inputRange: [-100, -55],
    outputRange: [0.1, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: estado.colorF }]}>
      <StatusBar barStyle="light-content" />
      
      <Animated.View 
        style={{
          opacity: estado.umbral === -100 ? opacidadSusurro : 1,
        }}
      >
        <Text style={[styles.textBase, estado.style, { color: estado.colorT }]}>
          {estado.texto}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  textBase: {
    fontSize: 30,
    textAlign: 'center', 
  }
});