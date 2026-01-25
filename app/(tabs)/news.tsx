import { ScreenHeader } from "@/src/components";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function SavedScreen() {
  const PropertyCard = () => (
    <View style={styles.propertyCard}>
      <View style={styles.propertyImagePlaceholder} />
      <View style={styles.propertyFooter}>
        <View style={styles.uploaderInfo}>
          <View style={styles.uploaderAvatar}>
            <Ionicons name="person" size={16} color="#666666" />
          </View>
          <View>
            <Text style={styles.uploadedByLabel}>
              Uploaded by Adumallah Kaylah
            </Text>
            <Text style={styles.timeLabel}>3 Weeks ago</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Saved"
        showMenuButton={false}
        showBackButton={false}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your saved here"
            placeholderTextColor="#666666"
          />
        </View>

        {/* Posts Category Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posts</Text>
          <View style={styles.categoriesRow}>
            <TouchableOpacity style={styles.categoryCard}>
              <Ionicons name="tv-outline" size={24} color="#FF2D55" />
              <Text style={styles.categoryText}>Photos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryCard}>
              <Ionicons name="book-outline" size={24} color="#FFD700" />
              <Text style={styles.categoryText}>Videos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Properties Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Properties</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.propertiesList}
          >
            <PropertyCard />
            <PropertyCard />
            <PropertyCard />
          </ScrollView>
        </View>
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
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 48,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
    height: "100%",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  categoriesRow: {
    flexDirection: "row",
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: "#1C1C1E", // Dark card background
    borderRadius: 16,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: "#999999", // Slightly muted text
  },
  propertiesList: {
    gap: 16,
  },
  propertyCard: {
    width: width * 0.7, // Card width
  },
  propertyImagePlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: "#2C2C2E", // Placeholder showing usage of image
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16, // Screenshot shows rounded corners on the image/card
    marginBottom: 12,
  },
  propertyFooter: {
    paddingHorizontal: 4,
  },
  uploaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  uploaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3A3A3C",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadedByLabel: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  timeLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: "#999999",
  },
});
