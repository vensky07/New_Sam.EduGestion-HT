import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    checkAllNotifications,
    deleteNotification,
    getNotifications,
    getUnreadCount,
    markAllAsRead,
    markNotificationAsRead,
    saveNotifications
} from "../../hooks/useNotifications";

export default function NotificationsScreen() {
    const router = useRouter();
    
    const [notifications, setNotifications] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Charger les notifications au montage
    useEffect(() => {
        loadNotifications();
        
        // Recharger toutes les 30 secondes
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            const notifs = await getNotifications();
            setNotifications(notifs);
            const count = await getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error("Erreur chargement notifications:", error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        
        // Vérifier les nouvelles notifications
        const newNotifications = await checkAllNotifications();
        if (newNotifications.length > 0) {
            await saveNotifications(newNotifications);
            await loadNotifications();
        }
        
        setRefreshing(false);
    };

    const markAsRead = async (id) => {
        await markNotificationAsRead(id);
        await loadNotifications();
    };

    const deleteNotif = async (id) => {
        Alert.alert(
            "Supprimer la notification",
            "Voulez-vous vraiment supprimer cette notification ?",
            [
                { text: "Annuler", style: "cancel" },
                { 
                    text: "Supprimer", 
                    style: "destructive",
                    onPress: async () => {
                        await deleteNotification(id);
                        await loadNotifications();
                    }
                },
            ]
        );
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;
        
        Alert.alert(
            "Tout marquer comme lu",
            `Marquer ${unreadCount} notification(s) comme lue(s) ?`,
            [
                { text: "Annuler", style: "cancel" },
                { 
                    text: "Marquer comme lu", 
                    onPress: async () => {
                        await markAllAsRead();
                        await loadNotifications();
                    }
                },
            ]
        );
    };

    const navigateToSource = (source, itemId) => {
        if (source === 'paiements') {
            router.push('/paiement');
        } else if (source === 'emploi du temps') {
            router.push('/EmploiTemps');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'course_reminder': return '';
            case 'payment_reminder': return '';
            case 'payment_overdue': return '';
            case 'payment_paid': return '';
            default: return '';
        }
    };

    // Formater la date relative
    const formatRelativeTime = (timestamp) => {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffMs = now - notificationTime;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) return "À l'instant";
        if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
        if (diffHours < 24) return `Il y a ${diffHours} h`;
        if (diffDays === 1) return "Hier";
        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        
        return notificationTime.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Grouper les notifications par date
    const groupNotificationsByDate = () => {
        const groups = {};
        notifications.forEach(notif => {
            const date = new Date(notif.time).toLocaleDateString('fr-FR');
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(notif);
        });
        return groups;
    };

    const notificationGroups = groupNotificationsByDate();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                
                {unreadCount > 0 && (
                    <TouchableOpacity 
                        style={styles.markAllButton}
                        onPress={handleMarkAllAsRead}
                    >
                        <Ionicons name="checkmark-done" size={20} color="#4A6572" />
                        <Text style={styles.markAllText}>Tout lire</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#4A6572"]}
                        tintColor="#4A6572"
                    />
                }
            >
                {/* Liste des notifications groupées par date */}
                {notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off" size={64} color="#CBD5E0" />
                        <Text style={styles.emptyStateTitle}>Aucune notification</Text>
                        <Text style={styles.emptyStateSubtitle}>
                            Vous serez alerté pour vos cours à venir et paiements
                        </Text>
                  
                    </View>
                ) : (
                    <View style={styles.notificationsContainer}>
                        {Object.entries(notificationGroups).map(([date, dayNotifications]) => (
                            <View key={date} style={styles.dayGroup}>
                                <Text style={styles.dayGroupTitle}>{date}</Text>
                                <View style={styles.notificationsList}>
                                    {dayNotifications.map((notification) => (
                                        <View
                                            key={notification.id}
                                            style={[
                                                styles.notificationItem,
                                                !notification.read && styles.notificationUnread
                                            ]}
                                        >
                                            <View style={styles.notificationIcon}>
                                                <Text style={styles.notificationEmoji}>
                                                    {getNotificationIcon(notification.type)}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.notificationContent}
                                                onPress={() => {
                                                    if (!notification.read) {
                                                        markAsRead(notification.id);
                                                    }
                                                    navigateToSource(notification.source, notification.courseId || notification.paymentId);
                                                }}
                                            >
                                                <View style={styles.notificationHeader}>
                                                    <Text style={styles.notificationTitle}>
                                                        {notification.title}
                                                    </Text>
                                                    {notification.priority === 'high' && (
                                                        <View style={styles.urgentBadge}>
                                                            <Ionicons name="alert-circle" size={12} color="#FFF" />
                                                            <Text style={styles.urgentText}>URGENT</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={styles.notificationMessage}>
                                                    {notification.message}
                                                </Text>
                                                <View style={styles.notificationFooter}>
                                                    <Text style={styles.notificationTime}>
                                                        {formatRelativeTime(notification.time)}
                                                    </Text>
                                                    <Text style={styles.notificationSource}>
                                                        {notification.source}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                            <View style={styles.notificationActions}>
                                                {!notification.read && (
                                                    <TouchableOpacity 
                                                        style={styles.readButton}
                                                        onPress={() => markAsRead(notification.id)}
                                                    >
                                                        <Ionicons name="checkmark" size={18} color="#4A6572" />
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity 
                                                    style={styles.deleteButton}
                                                    onPress={() => deleteNotif(notification.id)}
                                                >
                                                    <Ionicons name="trash-outline" size={18} color="#CBD5E0" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Actions rapides */}
                {notifications.length > 0 && (
                    <View style={styles.actionsSection}>
                        <Text style={styles.sectionTitle}>Accès rapide</Text>
                        <View style={styles.actionsGrid}>
                            <TouchableOpacity 
                                style={styles.actionButton}
                                onPress={() => router.push('/paiement')}
                            >
                                <Ionicons name="card" size={24} color="#4A6572" />
                                <Text style={styles.actionText}>Paiements</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.actionButton}
                                onPress={() => router.push('/EmploiTemps')}
                            >
                                <Ionicons name="calendar" size={24} color="#4A6572" />
                                <Text style={styles.actionText}>Emploi du temps</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#F8FAFD" 
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: { 
        fontSize: 24, 
        fontWeight: "700", 
        color: "#2D3748",
        marginRight: 12,
    },
    badge: {
        backgroundColor: '#FF6B6B',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    markAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(74, 101, 114, 0.1)',
    },
    markAllText: {
        color: '#4A6572',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
        marginTop: 20,
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyStateSubtitle: {
        fontSize: 16,
        color: '#718096',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    emptyStateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4A6572',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    emptyStateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    notificationsContainer: {
        gap: 24,
    },
    dayGroup: {
        gap: 12,
    },
    dayGroupTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
        paddingHorizontal: 8,
        marginBottom: 8,
    },
    notificationsList: {
        gap: 8,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        elevation: 2,
    },
    notificationUnread: {
        backgroundColor: 'rgba(74, 101, 114, 0.05)',
        borderLeftWidth: 4,
        borderLeftColor: '#4A6572',
    },
    notificationIcon: {
        marginRight: 12,
    },
    notificationEmoji: {
        fontSize: 20,
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        flex: 1,
        marginRight: 8,
    },
    urgentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    urgentText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#718096',
        lineHeight: 20,
        marginBottom: 12,
    },
    notificationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notificationTime: {
        fontSize: 12,
        color: '#A0AEC0',
        fontWeight: '500',
    },
    notificationSource: {
        fontSize: 11,
        color: '#4A6572',
        backgroundColor: 'rgba(74, 101, 114, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        fontWeight: '600',
    },
    notificationActions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 12,
    },
    readButton: {
        padding: 8,
        backgroundColor: 'rgba(74, 101, 114, 0.1)',
        borderRadius: 6,
    },
    deleteButton: {
        padding: 8,
        backgroundColor: 'rgba(203, 213, 224, 0.2)',
        borderRadius: 6,
    },
    actionsSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        marginTop: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 16,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(74, 101, 114, 0.1)',
        borderRadius: 8,
        gap: 8,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A6572',
        textAlign: 'center',
    },
});