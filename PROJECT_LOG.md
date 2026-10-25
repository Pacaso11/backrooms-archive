# 📁 BACKROOMS M.E.G. DOSSIER READER — GUÍA MAESTRA DEL PROYECTO

> **Documento de Referencia Permanente para Desarrolladores y Agentes de IA (Antigravity, OpenCode, Claude, etc.)**  
> *Última actualización: Octubre 2026 | Versión de la Aplicación: 1.0.0 | Expo SDK: 57.0.30*

---

## 1. 📌 Resumen Ejecutivo y Misión del Proyecto

Esta aplicación móvil (para Android e iOS, teléfonos y tablets) es un lector inmersivo nativo del universo **The Backrooms**, diseñado al estilo de aplicaciones de culto como *Only SCP* y *SCP Reader*.
La interfaz emula un terminal del **M.E.G. (Major Explorer Group)**, combinando una estética táctica/militar oscura con tipografía monospace y visualización confidencial de expedientes.

La app consume información directamente de las dos ramas oficiales de **Wikidot**:
1. **Rama Oficial en Inglés**: `https://backrooms-wiki.wikidot.com` (+600 niveles y +100 entidades).
2. **Rama Oficial en Español**: `https://es-backrooms-wiki.wikidot.com` (traducciones oficiales de la comunidad hispanohablante).

### Objetivos Clave
- **Bilingüe con preferencia Española**: Permite alternar entre Inglés y Español instantáneamente mediante un selector global (`ES | EN`).
- **Nombres Canónicos y Subtítulos**: Muestra siempre el número y el subtítulo oficial o apodo (ej. `Nivel 0 - "Umbral"`, `Entidad 3 - "Sonrientes"` / `Smiler`).
- **Lectura Offline Total**: Todos los expedientes abiertos se guardan en caché local persistente con `@react-native-async-storage/async-storage`.
- **Restauración de Progreso de Lectura**: Si el usuario cierra la app o cambia de pantalla leyendo cualquier nivel (ej. Nivel 100 al 65%), al volver o tocar el banner superior "Continuar Lectura", se restaura el nivel exacto y la posición de scroll (`scrollY`).
- **Motor Noclip (Deep Linking)**: Detecta automáticamente menciones de otros niveles y entidades en el texto (ej. `Nivel 0`, `Entidad 10`) y genera enlaces táctiles que navegan directamente al expediente.
- **Personalización Tipo Kindle**: Modal `Aa` para cambiar tamaño de letra (Compacta, Normal, Grande, Enorme) y paleta de color (M.E.G. OLED, Archivo Sepia, Midnight Blue).

---

## 2. ⚙️ Entorno de Desarrollo y Restricciones Técnicas Críticas

> [!CAUTION]
> **NO MODIFICAR LA VERSIÓN DE EXPO SDK A 58 O SUPERIOR.**
> El cliente móvil del usuario utiliza la app oficial de **Expo Go** descargada de Google Play Store, compatible con **SDK 57** (cliente versión `57.0.9`). Si se actualizan los paquetes a SDK 58, la app dejará de cargar en el móvil con error de versión incompatible.

### Dependencias Principales (`package.json`)
- `expo`: `~57.0.30`
- `expo-router`: `~5.0.0`
- `react`: `19.1.0`
- `react-native`: `0.79.5`
- `@react-native-async-storage/async-storage`: `2.1.2`
- `@expo/vector-icons`: `^14.0.4`
- `legacy-peer-deps=true` configurado en `.npmrc` para evitar conflictos de instalación de dependencias en React 19.

### Comandos de Ejecución y Diagnóstico
```powershell
# Iniciar servidor con túnel para escanear en Expo Go
npx.cmd expo start --tunnel

# Comprobación estricta de TypeScript (OBLIGATORIO antes de cerrar cualquier tarea)
npx.cmd tsc --noEmit

# Diagnóstico de dependencias
npx.cmd expo-doctor
```

---

## 3. 🗺️ Estructura del Proyecto

```
backrooms-archive/
├── src\
│   ├── app\                                # Rutas de Expo Router (Cada archivo = Pantalla)
│   │   ├── _layout.tsx                     # Root Layout con Stack Navigator (fondo oscuro)
│   │   ├── (tabs)\                         # Navegación por pestañas inferiores (Bottom Tabs)
│   │   │   ├── _layout.tsx                 # Configuración visual de pestañas M.E.G.
│   │   │   ├── index.tsx                   # Pantalla principal: Niveles de los Backrooms
│   │   │   ├── entities.tsx                # Directorio de Entidades (clasificadas por ID/apodo)
│   │   │   └── favorites.tsx               # Expedientes guardados offline / favoritos
│   │   └── dossier\
│   │       └── [id].tsx                    # Pantalla de expediente individual (Stack screen)
│   ├── components\                         # Componentes modulares y reutilizables
│   │   ├── DossierView.tsx                 # Lector principal de expedientes con scroll memory
│   │   ├── EntityCard.tsx                  # Tarjeta de entidad con subtítulo y estado de lectura
│   │   ├── HazardFilterBar.tsx             # Barra de filtros por Clase de Supervivencia (0 a 5, Deadzone)
│   │   ├── LanguageToggle.tsx              # Selector rápido ES / EN
│   │   ├── LevelCard.tsx                   # Tarjeta de nivel con subtítulo y badge de dificultad
│   │   ├── NoclipText.tsx                  # Transformador de texto con enlaces interactivos a niveles/entidades
│   │   ├── ReaderSettingsModal.tsx         # Modal tipo Kindle (temas visuales y fuentes)
│   │   ├── ResumeReadingBanner.tsx         # Banner flotante para reanudar última lectura con scroll %
│   │   └── SurvivalBadge.tsx               # Insignia de Clase de Dificultad de Supervivencia oficial
│   ├── constants\
│   │   └── theme.ts                        # Colores tácticos M.E.G., fuentes, temas y metadatos de clases
│   ├── services\
│   │   ├── storageService.ts               # Persistencia con AsyncStorage (caché, favoritos, historial, scroll)
│   │   └── wikidotService.ts               # Web crawler, sanitizador HTML, extractor de secciones y traductor neural
│   └── types\
│       └── wikidot.ts                      # Interfaces TypeScript para todo el modelo de datos
├── app.json                                # Configuración de Expo / Expo Router
├── package.json                            # Dependencias fijadas a Expo SDK 57
├── tsconfig.json                           # Configuración de compilación TypeScript
└── PROJECT_LOG.md                          # Este archivo de registro y arquitectura
```

---

## 4. 🧠 Motor de Scraping, Sanitización y Traducción (`wikidotService.ts`)

El crawler en `wikidotService.ts` resuelve los retos específicos del formato HTML de Wikidot:

### A. Títulos y Subtítulos Canónicos
- Wikidot publica títulos en formatos como `Level 0 - "Threshold"` o `Entidad 3 - "Sonrientes"`.
- `fetchLevels` y `fetchEntities` leen primero la lista completa de Wikidot EN (+600 elementos) y luego superponen (`overlay`) los títulos oficiales de Wikidot ES.
- Si un nivel no tiene traducción oficial en ES, conserva el nombre en inglés pero se formatea limpiamente.

### B. Sanitización Segura sin Pérdida de Lore
> [!IMPORTANT]
> **REGLA DE ORO DE EXTRACCIÓN**: Nunca utilices expresiones regulares codiciosas que busquen subcadenas como `ios` en etiquetas `<p>`.
> En español, cientos de palabras cotidianas contienen `ios` (`espacios`, `laboratorios`, `silencioso`, `edificios`). Un regex anterior borró 22,000 caracteres del Nivel 0.1 por este motivo.
- **Bloques Desplegables (`collapsible-block`)**:
  - Si el bloque contiene información de licencia o autor (`/autor|licencia|license|citation|créditos/i`), se descarta limpiamente.
  - Si es **lore del expediente** (ej. registros de exploración, grabaciones de audio, transcripciones de radio), se **despliega e integra** como subsección (`### 📂 [Título]`).
- **Eliminación de Basura de Wikidot**: Se eliminan limpiamente widgets de votación (`.page-rate-widget-box`), selectores de idioma (`.translations`), barras de navegación (`.footer-wikiwalk-nav`), etiquetas de página (`.page-tags`) y anuncios (`#wad-...`).
- **Artefactos de Plantilla**: Se limpian etiquetas no procesadas de Wikidot como `{$white}`, `{$color}`, `{$image}`, `{$one}`, `{$two}`, `{$three}`.
- **Entidades HTML**: El decodificador `decodeHtmlEntities` procesa entidades nombradas (`&quot;`, `&amp;`), numéricas (`&#8211;`, `&#171;`, `&#187;`, `&#8230;`, `&#160;`, `&#32;`) y cualquier código hexadecimal (`&#x...;`).

### C. Estructura de Secciones, Prólogos y Epílogos Canónicos
- **Prólogo / Relato Inicial (`item.prologue`)**:
  - En la wiki canónica, muchos niveles (como el Nivel 0.1 con la historia de Ria Valpuri observando las estrellas desde la Estación Zenith) comienzan con narraciones y relatos preliminares antes del encabezado `Descripción:`.
  - `wikidotService.ts` aísla este relato preliminar y `DossierView.tsx` lo posiciona **al inicio absoluto del expediente** (`REGISTRO PRELIMINAR / RELATO INICIAL`), tal como está estructurado en Wikidot.
- **Epílogo / Relato Final (`item.epilogue`)**:
  - Cierres dramáticos o narrativos tras las salidas (como el relato de Ria perdida y llorando en los pasillos amarillos) se extraen y renderizan al final en un bloque de cierre estilizado (`REGISTRO FINAL / EPÍLOGO`).
- **Filtrado de Temas CSS y Cajas de Info**:
  - Se eliminan bloques de código CSS (`NuTerminal`, `black-highlighter`, `código del tema`) e infoboxes de créditos (`#u-infobox`, `.infobox`) para evitar que código técnico se cuele en el texto literario.

### D. Motor de Traducción Neural de Respaldo (`translateText`)
- Algunos niveles (como el Nivel 0.7) existen en Wikidot EN pero dan error 404 en Wikidot ES porque la comunidad aún no los ha traducido.
- Cuando `lang === 'es'` y la página no existe en Wikidot ES (`isFallback = true`), el servicio activa automáticamente la traducción neural por párrafos (`translateText`), traduciendo título, prólogo, descripción, secciones, epílogo, entradas y salidas.
- En `DossierView.tsx` se muestra un distintivo informativo: *"Traducción M.E.G. activa. Este expediente no cuenta con traducción oficial en Wikidot ES y ha sido traducido para lectura en español."*
- El resultado traducido se guarda en caché local con clave `_es`, por lo que las lecturas posteriores son instantáneas y offline.

---

## 5. 💾 Persistencia y Estado (`storageService.ts`)

| Clave de Almacenamiento | Propósito | Formato |
|---|---|---|
| `@backrooms_cache_[id]_[lang]_[salt]` | Expediente completo offline (usa sal `v5_canonical` para invalidar versiones truncadas previas) | Objeto JSON `BackroomsItem` |
| `@backrooms_favorites` | Lista de IDs marcados con estrella | Array de strings |
| `@backrooms_read_history` | Expedientes ya leídos por el usuario | Array de strings (IDs) |
| `@backrooms_last_read` | Último expediente leído y posición de scroll | Objeto JSON `LastReadSession` (`scrollY`, `scrollPercent`, `path`) |
| `@backrooms_lang` | Idioma preferido del usuario | `'es' \| 'en'` |
| `@backrooms_reader_settings` | Preferencias de tema y tamaño de fuente | `{ theme: 'meg'\|'sepia'\|'midnight', fontSize: 'compact'\|'normal'\|'large'\|'huge' }` |

*Soporte de Recarga*: `DossierView` incluye `RefreshControl` (arrastrar hacia abajo para refrescar) y botón de actualización en la barra superior para forzar la recarga directa desde Wikidot evitando la caché local.

---

## 6. 📝 Registro de Modificaciones y Correcciones Recientes

### Versión 1.0.0 — Octubre 2026
1. **Fidelidad Canónica Total y Posicionamiento de Prólogos (Nivel 0.1 y otros)**:
   - Se corrigió la disposición en pantalla: el relato inicial de la chica (**Ria Valpuri**) en la Estación Zenith ahora se renderiza **arriba del todo**, antes de la descripción, en su orden cronológico exacto de la wiki.
   - Se añadió extracción de epílogos finales para que relatos de cierre no se confundan con las listas de salidas.
2. **Filtrado Limpio de Código CSS (Nivel 1)**:
   - Se filtraron los bloques colapsables de código de tema CSS (`+ Código del Tema`, `NuTerminal`, etc.) que contaminaban el texto en el Nivel 1.
3. **Invalidación de Caché Automática y Botón de Recarga**:
   - Se implementó sal de caché (`v5_canonical`) para que ningún usuario quede atrapado con expedientes incompletos descargados anteriormente.
   - Se añadió `RefreshControl` (pull-to-refresh) y botón de refresco táctil en la barra superior.
4. **Solución a Nivel 0.2**:
   - Limpieza de variables de plantilla `{$one}`, `{$white}`, etc.
   - Decodificación universal de entidades Unicode (`&#171;`, `&#187;`, `&#8211;`, `&#32;`, etc.).
5. **Traducción Automática de Respaldo (Nivel 0.7)**:
   - Niveles sin traducción oficial en Wikidot ES se traducen automáticamente manteniendo toda la jerarquía de secciones.
6. **Nombres Canónicos en Listas**:
   - Tarjetas con subtítulos oficiales (ej. `Nivel 0 - "Umbral"`, `Entidad 3 - "Sonrientes"`).
7. **Documentación Maestra `PROJECT_LOG.md`**:
   - Registro permanente para preservación del proyecto en futuras sesiones.
8. **Evolución Estética Sobria Inspirada en OnlySCP & REA Reader**:
   - **Rayas de Peligro Tácticas**: Borde lateral izquierdo coloreado según el nivel de hostilidad/clase de supervivencia (Clase 0: Verde `#10b981`, Clase 1: Cyan `#06b6d4`, Clase 2-3: Ámbar `#f59e0b`, Clase 4-5 / Hostil: Rojo `#ef4444`, Enigmático: Violeta `#a855f7`).
   - **Snippets / Vistas Previas de Expediente**: Cada tarjeta incluye un resumen de 2 líneas con contexto operativo del M.E.G.
   - **Taxonomía de Etiquetas (Tags)**: Chips temáticos estilo SCP en la base de la tarjeta (`#M.E.G.`, `#Subnivel`, `#Seguro`, `#Hostil`, etc.).
   - **Barra de Métricas / Estadísticas**: Encabezado en las pestañas con contador de total de registros, leídos y pendientes por leer.
   - **Control Segmentado de Filtro de Lectura**: Selector rápido `[ TODOS ]` | `[ NO LEÍDOS ]` | `[ LEÍDOS ]` con contadores en tiempo real para maratonear expedientes sin repetir los ya leídos.
9. **Desmarcado Interactivo de Leído / No Leído**:
   - **Toggle directo en tarjetas**: El usuario puede pulsar el icono de checkmark en la esquina superior de la tarjeta para alternar entre leído y no leído sin necesidad de entrar al nivel.
   - **Toggle en DossierView**: En la barra superior de acciones y en la cabecera (junto al ID) se añadió un botón/pill interactivo `[✓ LEÍDO]` / `[○ NO LEÍDO]` para desmarcar el nivel si el usuario entró por error.
   - **Corrección de persistencia en scroll**: Se desacopló `markAsRead` de `saveLastReadSession` para que el desplazamiento no vuelva a forzar el estado de leído sobre un nivel desmarcado manualmente.
10. **Cabecera Colapsable y Ahorro de Espacio Vertical**:
   - Se rediseñó el encabezado para que el panel de filtros avanzados, las estadísticas numéricas y el banner de reanudar lectura sean colapsables (`isPanelExpanded`).
   - Por defecto se muestra en modo compacto (solo buscador + selector segmentado ultrafino `TODOS | NO LEÍDOS | LEÍDOS` + botón `MÁS / MENOS`), liberando más del 70% del espacio vertical para la lista de expedientes.
   - Si hay un filtro de clase activo mientras está replegado, se muestra una micro-etiqueta táctica descartable sin ocupar espacio innecesario.
   - El banner de reanudar lectura incluye botón de descarte directo (`✕`) y se minimiza a una sola línea sutil cuando está replegado.
11. **Auditoría de Niveles en Wikidot (602 vs 999)**:
   - Se analizó la estructura de Wikidot `normal-levels-i` (que abarca del Nivel 0 al Nivel 999).
   - De los 1000 huecos numéricos posibles en la wiki, existen exactamente **602 niveles escritos** por autores de la comunidad; los 452 restantes son enlaces rojos/ranuras vacías marcadas oficialmente como `[NO DATA]` (`class="newpage"`).
   - La aplicación indexa y contiene el **100% de los niveles existentes hasta el Nivel 999** (incluyendo Nivel 900, 990, 998, 999, etc.).
12. **Alineación Milimétrica y Optimización de Rendimiento Extremo (Eliminación de Lag)**:
   - **Encuadre y Centrado Tipográfico**: Se corrigió el descuadre visual en el selector `TODOS | NO LEÍDOS | LEÍDOS` y en las insignias de dificultad. Se aplicó `includeFontPadding: false` y `textAlignVertical: 'center'` para eliminar el desplazamiento vertical asimétrico nativo de fuentes monospace en Android, junto con dimensiones simétricas (`height: 34`, `marginHorizontal: 12`) y `numberOfLines={1}`.
   - **Memoización con `React.memo` y `useCallback`**: Se envolvieron `LevelCard` y `EntityCard` en `React.memo` con comparador granular (`id`, `isSelected`, `isRead`, `title`, `subTitle`, `lang`). Todas las funciones de renderizado y pulsación se estabilizaron con `useCallback`.
   - **Respuesta Instantánea al Colapsar/Filtrar**: Al abrir o cerrar el panel táctico (`MÁS / MENOS`) o cambiar de clase/filtro, el hilo de JavaScript ya no recalcula ni vuelve a pintar los más de 600 componentes de la lista (0 re-renders en tarjetas estables).
   - **Transiciones Fluidas a 60 FPS**: Se integró `LayoutAnimation` nativo en Android e iOS, y se ajustaron los parámetros de virtualización de `FlatList` (`maxToRenderPerBatch: 10`, `windowSize: 5`, `updateCellsBatchingPeriod: 50`, `removeClippedSubviews`).
13. **Primera Versión Descargable APK (Release v1.0.0)**:
   - **Compilación Nativa de Producción**: Se generó el paquete nativo Android mediante Gradle `assembleRelease` (`com.backrooms.meg.reader`), empaquetando todo el bundle JavaScript, assets, tipografías e iconografía M.E.G. directamente en el binario sin depender de servidores de desarrollo.
   - **Compatibilidad e Instalación Universal**: Firmada para instalación directa en cualquier dispositivo Android (teléfonos y tablets) sin necesidad de cuenta de Google Play Console.
   - **Archivo Local**: Disponible en la raíz del proyecto como `Backrooms_Archive_v1.0.0.apk` (84.3 MB).
   - **Preservación de Expo Go**: La estructura del proyecto y compatibilidad con Expo SDK 57 se mantienen 100% intactas para continuar probando sobre la marcha sin reinstalar.
14. **Depuración y Mejoras UX en Emulador Android (`android-cli` / AVD `organiza`)**:
   - **Sanitización Integral de Comillas Redundantes (`cleanQuotes`)**: Se eliminaron las dobles comillas anidadas (`""...""` / `«...»` / `“...”`) presentes en los títulos crudos de Wikidot y en los snippets de niveles y entidades. Centralizado en `wikidotService.ts` y aplicado uniformemente en `LevelCard`, `EntityCard` y `DossierView`.
   - **Enriquecimiento Visual del Historial y Guardados (`SAVED -> HISTORIAL`)**: Se reestructuró `src/app/(tabs)/favorites.tsx` para resolver metadatos completos (`title`, `subTitle`, `hazardClass`) desde el índice en caché. Cada expediente leído ahora se visualiza con tarjeta táctica M.E.G., franja lateral de color por clase, insignia de expediente (`LVL-X` / `ENT-X`) y chevron de navegación.
   - **Botón Rápido de Limpieza en Barra de Búsqueda (`SearchBar`)**: Se incorporó un botón interactivo `✕` con icono de cierre, hitSlop táctil optimizado y respuesta inmediata para vaciar la búsqueda en un solo toque.
   - **Auto-Colapso Inteligente del Panel Táctico**: Al tocar un nivel/entidad o cambiar de clase de peligro en el panel extendido (`MÁS / MENOS`), el panel se auto-colapsa automáticamente con una suave animación nativa (`LayoutAnimation`), despejando la pantalla para concentrarse en la lectura.
   - **Verificación Automatizada**: Probado y validado en vivo en emulador Android (`emulator-5554`) mediante la herramienta oficial `android-cli` (`android screen capture`). Zero errores de TypeScript (`npx tsc --noEmit`).
15. **Restauración y Optimización del Flujo Expo Go en Terminal**:
   - **Desbloqueo de Política de Ejecución PowerShell**: Se solucionó el bloqueo de Windows (`PSSecurityException` sobre `npm.ps1`/`npx.ps1`) configurando `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force` para permitir ejecutar `npm start` y `npx expo start` directamente en cualquier consola.
   - **Alineación Exacta de Parches SDK 57**: Se actualizaron `expo` (`~57.0.31`) y `expo-router` (`~57.0.29`) resolviendo al 100% las advertencias de dependencias detectadas por `expo-doctor`.
   - **Lanzadores de Acceso Rápido**: Se crearon `start.bat` (red local Wi-Fi) y `start-tunnel.bat` (túnel remoto para datos móviles) en la raíz del proyecto para iniciar el servidor de desarrollo y mostrar el código QR con un solo clic.
16. **Resolución del Bucle Infinito de Carga en Expo Go (Diagnóstico y Modo Túnel por Defecto)**:
   - **Diagnóstico del "Spinner Infinito"**: Cuando el servidor se ejecutaba en modo LAN (`192.168.0.14`), si el dispositivo móvil estaba en datos móviles (4G/5G) o en una red Wi-Fi con aislamiento AP entre bandas (2.4GHz / 5GHz / Ethernet), los paquetes TCP hacia la IP privada se descartaban silenciosamente, provocando que la pantalla de Expo Go se quedara cargando indefinidamente sin arrojar error visible.
   - **Modo Túnel Global con Limpieza de Caché por Defecto**: Se reconfiguró `npm start` y los scripts lanzadores (`start.bat` y `start-tunnel.bat`) para ejecutar siempre `expo start --tunnel -c`. Esto garantiza que el código QR generado sea público (`*.exp.direct`) y accesible sin importar la red del móvil, purgando simultáneamente la caché de Metro para evitar atascos.
17. **Corrección de Solapamiento de Barra Inferior de Android y Sección "Biblioteca" (Wikidot Archive Hub)**:
   - **Elevación Dinámica de la Barra de Navegación (`useSafeAreaInsets`)**: Se corrigió el error donde la barra de 3 botones de Android / barra gestual del sistema tapaba las pestañas inferiores (`LEVELS`, `ENTITIES`, `SAVED`). Se reemplazó la altura estática de `60dp` en `src/app/(tabs)/_layout.tsx` por un cálculo dinámico `54 + (insets.bottom > 0 ? insets.bottom + 2 : 8)`. Se ajustó el `paddingBottom` en todas las listas a `80dp` para asegurar que el último elemento sea accesible sin interferencias.
   - **Sección Oficial "Biblioteca" (Library Hub)**: Se implementó la nueva pestaña `BIBLIOTECA` (`src/app/(tabs)/library.tsx`) en el `BottomTabsNavigator` respetando el diseño táctico M.E.G.
   - **Mapeo de 11 Categorías Oficiales de Wikidot**: Incorpora carrusel horizontal con chips interactivos para: `Objetos`, `Fenómenos`, `Grupos`, `Relatos`, `Personas de Interés (PDIs)`, `Cánones`, `Series y Subclústeres`, `Entradas de Broma`, `Páginas Técnicas`, `Entidades Enigmáticas` y `Galería de Arte`.
   - **Caché y Funcionamiento Offline**: Integrado con `storageService.ts` bajo `@backrooms_library_${category}_v1` para persistencia en `AsyncStorage`. Las categorías se cargan de forma diferida (lazy load) al seleccionarse, sin penalizar el arranque ni saturar la memoria.
   - **Filtrado y Búsqueda en Vivo**: Búsqueda táctica por texto, selector de estado (`TODOS | NO LEÍDOS | LEÍDOS`), contador dinámico, pull-to-refresh y soporte bilingüe (`ES | EN`).
   - **Visualización y Expedientes Completos**: Cada elemento se presenta mediante `LibraryItemCard` y se vincula con el visor `DossierView`, permitiendo lectura completa con imágenes, formato Wikidot, vínculos Noclip e historial de lectura.
   - **Validación Visual y Binario Release Actualizado**: Verificado en emulador Android (`emulator-5554`) con capturas de pantalla, confirmando elevación perfecta sobre la barra del sistema y renderizado fluido. Compilado e instalado en `Backrooms_Archive_v1.0.0.apk`.
18. **Corrección de Ejecución de `start.bat` y Lanzador Expo Go**:
   - **Diagnóstico del Cierre Inesperado**: El comando en Windows CMD fallaba debido a interferencias de scripts shell (`npx` vs `npx.cmd`) y sintaxis de paréntesis en bloques por lotes.
   - **Llamada Directa al Binario Local**: Se configuró `start.bat` y `start-tunnel.bat` para apuntar directamente a `%~dp0node_modules\.bin\expo.cmd` con bandera explícita `--go` (`expo.cmd start --go --tunnel -c`), evitando el desvío a Development Build provocado por la presencia del directorio `android/`.
   - **Liberación Preventiva de Puerto**: Limpieza automática previa del puerto `8081` mediante `netstat` y `taskkill` para prevenir errores de colisión.
19. **Motor de Cánones Interactivos, Pestañas YUI y Navegación Universal de Sagas**:
   - **Diagnóstico del Contenido Desactualizado en Español**: Se detectó que las páginas de cánones en Wikidot ES (como `black-knights` y `decay-canon-hub`) eran borradores obsoletos de 2021 de apenas 20 KB que carecían de las sagas, cronologías y ramas modernas (63 KB en la wiki original en inglés).
   - **Master Source & Traducción Neuronal Automatizada**: Se configuró `fetchItemDetails` para que los cánones utilicen siempre la fuente canónica en inglés de Wikidot como base maestra autorizada, traduciendo automáticamente al español todos los títulos, subtítulos, pestañas, sagas y secciones cuando se visualiza en idioma español, garantizando paridad 100% con la versión más reciente de la wiki oficial.
   - **Parser de Pestañas YUI Multicapa (`extractYuiTabs`)**: Implementación de extracción jerárquica con balanceo de etiquetas `<div>` (`findClosingDiv`) para delimitar con exactitud quirúrgica cada pestaña (`About`, `Contributions`, `Important Assets`, `Canon Crossing`, `FAQ and rules of the canon`, etc.) y preservar intacto el resto del documento (`remainingHtml`) sin cortes prematuros.
   - **Conversión de Featureboxes en Misiones y Sagas Tácticas (`unwrapFeatureboxes`)**: Extracción de contenedores `<div class="featurebox">` con profundidad anidada, convirtiéndolos en secciones `<h3>⚔ SAGA: [Título]</h3>` ("Saga Diánica", "La Ciudad Rota", "SEHNSUCHT", "Caballeros Blancos", "Varios").
   - **Compatibilidad con Encabezados H1-H6 y Desglose Modular**: El motor `parseSections` ahora procesa todas las jerarquías de títulos de Wikidot (`h1` a `h6`), permitiendo estructurar "Cronología Principal", "Sucursales", "Caballeros Blancos" y fases de "La Ciudad Rota" como tarjetas y acordeones interactivos individuales.
   - **Hipervínculos Universales Noclip (`convertHtmlLinksToMarkdown` & `NoclipText`)**: Se transforman todos los enlaces internos de la wiki en markdown `[Título](/ruta)`. `NoclipText` los renderiza como insignias tácticas interactivas con indicativo `↗`, permitiendo al usuario saltar directamente con un toque al expediente, relato o nivel correspondiente (e.g. `[THE FALL OF EREBUS]`, `[Chico de Ciudad]`, `[White Knights: 1]`, `[Sehnsucht: 1-5]`) con soporte completo de retroceso (`Back`).
   - **Invalidación Segura de Caché (`@backrooms_cached_items_v2`)**: Actualización de la clave de almacenamiento para purgar de forma transparente cualquier borrador antiguo y garantizar que el usuario reciba de inmediato los nuevos expedientes enriquecidos.

20. **Motor Lingüístico y Corrección Gramatical Española (Natural Spanish & Lore Consistency)**:
   - **Diagnóstico de Traducciones Literales de Machine Translation**: Se detectaron expresiones toscas generadas por traducción automática directa del inglés en cánones y expedientes, como `"Cruce y decadencia del canon está totalmente bien canon cruzar otros cánones y DK"` (*Decay Canon*), `"las trastiendas"` en lugar de `"los Backrooms"`, `"sin clip"` / `"no hacer clip"` en vez de `"hacer noclip"`, `"tanque de pensamiento"` por `"centro de investigación"`, `"vagabundo"` por `"explorador"`, y `"espacio de cabeza"` por `"espacio mental (Headspace)"`.
   - **Preprocesamiento Lingüístico (`preprocessForTranslation`)**: Normaliza modismos colaborativos de la comunidad Backrooms/Wikidot antes de enviarlos a la API de traducción para evitar construcciones agramaticales en el destino.
   - **Motor de Pulido y Glosario Oficial (`polishSpanishTranslation`)**: Reglas deterministas de post-procesamiento aplicadas a todos los textos traducidos y nativos en español (`fetchItemDetails` y `translateText`), garantizando:
     - Terminología canónica: `"los Backrooms"`, `"los Frontrooms"`, `"hacer noclip"`, `"Cruce de Cánones"`, `"Canon de Decadencia"`.
     - Naturalidad comunitaria: `"está totalmente permitido realizar cruces narrativos entre otros cánones y el Canon de Decadencia"`, `"explorador"`, `"Agua de Almendras"`, `"Ladrón de Piel"`, `"Polillas de la Muerte"`, `"sujetos de prueba en fase de sueño"`.
     - Corrección gramatical y tipográfica: contracciones obligatorias en español (`de el` -> `del`, `a el` -> `al`), eliminación de espacios espurios antes de signos de puntuación y preservación de símbolos de apertura (`¿`, `¡`).
   - **Decodificación Robusta de Entidades Unicode (`decodeHtmlEntities`)**: Reemplazo de `String.fromCharCode` por `String.fromCodePoint` con control de excepciones, solventando errores de renderizado en glifos extendidos y emojis (> 65535).
   - **Localización Completa de Insignias de Supervivencia (`SurvivalBadge.tsx`)**: Integración de propiedad `lang` con diccionario de clases y rasgos en español (`CLASE`, `SEGURO`, `ASEGURADO`, `DESPROVISTO DE ENTIDADES`, `PELIGROS AMBIENTALES`).
   - **Migración de Caché Global (`@backrooms_cached_items_v4`)**: Se incrementó la clave de persistencia en `storageService.ts` a `v4` para forzar la rehidratación fresca de todos los artículos con el nuevo motor de lenguaje natural.

21. **Unificación de Diseño en Tablets, Limpieza de Objetos Residuales y Ajuste del Selector de Idioma**:
   - **Diseño a Pantalla Completa en Tablets (Eliminación de Split View)**: Se modificó `src/hooks/useResponsiveLayout.ts` para desactivar el modo divido (`isSplitView: false`). En tablets y pantallas grandes, la interfaz ahora funciona con el mismo flujo inmersivo que en móvil: las listas de niveles, entidades, biblioteca y favoritos ocupan el 100% del ancho de la pantalla, y al pulsar cualquier elemento se abre el expediente a pantalla completa en `dossier/[id]` con su botón táctico de retroceso (`[ <- ÍNDICE ]`).
   - **Depuración de Entradas Residuales en la Biblioteca (Objetos, Fenómenos, etc.)**: En `src/services/wikidotService.ts` se implementó un filtro estricto en el scraper para erradicar enlaces de navegación y metadatos de Wikidot:
     - Se eliminaron páginas como `/members-only:rewrite-policy` (que provocaban el mensaje confidencial "Esta área del sitio web es privada y no tienes acceso a ella"), `/random:random-object` ("Random Object?"), `/trimmed:...`, enlaces con ancla `"here"` / `"aquí"`, políticas de reescritura, y números sueltos de paginación (`/p/2`).
     - Se actualizó la clave de caché en `src/services/storageService.ts` a `@backrooms_library_${type}_v2` y se añadió un filtro defensivo en tiempo de lectura para purgar cualquier entrada residual previamente guardada en el dispositivo.
   - **Ajuste del Selector de Idioma y Barra Superior (`LanguageToggle` & `DossierView`)**:
     - Se agregó `flexShrink: 0` a `src/components/LanguageToggle.tsx` para evitar que los contenedores flexibles compriman u oculten el botón en inglés (`EN`).
     - En `src/components/DossierView.tsx`, se dotó a la barra de acciones superior (`topActionsBar`) de `flexWrap: 'wrap'` y espaciado proporcional (`gap: 8`), garantizando que ni el sello confidencial ni los botones de acción (lector Aa, selector de idioma, favoritos, refresco y compartir) queden incrustados fuera de pantalla ante variaciones de ancho.
   - **Verificación y Compilación**:
     - `npx expo lint` y `npx tsc --noEmit` completados con 0 errores.
     - Release APK compilado exitosamente y generado en la raíz: `Backrooms_Archive_v1.0.0.apk`.

22. **Publicación Oficial del Proyecto en GitHub (Código Abierto & Releases)**:
   - **Configuración de Entorno de Control de Versiones**: Se instaló y vinculó Git (`MinGit v2.56`) y la CLI oficial de GitHub (`gh v2.103`).
   - **Creación del Repositorio Público**: Repositorio oficial creado bajo la cuenta del autor: [Pacaso11/backrooms-archive](https://github.com/Pacaso11/backrooms-archive).
   - **Documentación y Presentación**: Redacción de un `README.md` con temática táctica M.E.G., insignias de Expo SDK 57, TypeScript, React Native y enlace directo de descarga.
   - **Compilación Limpia en la Nube con EAS Build**: Se vinculó el proyecto oficial `@pacaso11/backrooms` a la infraestructura en la nube de Expo (`fc170f20-442d-4884-80f5-f5ced44ab5d8`) y se compiló el APK de producción/preview en servidores Linux de Expo (AWS).
   - **Auditoría de Seguridad y Privacidad**: Se escaneó el binario de forma exhaustiva byte a byte, confirmando cero coincidencias de rutas locales (`C:/Users/...`, `16abr` o `d:/IA/...`).
   - **Lanzamiento v1.0.0 (GitHub Releases)**: Se publicó el binario verificado [Backrooms_Archive_v1.0.0.apk](https://github.com/Pacaso11/backrooms-archive/releases/tag/v1.0.0) para descarga directa de la comunidad.

23. **Resolución Integral de Auditoría Técnica (Fallos P0 y P1 Corregidos al 100%)**:
   - **P0-1 & P0-5: Enrutamiento Estricto por Categoría y Prioridad de Wikidot ES**:
     - Se eliminó el uso de `'canon'` como comodín por defecto en `src/app/dossier/[id].tsx`, `src/app/(tabs)/index.tsx`, `library.tsx` y `favorites.tsx`.
     - Implementada la función `inferItemCategory` para inferir de forma determinista la categoría (`level`, `entity`, `object`, `phenomenon`, `canon`, `tale`, `group`, etc.).
     - Los expedientes de niveles (`level-*`), entidades y categorías traducidas en Wikidot ES se consumen prioritariamente desde `https://es-backrooms-wiki.wikidot.com` sin activar el motor de traducción automática innecesariamente.
     - Reparadas las rutas huérfanas en la biblioteca (`/enigmatic-levels`, etc.) y reconciliados los slugs de objetos y fenómenos entre ES y EN (`/object-1` vs `/objeto-es-1`).
   - **P0-2, P1-1, P1-2, P1-3, P1-4, P1-6: Integridad del Motor de Parseo de Wikidot**:
     - `extractYuiTabs` preserva todo el contenido narrativo previo y posterior al bloque de pestañas (`html.substring(0, start) + html.substring(end)`), recuperando más de 15 KB de descripciones y prólogos canónicos en Level 0, 1 y 2.
     - Corrección de ordenación numérica en listas: `Number.isFinite(num)` sitúa el `Level 0` al inicio absoluto del índice.
     - Eliminación estructural de raíz del contenedor de Dificultad de Supervivencia (`sd-container`) mediante balanceo de etiquetas `<div>` (`findClosingDiv`), eliminando cabeceras residuales en los prólogos.
     - Filtrado estricto de banderas (`JP-flag.png`, `flags/`) y componentes de traducción en `extractImages`.
     - Control jerárquico de títulos para evitar sobre-segmentación de secciones.
     - Desactivación de `polishSpanishTranslation` sobre contenido nativo oficial de Wikidot ES, restringiéndolo únicamente a fragmentos autotraducidos con reglas gramaticales seguras.
   - **P0-3 & P0-4: Aislamiento de Caché y Persistencia sin Mutación de IDs**:
     - `item.id` se mantiene inmutable y limpio (e.g. `level-0`); la clave interna de caché (`cacheKey`) se desacopla bajo `${KEYS.CACHED_ITEMS}_${cleanId}_${lang}`.
     - Saneamiento y auto-healing automático de claves contaminadas (`_es_v5_canonical`), resolviendo de forma permanente los errores 404 al usar "Continuar lectura".
     - Integración de `AbortController` en `DossierView.tsx`, cancelación de peticiones en vuelo, y reseteo inmediato de pantalla, scroll y pestañas activas al navegar entre expedientes.
   - **P1-7, P1-8, P1-10: Estado Global de Idioma, Peligrosidad Canónica y Enlaces Noclip**:
     - Despliegue de `LanguageContext.tsx` en `src/context/` para sincronización instantánea y global del idioma entre todas las pestañas de la aplicación.
     - Eliminación de clases de peligro fabricadas basadas en el número de nivel/entidad; `SurvivalBadge.tsx` renderiza la clasificación canónica real sin fallback falso a "Safe".
     - Soporte para enlaces Noclip multi-segmento y apertura de URLs externas (`Linking.openURL`).
   - **P1-12: Suite de Pruebas Unitarias Automatizadas & Calidad**:
     - Creada suite completa con 75 pruebas unitarias (`tests/wikidotParser.test.ts`, `tests/routingAndSpanishPriority.test.ts`, `tests/storageAndCache.test.ts`, `tests/globalStateAndLore.test.ts`).
     - 75/75 tests aprobados con 100% de éxito offline.
     - `npx tsc --noEmit` superado con 0 errores.
     - `npx expo lint` superado con 0 errores y 0 warnings.
     - Sin compilación de binarios nativos (conforme a la restricción solicitada).

---

## 7. 🤝 Protocolo para Futuros Agentes de IA

Si estás modificando este proyecto en una nueva sesión o con otro asistente:
1. **Verificar SDK**: Mantener siempre la compatibilidad con Expo SDK 57.
2. **Actualizar este registro**: Cada vez que agregues una nueva pantalla, modifiques el motor de parsing o soluciones un bug, agrega una entrada a la sección 6 de este archivo.
3. **Validar antes de entregar**: Ejecuta siempre `npx.cmd tsc --noEmit` para asegurar cero errores de tipos antes de confirmar cualquier tarea al usuario.
