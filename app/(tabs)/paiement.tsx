import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { checkUpcomingPayments, createPaymentPaidNotification, saveNotifications } from "../../hooks/useNotifications";

const PAYMENTS_STORAGE_KEY = "@edugestion_payments_v1";

type Payment = {
    id: string;
    title: string;
    amount: string;
    dueDate: string;
    status: 'paid' | 'pending' | 'overdue';
    type: 'tuition' | 'registration' | 'library' | 'other';
};

export default function PaymentsScreen() {
    const router = useRouter();
    
    const [payments, setPayments] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPayment, setNewPayment] = useState({
        title: '',
        amount: '',
        dueDate: '',
        type: 'tuition'
    });

    // Charger les paiements
    useEffect(() => {
        loadPayments();
        const interval = startPaymentChecker();
        return () => clearInterval(interval);
    }, []);

    const loadPayments = async () => {
        try {
            const stored = await AsyncStorage.getItem(PAYMENTS_STORAGE_KEY);
            if (stored) {
                setPayments(JSON.parse(stored));
            } else {
                // Données par défaut
                const defaultPayments = [
                    {
                        id: '1',
                        title: 'Frais de scolarité',
                        amount: '450000',
                        dueDate: '2024-09-15',
                        status: 'pending',
                        type: 'tuition'
                    },
                    {
                        id: '2',
                        title: 'Frais d\'inscription',
                        amount: '75000',
                        dueDate: '2024-09-05',
                        status: 'paid',
                        type: 'registration'
                    },
                    {
                        id: '3',
                        title: 'Frais de bibliothèque',
                        amount: '25000',
                        dueDate: '2024-08-10',
                        status: 'overdue',
                        type: 'library'
                    }
                ];
                setPayments(defaultPayments);
                await AsyncStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(defaultPayments));
            }
        } catch (error) {
            console.error("Erreur chargement paiements:", error);
        }
    };

    // Vérifier périodiquement les paiements à venir
    const startPaymentChecker = () => {
        const interval = setInterval(async () => {
            try {
                const upcoming = await checkUpcomingPayments();
                if (upcoming.length > 0) {
                    await saveNotifications(upcoming);
                }
            } catch (error) {
                console.error("Erreur vérification paiements:", error);
            }
        }, 60000);

        return interval;
    };

    // Sauvegarder les paiements
    const savePayments = async (newPayments) => {
        try {
            setPayments(newPayments);
            await AsyncStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(newPayments));
            
            // Vérifier les notifications après sauvegarde
            setTimeout(async () => {
                const upcoming = await checkUpcomingPayments();
                if (upcoming.length > 0) {
                    await saveNotifications(upcoming);
                }
            }, 1000);
        } catch (error) {
            console.error("Erreur sauvegarde paiements:", error);
            Alert.alert("Erreur", "Impossible de sauvegarder les paiements");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return '#1DD1A1';
            case 'pending': return '#FF9F43';
            case 'overdue': return '#FF6B6B';
            default: return '#718096';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'paid': return 'Payé';
            case 'pending': return 'En attente';
            case 'overdue': return 'En retard';
            default: return 'Inconnu';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'tuition': return 'school';
            case 'registration': return 'document-text';
            case 'library': return 'library';
            case 'other': return 'card';
            default: return 'card';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'tuition': return '#4A6572';
            case 'registration': return '#FF9F43';
            case 'library': return '#48DBFB';
            case 'other': return '#1DD1A1';
            default: return '#718096';
        }
    };

    const markAsPaid = async (id) => {
        const updatedPayments = payments.map(payment => 
            payment.id === id ? { ...payment, status: 'paid' } : payment
        );
        
        await savePayments(updatedPayments);
        
        // Créer une notification de paiement effectué
        const paidPayment = updatedPayments.find(p => p.id === id);
        if (paidPayment) {
            await createPaymentPaidNotification(paidPayment);
        }
        
        Alert.alert("Succès", "Paiement marqué comme payé");
    };

    const addPayment = () => {
        if (!newPayment.title || !newPayment.amount || !newPayment.dueDate) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs");
            return;
        }

        const payment = {
            id: Date.now().toString(),
            title: newPayment.title,
            amount: newPayment.amount.replace(/\D/g, ''),
            dueDate: newPayment.dueDate,
            status: 'pending',
            type: newPayment.type
        };

        const updatedPayments = [payment, ...payments];
        savePayments(updatedPayments);
        
        setNewPayment({ title: '', amount: '', dueDate: '', type: 'tuition' });
        setShowAddModal(false);
        Alert.alert("Succès", "Paiement ajouté avec succès");
    };

    const deletePayment = (id) => {
        Alert.alert(
            "Supprimer le paiement",
            "Êtes-vous sûr de vouloir supprimer ce paiement ?",
            [
                { text: "Annuler", style: "cancel" },
                { 
                    text: "Supprimer", 
                    style: "destructive",
                    onPress: () => {
                        const updatedPayments = payments.filter(payment => payment.id !== id);
                        savePayments(updatedPayments);
                    }
                }
            ]
        );
    };

    const formatAmount = (amount) => {
        return parseInt(amount).toLocaleString('fr-FR') + ' FCFA';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getTotalPending = () => {
        const total = payments
            .filter(p => p.status === 'pending')
            .reduce((total, p) => total + parseInt(p.amount), 0);
        return formatAmount(total);
    };

    const getTotalOverdue = () => {
        const total = payments
            .filter(p => p.status === 'overdue')
            .reduce((total, p) => total + parseInt(p.amount), 0);
        return formatAmount(total);
    };

    const getDaysUntilDue = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);
        const diffTime = due - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getDueDateColor = (dueDate, status) => {
        if (status === 'paid') return '#1DD1A1';
        if (status === 'overdue') return '#FF6B6B';
        
        const daysUntil = getDaysUntilDue(dueDate);
        if (daysUntil <= 3) return '#FF6B6B';
        if (daysUntil <= 7) return '#FF9F43';
        return '#718096';
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Paiements</Text>
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="add" size={24} color="#4A6572" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Résumé */}
                <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>Résumé des paiements</Text>
                    <View style={styles.summaryCards}>
                        <View style={styles.summaryCard}>
                            <Ionicons name="time" size={24} color="#FF9F43" />
                            <Text style={styles.summaryAmount}>{getTotalPending()}</Text>
                            <Text style={styles.summaryLabel}>En attente</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Ionicons name="alert-circle" size={24} color="#FF6B6B" />
                            <Text style={styles.summaryAmount}>{getTotalOverdue()}</Text>
                            <Text style={styles.summaryLabel}>En retard</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Ionicons name="checkmark-circle" size={24} color="#1DD1A1" />
                            <Text style={styles.summaryAmount}>
                                {payments.filter(p => p.status === 'paid').length}
                            </Text>
                            <Text style={styles.summaryLabel}>Payés</Text>
                        </View>
                    </View>
                </View>

                {/* Alertes importantes */}
                {payments.some(p => p.status === 'overdue' || getDaysUntilDue(p.dueDate) <= 3) && (
                    <View style={styles.alertSection}>
                        <Ionicons name="warning" size={20} color="#FF6B6B" />
                        <Text style={styles.alertText}>
                            Vous avez des paiements urgents nécessitant votre attention
                        </Text>
                    </View>
                )}

                {/* Liste des paiements */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Mes paiements</Text>
                        <Text style={styles.paymentsCount}>
                            {payments.length} paiement(s)
                        </Text>
                    </View>

                    {payments.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="card" size={64} color="#CBD5E0" />
                            <Text style={styles.emptyStateTitle}>Aucun paiement</Text>
                            <Text style={styles.emptyStateSubtitle}>
                                Ajoutez vos premiers paiements académiques
                            </Text>
                            <TouchableOpacity 
                                style={styles.emptyStateButton}
                                onPress={() => setShowAddModal(true)}
                            >
                                <Ionicons name="add" size={20} color="#FFF" />
                                <Text style={styles.emptyStateButtonText}>Ajouter un paiement</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.paymentsList}>
                            {payments.map((payment) => {
                                const daysUntil = getDaysUntilDue(payment.dueDate);
                                const isUrgent = payment.status === 'overdue' || (payment.status === 'pending' && daysUntil <= 3);
                                
                                return (
                                    <View
                                        key={payment.id}
                                        style={[
                                            styles.paymentItem,
                                            isUrgent && styles.paymentItemUrgent
                                        ]}
                                    >
                                        <View style={[styles.paymentIcon, { backgroundColor: getTypeColor(payment.type) + '20' }]}>
                                            <Ionicons 
                                                name={getTypeIcon(payment.type)} 
                                                size={20} 
                                                color={getTypeColor(payment.type)} 
                                            />
                                        </View>
                                        <View style={styles.paymentContent}>
                                            <Text style={styles.paymentTitle}>
                                                {payment.title}
                                            </Text>
                                            <Text style={styles.paymentAmount}>
                                                {formatAmount(payment.amount)}
                                            </Text>
                                            <View style={styles.paymentDateRow}>
                                                <Ionicons name="calendar" size={12} color="#718096" />
                                                <Text style={[styles.paymentDate, { color: getDueDateColor(payment.dueDate, payment.status) }]}>
                                                    Échéance: {formatDate(payment.dueDate)}
                                                    {payment.status === 'pending' && daysUntil >= 0 && (
                                                        <Text style={styles.daysText}> ({daysUntil} jour{daysUntil !== 1 ? 's' : ''})</Text>
                                                    )}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.paymentActions}>
                                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                                                <Text style={styles.statusText}>
                                                    {getStatusText(payment.status)}
                                                </Text>
                                            </View>
                                            <View style={styles.actionButtons}>
                                                {payment.status !== 'paid' && (
                                                    <TouchableOpacity 
                                                        style={styles.payButton}
                                                        onPress={() => markAsPaid(payment.id)}
                                                    >
                                                        <Ionicons name="checkmark" size={16} color="#1DD1A1" />
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity 
                                                    style={styles.deleteButton}
                                                    onPress={() => deletePayment(payment.id)}
                                                >
                                                    <Ionicons name="trash" size={16} color="#CBD5E0" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Instructions */}
                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>💡 Comment utiliser</Text>
                    <Text style={styles.infoText}>
                        • Ajoutez tous vos paiements académiques{"\n"}
                        • Marquez-les comme payés une fois réglés{"\n"}
                        • Consultez les montants en attente{"\n"}
                        • Recevez des alertes avant les échéances{"\n"}
                        • Ne manquez plus aucun paiement
                    </Text>
                </View>
            </ScrollView>

            {/* Modal d'ajout */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nouveau paiement</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Type de paiement</Text>
                            <View style={styles.typeButtons}>
                                {[
                                    { value: 'tuition', label: 'Scolarité', icon: 'school' },
                                    { value: 'registration', label: 'Inscription', icon: 'document-text' },
                                    { value: 'library', label: 'Bibliothèque', icon: 'library' },
                                    { value: 'other', label: 'Autre', icon: 'card' }
                                ].map((type) => (
                                    <TouchableOpacity
                                        key={type.value}
                                        style={[
                                            styles.typeButton,
                                            newPayment.type === type.value && styles.typeButtonSelected
                                        ]}
                                        onPress={() => setNewPayment(prev => ({ ...prev, type: type.value }))}
                                    >
                                        <Ionicons 
                                            name={type.icon} 
                                            size={16} 
                                            color={newPayment.type === type.value ? '#FFF' : '#4A6572'} 
                                        />
                                        <Text style={[
                                            styles.typeButtonText,
                                            newPayment.type === type.value && styles.typeButtonTextSelected
                                        ]}>
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Titre du paiement *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: Frais de scolarité semestre 1"
                                value={newPayment.title}
                                onChangeText={(text) => setNewPayment(prev => ({ ...prev, title: text }))}
                            />

                            <Text style={styles.inputLabel}>Montant (FCFA) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: 450000"
                                value={newPayment.amount}
                                onChangeText={(text) => setNewPayment(prev => ({ ...prev, amount: text }))}
                                keyboardType="numeric"
                            />

                            <Text style={styles.inputLabel}>Date d'échéance *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="AAAA-MM-JJ (Ex: 2024-09-15)"
                                value={newPayment.dueDate}
                                onChangeText={(text) => setNewPayment(prev => ({ ...prev, dueDate: text }))}
                            />
                            <Text style={styles.inputHelp}>
                                Format: Année-Mois-Jour (Ex: 2024-12-31)
                            </Text>

                            <TouchableOpacity 
                                style={[
                                    styles.addPaymentButton,
                                    (!newPayment.title || !newPayment.amount || !newPayment.dueDate) && styles.addPaymentButtonDisabled
                                ]} 
                                onPress={addPayment}
                                disabled={!newPayment.title || !newPayment.amount || !newPayment.dueDate}
                            >
                                <Ionicons name="add-circle" size={20} color="#FFF" />
                                <Text style={styles.addPaymentButtonText}>Ajouter le paiement</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    headerTitle: { 
        fontSize: 24, 
        fontWeight: "700", 
        color: "#2D3748",
    },
    addButton: {
        padding: 8,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    summarySection: {
        marginBottom: 16,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
    },
    paymentsCount: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '500',
    },
    summaryCards: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    summaryAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
        marginVertical: 8,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#718096',
        fontWeight: '500',
    },
    alertSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    alertText: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: '500',
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3748',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: '#718096',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
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
    paymentsList: {
        gap: 12,
    },
    paymentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: 'transparent',
    },
    paymentItemUrgent: {
        backgroundColor: 'rgba(255, 107, 107, 0.05)',
        borderLeftColor: '#FF6B6B',
    },
    paymentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    paymentContent: {
        flex: 1,
    },
    paymentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 4,
    },
    paymentAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4A6572',
        marginBottom: 6,
    },
    paymentDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    paymentDate: {
        fontSize: 12,
        fontWeight: '500',
    },
    daysText: {
        fontSize: 11,
        fontStyle: 'italic',
    },
    paymentActions: {
        alignItems: 'flex-end',
        gap: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    payButton: {
        padding: 6,
        backgroundColor: 'rgba(29, 209, 161, 0.1)',
        borderRadius: 6,
    },
    deleteButton: {
        padding: 6,
        backgroundColor: 'rgba(203, 213, 224, 0.2)',
        borderRadius: 6,
    },
    infoSection: {
        backgroundColor: 'rgba(74, 101, 114, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#718096',
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        maxHeight: '90%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
    },
    modalForm: {
        padding: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 8,
    },
    inputHelp: {
        fontSize: 12,
        color: '#718096',
        marginTop: 4,
        marginBottom: 16,
        fontStyle: 'italic',
    },
    typeButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    typeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F7FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 6,
    },
    typeButtonSelected: {
        backgroundColor: '#4A6572',
        borderColor: '#4A6572',
    },
    typeButtonText: {
        fontSize: 12,
        color: '#718096',
        fontWeight: '500',
    },
    typeButtonTextSelected: {
        color: '#FFFFFF',
    },
    input: {
        backgroundColor: '#F7FAFC',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        fontSize: 16,
        marginBottom: 16,
    },
    addPaymentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4A6572',
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
        shadowColor: "#4A6572",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    addPaymentButtonDisabled: {
        backgroundColor: '#CBD5E0',
        shadowOpacity: 0,
        elevation: 0,
    },
    addPaymentButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});