import { ScreenHeader } from "@/src/components";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                    <Ionicons name={icon as any} size={16} color="#A1A1AA" />
                </View>
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            {children}
        </View>
    );
}

function Bullet({ children }: { children: string }) {
    return (
        <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{children}</Text>
        </View>
    );
}

function SubHeading({ children }: { children: string }) {
    return <Text style={styles.subHeading}>{children}</Text>;
}

export default function PrivacyPolicyScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Privacy Policy"
                onBackPress={() => router.back()}
                showBackButton
                showMenuButton={false}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Hero */}
                <View style={styles.hero}>
                    <View style={styles.heroIconWrap}>
                        <Ionicons name="shield-checkmark" size={32} color="#A1A1AA" />
                    </View>
                    <Text style={styles.heroTitle}>Your Privacy Matters</Text>
                    <Text style={styles.heroSubtitle}>
                        We're committed to keeping your data safe and being transparent about how we use it.
                    </Text>
                </View>

                <Text style={styles.lastUpdated}>Last Updated: March 30, 2026</Text>

                <Text style={styles.body}>
                    Welcome to Revi.ai! This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform. By using Revi.ai, you agree to the practices described below.
                </Text>

                {/* 1. Information We Collect */}
                <Section icon="folder-open-outline" title="1. Information We Collect">
                    <Text style={styles.body}>
                        We collect different types of information to enhance your experience and provide personalised property recommendations.
                    </Text>

                    <SubHeading>Information You Provide</SubHeading>
                    <Bullet>Account details — name, email, phone number, and password when you sign up.</Bullet>
                    <Bullet>User profile — location (city, state, country) and user type (Tenant, Buyer, Landlord, or Agent).</Bullet>
                    <Bullet>Property preferences — housing needs, budget, and preferred locations.</Bullet>
                    <Bullet>Communication data — messages, enquiries, and interactions with landlords or agents.</Bullet>
                    <Bullet>Content you create — posts, reviews, comments, images, and videos shared through the app.</Bullet>

                    <SubHeading>Information We Collect Automatically</SubHeading>
                    <Bullet>Usage data — search history, viewed properties, features used, and time spent on screens.</Bullet>
                    <Bullet>Device information — IP address, device type, operating system, browser, and unique identifiers.</Bullet>
                    <Bullet>Location data — with your permission, we access your device's location services for nearby results.</Bullet>
                    <Bullet>Cookies & tracking — we use cookies to improve your experience and deliver relevant recommendations.</Bullet>
                </Section>

                {/* 2. How We Use Your Information */}
                <Section icon="analytics-outline" title="2. How We Use Your Information">
                    <Text style={styles.body}>We use the collected data to:</Text>
                    <Bullet>Provide personalised property suggestions and AI-powered insights.</Bullet>
                    <Bullet>Connect you with verified landlords and agents.</Bullet>
                    <Bullet>Ensure secure, transparent rental and purchase transactions.</Bullet>
                    <Bullet>Send service-related notifications and updates.</Bullet>
                    <Bullet>Monitor usage trends to improve app performance.</Bullet>
                    <Bullet>Detect, prevent, and address fraudulent activity or technical issues.</Bullet>
                </Section>

                {/* 3. Data Security */}
                <Section icon="lock-closed-outline" title="3. How We Protect Your Data">
                    <Text style={styles.body}>
                        We implement industry-standard security measures to protect your information:
                    </Text>
                    <Bullet>Data encryption — your data is encrypted during transmission and at rest.</Bullet>
                    <Bullet>Access controls — only authorised personnel can access sensitive data.</Bullet>
                    <Bullet>Regular security audits — we conduct routine checks to maintain data protection.</Bullet>
                    <Text style={styles.bodySmall}>
                        While we take every reasonable precaution, no method of transmission over the internet is completely secure. We cannot guarantee absolute security.
                    </Text>
                </Section>

                {/* 4. Information Sharing */}
                <Section icon="people-outline" title="4. Who We Share Your Data With">
                    <Text style={styles.body}>
                        We do not sell your personal data. We may share certain information with:
                    </Text>
                    <Bullet>Verified landlords & agents — to facilitate property enquiries and transactions.</Bullet>
                    <Bullet>Service providers — for analytics, customer support, and platform improvements.</Bullet>
                    <Bullet>Legal authorities — if required by law or to comply with regulations.</Bullet>
                    <Bullet>Corporate transactions — in connection with a merger, acquisition, or sale of assets.</Bullet>
                </Section>

                {/* 5. Your Rights */}
                <Section icon="hand-left-outline" title="5. Your Rights & Choices">
                    <Text style={styles.body}>As a user, you have full control over your data:</Text>
                    <Bullet>Access & update your personal information in account settings.</Bullet>
                    <Bullet>Request deletion of your account and all associated data.</Bullet>
                    <Bullet>Withdraw consent for data processing at any time.</Bullet>
                    <Bullet>Export your data in a portable format.</Bullet>
                    <Bullet>Manage cookie preferences in your browser settings.</Bullet>
                    <Text style={styles.bodySmall}>
                        To exercise any of these rights, contact us using the information below.
                    </Text>
                </Section>

                {/* 6. Changes */}
                <Section icon="refresh-outline" title="6. Changes to This Policy">
                    <Text style={styles.body}>
                        We may update this Privacy Policy from time to time. Any changes will be communicated through our platform. We encourage you to review this policy periodically.
                    </Text>
                </Section>

                {/* 7. Contact */}
                <Section icon="mail-outline" title="7. Contact Us">
                    <Text style={styles.body}>
                        If you have any questions about this Privacy Policy, reach out to us:
                    </Text>
                    <View style={styles.contactCard}>
                        <View style={styles.contactRow}>
                            <Ionicons name="mail" size={16} color="#A1A1AA" />
                            <Text style={styles.contactText}>support@reviai.ai</Text>
                        </View>
                    </View>
                </Section>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2026 ReviAI. All rights reserved.</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F0F10" },
    content: { flex: 1 },
    contentContainer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },

    // Hero
    hero: { alignItems: "center", paddingVertical: 28, gap: 10 },
    heroIconWrap: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        alignItems: "center", justifyContent: "center", marginBottom: 4,
    },
    heroTitle: { fontSize: 22, fontFamily: Fonts.bold, color: "#FFFFFF" },
    heroSubtitle: {
        fontSize: 14, fontFamily: Fonts.regular, color: "#71717A",
        textAlign: "center", lineHeight: 20, paddingHorizontal: 16,
    },

    lastUpdated: {
        fontSize: 12, fontFamily: Fonts.regular, color: "#52525B",
        textAlign: "center", marginBottom: 20,
    },

    // Sections
    section: { marginBottom: 28 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    sectionIconWrap: {
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        alignItems: "center", justifyContent: "center",
    },
    sectionTitle: { fontSize: 16, fontFamily: Fonts.semiBold, color: "#FFFFFF", flex: 1 },

    subHeading: {
        fontSize: 14, fontFamily: Fonts.semiBold, color: "#E4E4E7",
        marginTop: 12, marginBottom: 6,
    },

    // Body
    body: { fontSize: 14, fontFamily: Fonts.regular, color: "#A1A1AA", lineHeight: 22, marginBottom: 8 },
    bodySmall: {
        fontSize: 13, fontFamily: Fonts.regular, color: "#71717A",
        lineHeight: 20, marginTop: 8, fontStyle: "italic",
    },

    // Bullets
    bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8, paddingLeft: 4 },
    bulletDot: {
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: "#A1A1AA", marginTop: 7,
    },
    bulletText: { fontSize: 14, fontFamily: Fonts.regular, color: "#A1A1AA", lineHeight: 22, flex: 1 },

    // Contact
    contactCard: {
        backgroundColor: "#1C1C1E", borderRadius: 12,
        padding: 16, marginTop: 4, gap: 12,
    },
    contactRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    contactText: { fontSize: 14, fontFamily: Fonts.semiBold, color: "#FFFFFF" },

    // Footer
    footer: { alignItems: "center", paddingTop: 24, paddingBottom: 8 },
    footerText: { fontSize: 12, fontFamily: Fonts.regular, color: "#3F3F46" },
});
