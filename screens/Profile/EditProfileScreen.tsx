import { ScreenHeader } from "@/components";
import { colors, radius, spacing, typography } from "@/constants/design";
import { useUpdateProfileMutation } from "@/hooks/mutations/use-auth";
import { mediaService } from "@/scripts/services/social/media.service";
import { useAuthStore } from "@/stores/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const DEFAULT_AVATAR =
  process.env.EXPO_PUBLIC_DEFAULT_AVATAR_URL ?? "https://ui-avatars.com/api/?background=333&color=fff&name=U";

async function uploadImageToAzure(localUri: string): Promise<string> {
  const fileName = `avatar-${Date.now()}.jpg`;

  // Retry up to 3 times — handles Azure Container App cold starts (~15-25s)
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { upload_url, blob_url } = await mediaService.getUploadUrl(
        fileName,
        "image/jpeg",
      );
      const fileRes = await fetch(localUri);
      const blob = await fileRes.blob();
      const res = await fetch(upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": "image/jpeg",
          "x-ms-blob-type": "BlockBlob",
        },
        body: blob,
      });
      if (!res.ok) throw new Error(`Azure PUT failed: ${res.status}`);
      return blob_url;
    } catch (err) {
      lastError = err;
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
  throw lastError;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { mutate: updateProfile, isPending: isSaving } =
    useUpdateProfileMutation();

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(
    user?.avatar ?? null,
  );
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const localUri = result.assets[0].uri;
    setAvatarUri(localUri);
    setIsUploadingAvatar(true);
    try {
      const url = await uploadImageToAzure(localUri);
      setPendingAvatarUrl(url);
    } catch {
      // Upload service unavailable — let user decide: keep local preview and
      // save without updating the avatar, or revert.
      Alert.alert(
        "Photo upload unavailable",
        "The upload service is temporarily down. You can still save your other changes — your photo will not be updated.",
        [
          {
            text: "Revert photo",
            style: "cancel",
            onPress: () => {
              setAvatarUri(user?.avatar ?? null);
              setPendingAvatarUrl(null);
            },
          },
          { text: "Keep & save anyway", style: "default" },
        ],
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = () => {
    if (!user?.id) return;
    if (!username.trim()) {
      Alert.alert("Validation", "Username cannot be empty.");
      return;
    }
    if (isUploadingAvatar) {
      Alert.alert("Please wait", "Profile photo is still uploading.");
      return;
    }

    const updates: Parameters<typeof updateProfile>[0]["updates"] = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      username: username.trim().toLowerCase(),
    };
    if (pendingAvatarUrl) updates.avatar = pendingAvatarUrl;

    updateProfile(
      { userId: user.id, updates },
      {
        onSuccess: () => {
          Alert.alert("Saved", "Your profile has been updated.");
          router.back();
        },
        onError: (err: any) => {
          const detail = err?.response?.data?.detail;
          const msg =
            typeof detail === "string" ? detail : "Could not save changes.";
          Alert.alert("Error", msg);
        },
      },
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Edit Profile"
        onBackPress={() => router.back()}
        showBackButton
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.body}>
          {/* Avatar */}
          <TouchableOpacity
            onPress={pickImage}
            style={styles.avatarContainer}
            disabled={isUploadingAvatar}
          >
            <ExpoImage
              source={{ uri: avatarUri ?? DEFAULT_AVATAR }}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            {isUploadingAvatar ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            ) : (
              <View style={styles.cameraButton}>
                <Ionicons name="camera-outline" size={15} color="#FF2D55" />
              </View>
            )}
          </TouchableOpacity>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputRow}>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputRow, styles.inputRowReadOnly]}>
                <Ionicons
                  name="mail-outline"
                  size={16}
                  color={colors.textMuted}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.inputReadOnly}>{user?.email ?? "—"}</Text>
              </View>
              <Text style={styles.hint}>Email cannot be changed here</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (isSaving || isUploadingAvatar) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isSaving || isUploadingAvatar}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 48 },
  body: { alignItems: "center", paddingTop: spacing.xl },

  avatarContainer: { marginBottom: spacing.xxl },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.bgSecondary,
    backgroundColor: colors.bgTertiary,
  },
  avatarOverlay: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.bg,
  },

  form: {
    width: "100%",
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
  inputGroup: { gap: spacing.xs },
  label: {
    ...typography.labelMd,
    color: colors.textSecondary,
    marginLeft: spacing.xxs,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputRowReadOnly: { opacity: 0.6 },
  inputReadOnly: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.xxs,
    marginTop: 4,
  },
  atSymbol: {
    ...typography.bodyMd,
    color: colors.textMuted,
    marginRight: 2,
  },
  input: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.textPrimary,
    height: "100%",
  },

  saveButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.full,
    width: "90%",
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { ...typography.labelLg, color: "#000000" },
});
