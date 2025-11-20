import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const USERS_STORAGE_KEY = "@edugestion_users";
const CURRENT_USER_KEY = "@edugestion_current_user";
const USER_SETTINGS_KEY = "@edugestion_user_settings";

export default function SignupScreen() {
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // États pour le formulaire
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentClass, setStudentClass] = useState("");
  
  // États pour la visibilité du mot de passe
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Générer un ID unique simple pour l'utilisateur
  const generateUserId = () => {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Valider l'email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Valider le mot de passe
  const isValidPassword = (password) => {
    return password.length >= 6;
  };

  // Inscription
  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Erreur", "Veuillez saisir votre nom et prénom");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Erreur", "Veuillez saisir un email valide");
      return;
    }

    if (!isValidPassword(password)) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users = existingUsers ? JSON.parse(existingUsers) : {};

      if (users[email.toLowerCase()]) {
        Alert.alert("Erreur", "Un compte avec cet email existe déjà");
        setLoading(false);
        return;
      }

      // Créer le nouvel utilisateur avec les mêmes champs que le profil attend
      const newUser = {
        id: generateUserId(),
        email: email.toLowerCase(),
        password: password, // Stockage en clair (pour la démo - à hasher en production)
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        studentId: studentId.trim(),
        class: studentClass.trim(),
        createdAt: new Date().toISOString(),
        storageKey: `@edugestion_${generateUserId()}_data`
      };

      // Sauvegarder l'utilisateur
      users[email.toLowerCase()] = newUser;
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

      // Créer les paramètres par défaut pour l'utilisateur
      const defaultSettings = {
        darkMode: false,
        notifications: true,
        autoSave: true,
        syncData: false,
        lastUpdated: new Date().toISOString()
      };
      await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(defaultSettings));

      // Connecter automatiquement l'utilisateur
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

      Alert.alert(
        "Succès", 
        "Compte créé avec succès!",
        [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
      );

    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la création du compte");
    } finally {
      setLoading(false);
    }
  };

  // Connexion
  const handleLogin = async () => {
    if (!isValidEmail(email)) {
      Alert.alert("Erreur", "Veuillez saisir un email valide");
      return;
    }

    if (!password) {
      Alert.alert("Erreur", "Veuillez saisir votre mot de passe");
      return;
    }

    setLoading(true);

    try {
      // Récupérer les utilisateurs
      const existingUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users = existingUsers ? JSON.parse(existingUsers) : {};

      const user = users[email.toLowerCase()];

      if (!user) {
        Alert.alert("Erreur", "Aucun compte trouvé avec cet email");
        setLoading(false);
        return;
      }

      // Vérifier le mot de passe (en clair pour la démo)
      if (user.password !== password) {
        Alert.alert("Erreur", "Mot de passe incorrect");
        setLoading(false);
        return;
      }

      // Connecter l'utilisateur
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

      Alert.alert(
        "Succès", 
        "Connexion réussie!",
        [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
      );

    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setStudentId("");
    setStudentClass("");
  };

  const toggleMode = () => {
    resetForm();
    setIsLogin(!isLogin);
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Mot de passe oublié",
      "Une procédure de réinitialisation sera bientôt disponible.",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header avec logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Ionicons name="school" size={32} color="#4A6572" />
              </View>
            </View>
            <Text style={styles.headerTitle}>EduGestion</Text>
            <Text style={styles.headerSubtitle}>
              {isLogin ? "Content de vous revoir !" : "Créez votre compte étudiant"}
            </Text>
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            {!isLogin && (
              <>
                {/* Nom et Prénom */}
                <View style={styles.nameRow}>
                  <View style={styles.nameInput}>
                    <Text style={styles.inputLabel}>Prénom *</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        placeholder="Votre prénom"
                        value={firstName}
                        onChangeText={setFirstName}
                        style={styles.inputWithIcon}
                        placeholderTextColor="#999"
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                  <View style={styles.nameInput}>
                    <Text style={styles.inputLabel}>Nom *</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        placeholder="Votre nom"
                        value={lastName}
                        onChangeText={setLastName}
                        style={styles.inputWithIcon}
                        placeholderTextColor="#999"
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                </View>

                {/* Numéro étudiant */}
                <Text style={styles.inputLabel}>Numéro étudiant</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="id-card-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Ex: ETU123456"
                    value={studentId}
                    onChangeText={setStudentId}
                    style={styles.inputWithIcon}
                    placeholderTextColor="#999"
                    autoCapitalize="characters"
                  />
                </View>

                {/* Classe/Filière */}
                <Text style={styles.inputLabel}>Classe/Filière</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Ex: Terminale S"
                    value={studentClass}
                    onChangeText={setStudentClass}
                    style={styles.inputWithIcon}
                    placeholderTextColor="#999"
                  />
                </View>
              </>
            )}

            {/* Email */}
            <Text style={styles.inputLabel}>Email *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                style={styles.inputWithIcon}
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            {/* Mot de passe */}
            <Text style={styles.inputLabel}>Mot de passe *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                placeholder={isLogin ? "Votre mot de passe" : "Au moins 6 caractères"}
                value={password}
                onChangeText={setPassword}
                style={styles.inputWithIcon}
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            {/* Confirmation mot de passe (inscription seulement) */}
            {!isLogin && (
              <>
                <Text style={styles.inputLabel}>Confirmer le mot de passe *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={styles.inputWithIcon}
                    placeholderTextColor="#999"
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Mot de passe oublié (connexion seulement) */}
            {isLogin && (
              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            )}

            {/* Bouton de connexion/inscription */}
            <TouchableOpacity 
              style={[
                styles.primaryButton,
                loading && styles.primaryButtonDisabled
              ]}
              onPress={isLogin ? handleLogin : handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isLogin ? "Se connecter" : "Créer mon compte"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Ligne séparatrice */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Lien pour changer de mode */}
            <View style={styles.switchModeContainer}>
              <Text style={styles.switchModeText}>
                {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
              </Text>
              <TouchableOpacity onPress={toggleMode}>
                <Text style={styles.switchModeLink}>
                  {isLogin ? "S'inscrire" : "Se connecter"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Informations de sécurité */}
            <View style={styles.securityInfo}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#4A6572" />
              <Text style={styles.securityText}>
                Vos données sont sécurisées et stockées localement
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFD" 
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 101, 114, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: { 
    fontSize: 32, 
    fontWeight: "800", 
    color: "#4A6572",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#718096",
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  nameInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    paddingHorizontal: 16,
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2D3748',
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4A6572',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: "#4A6572",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: "#4A6572",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#718096',
    fontSize: 14,
    fontWeight: '500',
  },
  switchModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  switchModeText: {
    fontSize: 14,
    color: '#718096',
  },
  switchModeLink: {
    fontSize: 14,
    color: '#4A6572',
    fontWeight: '600',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74, 101, 114, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 'auto',
  },
  securityText: {
    fontSize: 12,
    color: '#4A6572',
    marginLeft: 8,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
});