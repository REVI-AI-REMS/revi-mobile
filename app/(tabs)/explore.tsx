import { ScreenHeader } from "@/src/components";
import { Fonts } from "@/src/constants";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ExploreScreen() {
  const [searchText, setSearchText] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([
    "Lagos Island apartments",
    "Victoria Island luxury homes",
    "Ikeja budget flats",
  ]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Sample images for when no search history
  const sampleImages = [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400",
  ];

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim()) {
      setIsSearching(true);
      // Simulate search - replace with real search logic
      setTimeout(() => {
        setSearchResults([]); // Empty results for demo
        setIsSearching(false);
      }, 1000);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    if (searchText.trim() && !searchHistory.includes(searchText.trim())) {
      setSearchHistory([searchText.trim(), ...searchHistory]);
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const renderContent = () => {
    if (isSearching) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    if (searchText.trim() && searchResults.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={60} color="#666666" />
            <Text style={styles.noResultsTitle}>Nothing Found</Text>
            <Text style={styles.noResultsSubtitle}>
              Try searching with different keywords
            </Text>
          </View>
        </View>
      );
    }

    if (searchHistory.length === 0) {
      return (
        <View style={styles.imageGridContainer}>
          {/* <Text style={styles.sectionTitle}>Explore Properties</Text> */}
          <View style={styles.imageGrid}>
            {sampleImages.map((image, index) => (
              <TouchableOpacity key={index} style={styles.imageItem}>
                <Image source={{ uri: image }} style={styles.gridImage} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.searchHistoryContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <TouchableOpacity onPress={clearSearchHistory}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.historyList}>
          {searchHistory.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.historyItem}
              onPress={() => handleSearch(item)}
            >
              <Ionicons name="time-outline" size={16} color="#666666" />
              <Text style={styles.historyText}>{item}</Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchHistory(searchHistory.filter((_, i) => i !== index));
                }}
              >
                {/* <Ionicons name="close" size={16} color="#666666" /> */}
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader title="Search" showMenuButton={false} />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties, locations..."
            placeholderTextColor="#666666"
            value={searchText}
            onChangeText={handleSearch}
            onSubmitEditing={handleSearchSubmit}
            autoCapitalize="none"
            returnKeyType="search"
            blurOnSubmit={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchText("");
                setSearchResults([]);
                setIsSearching(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#666666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Content */}
        {renderContent()}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F10",
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#666666",
  },
  noResultsContainer: {
    alignItems: "center",
  },
  noResultsTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#666666",
    textAlign: "center",
  },
  imageGridContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
    marginBottom: 16,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  imageItem: {
    width: "31%",
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  searchHistoryContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  clearAllText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: "#c7c7c7",
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
  },
  historyText: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: "#FFFFFF",
  },
});
