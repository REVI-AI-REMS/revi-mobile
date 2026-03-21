import { Fonts } from "@/src/constants/theme";
import { useCreatePostMutation } from "@/src/hooks/mutations/use-feed-mutations";
import { mediaService } from "@/src/services/social/media.service";
import type { MediaType } from "@/src/services/social/types";
import { useUploadStore } from "@/src/store/upload.store";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Hardcoded Lagos coords — replace with expo-location when ready
const DEV_COORDS = { latitude: 6.5244, longitude: 3.3792 };

type Step = "pick" | "caption";

// ─── URI resolver ────────────────────────────────────────────────────────────
// On iOS, MediaLibrary returns ph:// URIs that fetch() cannot read directly.
// Use MediaLibrary.getAssetInfoAsync to get the real file:// localUri.
async function resolvePhUri(uri: string, assetId?: string): Promise<string> {
  if (!uri.startsWith("ph://")) return uri;
  try {
    // getAssetInfoAsync accepts either an Asset object or an AssetId string
    const info = await MediaLibrary.getAssetInfoAsync(assetId ?? uri);
    if (info?.localUri) return info.localUri;
  } catch {
    // fall through
  }
  // Last-resort: export to cache via FileSystem
  const dest = (FileSystem.cacheDirectory ?? "") + `upload-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

// ─── Upload helper ────────────────────────────────────────────────────────────
// PUT raw bytes directly to Azure SAS URL (no backend proxy).
// localUri must already be a file:// or http:// URI — no ph:// here.
async function uploadToAzure(
  localUri: string,
  sasUrl: string,
  contentType: string,
): Promise<void> {
  const fileRes = await fetch(localUri);
  const blob = await fileRes.blob();
  const res = await fetch(sasUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-ms-blob-type": "BlockBlob",
    },
    body: blob,
  });
  if (!res.ok) {
    throw new Error(`Azure upload failed: ${res.status} ${res.statusText}`);
  }
}

export default function NewPostScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("pick");
  const [caption, setCaption] = useState("");
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "creating"
  >("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ─── Media picker state ───────────────────────────────────────────────────
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [activeTab, setActiveTab] = useState<"All" | "Photos" | "Videos">(
    "All",
  );

  // Multi-select: ordered list of selected image URIs (max 10)
  const [selectedUris, setSelectedUris] = useState<string[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<MediaLibrary.Asset[]>(
    [],
  );
  const [selectedVideoUris, setSelectedVideoUris] = useState<string[]>([]);
  // Which image is shown large in the preview pane
  const [focusedUri, setFocusedUri] = useState<string | null>(null);
  const [focusedIsVideo, setFocusedIsVideo] = useState(false);

  const { mutateAsync: createPostAsync } = useCreatePostMutation();
  const uploadStore = useUploadStore();

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
      // Auto-select first photo on initial load
      if (selectedUris.length === 0 && loaded.length > 0) {
        const first = loaded[0];
        setSelectedUris([first.uri]);
        setSelectedAssets([first]);
        setSelectedVideoUris(first.mediaType === "video" ? [first.uri] : []);
        setFocusedUri(first.uri);
        setFocusedIsVideo(first.mediaType === "video");
      }
    } catch (e) {
      console.log("Error loading assets:", e);
    }
  }, [permissionResponse?.status, activeTab, selectedUris.length]);

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

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Camera permission needed");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images", "videos"],
        quality: 0.85,
        videoMaxDuration: 60,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const isVideo = asset.type === "video";

        // If video, clear previous selections and use only the video
        // If image, add to existing selections
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
        setFocusedUri(uri);
        setFocusedIsVideo(isVideo);
      }
    } catch (e) {
      console.log("Camera error:", e);
    }
  };

  // Fallback for Expo Go where MediaLibrary has limited access
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
        setFocusedUri(videoAsset.uri);
        setFocusedIsVideo(true);
      } else {
        const uris = result.assets.map((a) => a.uri).slice(0, 10);
        setSelectedUris(uris);
        setSelectedVideoUris([]);
        setFocusedUri(uris[0]);
        setFocusedIsVideo(false);
      }
      setSelectedAssets([]);
    }
  };

  // ─── Post submission ──────────────────────────────────────────────────────
  const handlePost = async () => {
    if (selectedUris.length === 0) return;
    setUploadError(null);

    try {
      setUploadStatus("uploading");
      const ts = Date.now();

      // Tell the global store so the social feed shows the progress card
      const hasVideo =
        selectedVideoUris.length > 0 ||
        selectedAssets.some((a) => a.mediaType === "video") ||
        selectedUris.some((u) => /\.(mp4|mov|m4v)$/i.test(u.toLowerCase()));
      uploadStore.startUpload(selectedUris[0], hasVideo);
      uploadStore.setProgress(5);

      // Navigate back immediately — user sees progress in the feed
      router.back();

      // Step 1: Resolve any ph:// (iOS Photo Library) URIs to file:// URIs.
      // MediaLibrary.getAssetInfoAsync gives us the real local path.
      let resolvedUris = await Promise.all(
        selectedUris.map((uri, i) => {
          const assetId = selectedAssets[i]?.id;
          return resolvePhUri(uri, assetId);
        }),
      );

      // HEIC to JPEG conversion (common on iOS)
      const { manipulateAsync, SaveFormat } = await import("expo-image-manipulator");
      const uploadUris = await Promise.all(
        resolvedUris.map(async (uri) => {
          if (uri.toLowerCase().endsWith(".heic")) {
            console.log(`[Upload] Converting HEIC to JPEG: ${uri}`);
            try {
              const result = await manipulateAsync(uri, [{ resize: { width: 1600 } }], {
                compress: 0.9,
                format: SaveFormat.JPEG,
              });
              return result.uri;
            } catch (err) {
              console.error("[Upload] HEIC conversion failed:", err);
              return uri;
            }
          }
          return uri;
        }),
      );

      // Determine content type and file extension for each file
      const fileInfos = uploadUris.map((uri, i) => {
        const asset = selectedAssets[i];
        const lowerUri = uri.toLowerCase();

        // Detect video
        const isVideo =
          selectedVideoUris.includes(selectedUris[i]) ||
          asset?.mediaType === "video" ||
          !!lowerUri.match(/\.(mp4|mov|m4v|avi|mkv)$/);

        if (isVideo) {
          // iOS camera produces .mov, normalize to mp4 for Azure/backend
          return { contentType: "video/mp4", extension: "mp4", isVideo: true };
        }

        // Detect image MIME type from extension
        if (lowerUri.match(/\.jpe?g$/)) {
          return {
            contentType: "image/jpeg",
            extension: "jpg",
            isVideo: false,
          };
        }
        if (lowerUri.match(/\.png$/)) {
          return { contentType: "image/png", extension: "png", isVideo: false };
        }
        if (lowerUri.match(/\.heic$/)) {
          return {
            contentType: "image/heic",
            extension: "heic",
            isVideo: false,
          };
        }
        if (lowerUri.match(/\.webp$/)) {
          return {
            contentType: "image/webp",
            extension: "webp",
            isVideo: false,
          };
        }

        // Default: JPEG (most phone photos are JPEG)
        return { contentType: "image/jpeg", extension: "jpg", isVideo: false };
      });

      // Step 2: Get SAS URLs for all media files in parallel
      const sasResults = await Promise.all(
        uploadUris.map((_, i) =>
          mediaService.getUploadUrl(
            `post-${ts}-${i}.${fileInfos[i].extension}`,
            fileInfos[i].contentType,
          ),
        ),
      );
      uploadStore.setProgress(20);

      // Step 3: Upload all media to Azure in parallel
      await Promise.all(
        uploadUris.map((uri, i) =>
          uploadToAzure(
            uri,
            sasResults[i].upload_url,
            fileInfos[i].contentType,
          ),
        ),
      );
      uploadStore.setProgress(60);

      const blobUrls = sasResults.map((r) => r.blob_url);
      uploadStore.setProgress(70);
      // Use requires_transcoding from the SAS response as the source of truth
      const requiresTranscoding = sasResults.some(
        (r) => r.requires_transcoding,
      );
      const isCarousel = !requiresTranscoding && blobUrls.length > 1;

      // Per API spec:
      // video_upload → media_url = raw blob URL, media_urls = null
      // carousel     → media_url = first image, media_urls = all blob URLs
      // image        → media_url = blob URL, media_urls = null
      let mediaType: MediaType;
      let mediaUrls: string[] | null = null;

      if (requiresTranscoding) {
        mediaType = "video_upload";
        mediaUrls = null; // API spec: null for video
      } else if (isCarousel) {
        mediaType = "carousel";
        mediaUrls = blobUrls;
      } else {
        mediaType = "image";
        mediaUrls = null;
      }

      console.log("[Upload] Creating post:", {
        mediaType,
        mediaUrls,
        blobUrl: blobUrls[0],
        requiresTranscoding,
      });

      // Step 4: Create post — use mutateAsync so the result is awaited even
      // after router.back() unmounts this screen (mutate callbacks are
      // suppressed on unmount, but awaiting a Promise is not).
      uploadStore.setStatus("creating");
      uploadStore.setProgress(80);
      await createPostAsync({
        caption: caption.trim() || null,
        media_url: blobUrls[0],
        media_urls: mediaUrls,
        media_type: mediaType,
        latitude: DEV_COORDS.latitude,
        longitude: DEV_COORDS.longitude,
      });

      if (requiresTranscoding) {
        // Video needs server-side HLS transcoding (~15-30s)
        // Polling is now handled in SocialsScreen (app/(tabs)/social.tsx)
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

  // ─── Caption step ─────────────────────────────────────────────────────────
  if (step === "caption") {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                if (!isBusy) setStep("pick");
              }}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Post</Text>
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
          </View>

          {/* Thumbnails + caption row */}
          <View style={styles.captionRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.captionThumbsRow}
              contentContainerStyle={{ paddingRight: 8 }}
            >
              {selectedUris.map((uri, i) => (
                <View key={uri} style={styles.captionThumbWrapper}>
                  <Image
                    source={{ uri }}
                    style={styles.captionThumb}
                    contentFit="cover"
                  />
                  {selectedUris.length > 1 && (
                    <View style={styles.captionThumbBadge}>
                      <Text style={styles.captionThumbBadgeText}>{i + 1}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              placeholderTextColor="#666"
              multiline
              maxLength={500}
              value={caption}
              onChangeText={setCaption}
              editable={!isBusy}
              autoFocus
            />
          </View>

          {/* Upload status */}
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

          {/* Error */}
          {uploadError && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
              <Text style={styles.errorText}>{uploadError}</Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Pick step ────────────────────────────────────────────────────────────
  const gridData: (string | MediaLibrary.Asset)[] = ["camera", ...assets];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          style={[
            styles.nextButton,
            selectionCount === 0 && styles.nextButtonDisabled,
          ]}
          onPress={() => {
            if (selectionCount > 0) setStep("caption");
          }}
          disabled={selectionCount === 0}
        >
          <Text style={styles.nextButtonText}>
            Next{selectionCount > 1 ? ` (${selectionCount})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Preview */}
      <View style={styles.previewContainer}>
        {focusedUri ? (
          <>
            {focusedIsVideo ? (
              <Video
                source={{ uri: focusedUri }}
                style={styles.previewImage}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
                useNativeControls={false}
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
                    onPress={() => {
                      setFocusedUri(uri);
                      setFocusedIsVideo(isVideoUri(uri));
                    }}
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
            <Text style={styles.emptyPreviewText}>Tap photos to select</Text>
          </View>
        )}
      </View>

      {/* Tabs + library fallback */}
      <View style={styles.tabsContainer}>
        {["All", "Photos", "Videos"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as "All" | "Photos" | "Videos")}
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
        {/* Expo Go fallback — MediaLibrary has limited access in Expo Go */}
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

      <FlatList
        data={gridData}
        renderItem={({ item }) => {
          if (item === "camera") {
            return (
              <TouchableOpacity style={styles.gridItem} onPress={handleCamera}>
                <View style={styles.cameraItem}>
                  <Ionicons name="camera-outline" size={30} color="#FFF" />
                </View>
              </TouchableOpacity>
            );
          }
          const asset = item as MediaLibrary.Asset;
          const selectedIdx = selectedUris.indexOf(asset.uri);
          const isSelected = selectedIdx >= 0;
          return (
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => {
                if (isSelected) {
                  // Deselect
                  const newUris = selectedUris.filter((u) => u !== asset.uri);
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
                      newUris.length > 0 ? newUris[newUris.length - 1] : null;
                    setFocusedUri(lastUri);
                    setFocusedIsVideo(
                      !!lastUri &&
                        (newVideoUris.includes(lastUri) ||
                          /\.(mp4|mov|m4v|avi|mkv)$/i.test(
                            lastUri.toLowerCase(),
                          )),
                    );
                  }
                } else {
                  const isVideo = asset.mediaType === "video";
                  if (isVideo) {
                    // Video: clear all other selections, only allow one video
                    setSelectedUris([asset.uri]);
                    setSelectedAssets([asset]);
                    setSelectedVideoUris([asset.uri]);
                  } else {
                    // Image: don't allow adding images when a video is selected
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
                  setFocusedUri(asset.uri);
                  setFocusedIsVideo(isVideo);
                }
              }}
            >
              <Image
                source={{ uri: asset.uri }}
                style={[
                  styles.gridImage,
                  isSelected && styles.gridImageSelected,
                ]}
                contentFit="cover"
              />
              {asset.mediaType === "video" && (
                <View style={styles.videoIndicator}>
                  <Text style={styles.videoDuration}>
                    {`${Math.floor(asset.duration / 60)}:${String(Math.round(asset.duration % 60)).padStart(2, "0")}`}
                  </Text>
                </View>
              )}
              {isSelected ? (
                <View style={styles.selectionBadge}>
                  <Text style={styles.selectionBadgeText}>
                    {selectedIdx + 1}
                  </Text>
                </View>
              ) : (
                <View style={styles.unselectedCircle} />
              )}
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => (typeof item === "string" ? item : item.id)}
        numColumns={4}
        showsVerticalScrollIndicator={false}
      />
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
    width: width,
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
    opacity: 0.75,
  },
  // ─── Selection badges ────────────────────────────────────────────────────────
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
  // ─── Preview strip ──────────────────────────────────────────────────────
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
  stripThumbWrapper: {
    position: "relative",
  },
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
    flexDirection: "column",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  captionThumbsRow: {
    maxHeight: 88,
  },
  captionThumbWrapper: {
    marginRight: 8,
    position: "relative",
  },
  captionThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#2C2C2E",
  },
  captionThumbBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#A855F7",
    alignItems: "center",
    justifyContent: "center",
  },
  captionThumbBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  captionInput: {
    color: "#FFF",
    fontFamily: Fonts.regular,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
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
});
