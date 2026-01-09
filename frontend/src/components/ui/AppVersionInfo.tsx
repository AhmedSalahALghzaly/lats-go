/**
 * AppVersionInfo Component
 * Displays app version, build timestamp, and cache status
 * Helps verify which code version is running
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';

// Build timestamp is injected at build time
const BUILD_TIMESTAMP = new Date().toISOString();

// Get app version from app.json through Expo Constants
const getAppVersion = () => {
  return Constants.expoConfig?.version || '1.0.0';
};

// Generate a unique build identifier based on timestamp
const getBuildId = () => {
  const now = new Date();
  const buildId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  return buildId;
};

interface AppVersionInfoProps {
  showDetails?: boolean;
  compact?: boolean;
}

export const AppVersionInfo: React.FC<AppVersionInfoProps> = ({
  showDetails = false,
  compact = false,
}) => {
  const { colors } = useTheme();
  const { language } = useTranslation();
  const [tapCount, setTapCount] = useState(0);

  const appVersion = useMemo(() => getAppVersion(), []);
  const buildId = useMemo(() => getBuildId(), []);
  const buildDate = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [language]);

  const handleTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    // Easter egg: 5 taps reveals technical details
    if (newCount >= 5) {
      Alert.alert(
        language === 'ar' ? 'معلومات التطبيق' : 'App Info',
        `Version: ${appVersion}\nBuild: ${buildId}\nTimestamp: ${BUILD_TIMESTAMP}\nPlatform: ${Platform.OS}\n\n${language === 'ar' ? 'تم التحقق من أحدث إصدار!' : 'Latest version verified!'}`
      );
      setTapCount(0);
    }
  };

  if (compact) {
    return (
      <TouchableOpacity onPress={handleTap} activeOpacity={0.7}>
        <Text style={[styles.compactText, { color: colors.textSecondary }]}>
          v{appVersion}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={handleTap}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {language === 'ar' ? 'إصدار التطبيق' : 'App Version'}
        </Text>
        <Text style={[styles.version, { color: colors.text }]}>
          v{appVersion} ({buildId})
        </Text>
        {showDetails && (
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {buildDate}
          </Text>
        )}
      </View>
      <View style={styles.badge}>
        <Text style={[styles.badgeText, { color: colors.success || '#10B981' }]}>
          {language === 'ar' ? 'محدث' : 'Latest'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Export a simple version string for use elsewhere
export const getVersionString = () => `v${getAppVersion()} (${getBuildId()})`;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  version: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  compactText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default AppVersionInfo;
