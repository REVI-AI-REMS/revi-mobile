import { colors, radius, spacing, typography } from "@/src/constants/design";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
    Animated,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── T&C Content ─────────────────────────────────────────────────────────────

const SECTIONS = [
    {
        title: "1. Acceptance of Terms",
        body: "By downloading, installing, or using the REVIAI app, you acknowledge that you have read, understood, and agree to be bound by these Terms, as well as our Privacy Policy, which is incorporated herein by reference. These Terms form a legally binding agreement between you (\u201cUser,\u201d \u201cyou,\u201d or \u201cyour\u201d) and REVIAI Technologies Limited. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.",
    },
    {
        title: "2. Description of Service",
        body: "The REVIAI app is an AI-powered platform designed to assist home renters, buyers, and tenants by providing transparent insights into properties, landlords, developers and real estate agents. REVIAI does not act as a broker, advisor, or intermediary in property transactions and retains no custody or control over user funds or assets.",
    },
    {
        title: "3. Eligibility",
        body: "To use the Service, you must:\n\n• Be at least 13 years old or the age of majority in your jurisdiction, whichever is higher;\n• Have the legal capacity to enter into a binding agreement; and\n• Not be prohibited from using the Service under applicable laws.\n\nWe reserve the right to refuse access to the Service to anyone for any reason at our sole discretion.",
    },
    {
        title: "4. License to Use the Service",
        body: "Subject to your compliance with these Terms, REVIAI Technologies Limited grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for personal, non-commercial purposes. This license does not permit you to:\n\n• Modify, reverse-engineer, decompile, or disassemble the Service;\n• Distribute, sublicense, or otherwise transfer the Service to third parties;\n• Use the Service for any unlawful purpose or in violation of these Terms.",
    },
    {
        title: "5. User Accounts",
        body: "To access certain features of the Service, you may need to create an account. You agree to:\n\n• Provide accurate, current, and complete information during registration;\n• Maintain the security of your account credentials; and\n• Notify us immediately of any unauthorized use of your account.\n\nYou are solely responsible for all activities that occur under your account. We may suspend or terminate your account if we suspect any breach of these Terms.",
    },
    {
        title: "6. User Conduct",
        body: "You agree not to:\n\n• Use the Service to transmit harmful, false, intentionally inaccurate, offensive, or illegal content;\n• Interfere with or disrupt the Service, including through hacking or introducing malicious code;\n• Collect or harvest data from the Service without our express consent;\n• Impersonate any person or entity or misrepresent your affiliation with any party;\n• Use the App to harass, defame, or discriminate against individuals or entities.\n\nWe reserve the right to investigate and take appropriate action, including legal action, against any User who violates this section.",
    },
    {
        title: "7. Intellectual Property",
        body: "All content, trademarks, and other intellectual property within the Service are owned by REVIAI Technologies Limited or its licensors. You may not reproduce, distribute, or create derivative works from any part of the Service without our prior written permission, except as expressly permitted under these Terms.",
    },
    {
        title: "8. Privacy",
        body: "Your use of the Service is subject to our Privacy Policy, which explains how we collect, use, and protect your personal information. By using the Service, you consent to such processing as described therein. Personal data will be anonymized to comply with extant regulations. You acknowledge that data provided by the App (e.g. trust scores, predictions) is for informational purposes only and not guaranteed to be error-free.",
    },
    {
        title: "9. Third-Party Links and Services",
        body: "The Service may contain links to third-party websites or services that are not controlled by us. We are not responsible for the content, policies, or practices of these third parties, and you access them at your own risk.",
    },
    {
        title: "10. Termination",
        body: "We may terminate or suspend your access to the Service at any time, with or without notice, for any reason, including if we believe you have violated these Terms. Upon termination, your license to use the Service ends, and you must cease all use of it. Sections 7, 11, 12, and 13 will survive termination.",
    },
    {
        title: "11. Disclaimer of Warranties",
        body: "The Service is provided \"as is\" and \"as available\" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee that the Service will be uninterrupted, error-free, or secure.",
    },
    {
        title: "12. Limitation of Liability",
        body: "To the fullest extent permitted by law, REVIAI Technologies Limited, its affiliates, officers, directors, employees, and agents will not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, even if advised of the possibility of such damages. Our total liability to you for any claim will not exceed the amount you paid us, if any, to use the Service in the preceding 12 months.",
    },
    {
        title: "13. Governing Law and Dispute Resolution",
        body: "These Terms are governed by the laws of The Federal Republic of Nigeria, without regard to its conflict of law principles. You agree to attempt informal resolution of disputes with REVIAI Technologies Limited before initiating legal action. If unresolved, either party may then seek injunctive relief in a court of competent jurisdiction.",
    },
    {
        title: "14. Changes to the Terms",
        body: "We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms within the Service or via email. Your continued use of the Service after such changes constitutes your acceptance of the revised Terms.",
    },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface TermsModalProps {
    visible: boolean;
    onAccept: () => void;
    onDecline: () => void;
}

export default function TermsModal({ visible, onAccept, onDecline }: TermsModalProps) {
    const insets = useSafeAreaInsets();
    const [agreed, setAgreed] = useState(false);
    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
        const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 80;
        if (isNearBottom && !hasScrolledToEnd) {
            setHasScrolledToEnd(true);
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        }
    };

    const handleAccept = () => {
        setAgreed(false);
        setHasScrolledToEnd(false);
        onAccept();
    };

    const handleDecline = () => {
        setAgreed(false);
        setHasScrolledToEnd(false);
        onDecline();
    };

    const canAccept = agreed;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleDecline}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleDecline} />

                <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="document-text" size={20} color={colors.accent} />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>Terms & Conditions</Text>
                            <Text style={styles.subtitle}>Last Updated: 4/3/2026</Text>
                        </View>
                    </View>

                    {/* Scroll hint */}
                    {!hasScrolledToEnd && (
                        <View style={styles.scrollHint}>
                            <Ionicons name="arrow-down-circle-outline" size={14} color={colors.textMuted} />
                            <Text style={styles.scrollHintText}>Scroll to read all terms</Text>
                        </View>
                    )}

                    {/* Content */}
                    <ScrollView
                        style={styles.scroll}
                        showsVerticalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={100}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <Text style={styles.intro}>
                            Welcome to REVIAI, an application provided by REVIAI Technologies Limited. These Terms of Use govern your access to and use of the REVIAI app, including any content, features, and services offered through it. By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, please do not use the Service.
                        </Text>

                        {SECTIONS.map((section) => (
                            <View key={section.title} style={styles.section}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                <Text style={styles.sectionBody}>{section.body}</Text>
                            </View>
                        ))}

                        <Text style={styles.contactNote}>
                            Questions about these Terms? Contact us at{" "}
                            <Text style={styles.contactEmail}>Info@reviai.ai</Text>
                        </Text>
                    </ScrollView>

                    {/* Footer */}
                    <Animated.View style={[styles.footer, { opacity: hasScrolledToEnd ? 1 : 0.4 }]}>
                        {/* Checkbox */}
                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => hasScrolledToEnd && setAgreed((v) => !v)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                                {agreed && <Ionicons name="checkmark" size={13} color={colors.white} />}
                            </View>
                            <Text style={styles.checkboxLabel}>
                                I have read and agree to the{" "}
                                <Text style={styles.checkboxLink}>Terms of Service</Text>
                                {" "}and{" "}
                                <Text style={styles.checkboxLink}>Privacy Policy</Text>
                            </Text>
                        </TouchableOpacity>

                        {/* Buttons */}
                        <View style={styles.buttons}>
                            <TouchableOpacity
                                style={styles.declineButton}
                                onPress={handleDecline}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.declineText}>Decline</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.acceptButton, !canAccept && styles.acceptButtonDisabled]}
                                onPress={canAccept ? handleAccept : undefined}
                                activeOpacity={canAccept ? 0.8 : 1}
                            >
                                <Text style={[styles.acceptText, !canAccept && styles.acceptTextDisabled]}>
                                    Accept & Continue
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </View>
        </Modal>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
    },
    sheet: {
        backgroundColor: "#1A1A1A",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        height: "88%",
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        flexDirection: "column",
    },

    // Handle
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.bgTertiary,
        alignSelf: "center",
        marginBottom: spacing.md,
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: radius.sm,
        backgroundColor: "rgba(0,122,255,0.12)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerText: {
        flex: 1,
    },
    title: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    subtitle: {
        ...typography.caption,
        color: colors.textMuted,
        marginTop: 2,
    },

    // Scroll hint
    scrollHint: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xxs,
        marginBottom: spacing.xs,
    },
    scrollHintText: {
        ...typography.caption,
        color: colors.textMuted,
    },

    // Scroll
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: spacing.md,
        gap: spacing.md,
    },
    intro: {
        ...typography.bodyMd,
        color: colors.textSecondary,
        lineHeight: 22,
        marginBottom: spacing.xs,
    },
    section: {
        gap: spacing.xxs + 2,
    },
    sectionTitle: {
        ...typography.labelLg,
        color: colors.textPrimary,
    },
    sectionBody: {
        ...typography.bodyMd,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    contactNote: {
        ...typography.bodySm,
        color: colors.textTertiary,
        marginTop: spacing.md,
        textAlign: "center",
    },
    contactEmail: {
        color: colors.accent,
    },

    // Footer
    footer: {
        paddingTop: spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        gap: spacing.md,
    },

    // Checkbox
    checkboxRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.sm,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: radius.xs,
        borderWidth: 1.5,
        borderColor: colors.borderLight,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 1,
        flexShrink: 0,
    },
    checkboxChecked: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    checkboxLabel: {
        ...typography.bodyMd,
        color: colors.textSecondary,
        flex: 1,
        lineHeight: 20,
    },
    checkboxLink: {
        color: colors.accent,
    },

    // Buttons
    buttons: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    declineButton: {
        flex: 1,
        height: 48,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    declineText: {
        ...typography.labelLg,
        color: colors.textSecondary,
    },
    acceptButton: {
        flex: 2,
        height: 48,
        borderRadius: radius.md,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
    },
    acceptButtonDisabled: {
        backgroundColor: colors.bgTertiary,
    },
    acceptText: {
        ...typography.labelLg,
        color: colors.white,
    },
    acceptTextDisabled: {
        color: colors.textMuted,
    },
});
