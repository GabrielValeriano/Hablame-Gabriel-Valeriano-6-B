import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, StatusBar } from 'react-native';
import { Audio } from 'expo-av';

const ANCHO_TOTAL = 380;

export default function App() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const volAnim = useRef(new Animated.Value(-100)).current;

    // Usamos un valor base de -100 (silencio)

  // --- LÓGICA DE OPACIDAD ---
  const opacidad1 = volAnim.interpolate({
    inputRange: [-100, -80, -60],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const opacidad2 = volAnim.interpolate({
    inputRange: [-65, -55, -40],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const opacidad3 = volAnim.interpolate({
    inputRange: [-45, -40, -10],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });
  // ESTA ES LA CLAVE: 
  // El color se mueve, pero el contenido de adentro se mueve en sentido OPUESTO
  // para quedarse quieto en la pantalla (Efecto Ventana)
  const movimientoTinte = volAnim.interpolate({
    inputRange: [-100, -10],
    outputRange: [-ANCHO_TOTAL, 0],
    extrapolate: 'clamp',
  });

  const contraMovimiento = volAnim.interpolate({
    inputRange: [-100, -10],
    outputRange: [ANCHO_TOTAL, 0],
    extrapolate: 'clamp',
  });

  const startMonitoring = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      await recording.setProgressUpdateInterval(50);

      recording.setOnRecordingStatusUpdate((s) => {
        if (s.canRecord && s.metering !== undefined) {
          Animated.timing(volAnim, {
            toValue: s.metering,
            duration: 100,
            useNativeDriver: true,
          }).start();
        }
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    startMonitoring();
    return () => { recordingRef.current?.stopAndUnloadAsync(); };
  }, []);

  // Función para no repetir el diseño del indicador
  const RenderIndicador = ({ color }: { color: string }) => (
    <View style={[styles.filaIndicador, { width: ANCHO_TOTAL }]}>
      <View style={[styles.linea, { backgroundColor: color }]} />
      <Text style={[styles.textoGrita, { color: color }]}>GRITA</Text>
      <View style={[styles.linea, { backgroundColor: color }]} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* CONTENEDOR MAESTRO DEL INDICADOR */}
      <View style={styles.areaIndicador}>
        
        {/* 1. CAPA BASE: Gris y siempre quieta */}
        <RenderIndicador color="#222" />

        {/* 2. CAPA DE TINTE: Se mueve el contenedor, pero el texto adentro se compensa */}
        <Animated.View 
          style={[
            styles.capaMascara, 
            { transform: [{ translateX: movimientoTinte }] }
          ]}
        >
          <Animated.View style={{ transform: [{ translateX: contraMovimiento }] }}>
            <RenderIndicador color="#ff0000af" />
          </Animated.View>
        </Animated.View>

      </View>

      {/* TEXTOS (FADE IN/OUT) */}
      <View style={styles.content}>
        <Animated.View style={[styles.wrapper, { opacity: opacidad1 }]}>
          <Text style={styles.textSusurro}>Aunque te digan...</Text>
        </Animated.View>

        <Animated.View style={[styles.wrapper, { opacity: opacidad2 }]}>
          <Text style={styles.textNatural}>Que hagas silencio, podés pedir</Text>
        </Animated.View>

        <Animated.View style={[styles.wrapper, { opacity: opacidad3 }]}>
          <Text style={styles.textGrito}>¡AYUDA!</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wrapper: { position: 'absolute', width: '90%' },
  contenedorIndicador: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    width: 300, // Ancho fijo para que el scale sea preciso
    height: 3,
    backgroundColor: '#222',
    borderRadius: 2,
    overflow: 'hidden',
  },
  textSusurro: { color: '#fff', fontFamily: 'sans-serif-thin', 
      fontSize: 25, 
      letterSpacing: 7, 
      lineHeight: 25, // Espacio entre líneas para que respire
      fontStyle: 'italic',
      textAlign: 'center' 
    },
  textNatural: {color: '#fff', 
    fontSize: 30, 
    fontFamily: 'serif',
    fontWeight: '300', 
    textAlign: 'center' 
  },
  textGrito: { color: '#fff', fontFamily: 'sans-serif-condensed', 
      fontWeight: '900', 
      fontSize: 40, 
      transform: [{ scaleY: 1.5}],
      textAlign: 'center' 
    },

  areaIndicador: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    width: ANCHO_TOTAL,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  filaIndicador: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capaMascara: {
    position: 'absolute',
    width: ANCHO_TOTAL,
    height: '100%',
    overflow: 'hidden', // Esto es lo que "recorta" el color
    justifyContent: 'center',
  },
  linea: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  textoGrita: {
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: 'serif',

  },
});