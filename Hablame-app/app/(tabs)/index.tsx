import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, StatusBar } from 'react-native';
import { Audio } from 'expo-av';

// Definimos los niveles con sus estilos específicos
const NIVELES_GRITO = [
  { 
    umbral: -100, 
    texto: "TE SUSURRO\nMI SECRETO..\nSILENCIO", 
    colorT: "#888", 
    colorF: "#050505",
    style: {fontFamily: 'sans-serif-condensed', // Es la más gruesa y "apretada" por defecto
    fontWeight: '900', 
    fontSize: 50, // Tamaño masivo
    letterSpacing: -5, // Letras que se enciman brutalmente
    lineHeight: 45,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
    transform: [
      { scaleX: 1.5 }, // Estiramos el texto a lo ancho
      { scaleY: 2 }, // Lo estiramos a lo alto
    ]} 
  },
  { 
    umbral: -55, 
    texto: "TE ESTOY HABLO\nTRANQUILO\nACA NO TIENES QUE GRITAR", 
    colorT: "#000", 
    colorF: "#fff",
    style: { fontFamily: 'sans-serif-condensed', fontSize: 40 ,fontWeight: '900', letterSpacing: -1 } 
  },
  { 
    umbral: -25, 
    texto: "Siento que el Aire\nSe Acaba\nLas paredes se Cierran\nNo puedo Parar\nDe Gritar", 
    colorT: "#fff", 
    colorF: "#FF4500",
    style: {fontFamily: 'serif', // Limpia y moderna
      fontWeight: '300', 
      letterSpacing: -1,
      lineHeight: 55,
      } 
  },
  { 
    umbral: -15, 
    texto: "no puedo parar\nde gritar\nporque si me callo\ntodo se termina\ntodo es ruido\nnecesito hablar", 
    colorT: "#fff", 
    colorF: "#ff0000",
    style: { fontFamily: 'sans-serif-thin', // La fuente más delgada disponible
    fontWeight: '100', 
    fontSize: 18, // Tamaño pequeño para que el usuario tenga que "acercarse" a leer
    letterSpacing: 10, // Mucho espacio entre letras para que se sienta "aireado"
    lineHeight: 80,
    fontStyle: 'italic', // La inclinación le da una sensación de fragilidad
    opacity: 0.8, // Semi-transparente para que realmente parezca escondida
    textTransform: 'lowercase', // Todo en minúsculas suena más suave y silencioso
    transform: [
      { scaleY: 0.9 }, // La achatamos un poquito para que se vea más hundida
    ] } 
  },
];

const TEXTO_REPOSO = {
  texto: "EL SILENCIO ESPERA...",
    colorF: "#888", 
    colorT: "#050505",
  style: { fontWeight: '200', letterSpacing: 8 }
};

export default function App() {
  const [estado, setEstado] = useState<any>(TEXTO_REPOSO);
  const [esRuido, setEsRuido] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

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

          // Si el volumen supera el umbral de "Susurro" (-100)
          if (vol > -100) {
            const nivel = [...NIVELES_GRITO].reverse().find(n => vol >= n.umbral);
            if (nivel) {
              setEstado(nivel);
              setEsRuido(true);
            }
          } else {
            // Silencio absoluto
            setEstado(TEXTO_REPOSO);
            setEsRuido(false);
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    startMonitoring();
    return () => { recordingRef.current?.stopAndUnloadAsync(); };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: estado.colorF }]}>
      <StatusBar barStyle="light-content" />
      
      <View key={esRuido ? "grito" : "silencio"}>
        <Text style={[
          styles.textBase, 
          estado.style, 
          { color: estado.colorT }
        ]}>
          {estado.texto}
        </Text>
      </View>
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
    fontSize: 30, // Tamaño base que luego se modifica con el 'style' de cada nivel
    textAlign: 'center', 
  }
});