import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ADVENTURE_FLOORS,
  ACT_LABELS,
  NODE_COLORS,
  NODE_EMOJIS,
  getActForFloor,
  isBossFloor,
} from '../../constants/adventure';
import { abandonAdventureRun, createAdventureRun, getActiveRun, getLastRun } from '../../database/adventureQueries';
import { useApp } from '../../context/AppContext';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import { AdventureNode, AdventureRun } from '../../types/adventure';
import { generateAdventureMap, getAvailableNodes } from '../../utils/mapGenerator';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Adventure'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FLOOR_HEIGHT = 88;
const NODE_SIZE = 54;
const PADDING_TOP = 80;
const PADDING_BOTTOM = 100;
const CANVAS_HEIGHT = ADVENTURE_FLOORS * FLOOR_HEIGHT + PADDING_TOP + PADDING_BOTTOM;

// 3 column x positions
const COL_X = [58, SCREEN_WIDTH / 2, SCREEN_WIDTH - 58];

function nodeCenter(floor: number, position: number): { x: number; y: number } {
  return {
    x: COL_X[position],
    y: (ADVENTURE_FLOORS - 1 - floor) * FLOOR_HEIGHT + PADDING_TOP + NODE_SIZE / 2,
  };
}

// ─── Connection Line ────────────────────────────────────────────────────────

interface LineProps {
  from: AdventureNode;
  to: AdventureNode;
  completed: boolean;
  faded: boolean;
}

function ConnectionLine({ from, to, completed, faded }: LineProps) {
  const c1 = nodeCenter(from.floor, from.position);
  const c2 = nodeCenter(to.floor, to.position);
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const cx = (c1.x + c2.x) / 2;
  const cy = (c1.y + c2.y) / 2;

  return (
    <View
      style={{
        position: 'absolute',
        left: cx - length / 2,
        top: cy - 2,
        width: length,
        height: 4,
        borderRadius: 2,
        backgroundColor: completed ? 'rgba(255,230,109,0.7)' : faded ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.3)',
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

// ─── Node Circle ─────────────────────────────────────────────────────────────

interface NodeCircleProps {
  node: AdventureNode;
  isAvailable: boolean;
  isCompleted: boolean;
  stars: number | undefined;
  onPress?: () => void;
}

function NodeCircle({ node, isAvailable, isCompleted, stars, onPress }: NodeCircleProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isAvailable) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [isAvailable]);

  const center = nodeCenter(node.floor, node.position);
  const nodeColor = NODE_COLORS[node.type];
  const emoji = NODE_EMOJIS[node.type];

  const opacity = isCompleted ? 0.55 : isAvailable ? 1 : 0.32;

  return (
    <Animated.View
      style={[
        styles.nodeWrap,
        {
          left: center.x - NODE_SIZE / 2,
          top: center.y - NODE_SIZE / 2,
          transform: [{ scale: isAvailable ? pulseAnim : 1 }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={!isAvailable}
        activeOpacity={0.75}
        style={[
          styles.nodeCircle,
          { backgroundColor: nodeColor, borderColor: isAvailable ? '#FFE66D' : 'transparent' },
          isAvailable && styles.nodeAvailableGlow,
        ]}
      >
        <Text style={styles.nodeEmoji}>{emoji}</Text>
        {isCompleted && stars !== undefined && (
          <View style={styles.nodeStarBadge}>
            <Text style={styles.nodeStarText}>{'★'.repeat(stars)}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Floor Labels (Act boundaries) ────────────────────────────────────────────

function FloorLabel({ floor }: { floor: number }) {
  const { t } = useTranslation();
  const actNum = ACT_LABELS[floor];
  if (actNum === undefined) return null;
  const y = (ADVENTURE_FLOORS - 1 - floor) * FLOOR_HEIGHT + PADDING_TOP - 26;
  return (
    <View style={[styles.actLabel, { top: y }]}>
      <Text style={styles.actLabelText}>{t('adventure.act', { act: actNum })}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function AdventureScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { currentProfile } = useApp();
  const [run, setRun] = useState<AdventureRun | null | 'loading'>('loading');
  const scrollRef = useRef<ScrollView>(null);

  const loadRun = useCallback(async () => {
    if (!currentProfile) return;
    const active = await getActiveRun(currentProfile.id);
    setRun(active);
  }, [currentProfile]);

  useFocusEffect(
    useCallback(() => {
      loadRun();
    }, [loadRun]),
  );

  // Auto-scroll to current floor whenever run changes
  useEffect(() => {
    if (!run || run === 'loading') return;
    const floorY = nodeCenter(run.currentFloor, 1).y;
    const scrollY = floorY - SCREEN_HEIGHT / 2 + NODE_SIZE / 2;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, scrollY), animated: true });
    }, 350);
  }, [run]);

  const handleStartRun = async () => {
    if (!currentProfile) return;
    setRun('loading');
    const mapData = generateAdventureMap(Date.now());
    const newRun = await createAdventureRun(currentProfile.id, mapData);
    setRun(newRun);
  };

  const handleAbandonRun = async () => {
    if (!run || run === 'loading') return;
    await abandonAdventureRun(run.id);
    const mapData = generateAdventureMap(Date.now());
    const newRun = await createAdventureRun(currentProfile!.id, mapData);
    setRun(newRun);
  };

  const handleNodeTap = (node: AdventureNode) => {
    if (!run || run === 'loading') return;
    navigation.navigate('AdventureNode', {
      runId: run.id,
      nodeId: node.id,
      nodeType: node.type,
      difficulty: node.difficulty,
      floor: node.floor,
    });
  };

  if (run === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // No active run → show start screen
  if (!run) {
    return (
      <SafeAreaView style={styles.startSafe}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.startBody}>
          <Text style={styles.startHero}>🗺️</Text>
          <Text style={styles.startTitle}>{t('adventure.title')}</Text>
          <Text style={styles.startSubtitle}>{t('adventure.subtitle')}</Text>
          <TouchableOpacity style={styles.startBtn} onPress={handleStartRun} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>{t('adventure.startNew')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Completed run → victory screen
  if (run.status === 'completed') {
    return (
      <SafeAreaView style={styles.startSafe}>
        <View style={styles.startBody}>
          <Text style={styles.startHero}>🏆</Text>
          <Text style={styles.startTitle}>{t('adventure.runComplete')}</Text>
          <Text style={styles.startSubtitle}>{t('adventure.runCompleteMsg')}</Text>
          <Text style={styles.victoryStars}>⭐ {run.totalStars}</Text>
          <TouchableOpacity style={styles.startBtn} onPress={handleStartRun} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>{t('adventure.newRun')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Active run → render map
  const allNodes = Object.values(run.mapData.nodes);
  const availableNodes = getAvailableNodes(run.mapData, run.currentFloor, run.lastNodeId);
  const availableIds = new Set(availableNodes.map((n) => n.id));

  return (
    <View style={styles.mapRoot}>
      {/* Header overlay */}
      <SafeAreaView edges={['top']} style={styles.mapHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: '#fff' }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.mapHeaderCenter}>
          <Text style={styles.mapHeaderTitle}>{t('adventure.title')}</Text>
          <Text style={styles.mapHeaderSub}>
            {t('adventure.floor', { floor: run.currentFloor + 1 })} / {ADVENTURE_FLOORS}
          </Text>
        </View>
        <View style={styles.mapHeaderStars}>
          <Text style={styles.mapHeaderStarsText}>⭐ {run.totalStars}</Text>
        </View>
      </SafeAreaView>

      {/* Act banner */}
      <View style={styles.actBanner}>
        <Text style={styles.actBannerText}>
          {t('adventure.act', { act: getActForFloor(run.currentFloor) })}
          {isBossFloor(run.currentFloor) ? '  👑' : ''}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.mapScroll}
        contentContainerStyle={{ height: CANVAS_HEIGHT }}
        showsVerticalScrollIndicator={false}
      >
        {/* Canvas */}
        <View style={{ width: SCREEN_WIDTH, height: CANVAS_HEIGHT }}>
          {/* Connection lines (rendered before nodes so nodes appear on top) */}
          {allNodes.map((node) =>
            node.connections.map((targetId) => {
              const target = run.mapData.nodes[targetId];
              if (!target) return null;
              const fromCompleted = node.id in run.completedNodes;
              const toCompleted = targetId in run.completedNodes;
              const isPathLine = fromCompleted && toCompleted;
              const isActive = fromCompleted && availableIds.has(targetId);
              return (
                <ConnectionLine
                  key={`line-${node.id}-${targetId}`}
                  from={node}
                  to={target}
                  completed={isPathLine || isActive}
                  faded={!fromCompleted}
                />
              );
            }),
          )}

          {/* Floor labels */}
          {Object.keys(ACT_LABELS).map((f) => (
            <FloorLabel key={`act-${f}`} floor={Number(f)} />
          ))}

          {/* Nodes */}
          {allNodes.map((node) => (
            <NodeCircle
              key={node.id}
              node={node}
              isAvailable={availableIds.has(node.id)}
              isCompleted={node.id in run.completedNodes}
              stars={run.completedNodes[node.id]}
              onPress={availableIds.has(node.id) ? () => handleNodeTap(node) : undefined}
            />
          ))}
        </View>
      </ScrollView>

      {/* Available nodes hint */}
      {availableNodes.length > 0 && (
        <View style={styles.hintBanner}>
          <Text style={styles.hintText}>{t('adventure.available')}</Text>
        </View>
      )}

      {/* Restart button */}
      <TouchableOpacity style={styles.restartBtn} onPress={handleAbandonRun} activeOpacity={0.7}>
        <Text style={styles.restartText}>🔄</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A2E' },

  // Start / Victory screen
  startSafe: { flex: 1, backgroundColor: '#1A1A2E' },
  startBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.lg },
  startHero: { fontSize: 96 },
  startTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy, color: '#fff', textAlign: 'center' },
  startSubtitle: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 22 },
  startBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    marginTop: spacing.md,
    ...shadow.lg,
  },
  startBtnText: { fontSize: fontSize.lg, fontWeight: fontWeight.heavy, color: colors.text },
  victoryStars: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy, color: colors.accent },

  // Back button
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: fontSize.xl, color: colors.primary },

  // Map
  mapRoot: { flex: 1, backgroundColor: '#1A1A2E' },
  mapScroll: { flex: 1 },

  mapHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(26,26,46,0.92)',
  },
  mapHeaderCenter: { flex: 1, alignItems: 'center' },
  mapHeaderTitle: { fontSize: fontSize.md, fontWeight: fontWeight.heavy, color: '#fff' },
  mapHeaderSub: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  mapHeaderStars: {},
  mapHeaderStarsText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.accent },

  actBanner: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    zIndex: 9,
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(26,26,46,0.85)',
  },
  actBannerText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },

  // Node
  nodeWrap: { position: 'absolute' },
  nodeCircle: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
  },
  nodeAvailableGlow: {
    shadowColor: '#FFE66D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 14,
  },
  nodeEmoji: { fontSize: 24 },
  nodeStarBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#1A1A2E',
    borderRadius: radius.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  nodeStarText: { fontSize: 9, color: colors.accent },

  // Act label
  actLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  actLabelText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Hint + restart
  hintBanner: {
    position: 'absolute',
    bottom: 90,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: 'rgba(255,230,109,0.18)',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,230,109,0.4)',
  },
  hintText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.accent },

  restartBtn: {
    position: 'absolute',
    bottom: 36,
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restartText: { fontSize: 22 },
});
