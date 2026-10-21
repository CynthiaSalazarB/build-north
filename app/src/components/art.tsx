// The cave, drawn in code (round 6): the glow of the cave mouth, the beam of light on the floor, and the
// arch every photo sits in. The meaning lives in these shapes; the photo only fills the arch.
import { Image, StyleSheet, View, type ImageSourcePropType } from "react-native";
import Svg, { Defs, LinearGradient, Polygon, RadialGradient, Rect, Stop } from "react-native-svg";
import { palette, space } from "../theme.ts";

const cave = palette.cave;

/** The light from the cave mouth, high on the screen. */
export function Glow({ top = "34%" }: { top?: string }) {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} accessible={false}>
      <Defs>
        <RadialGradient id="glow" cx="50%" cy={top} rx="72%" ry="40%">
          <Stop offset="0" stopColor={cave.beam} stopOpacity={0.2} />
          <Stop offset="1" stopColor={cave.beam} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#glow)" />
    </Svg>
  );
}

/** The beam the opening throws on the floor, widening as it falls. */
export function Beam({ strength = 0.16 }: { strength?: number }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" accessible={false}>
      <Defs>
        <LinearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={cave.beam} stopOpacity={strength} />
          <Stop offset="0.85" stopColor={cave.beam} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Polygon points="33.7,0 66.3,0 100,100 0,100" fill="url(#beam)" />
    </Svg>
  );
}

/** A photo in a gilt-edged arch, with the beam falling from it. */
export function Arch({ source, label, width, height }: { source: ImageSourcePropType; label: string; width: number; height: number }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.beam, { top: height + space.l, width: width * 2.1, height: height * 1.4 }]} pointerEvents="none">
        <Beam strength={0.28} />
      </View>
      <View style={[styles.outline, { borderRadius: width / 2 + space.s }]}>
        <View style={[styles.window, { width, height, borderTopLeftRadius: width / 2, borderTopRightRadius: width / 2 }]}>
          <Image source={source} style={styles.photo} accessibilityLabel={label} resizeMode="cover" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  beam: { position: "absolute" },
  outline: {
    padding: space.s,
    borderWidth: 1,
    borderColor: cave.gilt,
    borderBottomLeftRadius: space.m,
    borderBottomRightRadius: space.m,
  },
  window: { overflow: "hidden", borderBottomLeftRadius: space.xs, borderBottomRightRadius: space.xs },
  photo: { width: "100%", height: "100%" },
});
