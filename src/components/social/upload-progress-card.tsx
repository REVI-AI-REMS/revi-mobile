import { Fonts } from "@/src/constants/theme";
import { useUploadStore } from "@/src/store/upload.store";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface UploadProgressCardProps {
  style?: StyleProp<ViewStyle>;
}

export function UploadProgressCard({ style }: UploadProgressCardProps) {
  const { status, progress, reset } = useUploadStore();

  // Animated progress bar width (0→100%)
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progress, { duration: 300 });
  }, [progress, progressWidth]);

  // Auto-dismiss after "done" for 3 seconds
  useEffect(() => {
    if (status === "done") {
      const t = setTimeout(() => reset(), 3000);
      return () => clearTimeout(t);
    }
  }, [status, reset]);

  const barAnimStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Don't render when idle
  if (status === "idle") return null;

  const label =
    status === "uploading"
      ? "Posting…"
      : status === "creating"
        ? "Creating post…"
        : status === "processing"
          ? "Processing video…"
          : status === "done"
            ? "Posted!"
            : "Posting failed";

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelRow}>
        <View style={styles.leftLabel}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
          {status !== "error" && status !== "done" && (
            <Text style={styles.percent}>{Math.round(progress)}%</Text>
          )}
        </View>
        {status === "error" ? (
          <TouchableOpacity>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={reset} style={styles.closeBtn}>
            <Ionicons name="close" size={16} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress info */}
      <View style={styles.infoCol}>
        {/* Progress bar track */}
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, barAnimStyle]} />
        </View>
      </View>

      {/* Dismiss / retry */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "stretch",
    // paddingHorizontal: 1,

    gap: 4,
    backgroundColor: "#0F0F10",
    //translucent card with blur-like effecth
    // backgroundColor: "rgba(26, 26, 26, 0.8)",
    // borderRadius: 8,
    borderWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    // borderRadius: 16,

    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    width: "100%",
    // borderTopColor: "#2C2C2E",
  },

  infoCol: {
    width: "100%",
    paddingHorizontal: 0,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2C2C2E",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    // Gradient-like effect: yellow → pink
    backgroundColor: "#E040FB",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
    gap: 8,
    paddingVertical: 1,
  },
  leftLabel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  closeBtn: {
    padding: 4,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#E040FB",
    // borderRadius: 4,
  },
  retryText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: "#AAAAAA",
  },
  percent: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
});
