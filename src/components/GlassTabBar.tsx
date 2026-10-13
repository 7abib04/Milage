import React from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Text,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { triggerHaptic } from '../utils/haptics';

export const GlassTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  const getTabIcon = (
    routeName: string,
    focused: boolean
  ): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case 'Dashboard':
        return focused ? 'speedometer' : 'speedometer-outline';
      case 'History':
        return focused ? 'time' : 'time-outline';
      case 'Analytics':
        return focused ? 'stats-chart' : 'stats-chart-outline';
      case 'Settings':
        return focused ? 'settings' : 'settings-outline';
      default:
        return 'ellipse-outline';
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          bottom: Platform.OS === 'ios' ? Math.max(16, insets.bottom) : 16,
        },
      ]}
    >
      <View style={styles.glassContainer}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              triggerHaptic('light');
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const iconName = getTabIcon(route.name, isFocused);
            const label =
              options.tabBarLabel !== undefined
                ? String(options.tabBarLabel)
                : options.title !== undefined
                ? options.title
                : route.name;

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={[
                  styles.tabButton,
                  isFocused && styles.tabButtonActive,
                ]}
              >
                {isFocused && <View style={styles.activeGlowPill} />}
                <Ionicons
                  name={iconName}
                  size={20}
                  color={isFocused ? '#00F2FE' : Colors.textTertiary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 50,
  },
  glassContainer: {
    width: '100%',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(10, 15, 26, 0.72)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 20,
    position: 'relative',
  },
  tabButtonActive: {},
  activeGlowPill: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#00F2FE',
  },
  tabLabelInactive: {
    color: Colors.textTertiary,
  },
});
