import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { SyncPackageType, SyncProgress } from '../types/wikidot';
import { SyncService } from '../services/syncService';
import { StorageService } from '../services/storageService';

interface SyncModalProps {
  visible: boolean;
  onClose: () => void;
  lang?: 'es' | 'en';
}

interface PackageOption {
  key: SyncPackageType;
  title: string;
  badge: string;
  description: string;
  approxSize: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PACKAGES: PackageOption[] = [
  {
    key: 'essentials',
    title: 'Paquete Esencial M.E.G.',
    badge: 'RÁPIDO',
    description: 'Los 9 niveles principales (0 al 8) y las 10 entidades icónicas.',
    approxSize: '~1.5 MB (19 archivos)',
    icon: 'flash-outline',
  },
  {
    key: 'cluster_1',
    title: 'Cúmulo I (Niveles 0 - 99)',
    badge: '100 NIVELES',
    description: 'Colección íntegra de los primeros 100 niveles clasificados.',
    approxSize: '~12 MB (100 archivos)',
    icon: 'layers-outline',
  },
  {
    key: 'favorites',
    title: 'Mis Favoritos',
    badge: 'PERSONAL',
    description: 'Descarga completa de todos los expedientes que has guardado.',
    approxSize: 'Variable según favoritos',
    icon: 'star-outline',
  },
  {
    key: 'full',
    title: 'Archivo M.E.G. Total',
    badge: 'COMPLETO',
    description: 'Todos los niveles, entidades y registros destacados de la biblioteca.',
    approxSize: '~60-120 MB (+800 archivos)',
    icon: 'file-tray-full-outline',
  },
];

export function SyncModal({ visible, onClose, lang = 'es' }: SyncModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<SyncPackageType>('essentials');
  const [forceRefresh, setForceRefresh] = useState(false);
  const [progress, setProgress] = useState<SyncProgress>(SyncService.getProgress());
  const [cacheStats, setCacheStats] = useState<{ cachedArticlesCount: number; approxBytes: number }>({
    cachedArticlesCount: 0,
    approxBytes: 0,
  });

  const loadCacheStats = useCallback(async () => {
    const stats = await StorageService.getCacheStats();
    setCacheStats(stats);
  }, []);

  useEffect(() => {
    if (visible) {
      loadCacheStats();
      const unsubscribe = SyncService.subscribe(newProgress => {
        setProgress(newProgress);
      });
      return unsubscribe;
    }
  }, [visible, loadCacheStats]);

  const handleStart = async () => {
    await SyncService.startSync(selectedPackage, lang, forceRefresh);
    loadCacheStats();
  };

  const handlePauseResume = () => {
    if (progress.status === 'running') {
      SyncService.pause();
    } else if (progress.status === 'paused') {
      SyncService.resume();
    }
  };

  const handleCancel = () => {
    SyncService.cancel();
  };

  const isRunning = progress.status === 'running' || progress.status === 'paused';
  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const mbFormatted = (cacheStats.approxBytes / (1024 * 1024)).toFixed(1);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={isRunning ? undefined : onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="cloud-download-outline" size={20} color={THEME.colors.accentAmber} />
              <Text style={styles.headerTitle}>DESCARGA OFFLINE TÁCTICA</Text>
            </View>
            {!isRunning && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Subheader cache indicator */}
          <View style={styles.storageBanner}>
            <Ionicons name="hardware-chip-outline" size={14} color={THEME.colors.accentCyan} />
            <Text style={styles.storageBannerText}>
              Memoria Offline Ocupada: <Text style={styles.storageHighlight}>{cacheStats.cachedArticlesCount} archivos ({mbFormatted} MB)</Text>
            </Text>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {!isRunning && progress.status !== 'completed' && (
              <>
                <Text style={styles.sectionSubtitle}>
                  Selecciona el paquete de expedientes que deseas descargar para disponer de ellos cuando estés sin conexión a internet:
                </Text>

                {PACKAGES.map(pkg => {
                  const isSelected = selectedPackage === pkg.key;
                  return (
                    <TouchableOpacity
                      key={pkg.key}
                      style={[styles.packageCard, isSelected && styles.packageCardSelected]}
                      onPress={() => setSelectedPackage(pkg.key)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.packageHeader}>
                        <View style={styles.packageTitleRow}>
                          <Ionicons
                            name={pkg.icon}
                            size={18}
                            color={isSelected ? THEME.colors.accentAmber : THEME.colors.textMuted}
                            style={{ marginRight: 8 }}
                          />
                          <Text style={[styles.packageTitle, isSelected && styles.packageTitleSelected]}>
                            {pkg.title}
                          </Text>
                        </View>
                        <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                          <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                            {pkg.badge}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.packageDesc}>{pkg.description}</Text>

                      <View style={styles.packageFooter}>
                        <Ionicons name="file-tray-outline" size={12} color={THEME.colors.textMuted} />
                        <Text style={styles.packageSize}>{pkg.approxSize}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Overwrite Cache Option */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => setForceRefresh(!forceRefresh)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={forceRefresh ? 'checkbox-outline' : 'square-outline'}
                    size={18}
                    color={forceRefresh ? THEME.colors.accentAmber : THEME.colors.textMuted}
                  />
                  <Text style={styles.optionLabel}>
                    Forzar re-descarga (sobrescribir expedientes antiguos guardados)
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Live Syncing Progress View */}
            {(isRunning || progress.status === 'completed' || progress.status === 'error') && (
              <View style={styles.liveContainer}>
                <View style={styles.terminalBox}>
                  <View style={styles.terminalHeader}>
                    <Text style={styles.terminalLed}>●</Text>
                    <Text style={styles.terminalTitle}>
                      M.E.G. TRANSCRIPCIÓN TERMINAL — ESTADO: {progress.status.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
                  </View>

                  <View style={styles.progressDataRow}>
                    <Text style={styles.progressNumber}>
                      {progress.current} / {progress.total} ({percent}%)
                    </Text>
                    <Text style={styles.progressBytes}>
                      {(progress.approxBytes / (1024 * 1024)).toFixed(2)} MB
                    </Text>
                  </View>

                  <View style={styles.logBox}>
                    <Text style={styles.logCursor}>{'>'}</Text>
                    <Text style={styles.logText} numberOfLines={2}>
                      {progress.currentTitle || progress.message || 'Esperando órdenes del operador...'}
                    </Text>
                  </View>

                  {progress.errorsCount > 0 && (
                    <Text style={styles.errorNotice}>
                      ⚠ {progress.errorsCount} expediente(s) con fallo temporal de red (se omitieron sin detener el resto).
                    </Text>
                  )}
                </View>

                {progress.status === 'completed' && (
                  <View style={styles.completedBanner}>
                    <Ionicons name="checkmark-circle" size={24} color={THEME.colors.accentCyan} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.completedTitle}>DESCARGA COMPLETADA</Text>
                      <Text style={styles.completedSub}>
                        Todos los archivos seleccionados están disponibles en tu memoria local. Puedes usarlos sin conexión.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            {!isRunning && progress.status !== 'completed' && (
              <TouchableOpacity style={styles.actionBtn} onPress={handleStart} activeOpacity={0.8}>
                <Ionicons name="cloud-download" size={18} color="#000" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>INICIAR DESCARGA TÁCTICA</Text>
              </TouchableOpacity>
            )}

            {isRunning && (
              <View style={styles.runningActions}>
                <TouchableOpacity
                  style={[styles.pauseBtn, progress.status === 'paused' && styles.resumeBtn]}
                  onPress={handlePauseResume}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={progress.status === 'paused' ? 'play' : 'pause'}
                    size={16}
                    color="#000"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.pauseBtnText}>
                    {progress.status === 'paused' ? 'REANUDAR' : 'PAUSAR'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
                  <Ionicons name="stop" size={16} color="#ef4444" style={{ marginRight: 4 }} />
                  <Text style={styles.cancelBtnText}>ABORTAR</Text>
                </TouchableOpacity>
              </View>
            )}

            {progress.status === 'completed' && (
              <TouchableOpacity style={styles.finishBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.finishBtnText}>CERRAR Y REGRESAR AL ARCHIVO</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.surfaceHighlight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.accentAmber,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  storageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 182, 212, 0.2)',
  },
  storageBannerText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontFamily: THEME.fonts.mono,
  },
  storageHighlight: {
    color: THEME.colors.accentCyan,
    fontWeight: 'bold',
  },
  body: {
    flexShrink: 1,
  },
  bodyContent: {
    padding: 16,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginBottom: 14,
    lineHeight: 18,
  },
  packageCard: {
    padding: 14,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.background,
    marginBottom: 10,
  },
  packageCardSelected: {
    borderColor: THEME.colors.accentAmber,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  packageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  packageTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  packageTitleSelected: {
    color: THEME.colors.accentAmber,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.surfaceHighlight,
  },
  badgeSelected: {
    borderColor: THEME.colors.accentAmber,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  badgeText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: 'bold',
  },
  badgeTextSelected: {
    color: THEME.colors.accentAmber,
  },
  packageDesc: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  packageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  packageSize: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingVertical: 6,
  },
  optionLabel: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    flex: 1,
  },
  liveContainer: {
    paddingVertical: 8,
  },
  terminalBox: {
    backgroundColor: '#05070a',
    borderWidth: 1,
    borderColor: THEME.colors.accentAmber,
    borderRadius: THEME.radius.sm,
    padding: 14,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  terminalLed: {
    color: THEME.colors.accentAmber,
    fontSize: 12,
  },
  terminalTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    fontWeight: 'bold',
    color: THEME.colors.accentAmber,
    letterSpacing: 0.5,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#10151e',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.accentAmber,
  },
  progressDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressNumber: {
    fontFamily: THEME.fonts.mono,
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  progressBytes: {
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
    color: THEME.colors.accentCyan,
  },
  logBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#020406',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: THEME.colors.accentAmber,
  },
  logCursor: {
    fontFamily: THEME.fonts.mono,
    color: THEME.colors.accentAmber,
    marginRight: 6,
    fontWeight: 'bold',
  },
  logText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    color: THEME.colors.accentAmber,
    flex: 1,
  },
  errorNotice: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    color: '#FFB74D',
    marginTop: 8,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: THEME.colors.accentCyan,
    borderRadius: THEME.radius.sm,
    padding: 12,
    marginTop: 14,
  },
  completedTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.accentCyan,
  },
  completedSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.surfaceHighlight,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.accentAmber,
    paddingVertical: 12,
    borderRadius: THEME.radius.sm,
  },
  actionBtnText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 0.5,
  },
  runningActions: {
    flexDirection: 'row',
    gap: 10,
  },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.accentAmber,
    paddingVertical: 12,
    borderRadius: THEME.radius.sm,
  },
  resumeBtn: {
    backgroundColor: THEME.colors.accentCyan,
  },
  pauseBtnText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: THEME.radius.sm,
  },
  cancelBtnText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  finishBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.accentCyan,
    paddingVertical: 12,
    borderRadius: THEME.radius.sm,
  },
  finishBtnText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
});
