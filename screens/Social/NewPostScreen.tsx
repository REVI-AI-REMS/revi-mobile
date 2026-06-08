import { Fonts } from "@/constants/theme";
import { useCreatePostMutation } from "@/hooks/mutations/use-feed-mutations";
import { feedKeys } from "@/hooks/queries/use-feed";
import { mediaService } from "@/scripts/services/social/media.service";
import type { MediaType } from "@/scripts/services/social/types";
import { useUploadStore } from "@/stores/upload.store";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Image } from "@/components/ExpoImage";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const DEV_COORDS = {
  latitude: parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LAT ?? "6.5244"),
  longitude: parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LNG ?? "3.3792"),
};

type Step = "pick" | "caption";

async function resolvePhUri(uri: string, assetId?: string): Promise<string> {
  if (!uri.startsWith("ph://")) return uri;
  try {
    const info = await MediaLibrary.getAssetInfoAsync(assetId ?? uri);
    if (info?.localUri) return info.localUri;
  } catch {}
  const dest = (FileSystem.cacheDirectory ?? "") + `upload-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

async function uploadToAzure(
  localUri: string,
  sasUrl: string,
  contentType: string,
): Promise<void> {
  const fileRes = await fetch(localUri);
  const blob = await fileRes.blob();
  const res = await fetch(sasUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType, "x-ms-blob-type": "BlockBlob" },
    body: blob,
  });
  if (!res.ok)
    throw new Error(`Azure upload failed: ${res.status} ${res.statusText}`);
}

// ─── Animated grid item ───────────────────────────────────────────────────────
type GridItemProps = {
  asset: MediaLibrary.Asset;
  isSelected: boolean;
  selectedIdx: number;
  onPress: () => void;
};

function AnimatedGridItem({
  asset,
  isSelected,
  selectedIdx,
  onPress,
}: GridItemProps) {
  const scale = useSharedValue(1);
  const badgeScale = useSharedValue(isSelected ? 1 : 0);
  const circleOpacity = useSharedValue(isSelected ? 0 : 1);

  useEffect(() => {
    badgeScale.value = withSpring(isSelected ? 1 : 0, {
      damping: 14,
      stiffness: 220,
    });
    circleOpacity.value = withTiming(isSelected ? 0 : 1, { duration: 150 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelected]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
    opacity: badgeScale.value,
  }));

  const circleStyle = useAnimatedStyle(() => ({
    opacity: circleOpacity.value,
  }));

  const handlePress = () => {
    scale.value = withSpring(0.88, { damping: 10, stiffness: 350 }, () => {
      scale.value = withSpring(1, { damping: 14, stiffness: 180 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity style={styles.gridItem} onPress={handlePress} activeOpacity={1}>
      <Animated.View style={[StyleSheet.absoluteFill, pressStyle]}>
        <Image
          source={{ uri: asset.uri }}
          style={[styles.gridImage, isSelected && styles.gridImageSelected]}
          contentFit="cover"
        />
        {asset.mediaType === "video" && (
          <View style={styles.videoIndicator}>
            <Text style={styles.videoDuration}>
              {`${Math.floor(asset.duration / 60)}:${String(
                Math.round(asset.duration % 60),
              ).padStart(2, "0")}`}
            </Text>
          </View>
        )}
        <Animated.View style={[styles.selectionBadge, badgeStyle]}>
          <Text style={styles.selectionBadgeText}>{selectedIdx + 1}</Text>
        </Animated.View>
        <Animated.View style={[styles.unselectedCircle, circleStyle]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function NewPostScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("pick");
  const [caption, setCaption] = useState("");
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "creating"
  >("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const captionInputRef = useRef<TextInput>(null);

  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [activeTab, setActiveTab] = useState<"All" | "Photos" | "Videos">("All");

  const [selectedUris, setSelectedUris] = useState<string[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<MediaLibrary.Asset[]>([]);
  const [selectedVideoUris, setSelectedVideoUris] = useState<string[]>([]);
  const [focusedUri, setFocusedUri] = useState<string | null>(null);
  const [focusedIsVideo, setFocusedIsVideo] = useState(false);

  // Animation shared values
  const stepAnim = useSharedValue(0); // 0 = pick, 1 = caption
  const previewOpacity = useSharedValue(1);

  const previewPlayer = useVideoPlayer(
    focusedIsVideo && focusedUri ? focusedUri : null,
    (player) => {
      player.loop = true;
      player.muted = true;
      player.play();
    },
  );

  const { mutateAsync: createPostAsync } = useCreatePostMutation();
  const queryClient = useQueryClient();
  const uploadStore = useUploadStore();

  // ─── Animated styles ──────────────────────────────────────────────────────
  const pickAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(stepAnim.value, [0, 0.6], [1, 0], "clamp"),
    transform: [{ translateX: stepAnim.value * -width * 0.2 }],
  }));

  const captionAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(stepAnim.value, [0.4, 1], [0, 1], "clamp"),
    transform: [{ translateX: (1 - stepAnim.value) * width * 0.25 }],
  }));

  const previewAnimStyle = useAnimatedStyle(() => ({
    opacity: previewOpacity.value,
  }));

  const focusCaptionInput = useCallback(() => {
    setTimeout(() => captionInputRef.current?.focus(), 100);
  }, []);

  const goToCaption = () => {
    if (selectedUris.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("caption");
    stepAnim.value = withSpring(1, { damping: 22, stiffness: 200 }, () => {
      runOnJS(focusCaptionInput)();
    });
  };

  const goToPick = () => {
    if (isBusy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep("pick");
    stepAnim.value = withSpring(0, { damping: 22, stiffness: 200 });
  };

  // Animated preview swap — quick dip then spring back
  const updateFocused = (uri: string, isVideo: boolean) => {
    setFocusedUri(uri);
    setFocusedIsVideo(isVideo);
    previewOpacity.value = withSequence(
      withTiming(0.3, { duration: 80 }),
      withSpring(1, { damping: 14, stiffness: 200 }),
    );
  };

  // ─── Permissions & assets ─────────────────────────────────────────────────
  useEffect(() => {
    async function getPermissions() {
      if (!permissionResponse) {
        await requestPermission();
      } else if (
        permissionResponse.status !== "granted" &&
        permissionResponse.canAskAgain
      ) {
        await requestPermission();
      }
    }
    getPermissions();
  }, [permissionResponse, requestPermission]);

  const loadAssets = useCallback(async () => {
    if (permissionResponse?.status !== "granted") return;
    let mediaType: MediaLibrary.MediaTypeValue[] = ["photo", "video"];
    if (activeTab === "Photos") mediaType = ["photo"];
    if (activeTab === "Videos") mediaType = ["video"];
    try {
      const { assets: loaded } = await MediaLibrary.getAssetsAsync({
        mediaType,
        sortBy: MediaLibrary.SortBy.creationTime,
        first: 100,
      });
      setAssets(loaded);
    } catch (e) {
      console.warn("[new-post] loadAssets failed", e);
    }
  }, [permissionResponse?.status, activeTab]);

  useEffect(() => {
    if (permissionResponse?.status === "granted") {
      loadAssets();
    }
  }, [permissionResponse, loadAssets]);

  const isVideoUri = (uri: string | null): boolean => {
    if (!uri) return false;
    if (selectedVideoUris.includes(uri)) return true;
    const fromAsset = selectedAssets.find((a) => a.uri === uri);
    if (fromAsset?.mediaType === "video") return true;
    return /\.(mp4|mov|m4v|avi|mkv)$/i.test(uri.toLowerCase());
  };

  // ─── Camera / library ─────────────────────────────────────────────────────
  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Camera access needed",
          "To take a new photo or video, Revi needs permission to use the camera.",
          [
            { text: "Not now", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      const isVideoTab = activeTab === "Videos";
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: isVideoTab ? ["videos"] : ["images", "videos"],
        quality: 0.85,
        videoMaxDuration: 60,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const isVideo = asset.type === "video";

        if (isVideo) {
          setSelectedUris([uri]);
          setSelectedAssets([]);
          setSelectedVideoUris([uri]);
        } else if (selectedUris.length < 10) {
          if (focusedIsVideo || selectedVideoUris.length > 0) {
            setSelectedUris([uri]);
            setSelectedAssets([]);
          } else {
            setSelectedUris((prev) => [...prev, uri]);
          }
          setSelectedVideoUris([]);
        }
        updateFocused(uri, isVideo);
      }
    } catch (e) {
      console.warn("[new-post] camera failed", e);
      Alert.alert(
        "Camera unavailable",
        "The camera couldn't open. On a simulator this is expected — try picking a photo from the library instead.",
      );
    }
  };

  const handlePickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.85,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets.length > 0) {
      const videoAsset = result.assets.find((a) => a.type === "video");
      if (videoAsset) {
        setSelectedUris([videoAsset.uri]);
        setSelectedVideoUris([videoAsset.uri]);
        setSelectedAssets([]);
        updateFocused(videoAsset.uri, true);
      } else {
        const uris = result.assets.map((a) => a.uri).slice(0, 10);
        setSelectedUris(uris);
        setSelectedVideoUris([]);
        setSelectedAssets([]);
        updateFocused(uris[0], false);
      }
    }
  };

  // ─── Post submission ──────────────────────────────────────────────────────
  const handlePost = async () => {
    if (selectedUris.length === 0) return;
    setUploadError(null);

    try {
      setUploadStatus("uploading");
      const ts = Date.now();

      const hasVideo =
        selectedVideoUris.length > 0 ||
        selectedAssets.some((a) => a.mediaType === "video") ||
        selectedUris.some((u) => /\.(mp4|mov|m4v)$/i.test(u.toLowerCase()));
      uploadStore.startUpload(selectedUris[0], hasVideo);
      uploadStore.setProgress(5);

      router.back();

      let resolvedUris = await Promise.all(
        selectedUris.map((uri, i) => {
          const assetId = selectedAssets[i]?.id;
          return resolvePhUri(uri, assetId);
        }),
      );

      const { manipulateAsync, SaveFormat } =
        await import("expo-image-manipulator");
      const uploadUris = await Promise.all(
        resolvedUris.map(async (rawUri, i) => {
          const uri = rawUri.split("#")[0];
          const lowerUri = uri.toLowerCase();

          if (lowerUri.match(/\.(mp4|mov|m4v|avi|mkv)$/)) {
            try {
              const { Video: VideoCompressor } =
                await import("react-native-compressor");
              console.log("[new-post] Compressing video...", uri);
              const compressedUri = await VideoCompressor.compress(
                uri,
                { compressionMethod: "auto" },
                (progress) => {
                  uploadStore.setProgress(5 + progress * 15);
                },
              );
              console.log("[new-post] Video compressed:", compressedUri);
              return compressedUri;
            } catch (err) {
              console.warn(
                "[new-post] Video compression failed, using original:",
                err,
              );
              return uri;
            }
          }

          const isSafeFormat = lowerUri.match(/\.(jpe?g|png|webp)$/);
          const originalAsset = selectedAssets[i];
          const assetFilename = originalAsset?.filename?.toLowerCase() ?? "";
          const isHeic =
            lowerUri.endsWith(".heic") ||
            assetFilename.endsWith(".heic") ||
            assetFilename.endsWith(".heif");

          if (isHeic || !isSafeFormat) {
            try {
              console.log("[new-post] Converting image to JPEG:", uri);
              const result = await manipulateAsync(
                uri,
                [{ resize: { width: Math.min(2048, 1600) } }],
                { compress: 0.92, format: SaveFormat.JPEG },
              );
              console.log("[new-post] Converted to JPEG:", result.uri);
              return result.uri;
            } catch (err) {
              console.warn(
                "[new-post] Image conversion failed, using original:",
                err,
              );
              return uri;
            }
          }

          return uri;
        }),
      );

      const fileInfos = uploadUris.map((uri, i) => {
        const asset = selectedAssets[i];
        const lowerUri = uri.toLowerCase();
        const isVideo =
          selectedVideoUris.includes(selectedUris[i]) ||
          asset?.mediaType === "video" ||
          !!lowerUri.match(/\.(mp4|mov|m4v|avi|mkv)$/);

        if (isVideo)
          return { contentType: "video/mp4", extension: "mp4", isVideo: true };
        if (lowerUri.match(/\.jpe?g$/))
          return {
            contentType: "image/jpeg",
            extension: "jpg",
            isVideo: false,
          };
        if (lowerUri.match(/\.png$/))
          return {
            contentType: "image/png",
            extension: "png",
            isVideo: false,
          };
        if (lowerUri.match(/\.heic$/))
          return {
            contentType: "image/heic",
            extension: "heic",
            isVideo: false,
          };
        if (lowerUri.match(/\.webp$/))
          return {
            contentType: "image/webp",
            extension: "webp",
            isVideo: false,
          };
        return { contentType: "image/jpeg", extension: "jpg", isVideo: false };
      });

      const sasResults = await Promise.all(
        uploadUris.map((_, i) =>
          mediaService.getUploadUrl(
            `post-${ts}-${i}.${fileInfos[i].extension}`,
            fileInfos[i].contentType,
          ),
        ),
      );
      uploadStore.setProgress(20);

      await Promise.all(
        uploadUris.map((uri, i) =>
          uploadToAzure(uri, sasResults[i].upload_url, fileInfos[i].contentType),
        ),
      );
      uploadStore.setProgress(60);

      const blobUrls = sasResults.map((r) => r.blob_url);
      uploadStore.setProgress(70);

      const requiresTranscoding = sasResults.some((r) => r.requires_transcoding);
      const isCarousel = !requiresTranscoding && blobUrls.length > 1;

      let thumbnailBlobUrl: string | null = null;
      if (requiresTranscoding) {
        try {
          let videoLocalUri = uploadUris[0];
          if (videoLocalUri.includes("/var/mobile/Media/")) {
            const tempVideoPath = `${FileSystem.cacheDirectory}temp_thumb_${Date.now()}.mp4`;
            await FileSystem.copyAsync({
              from: videoLocalUri,
              to: tempVideoPath,
            });
            videoLocalUri = tempVideoPath;
          }
          const { uri: thumbLocalUri } =
            await VideoThumbnails.getThumbnailAsync(videoLocalUri, {
              time: 1000,
              quality: 0.7,
            });
          const thumbSas = await mediaService.getUploadUrl(
            `post-${ts}-thumb.jpg`,
            "image/jpeg",
          );
          await uploadToAzure(thumbLocalUri, thumbSas.upload_url, "image/jpeg");
          thumbnailBlobUrl = thumbSas.blob_url;
        } catch (thumbErr) {
          console.error(
            "[new-post] Thumbnail extraction failed (non-fatal):",
            thumbErr,
          );
        }
      }

      let mediaType: MediaType;
      let mediaUrls: string[] | null = null;
      if (requiresTranscoding) {
        mediaType = "video_upload";
        mediaUrls = null;
      } else if (isCarousel) {
        mediaType = "carousel";
        mediaUrls = blobUrls;
      } else {
        mediaType = "image";
        mediaUrls = null;
      }

      uploadStore.setStatus("creating");
      uploadStore.setProgress(80);

      const payload = {
        caption: caption.trim() || null,
        media_url: blobUrls[0],
        media_urls: mediaUrls,
        media_type: mediaType,
        latitude: DEV_COORDS.latitude,
        longitude: DEV_COORDS.longitude,
        thumbnail_url: thumbnailBlobUrl ?? undefined,
      };

      await createPostAsync(payload);
      queryClient.invalidateQueries({ queryKey: feedKeys.all });

      if (requiresTranscoding) {
        uploadStore.setStatus("processing");
        uploadStore.setProgress(90);
      } else {
        uploadStore.setProgress(100);
        uploadStore.setStatus("done");
      }
    } catch (err) {
      setUploadStatus("idle");
      uploadStore.setError((err as Error).message ?? "Upload failed");
    }
  };

  const isBusy = uploadStatus !== "idle";
  const selectionCount = selectedUris.length;
  const permissionPermanentlyDenied =
    permissionResponse?.status === "denied" &&
    permissionResponse.canAskAgain === false;
  const gridData: (string | MediaLibrary.Asset)[] = ["camera", ...assets];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Shared header — content swaps between pick/caption */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={step === "pick" ? () => router.back() : goToPick}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <View style={{ minWidth: 80, alignItems: "flex-end" }}>
          {step === "pick" ? (
            <TouchableOpacity
              style={[
                styles.nextButton,
                selectionCount === 0 && styles.nextButtonDisabled,
              ]}
              onPress={goToCaption}
              disabled={selectionCount === 0}
            >
              <Text style={styles.nextButtonText}>
                Next{selectionCount > 1 ? ` (${selectionCount})` : ""}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.postButton, isBusy && styles.postButtonDisabled]}
              onPress={handlePost}
              disabled={isBusy}
            >
              {isBusy ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Slide container — both steps layered, animated in/out */}
      <View style={{ flex: 1, overflow: "hidden" }}>
        {/* ── Pick step ────────────────────────────────────────────────────── */}
        <View
          style={StyleSheet.absoluteFill}
          pointerEvents={step === "pick" ? "auto" : "none"}
        >
          <Animated.View style={[StyleSheet.absoluteFill, pickAnimStyle]}>
            {/* Preview pane */}
            <Animated.View style={[styles.previewContainer, previewAnimStyle]}>
              {focusedUri ? (
                <>
                  {focusedIsVideo ? (
                    <VideoView
                      player={previewPlayer}
                      style={styles.previewImage}
                      contentFit="cover"
                      nativeControls={false}
                    />
                  ) : (
                    <Image
                      source={{ uri: focusedUri }}
                      style={styles.previewImage}
                      contentFit="cover"
                    />
                  )}
                  {focusedIsVideo && (
                    <View style={styles.videoPreviewBadge}>
                      <Ionicons name="videocam" size={14} color="#FFF" />
                      <Text style={styles.videoPreviewText}>Video</Text>
                    </View>
                  )}
                  {selectedUris.length > 1 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.previewStrip}
                      contentContainerStyle={styles.previewStripContent}
                    >
                      {selectedUris.map((uri, i) => (
                        <TouchableOpacity
                          key={uri}
                          onPress={() => updateFocused(uri, isVideoUri(uri))}
                          style={styles.stripThumbWrapper}
                        >
                          <Image
                            source={{ uri }}
                            style={[
                              styles.stripThumb,
                              focusedUri === uri && styles.stripThumbActive,
                            ]}
                            contentFit="cover"
                          />
                          <View style={styles.stripBadge}>
                            <Text style={styles.stripBadgeText}>{i + 1}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </>
              ) : (
                <View style={styles.emptyPreview}>
                  <Ionicons name="image-outline" size={48} color="#3A3A3C" />
                  <Text style={styles.emptyPreviewText}>
                    Tap photos to select
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Filter tabs */}
            <View style={styles.tabsContainer}>
              {(["All", "Photos", "Videos"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.activeTab]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveTab(tab);
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab && styles.activeTabText,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
              {assets.length === 0 && (
                <TouchableOpacity
                  style={styles.libraryFallback}
                  onPress={handlePickFromLibrary}
                >
                  <Ionicons name="folder-outline" size={16} color="#A855F7" />
                  <Text style={styles.libraryFallbackText}>Browse</Text>
                </TouchableOpacity>
              )}
            </View>

            {permissionPermanentlyDenied ? (
              <View style={styles.permissionState}>
                <Ionicons name="lock-closed-outline" size={40} color="#666" />
                <Text style={styles.permissionTitle}>Photo access is off</Text>
                <Text style={styles.permissionSubtitle}>
                  Enable photo library access in Settings to pick media for your
                  post.
                </Text>
                <TouchableOpacity
                  style={styles.permissionBtn}
                  onPress={() => Linking.openSettings()}
                >
                  <Text style={styles.permissionBtnText}>Open Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.permissionBrowseBtn}
                  onPress={handlePickFromLibrary}
                >
                  <Text style={styles.permissionBrowseText}>
                    Or pick files via the system picker
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                style={{ flex: 1 }}
                data={gridData}
                renderItem={({ item }) => {
                  if (item === "camera") {
                    return (
                      <TouchableOpacity
                        style={styles.gridItem}
                        onPress={handleCamera}
                        activeOpacity={0.7}
                      >
                        <View style={styles.cameraItem}>
                          <Ionicons
                            name="camera-outline"
                            size={30}
                            color="#FFF"
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  }
                  const asset = item as MediaLibrary.Asset;
                  const selectedIdx = selectedUris.indexOf(asset.uri);
                  const isSelected = selectedIdx >= 0;
                  return (
                    <AnimatedGridItem
                      asset={asset}
                      isSelected={isSelected}
                      selectedIdx={selectedIdx}
                      onPress={() => {
                        if (isSelected) {
                          const newUris = selectedUris.filter(
                            (u) => u !== asset.uri,
                          );
                          const newAssets = selectedAssets.filter(
                            (a) => a.id !== asset.id,
                          );
                          const newVideoUris = selectedVideoUris.filter(
                            (u) => u !== asset.uri,
                          );
                          setSelectedUris(newUris);
                          setSelectedAssets(newAssets);
                          setSelectedVideoUris(newVideoUris);
                          if (focusedUri === asset.uri) {
                            const lastUri =
                              newUris.length > 0
                                ? newUris[newUris.length - 1]
                                : null;
                            if (lastUri) {
                              updateFocused(
                                lastUri,
                                newVideoUris.includes(lastUri) ||
                                  /\.(mp4|mov|m4v|avi|mkv)$/i.test(
                                    lastUri.toLowerCase(),
                                  ),
                              );
                            } else {
                              setFocusedUri(null);
                              setFocusedIsVideo(false);
                            }
                          }
                        } else {
                          const isVideo = asset.mediaType === "video";
                          if (isVideo) {
                            setSelectedUris([asset.uri]);
                            setSelectedAssets([asset]);
                            setSelectedVideoUris([asset.uri]);
                          } else {
                            if (focusedIsVideo) {
                              setSelectedUris([asset.uri]);
                              setSelectedAssets([asset]);
                              setSelectedVideoUris([]);
                            } else {
                              if (selectedUris.length >= 10) return;
                              setSelectedUris((prev) => [...prev, asset.uri]);
                              setSelectedAssets((prev) => [...prev, asset]);
                              setSelectedVideoUris((prev) =>
                                prev.filter((u) => u !== asset.uri),
                              );
                            }
                          }
                          updateFocused(asset.uri, isVideo);
                        }
                      }}
                    />
                  );
                }}
                keyExtractor={(item) =>
                  typeof item === "string" ? item : item.id
                }
                numColumns={4}
                showsVerticalScrollIndicator={false}
              />
            )}
          </Animated.View>
        </View>

        {/* ── Caption step ─────────────────────────────────────────────────── */}
        <View
          style={StyleSheet.absoluteFill}
          pointerEvents={step === "caption" ? "auto" : "none"}
        >
          <Animated.View style={[StyleSheet.absoluteFill, captionAnimStyle]}>
            <KeyboardAvoidingView
              style={{ flex: 1, backgroundColor: "#0F0F10" }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              {/* Thumbnail + caption input side by side */}
              <View style={styles.captionRow}>
                <View>
                  {selectedUris.length <= 1 ? (
                    <Image
                      source={{ uri: selectedUris[0] }}
                      style={styles.captionThumb}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.captionThumbGrid}>
                      {selectedUris.slice(0, 4).map((uri) => (
                        <Image
                          key={uri}
                          source={{ uri }}
                          style={styles.captionThumbGridItem}
                          contentFit="cover"
                        />
                      ))}
                      {selectedUris.length > 4 && (
                        <View style={[styles.captionThumbGridItem, styles.captionMoreOverlay]}>
                          <Text style={styles.captionMoreText}>
                            +{selectedUris.length - 4}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <TextInput
                  ref={captionInputRef}
                  style={styles.captionInput}
                  placeholder="Write a caption..."
                  placeholderTextColor="#555"
                  multiline
                  maxLength={500}
                  value={caption}
                  onChangeText={setCaption}
                  editable={!isBusy}
                />
              </View>

              {caption.length > 0 && (
                <Text
                  style={[
                    styles.captionCounter,
                    caption.length >= 480 && styles.captionCounterWarn,
                  ]}
                >
                  {caption.length}/500
                </Text>
              )}

              {isBusy && (
                <View style={styles.statusRow}>
                  <ActivityIndicator color="#A855F7" size="small" />
                  <Text style={styles.statusText}>
                    {uploadStatus === "uploading"
                      ? "Uploading media..."
                      : "Creating post..."}
                  </Text>
                </View>
              )}

              {uploadError && (
                <View style={styles.errorRow}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color="#FF6B6B"
                  />
                  <Text style={styles.errorText}>{uploadError}</Text>
                </View>
              )}
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F10",
  },
  // ─── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  nextButton: {
    backgroundColor: "#2C2C2E",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    color: "#A855F7",
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  postButton: {
    backgroundColor: "#A855F7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 64,
    alignItems: "center",
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: "#FFF",
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  // ─── Pick step ─────────────────────────────────────────────────────────────
  previewContainer: {
    width,
    height: width * 1.1,
    backgroundColor: "#1C1C1E",
    marginBottom: 4,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  videoPreviewBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoPreviewText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  emptyPreview: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyPreviewText: {
    color: "#3A3A3C",
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0F0F10",
    gap: 12,
    alignItems: "center",
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#FFF",
  },
  tabText: {
    color: "#999",
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  activeTabText: {
    color: "#000",
  },
  libraryFallback: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A855F7",
  },
  libraryFallbackText: {
    color: "#A855F7",
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  gridItem: {
    width: width / 4,
    height: width / 4,
    padding: 1,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridImageSelected: {
    opacity: 0.7,
  },
  selectionBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#A855F7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  selectionBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  unselectedCircle: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
  },
  previewStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  previewStripContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
    flexDirection: "row",
  },
  stripThumbWrapper: {},
  stripThumb: {
    width: 52,
    height: 52,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  stripThumbActive: {
    borderColor: "#A855F7",
  },
  stripBadge: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#A855F7",
    alignItems: "center",
    justifyContent: "center",
  },
  stripBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: Fonts.bold,
  },
  cameraItem: {
    flex: 1,
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  videoIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  videoDuration: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: Fonts.medium,
  },
  // ─── Caption step ──────────────────────────────────────────────────────────
  captionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  captionThumb: {
    width: 110,
    height: 110,
    borderRadius: 10,
    backgroundColor: "#2C2C2E",
  },
  captionThumbGrid: {
    width: 110,
    height: 110,
    borderRadius: 10,
    overflow: "hidden",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  captionThumbGridItem: {
    width: 55,
    height: 55,
  },
  captionMoreOverlay: {
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  captionMoreText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  captionInput: {
    flex: 1,
    color: "#FFF",
    fontFamily: Fonts.regular,
    fontSize: 15,
    minHeight: 110,
    textAlignVertical: "top",
    paddingTop: 0,
  },
  captionCounter: {
    alignSelf: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 4,
    color: "#666",
    fontFamily: Fonts.regular,
    fontSize: 11,
  },
  captionCounterWarn: {
    color: "#FFB020",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusText: {
    color: "#999",
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255,107,107,0.1)",
    marginHorizontal: 16,
    borderRadius: 8,
  },
  errorText: {
    color: "#FF6B6B",
    fontFamily: Fonts.regular,
    fontSize: 13,
    flex: 1,
  },
  // ─── Permission denied ─────────────────────────────────────────────────────
  permissionState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  permissionTitle: {
    color: "#FFFFFF",
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    marginTop: 4,
  },
  permissionSubtitle: {
    color: "#999",
    fontFamily: Fonts.regular,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  permissionBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#A855F7",
    borderRadius: 20,
  },
  permissionBtnText: {
    color: "#FFFFFF",
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  permissionBrowseBtn: {
    paddingVertical: 8,
  },
  permissionBrowseText: {
    color: "#A855F7",
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
});
