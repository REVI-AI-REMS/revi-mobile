import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function NewPostScreen() {
    const router = useRouter();
    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
    const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<MediaLibrary.Asset | null>(null);
    const [activeTab, setActiveTab] = useState<"All" | "Photos" | "Videos">("All");

    useEffect(() => {
        async function getPermissions() {
            if (!permissionResponse) {
                // Initial load, wait slightly or request
                await requestPermission();
            } else if (permissionResponse.status !== "granted" && permissionResponse.canAskAgain) {
                await requestPermission();
            }
        }
        getPermissions();
    }, [permissionResponse, requestPermission]);

    useEffect(() => {
        // Only load assets if explicitly granted
        if (permissionResponse?.status === "granted") {
            loadAssets();
        }
    }, [permissionResponse, activeTab]);

    const loadAssets = async () => {
        // Double check permission before calling getAssetsAsync to avoid crash
        if (permissionResponse?.status !== "granted") return;

        let mediaType: any[] = ['photo', 'video'];
        if (activeTab === "Photos") mediaType = ['photo'];
        if (activeTab === "Videos") mediaType = ['video'];

        try {
            const { assets } = await MediaLibrary.getAssetsAsync({
                mediaType,
                sortBy: MediaLibrary.SortBy.creationTime,
                first: 100,
            });
            setAssets(assets);
            if (!selectedAsset && assets.length > 0) {
                setSelectedAsset(assets[0]);
            }
        } catch (e) {
            console.log("Error loading assets:", e);
        }
    };

    const handleCamera = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                alert("Camera permission needed");
                return;
            }

            const result = await ImagePicker.launchCameraAsync();
            if (!result.canceled && result.assets[0]) {
                console.log("Camera result", result.assets[0]);
                // Optionally add to list or select it
            }
        } catch (e) {
            console.log("Error launching camera:", e);
        }
    }

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Post</Text>
            <TouchableOpacity style={styles.nextButton}>
                <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
        </View>
    );

    const renderItem = ({ item, index }: { item: string | MediaLibrary.Asset; index: number }) => {
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
        return (
            <TouchableOpacity
                style={[styles.gridItem, selectedAsset?.id === asset.id && styles.selectedGridItem]}
                onPress={() => setSelectedAsset(asset)}
            >
                <Image source={{ uri: asset.uri }} style={styles.gridImage} />
                {asset.mediaType === "video" && (
                    <View style={styles.videoIndicator}>
                        <Text style={styles.videoDuration}>{formatDuration(asset.duration)}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.round(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const data: (string | MediaLibrary.Asset)[] = ["camera", ...assets];

    if (!permissionResponse) {
        return <View style={styles.container} />; // Loading state
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />
            {renderHeader()}

            <View style={styles.previewContainer}>
                {selectedAsset ? (
                    <Image source={{ uri: selectedAsset.uri }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                    <View style={styles.emptyPreview} />
                )}
            </View>

            <View style={styles.tabsContainer}>
                {["All", "Photos", "Videos"].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab as any)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={data}
                renderItem={renderItem}
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
    nextButtonText: {
        color: "#A855F7", // Purple-ish
        fontFamily: Fonts.semiBold,
        fontSize: 14,
    },
    previewContainer: {
        width: width,
        height: width * 1.2,
        backgroundColor: "#1C1C1E",
        marginBottom: 4,
    },
    previewImage: {
        width: "100%",
        height: "100%",
    },
    emptyPreview: {
        flex: 1,
        backgroundColor: "#1C1C1E"
    },
    tabsContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#0F0F10",
        gap: 16,
        alignItems: 'center'
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
    gridItem: {
        width: width / 4,
        height: width / 4,
        padding: 1,
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    selectedGridItem: {
        opacity: 0.6,
    },
    cameraItem: {
        flex: 1,
        backgroundColor: "#2C2C2E",
        alignItems: "center",
        justifyContent: "center",
    },
    videoIndicator: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 4,
        borderRadius: 4,
    },
    videoDuration: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: Fonts.medium
    }
});
