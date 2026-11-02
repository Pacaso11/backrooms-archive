# 📁 BACKROOMS ARCHIVE // M.E.G. TERMINAL

<p align="center">
  <img src="https://img.shields.io/badge/EXPO-SDK%2057-black?style=for-the-badge&logo=expo" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/REACT%20NATIVE-0.86-61DAFB?style=for-the-badge&logo=react" alt="React Native 0.86" />
  <img src="https://img.shields.io/badge/TYPESCRIPT-6-blue?style=for-the-badge&logo=typescript" alt="TypeScript 6" />
  <img src="https://img.shields.io/badge/PLATFORM-ANDROID%20%7C%20TABLET%20%7C%20IOS-3DDC84?style=for-the-badge&logo=android" alt="Android" />
  <img src="https://img.shields.io/badge/SOURCE-WIKIDOT%20OFFICIAL-FFB000?style=for-the-badge" alt="Wikidot Official" />
</p>

---

Lector inmersivo táctico de expedientes confidenciales del universo **The Backrooms**, diseñado con la estética de terminal del **M.E.G. (Major Explorer Group)**. 

Inspirado en lectores como *Only SCP* y *SCP Reader*, esta aplicación consulta las ramas en inglés y español de **Wikidot** para ofrecer una experiencia de lectura móvil y adaptable a tablets. Los expedientes visitados se guardan en caché en el dispositivo y pueden volver a abrirse sin conexión; los índices de las listas también se conservan localmente.

---

## ⚡ Características Principales

* 📖 **Base de Datos Canónica Completa**: Acceso a más de 600 niveles, 100+ entidades, objetos anómalos, fenómenos, grupos, relatos y personas de interés (PDI).
* 📡 **Descarga y Sincronización Offline Total**: Motor de transcripción por paquetes modulares (*Paquete Esencial*, *Cúmulo I*, *Favoritos* o *Archivo Completo*) con control de peticiones para evitar bloqueos y modo 100% sin internet para viajes.
* 🖼️ **Galería Lightbox y Visor con Zoom**: Visualización detallada de todas las fotos, esquemas y notas anexas con soporte táctil para zoom de pellizco (*pinch-to-zoom*).
* 📜 **Barra de Progreso e Índice Rápido Flotante**: Indicador de porcentaje de lectura superior y menú de salto instantáneo (*Quick Jump*) a secciones clave del expediente.
* 🏷️ **Filtros de Hostilidad en Entidades**: Clasificación rápida entre entidades dóciles, neutrales, hostiles o de peligro extremo.
* 🌐 **Motor Bilingüe Instantáneo (`ES` / `EN`)**: Alterna con un solo toque entre la versión original en inglés y la traducción al español, procesada con un motor de pulido lingüístico adaptado a la terminología oficial de la comunidad (*los Backrooms*, *los Frontrooms*, *noclip*, *Agua de Almendras*, *Ladrón de Piel*).
* ⚡ **Hipervínculos Noclip (Deep Linking)**: Detección inteligente de referencias cruzadas en el texto (ej. `Nivel 0`, `Entidad 10`, sagas narrativas) que permiten navegar directamente de un expediente a otro con historial de navegación y retroceso táctico.
* ⚔️ **Sagas y Cánones Interactivos**: Soporte completo para pestañas YUI y sagas complejas (Caballeros Negros, Canon de Decadencia, Canon de la Desolación, etc.) con sus cronologías, ramas y fases narrativas.
* 💾 **Caché Local Inteligente y Limpieza de Historial**: Gestión de almacenamiento con medidor de MB ocupados, opción de purga de historial y protección de favoritos.
* 👓 **Personalización Ergonómica (Modo Aa)**: Control de tamaño de tipografía (Compacta, Normal, Grande, Enorme) y tres temas especializados:
  * **M.E.G. OLED**: Negro puro táctico de alto contraste.
  * **Archivo Sepia**: Tono cálido para lecturas nocturnas prolongadas.
  * **Midnight Blue**: Azul naval oscuro confidencial.
* 📱 **Diseño Adaptativo Móvil y Tablet**: Interfaz unificada de flujo completo con navegación fluida, elevación sobre la barra de navegación del sistema y visualización limpia.

---

## 📲 Descarga e Instalación Directa (Android)

Puedes descargar la última versión compilada en formato **APK** desde la sección de **Releases** de este repositorio:

👉 **[Descargar la última versión publicada](../../releases/latest)**

*Compatible con Android 7.0 (Nougat) y superior.*

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: [Expo](https://expo.dev) SDK 57 / [React Native](https://reactnative.dev) 0.86
- **Navegación**: [Expo Router](https://docs.expo.dev/router/introduction/) 57 (rutas basadas en archivos)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Almacenamiento Local**: `@react-native-async-storage/async-storage`
- **Iconografía**: `@expo/vector-icons` (Ionicons)
- **Construcción nativa**: EAS Build / Continuous Native Generation (CNG)

---

## 💻 Desarrollo Local

Si deseas clonar el proyecto y ejecutarlo en tu propio entorno:

```bash
# 1. Clonar el repositorio
git clone https://github.com/Pacaso11/backrooms-archive.git
cd backrooms-archive

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npx expo start

# 4. Comprobaciones de código
npx tsc --noEmit     # Verificación de tipos TypeScript
npx expo lint        # Linting del proyecto
```

---

## ⚖️ Licencia y Atribución

Este proyecto es de código abierto bajo la licencia **MIT**.

El contenido narrativo, textos de niveles, entidades y archivos de los Backrooms pertenecen a sus respectivos autores de la comunidad de **The Backrooms Wiki** en [Wikidot](https://backrooms-wiki.wikidot.com/) y se distribuyen bajo la licencia [Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0)](https://creativecommons.org/licenses/by-sa/3.0/).
