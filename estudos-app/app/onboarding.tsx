import { useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radii, Spacing, Fonts } from '../src/constants/design';
import { useLanguage } from '../src/hooks/useLanguage';
import { markOnboarded } from '../src/hooks/useUser';

const SLIDES = (t: ReturnType<typeof useLanguage>['t']) => [
  { emoji: '🗂️', title: t.ob1Title, desc: t.ob1Desc },
  { emoji: '📅', title: t.ob2Title, desc: t.ob2Desc },
  { emoji: '⭕', title: t.ob3Title, desc: t.ob3Desc },
];

export default function OnboardingScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);
  const slides = SLIDES(t);

  const goNext = async () => {
    if (current < slides.length - 1) {
      const next = current + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setCurrent(next);
    } else {
      await markOnboarded();
      router.replace('/(tabs)');
    }
  };

  const onScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrent(idx);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.desc}>{slide.desc}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, current === i && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.cta} onPress={goNext}>
          <Text style={styles.ctaText}>
            {current === slides.length - 1 ? t.getStarted : t.next}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bone },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingBottom: 120 },
  emoji: { fontSize: 72, marginBottom: Spacing.xl },
  title: { fontSize: 28, fontFamily: Fonts.bold, color: Colors.ink, textAlign: 'center', marginBottom: Spacing.md },
  desc: { fontSize: 16, fontFamily: Fonts.regular, color: Colors.inkMuted, textAlign: 'center', lineHeight: 24 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.xl, paddingBottom: 48, paddingTop: Spacing.md, backgroundColor: Colors.bone },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.cardBorder },
  dotActive: { backgroundColor: Colors.clay, width: 20 },
  cta: { backgroundColor: Colors.clay, borderRadius: Radii.cta, padding: Spacing.md + 2, alignItems: 'center' },
  ctaText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 16 },
});
