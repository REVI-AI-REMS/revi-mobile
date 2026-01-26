import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";

interface SuccessModalProps {
    visible: boolean;
    message?: string;
    onClose?: () => void;
}

export default function SuccessModal({
    visible,
    message = "Report successful",
    onClose,
}: SuccessModalProps) {
    useEffect(() => {
        if (visible && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, 2000); // Auto close after 2 seconds
            return () => clearTimeout(timer);
        }
    }, [visible, onClose]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        {/* Using a gradient-like setup or just a nice color */}
                        <Ionicons name="shield-checkmark" size={48} color="#A855F7" />
                    </View>
                    <Text style={styles.text}>{message}</Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        backgroundColor: "#1C1C1E",
        borderRadius: 20,
        padding: 32,
        alignItems: "center",
        minWidth: 200,
    },
    iconContainer: {
        marginBottom: 16,
        // Add shadow/glow effect if possible
        shadowColor: "#A855F7",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    text: {
        color: "#FFF",
        fontFamily: Fonts.medium,
        fontSize: 16,
        textAlign: "center",
    },
});
