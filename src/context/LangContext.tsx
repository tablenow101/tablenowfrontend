import React, { createContext, useContext, useState } from 'react';

export type Lang = 'fr' | 'en';

interface LangContextValue {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: (key: string) => string;
}

// ─── Translations ─────────────────────────────────────────────────────────────

const translations: Record<Lang, Record<string, string>> = {
    fr: {
        // Nav
        navDashboard: 'Dashboard', navReservations: 'Réservations', navCalls: 'Appels',
        navSettings: 'Paramètres', iaActive: 'IA ACTIVE', logout: 'Déconnexion',
        // Auth
        tagline: 'Your Restaurant Host(ess) 24/7',
        loginTitle: 'Connexion', loginSub: 'Accédez à votre espace TableNow',
        loginBtn: 'Se connecter', googleBtn: 'Continuer avec Google',
        noAccount: 'Pas encore de compte ?', createAccount: 'Créer votre compte →',
        email: 'E-MAIL', password: 'MOT DE PASSE', remember: 'Se souvenir de moi',
        forgot: 'Mot de passe oublié ?',
        registerTitle: 'Créer votre compte', registerSub: 'Essai 7 jours gratuits · Résiliable à tout moment',
        createBtn: 'Créer mon compte →', alreadyAccount: 'Déjà un compte ?', loginLink: 'Se connecter',
        manager: 'RESPONSABLE *', confirm: 'CONFIRMER *', phone: 'TÉLÉPHONE', cuisine: 'TYPE DE CUISINE',
        address: 'ADRESSE', websiteLabel: 'SITE WEB',
        websiteHint: "Nous l'analysons pour mieux configurer votre assistant IA",
        restaurantLabel: 'RESTAURANT *',
        restaurantHint: 'Tapez le nom — nous remplissons tout automatiquement via Google Places',
        yourInfo: 'VOS INFORMATIONS',
        // Verify
        verifyTitle: 'Vérifiez votre email',
        verifySent: 'Un lien de vérification a été envoyé à',
        onceActive: 'UNE FOIS ACTIVÉ',
        verifyBullet1: 'Votre assistant IA est configuré selon les standards de votre établissement',
        verifyBullet2: 'Une ligne téléphonique dédiée vous est attribuée',
        verifyBullet3: 'Une adresse BCC privée est créée pour centraliser vos réservations (Zenchef, SevenRooms…)',
        verifyBtn: "J'ai vérifié mon email →",
        notReceived: 'Pas reçu ? Vérifiez vos spams ou', resend: "renvoyez l'email",
        // Dashboard
        greeting_morning: 'Bonjour', greeting_afternoon: 'Bon après-midi', greeting_evening: 'Bonsoir',
        heroSub: 'Votre assistant a traité {calls} appels et confirmé {resas} réservations aujourd\'hui',
        today: "Auj.", all: 'Tout',
        sectionActivity: 'ACTIVITÉ', sectionAnalysis: 'ANALYSE',
        callsHandled: 'Appels traités', callsDesc: "Appels reçus et gérés par l'assistant",
        reservations: 'Réservations', confirmed: 'confirmées', cancelled: 'annulées',
        covers: 'Couverts', coversDesc: 'Moyenne {avg} par réservation',
        conversion: 'Conversion', conversionDesc: 'Appels transformés en réservations',
        fillRate: 'Remplissage', fillRateDesc: 'Créneau le plus faible : {slot}',
        unplaced: 'Demandes non placées', unplacedDesc: 'Pic à {time}',
        abandoned: 'Demandes abandonnées',
        bestSlot: 'Créneau à valoriser', bestSlotDesc: 'Disponibilités ouvertes',
        latestCalls: 'DERNIERS APPELS', nextResa: 'PROCHAINES RÉSERVATIONS',
        seeAll: 'Voir tout →',
        // Reservations
        resaPageTitle: 'Réservations', resaPageSub: 'Cliquez sur une ligne pour les détails et le transcript',
        all2: 'Toutes', total: 'Total', resasDesc: 'Réservations sur la période',
        tablesSecured: 'Tables assurées', slotsFreed: 'Places libérées', expected: 'Personnes attendues',
        client: 'CLIENT', date: 'DATE', time: 'HEURE', status: 'STATUT', cancel: 'Annuler',
        noResas: 'Aucune réservation trouvée',
        // Calls
        callsTitle: 'Journal des appels',
        callsSub: "Cliquez sur un appel pour écouter l'enregistrement et télécharger le transcript",
        callsReceived: 'Appels reçus', completed: 'Terminés', successfulDesc: 'Traités avec succès',
        avgDuration: 'Durée moyenne', perCall: 'par appel', totalDuration: 'Durée totale', conversations: 'de conversations',
        history: 'HISTORIQUE',
        statusCompleted: 'Terminé', statusMissed: 'Manqué', statusFailed: 'Non abouti',
        resaCreated: '✓ Résa créée',
        // Settings
        settingsTitle: 'Paramètres', subGeneral: 'Général', subHours: 'Horaires & Services',
        subIntegrations: 'Intégrations', subParrainage: 'Parrainage',
        restaurantInfo: 'Informations du restaurant', restaurantName: 'Nom du restaurant', website: 'Site web',
        aiNotes: "Notes & commentaires pour l'IA",
        aiNotesDesc: "Transmises à l'assistant pour personnaliser les réponses (allergies, demandes spéciales, politique maison…)",
        save: 'Sauvegarder',
        hoursDesc: "Cochez les jours d'ouverture. Ajoutez autant de services que nécessaire par ligne.",
        add: 'Ajouter', closed: 'Fermé',
        calDesc: 'Événements automatiques à chaque réservation.',
        notConnected: 'Non connecté', connectCal: 'Connecter Google Agenda',
        notifications: 'Notifications', confirmEmail: 'Email de confirmation des réservations',
        cancelPolicy: "Politique d'annulation",
        identifiers: 'Identifiants système', readOnly: 'Lecture seule — gérés automatiquement par TableNow.',
        tableNowNumber: 'Numéro TableNow', copy: 'Copier',
        referralProgram: 'PROGRAMME PARRAINAGE',
        referralTitle: 'Parrainez un restaurant, gagnez 100 minutes offertes',
        referralSub: 'Valables sur votre forfait · cumulables · sans limite',
        yourCode: 'VOTRE CODE PARRAIN', shareLink: 'Partager le lien →',
        myProgram: 'Mon programme', historyTab: 'Historique',
        activeReferrals: 'FILLEULS ACTIFS', pending: 'EN ATTENTE', earned: 'MINUTES GAGNÉES',
        // Drawers
        resaDetails: 'Détails réservation', associatedCall: 'APPEL ASSOCIÉ',
        transcript: 'TRANSCRIPT', downloadTranscript: '⬇ Télécharger transcript (.txt)',
        downloadAudio: '⬇ Télécharger audio', cancelResa: 'Annuler la réservation',
        callDetails: "Détails de l'appel", audioRecording: 'ENREGISTREMENT AUDIO',
        duration: 'DURÉE', download: '⬇ Télécharger',
        noTranscript: 'Aucun transcript disponible pour cet appel.',
    },
    en: {
        navDashboard: 'Dashboard', navReservations: 'Reservations', navCalls: 'Calls',
        navSettings: 'Settings', iaActive: 'AI ACTIVE', logout: 'Sign out',
        tagline: 'Your Restaurant Host(ess) 24/7',
        loginTitle: 'Sign in', loginSub: 'Access your TableNow workspace',
        loginBtn: 'Sign in', googleBtn: 'Continue with Google',
        noAccount: 'No account yet?', createAccount: 'Create your account →',
        email: 'EMAIL', password: 'PASSWORD', remember: 'Remember me',
        forgot: 'Forgot password?',
        registerTitle: 'Create your account', registerSub: '7-day free trial · Cancel anytime',
        createBtn: 'Create my account →', alreadyAccount: 'Already have an account?', loginLink: 'Sign in',
        manager: 'MANAGER *', confirm: 'CONFIRM *', phone: 'PHONE', cuisine: 'CUISINE TYPE',
        address: 'ADDRESS', websiteLabel: 'WEBSITE',
        websiteHint: 'We analyse it to better configure your AI assistant',
        restaurantLabel: 'RESTAURANT *',
        restaurantHint: 'Type the name — we fill everything in automatically via Google Places',
        yourInfo: 'YOUR INFORMATION',
        verifyTitle: 'Check your email',
        verifySent: 'A verification link was sent to',
        onceActive: 'ONCE ACTIVATED',
        verifyBullet1: 'Your AI assistant is configured to your establishment standards',
        verifyBullet2: 'A dedicated phone line is assigned to you',
        verifyBullet3: 'A private BCC address is created to centralise your reservations (Zenchef, SevenRooms…)',
        verifyBtn: 'I verified my email →',
        notReceived: "Didn't receive it? Check spam or", resend: 'resend the email',
        greeting_morning: 'Good morning', greeting_afternoon: 'Good afternoon', greeting_evening: 'Good evening',
        heroSub: 'Your assistant handled {calls} calls and confirmed {resas} reservations today',
        today: 'Today', all: 'All',
        sectionActivity: 'ACTIVITY', sectionAnalysis: 'ANALYSIS',
        callsHandled: 'Calls handled', callsDesc: 'Calls received and managed by the assistant',
        reservations: 'Reservations', confirmed: 'confirmed', cancelled: 'cancelled',
        covers: 'Covers', coversDesc: 'Average {avg} per reservation',
        conversion: 'Conversion', conversionDesc: 'Calls turned into reservations',
        fillRate: 'Occupancy', fillRateDesc: 'Lowest slot: {slot}',
        unplaced: 'Unplaced requests', unplacedDesc: 'Peak at {time}',
        abandoned: 'Abandoned requests',
        bestSlot: 'Slot to promote', bestSlotDesc: 'Availability open',
        latestCalls: 'RECENT CALLS', nextResa: 'UPCOMING RESERVATIONS',
        seeAll: 'See all →',
        resaPageTitle: 'Reservations', resaPageSub: 'Click a row for details and call transcript',
        all2: 'All', total: 'Total', resasDesc: 'Reservations for the period',
        tablesSecured: 'Tables secured', slotsFreed: 'Slots freed', expected: 'Expected guests',
        client: 'GUEST', date: 'DATE', time: 'TIME', status: 'STATUS', cancel: 'Cancel',
        noResas: 'No reservations found',
        callsTitle: 'Call log',
        callsSub: 'Click a call to listen to the recording and download the transcript',
        callsReceived: 'Calls received', completed: 'Completed', successfulDesc: 'Successfully handled',
        avgDuration: 'Avg duration', perCall: 'per call', totalDuration: 'Total duration', conversations: 'of conversations',
        history: 'HISTORY',
        statusCompleted: 'Completed', statusMissed: 'Missed', statusFailed: 'Failed',
        resaCreated: '✓ Reservation created',
        settingsTitle: 'Settings', subGeneral: 'General', subHours: 'Hours & Services',
        subIntegrations: 'Integrations', subParrainage: 'Referral',
        restaurantInfo: 'Restaurant information', restaurantName: 'Restaurant name', website: 'Website',
        aiNotes: 'Notes & comments for AI',
        aiNotesDesc: 'Shared with the assistant to personalise responses (allergies, special requests, house policy…)',
        save: 'Save',
        hoursDesc: 'Check open days. Add as many services per line as needed.',
        add: 'Add', closed: 'Closed',
        calDesc: 'Automatic events for each reservation.',
        notConnected: 'Not connected', connectCal: 'Connect Google Calendar',
        notifications: 'Notifications', confirmEmail: 'Reservation confirmation email',
        cancelPolicy: 'Cancellation policy',
        identifiers: 'System identifiers', readOnly: 'Read only — managed automatically by TableNow.',
        tableNowNumber: 'TableNow number', copy: 'Copy',
        referralProgram: 'REFERRAL PROGRAMME',
        referralTitle: 'Refer a restaurant, earn 100 free minutes',
        referralSub: 'Count toward your plan · stackable · unlimited',
        yourCode: 'YOUR REFERRAL CODE', shareLink: 'Share the link →',
        myProgram: 'My programme', historyTab: 'History',
        activeReferrals: 'ACTIVE REFERRALS', pending: 'PENDING', earned: 'MINUTES EARNED',
        resaDetails: 'Reservation details', associatedCall: 'ASSOCIATED CALL',
        transcript: 'TRANSCRIPT', downloadTranscript: '⬇ Download transcript (.txt)',
        downloadAudio: '⬇ Download audio', cancelResa: 'Cancel reservation',
        callDetails: 'Call details', audioRecording: 'AUDIO RECORDING',
        duration: 'DURATION', download: '⬇ Download',
        noTranscript: 'No transcript available for this call.',
    },
};

// ─── Context ──────────────────────────────────────────────────────────────────

const LangContext = createContext<LangContextValue>({
    lang: 'fr',
    setLang: () => {},
    t: (k) => k,
});

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<Lang>(() => {
        const stored = localStorage.getItem('lang');
        if (stored === 'fr' || stored === 'en') return stored;
        // Default FR — TableNow est un produit français
        return 'fr';
    });

    const setLang = (l: Lang) => {
        localStorage.setItem('lang', l);
        setLangState(l);
    };

    const t = (key: string): string => translations[lang][key] ?? translations['fr'][key] ?? key;

    return (
        <LangContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LangContext.Provider>
    );
};

export const useLang = () => useContext(LangContext);
