import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './lib/storage-shim.js';
import {
  LayoutDashboard, Calendar as CalendarIcon, Users, User, Settings as SettingsIcon, Plus, X,
  ChevronLeft, ChevronRight, Clock, Euro, TrendingUp, TrendingDown, Trash2, Pencil,
  Search, FileText, Printer, Download, Repeat, MapPin, Globe2, BarChart3, Sun, Moon, LogOut, Lock, Mail, Menu
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell
} from 'recharts';

/* ==================================================================================
   DESIGN TOKENS
   ================================================================================== */
const PALETTES = {
  light: {
    snow: '#FAFBFC', snowDim: '#F0F3F6', ice: '#E4EBF0', iceLine: '#D3DEE6',
    navy: '#10233D', navySoft: '#1A3355', ink: '#16232F', inkSoft: '#5A6B7A',
    card: '#FFFFFF', sidebar: '#10233D', sidebarText: '#FFFFFF'
  },
  dark: {
    snow: '#0D1620', snowDim: '#131F2C', ice: '#1C2A38', iceLine: '#26374A',
    navy: '#E7EEF5', navySoft: '#CBD8E6', ink: '#E7EEF5', inkSoft: '#8FA3B5',
    card: '#131F2C', sidebar: '#0A121B', sidebarText: '#FFFFFF'
  }
};
const ACCENTS = { glacier: '#2E6F8E', glacierDeep: '#3E8CB0', green: '#2F8F5B', blue: '#2E6F8E', black: '#181C22', red: '#C23B3B', amber: '#C99A46' };
const disciplineColor = (d) => d === 'Ski' ? ACCENTS.blue : ACCENTS.green;
const statutColor = (s) => s === 'Confirmée' ? ACCENTS.green : s === 'En attente' ? ACCENTS.amber : ACCENTS.red;

const STATIONS_BY_MASSIF = {
  'Alpes du Nord': [
    'Chamonix-Mont-Blanc', 'Megève', 'Saint-Gervais-les-Bains', 'Combloux', 'Les Contamines-Montjoie', 'Cordon', 'Les Houches',
    'Morzine', 'Avoriaz', 'Les Gets', 'Châtel', 'Saint-Jean-d\'Aulps',
    'La Clusaz', 'Le Grand-Bornand',
    'Flaine', 'Samoëns', 'Les Carroz-d\'Arâches', 'Sixt-Fer-à-Cheval',
    'Praz-sur-Arly', 'Notre-Dame-de-Bellecombe', 'Crest-Voland', 'Les Saisies', 'Hauteluce',
    'Courchevel', 'Méribel', 'Val Thorens', 'Les Menuires', 'Saint-Martin-de-Belleville', 'La Tania',
    'Tignes', 'Val d\'Isère', 'Les Arcs', 'La Plagne', 'Peisey-Vallandry', 'Champagny-en-Vanoise', 'Bourg-Saint-Maurice', 'Sainte-Foy-Tarentaise',
    'Valmorel', 'Saint-François-Longchamp', 'Valloire', 'Valfréjus', 'Aussois', 'Bonneval-sur-Arc', 'Val-Cenis', 'La Norma', 'Orelle',
    'Les Deux Alpes', 'Alpe d\'Huez', 'Chamrousse', 'Villard-de-Lans', 'Corrençon-en-Vercors', 'Autrans-Méaudre',
    'Le Collet d\'Allevard', 'Les Sept Laux', 'Oz-en-Oisans', 'Vaujany', 'Auris-en-Oisans', 'La Grave'
  ],
  'Alpes du Sud': [
    'Serre Chevalier', 'Montgenèvre', 'Puy-Saint-Vincent', 'Vars', 'Risoul', 'Orcières-Merlette',
    'Superdévoluy', 'Ancelle', 'Pra-Loup', 'La Foux d\'Allos', 'Le Sauze', 'Auron', 'Isola 2000', 'Valberg', 'Gréolières-les-Neiges'
  ],
  'Pyrénées': [
    'La Pierre Saint-Martin', 'Gourette', 'Artouste', 'Le Somport',
    'Peyragudes', 'Piau-Engaly', 'Saint-Lary-Soulan', 'Luz-Ardiden', 'Barèges', 'La Mongie', 'Cauterets', 'Luchon-Superbagnères', 'Peyresourde',
    'Ax 3 Domaines', 'Ascou-Pailhères', 'Guzet', 'Le Mourtis',
    'Font-Romeu', 'Les Angles', 'Formiguères', 'Puyvalador', 'Porté-Puymorens', 'Les Cambre d\'Aze'
  ],
  'Jura': ['Les Rousses', 'Métabief', 'Mijoux-Monts Jura', 'Lélex', 'Chapelle-des-Bois'],
  'Vosges': ['La Bresse-Hohneck', 'Gérardmer', 'Le Markstein', 'Ventron', 'Lac Blanc-Orbey', 'Xonrupt-Longemer', 'Schnepfenried'],
  'Massif Central': ['Super Besse', 'Le Mont-Dore', 'Le Lioran', 'Chalmazel', 'La Bourboule', 'Chastreix-Sancy', 'Prat-de-Bouc'],
  'Corse': ['Ghisoni-Capannelle', 'Val d\'Ese', 'Haut Asco']
};
const STATIONS = Object.values(STATIONS_BY_MASSIF).flat();
const NIVEAUX = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'];
const DISCIPLINES = ['Ski', 'Snowboard'];
const STATUTS = ['Confirmée', 'En attente', 'Annulée'];
const PAIEMENT_STATUTS = ['Payé', 'Non payé'];
const MODES_PAIEMENT = ['Non renseigné', 'Espèces', 'Carte bancaire', 'Virement'];
const LANGUES = ['Français', 'Anglais', 'Allemand', 'Espagnol', 'Italien', 'Portugais', 'Russe'];
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const ENGAGEMENTS = ['Heure', 'Demi-journée', 'Journée'];
const UI_TRANSLATIONS = {
  Français: {
    dashboard: 'Tableau de bord', calendar: 'Calendrier', reservations: 'Réservations',
    clients: 'Clients', paiements: 'Paiements & Factures', stats: 'Statistiques',
    parametres: 'Paramètres', deconnexion: 'Déconnexion',
    newReservation: 'Nouvelle réservation',
    subscribeTitle: 'Abonne-toi pour débloquer tes statistiques',
    subscribeSub: "Rends-toi dans Paramètres pour t'abonner (29€/mois).",
    kpiTodayLessons: "Cours aujourd'hui", hoursTaught: 'enseignées',
    kpiWeekLessons: 'Cours cette semaine', kpiMonthRevenue: 'Revenus du mois',
    lessonsThisMonth: 'cours ce mois-ci', kpiFillRate: 'Taux de remplissage', thisWeek: 'cette semaine',
    kpiTodayRevenue: 'Revenus du jour', kpiSeasonRevenue: 'Revenus de la saison',
    kpiTotalClients: 'Total clients', newClientsThisMonth: 'nouveaux ce mois-ci',
    kpiSeasonHours: 'Heures — saison',
    chartRevenue14d: "Évolution du chiffre d'affaires (14 jours)", chartDisciplineSplit: 'Répartition des disciplines',
    upcomingLessons: 'Prochains cours', noUpcomingLessons: 'Aucun cours à venir.',
    recentPayments: 'Derniers paiements reçus', noPaymentsRecorded: 'Aucun paiement enregistré.',
    calendarTitle: 'Calendrier', viewDay: 'Jour', viewWeek: 'Semaine', viewMonth: 'Mois', today: "Aujourd'hui", lessonsCount: 'cours',
    modalEditTitle: 'Modifier la réservation', highSeason: 'Haute saison', lowSeason: 'Basse saison',
    engHeure: 'Heure', engDemiJournee: 'Demi-journée', engJournee: 'Journée',
    crenMatin: 'Matin', crenApresMidi: 'Après-midi',
    fPrenom: 'Prénom', fNom: 'Nom', fTelephone: 'Téléphone', fEmail: 'E-mail', fNationalite: 'Nationalité',
    fLangueParlee: 'Langue parlée', fAge: 'Âge', fNiveau: 'Niveau', fDiscipline: 'Discipline',
    fNbPersonnes: 'Nombre de personnes', fStation: 'Station', fPointRdv: 'Point de rendez-vous',
    fDate: 'Date', fHeureDebut: 'Heure de début', fHeureFin: 'Heure de fin', fDuree: 'Durée', fPrix: 'Prix',
    suggestedRate: 'Tarif suggéré', fStatut: 'Statut', fModePaiement: 'Mode de règlement',
    fStatutPaiement: 'Statut du paiement', fNotes: 'Notes privées',
    btnCancel: 'Annuler', btnSave: 'Enregistrer', btnCreateReservation: 'Créer la réservation', btnDelete: 'Supprimer',
    totalReservations: 'réservations au total', searchClientStation: 'Rechercher un client, une station...',
    filterAll: 'Tous', thHoraire: 'Horaire', thPaiement: 'Paiement', thClient: 'Client',
    noResults: 'Aucune réservation ne correspond à votre recherche.',
    lessonsFollowed: 'Cours suivis', totalHours: 'Heures totales', totalSpent: 'Dépense totale',
    preferredDiscipline: 'Discipline préférée', lessonHistory: 'Historique des cours',
    documents: 'Documents', noDocuments: 'Aucun document pour ce client.',
    clientsInCrm: 'clients dans votre CRM', searchClient: 'Rechercher un client...',
    miniLessons: 'Cours', miniHours: 'Heures', miniSpent: 'Dépensé',
    noClientsMatch: 'Aucun client ne correspond à votre recherche.'
  },
  Anglais: {
    dashboard: 'Dashboard', calendar: 'Calendar', reservations: 'Bookings',
    clients: 'Clients', paiements: 'Payments & Invoices', stats: 'Statistics',
    parametres: 'Settings', deconnexion: 'Log out',
    newReservation: 'New booking',
    subscribeTitle: 'Subscribe to unlock your stats',
    subscribeSub: 'Go to Settings to subscribe (€29/month).',
    kpiTodayLessons: 'Lessons today', hoursTaught: 'taught',
    kpiWeekLessons: 'Lessons this week', kpiMonthRevenue: 'Revenue this month',
    lessonsThisMonth: 'lessons this month', kpiFillRate: 'Fill rate', thisWeek: 'this week',
    kpiTodayRevenue: "Today's revenue", kpiSeasonRevenue: 'Season revenue',
    kpiTotalClients: 'Total clients', newClientsThisMonth: 'new this month',
    kpiSeasonHours: 'Hours — season',
    chartRevenue14d: 'Revenue trend (14 days)', chartDisciplineSplit: 'Discipline breakdown',
    upcomingLessons: 'Upcoming lessons', noUpcomingLessons: 'No upcoming lessons.',
    recentPayments: 'Recent payments', noPaymentsRecorded: 'No payments recorded.',
    calendarTitle: 'Calendar', viewDay: 'Day', viewWeek: 'Week', viewMonth: 'Month', today: 'Today', lessonsCount: 'lessons',
    modalEditTitle: 'Edit booking', highSeason: 'High season', lowSeason: 'Low season',
    engHeure: 'Hour', engDemiJournee: 'Half-day', engJournee: 'Full day',
    crenMatin: 'Morning', crenApresMidi: 'Afternoon',
    fPrenom: 'First name', fNom: 'Last name', fTelephone: 'Phone', fEmail: 'Email', fNationalite: 'Nationality',
    fLangueParlee: 'Spoken language', fAge: 'Age', fNiveau: 'Level', fDiscipline: 'Discipline',
    fNbPersonnes: 'Number of people', fStation: 'Resort', fPointRdv: 'Meeting point',
    fDate: 'Date', fHeureDebut: 'Start time', fHeureFin: 'End time', fDuree: 'Duration', fPrix: 'Price',
    suggestedRate: 'Suggested rate', fStatut: 'Status', fModePaiement: 'Payment method',
    fStatutPaiement: 'Payment status', fNotes: 'Private notes',
    btnCancel: 'Cancel', btnSave: 'Save', btnCreateReservation: 'Create booking', btnDelete: 'Delete',
    totalReservations: 'bookings total', searchClientStation: 'Search a client, a resort...',
    filterAll: 'All', thHoraire: 'Time', thPaiement: 'Payment', thClient: 'Client',
    noResults: 'No booking matches your search.',
    lessonsFollowed: 'Lessons taken', totalHours: 'Total hours', totalSpent: 'Total spent',
    preferredDiscipline: 'Preferred discipline', lessonHistory: 'Lesson history',
    documents: 'Documents', noDocuments: 'No documents for this client.',
    clientsInCrm: 'clients in your CRM', searchClient: 'Search a client...',
    miniLessons: 'Lessons', miniHours: 'Hours', miniSpent: 'Spent',
    noClientsMatch: 'No client matches your search.'
  },
  Espagnol: {
    dashboard: 'Panel', calendar: 'Calendario', reservations: 'Reservas',
    clients: 'Clientes', paiements: 'Pagos y Facturas', stats: 'Estadísticas',
    parametres: 'Ajustes', deconnexion: 'Cerrar sesión',
    newReservation: 'Nueva reserva',
    subscribeTitle: 'Suscríbete para desbloquear tus estadísticas',
    subscribeSub: 'Ve a Ajustes para suscribirte (29€/mes).',
    kpiTodayLessons: 'Clases hoy', hoursTaught: 'impartidas',
    kpiWeekLessons: 'Clases esta semana', kpiMonthRevenue: 'Ingresos del mes',
    lessonsThisMonth: 'clases este mes', kpiFillRate: 'Tasa de ocupación', thisWeek: 'esta semana',
    kpiTodayRevenue: 'Ingresos de hoy', kpiSeasonRevenue: 'Ingresos de la temporada',
    kpiTotalClients: 'Total de clientes', newClientsThisMonth: 'nuevos este mes',
    kpiSeasonHours: 'Horas — temporada',
    chartRevenue14d: 'Evolución de ingresos (14 días)', chartDisciplineSplit: 'Reparto por disciplina',
    upcomingLessons: 'Próximas clases', noUpcomingLessons: 'No hay clases próximas.',
    recentPayments: 'Últimos pagos recibidos', noPaymentsRecorded: 'No hay pagos registrados.',
    calendarTitle: 'Calendario', viewDay: 'Día', viewWeek: 'Semana', viewMonth: 'Mes', today: 'Hoy', lessonsCount: 'clases',
    modalEditTitle: 'Editar reserva', highSeason: 'Temporada alta', lowSeason: 'Temporada baja',
    engHeure: 'Hora', engDemiJournee: 'Media jornada', engJournee: 'Día completo',
    crenMatin: 'Mañana', crenApresMidi: 'Tarde',
    fPrenom: 'Nombre', fNom: 'Apellido', fTelephone: 'Teléfono', fEmail: 'Correo electrónico', fNationalite: 'Nacionalidad',
    fLangueParlee: 'Idioma hablado', fAge: 'Edad', fNiveau: 'Nivel', fDiscipline: 'Disciplina',
    fNbPersonnes: 'Número de personas', fStation: 'Estación', fPointRdv: 'Punto de encuentro',
    fDate: 'Fecha', fHeureDebut: 'Hora de inicio', fHeureFin: 'Hora de fin', fDuree: 'Duración', fPrix: 'Precio',
    suggestedRate: 'Tarifa sugerida', fStatut: 'Estado', fModePaiement: 'Método de pago',
    fStatutPaiement: 'Estado del pago', fNotes: 'Notas privadas',
    btnCancel: 'Cancelar', btnSave: 'Guardar', btnCreateReservation: 'Crear reserva', btnDelete: 'Eliminar',
    totalReservations: 'reservas en total', searchClientStation: 'Buscar un cliente, una estación...',
    filterAll: 'Todos', thHoraire: 'Horario', thPaiement: 'Pago', thClient: 'Cliente',
    noResults: 'Ninguna reserva coincide con tu búsqueda.',
    lessonsFollowed: 'Clases realizadas', totalHours: 'Horas totales', totalSpent: 'Gasto total',
    preferredDiscipline: 'Disciplina preferida', lessonHistory: 'Historial de clases',
    documents: 'Documentos', noDocuments: 'Ningún documento para este cliente.',
    clientsInCrm: 'clientes en tu CRM', searchClient: 'Buscar un cliente...',
    miniLessons: 'Clases', miniHours: 'Horas', miniSpent: 'Gastado',
    noClientsMatch: 'Ningún cliente coincide con tu búsqueda.'
  },
  Italien: {
    dashboard: 'Bacheca', calendar: 'Calendario', reservations: 'Prenotazioni',
    clients: 'Clienti', paiements: 'Pagamenti e Fatture', stats: 'Statistiche',
    parametres: 'Impostazioni', deconnexion: 'Disconnetti',
    newReservation: 'Nuova prenotazione',
    subscribeTitle: 'Abbonati per sbloccare le tue statistiche',
    subscribeSub: 'Vai su Impostazioni per abbonarti (29€/mese).',
    kpiTodayLessons: 'Lezioni oggi', hoursTaught: 'insegnate',
    kpiWeekLessons: 'Lezioni questa settimana', kpiMonthRevenue: 'Entrate del mese',
    lessonsThisMonth: 'lezioni questo mese', kpiFillRate: 'Tasso di riempimento', thisWeek: 'questa settimana',
    kpiTodayRevenue: 'Entrate di oggi', kpiSeasonRevenue: 'Entrate stagionali',
    kpiTotalClients: 'Totale clienti', newClientsThisMonth: 'nuovi questo mese',
    kpiSeasonHours: 'Ore — stagione',
    chartRevenue14d: 'Andamento entrate (14 giorni)', chartDisciplineSplit: 'Ripartizione discipline',
    upcomingLessons: 'Prossime lezioni', noUpcomingLessons: 'Nessuna lezione in programma.',
    recentPayments: 'Ultimi pagamenti ricevuti', noPaymentsRecorded: 'Nessun pagamento registrato.',
    calendarTitle: 'Calendario', viewDay: 'Giorno', viewWeek: 'Settimana', viewMonth: 'Mese', today: 'Oggi', lessonsCount: 'lezioni',
    modalEditTitle: 'Modifica prenotazione', highSeason: 'Alta stagione', lowSeason: 'Bassa stagione',
    engHeure: 'Ora', engDemiJournee: 'Mezza giornata', engJournee: 'Giornata intera',
    crenMatin: 'Mattina', crenApresMidi: 'Pomeriggio',
    fPrenom: 'Nome', fNom: 'Cognome', fTelephone: 'Telefono', fEmail: 'E-mail', fNationalite: 'Nazionalità',
    fLangueParlee: 'Lingua parlata', fAge: 'Età', fNiveau: 'Livello', fDiscipline: 'Disciplina',
    fNbPersonnes: 'Numero di persone', fStation: 'Stazione', fPointRdv: "Punto d'incontro",
    fDate: 'Data', fHeureDebut: 'Ora di inizio', fHeureFin: 'Ora di fine', fDuree: 'Durata', fPrix: 'Prezzo',
    suggestedRate: 'Tariffa consigliata', fStatut: 'Stato', fModePaiement: 'Metodo di pagamento',
    fStatutPaiement: 'Stato del pagamento', fNotes: 'Note private',
    btnCancel: 'Annulla', btnSave: 'Salva', btnCreateReservation: 'Crea prenotazione', btnDelete: 'Elimina',
    totalReservations: 'prenotazioni totali', searchClientStation: 'Cerca un cliente, una stazione...',
    filterAll: 'Tutti', thHoraire: 'Orario', thPaiement: 'Pagamento', thClient: 'Cliente',
    noResults: 'Nessuna prenotazione corrisponde alla tua ricerca.',
    lessonsFollowed: 'Lezioni seguite', totalHours: 'Ore totali', totalSpent: 'Spesa totale',
    preferredDiscipline: 'Disciplina preferita', lessonHistory: 'Storico lezioni',
    documents: 'Documenti', noDocuments: 'Nessun documento per questo cliente.',
    clientsInCrm: 'clienti nel tuo CRM', searchClient: 'Cerca un cliente...',
    miniLessons: 'Lezioni', miniHours: 'Ore', miniSpent: 'Speso',
    noClientsMatch: 'Nessun cliente corrisponde alla tua ricerca.'
  },
  Portugais: {
    dashboard: 'Painel', calendar: 'Calendário', reservations: 'Reservas',
    clients: 'Clientes', paiements: 'Pagamentos e Faturas', stats: 'Estatísticas',
    parametres: 'Configurações', deconnexion: 'Sair',
    newReservation: 'Nova reserva',
    subscribeTitle: 'Assine para desbloquear suas estatísticas',
    subscribeSub: 'Vá em Configurações para assinar (29€/mês).',
    kpiTodayLessons: 'Aulas hoje', hoursTaught: 'ministradas',
    kpiWeekLessons: 'Aulas esta semana', kpiMonthRevenue: 'Receita do mês',
    lessonsThisMonth: 'aulas este mês', kpiFillRate: 'Taxa de ocupação', thisWeek: 'esta semana',
    kpiTodayRevenue: 'Receita de hoje', kpiSeasonRevenue: 'Receita da temporada',
    kpiTotalClients: 'Total de clientes', newClientsThisMonth: 'novos este mês',
    kpiSeasonHours: 'Horas — temporada',
    chartRevenue14d: 'Evolução da receita (14 dias)', chartDisciplineSplit: 'Distribuição por modalidade',
    upcomingLessons: 'Próximas aulas', noUpcomingLessons: 'Nenhuma aula agendada.',
    recentPayments: 'Últimos pagamentos recebidos', noPaymentsRecorded: 'Nenhum pagamento registrado.',
    calendarTitle: 'Calendário', viewDay: 'Dia', viewWeek: 'Semana', viewMonth: 'Mês', today: 'Hoje', lessonsCount: 'aulas',
    modalEditTitle: 'Editar reserva', highSeason: 'Época alta', lowSeason: 'Época baixa',
    engHeure: 'Hora', engDemiJournee: 'Meio-dia', engJournee: 'Dia inteiro',
    crenMatin: 'Manhã', crenApresMidi: 'Tarde',
    fPrenom: 'Nome', fNom: 'Sobrenome', fTelephone: 'Telefone', fEmail: 'E-mail', fNationalite: 'Nacionalidade',
    fLangueParlee: 'Idioma falado', fAge: 'Idade', fNiveau: 'Nível', fDiscipline: 'Modalidade',
    fNbPersonnes: 'Número de pessoas', fStation: 'Estação', fPointRdv: 'Ponto de encontro',
    fDate: 'Data', fHeureDebut: 'Hora de início', fHeureFin: 'Hora de término', fDuree: 'Duração', fPrix: 'Preço',
    suggestedRate: 'Tarifa sugerida', fStatut: 'Estado', fModePaiement: 'Método de pagamento',
    fStatutPaiement: 'Estado do pagamento', fNotes: 'Notas privadas',
    btnCancel: 'Cancelar', btnSave: 'Salvar', btnCreateReservation: 'Criar reserva', btnDelete: 'Excluir',
    totalReservations: 'reservas no total', searchClientStation: 'Buscar um cliente, uma estação...',
    filterAll: 'Todos', thHoraire: 'Horário', thPaiement: 'Pagamento',
    thClient: 'Cliente', noResults: 'Nenhuma reserva corresponde à sua busca.',
    lessonsFollowed: 'Aulas realizadas', totalHours: 'Horas totais', totalSpent: 'Total gasto',
    preferredDiscipline: 'Modalidade preferida', lessonHistory: 'Histórico de aulas',
    documents: 'Documentos', noDocuments: 'Nenhum documento para este cliente.',
    clientsInCrm: 'clientes no seu CRM', searchClient: 'Buscar um cliente...',
    miniLessons: 'Aulas', miniHours: 'Horas', miniSpent: 'Gasto',
    noClientsMatch: 'Nenhum cliente corresponde à sua busca.'
  }
};
const LOCALE_MAP = { Français: 'fr-FR', Anglais: 'en-US', Espagnol: 'es-ES', Italien: 'it-IT', Portugais: 'pt-PT' };
const DAYS_SHORT_MAP = {
  Français: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  Anglais: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  Espagnol: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  Italien: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
  Portugais: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
};
function tUI(key, langue) {
  return (UI_TRANSLATIONS[langue] && UI_TRANSLATIONS[langue][key]) || UI_TRANSLATIONS['Français'][key] || key;
}

function getCreneaux(settings) {
  return {
    'Matin': [settings.matinDebut || '09:00', settings.matinFin || '12:30'],
    'Après-midi': [settings.apresMidiDebut || '13:30', settings.apresMidiFin || '17:00']
  };
}
const JOURNEE_HOURS = ['09:00', '16:30'];

/* ==================================================================================
   HELPERS
   ================================================================================== */
const pad = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfWeek = (d) => { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const timeToMinutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const minutesLabel = (mins) => { const h = Math.floor(mins / 60); const m = mins % 60; return m === 0 ? `${h}h` : `${h}h${pad(m)}`; };
const fmtEUR = (n, devise = 'EUR') => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise, maximumFractionDigits: 0 }).format(n || 0);
const fmtDateShort = (dateKey) => new Date(dateKey + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const monthDay = (dateKey) => dateKey.slice(5); // 'MM-DD'

// Dates officielles des vacances scolaires françaises (zones A, B, C), publiées au Journal officiel.
// Couvre les années scolaires 2025-2026 et 2026-2027 (données disponibles au moment de l'écriture).
// À mettre à jour lorsque les arrêtés suivants seront publiés par l'Éducation nationale.
const SCHOOL_HOLIDAYS = [
  // 2025-2026
  { name: 'Toussaint', A: ['2025-10-18', '2025-11-03'], B: ['2025-10-18', '2025-11-03'], C: ['2025-10-18', '2025-11-03'] },
  { name: 'Noël', A: ['2025-12-20', '2026-01-05'], B: ['2025-12-20', '2026-01-05'], C: ['2025-12-20', '2026-01-05'] },
  { name: 'Hiver', A: ['2026-02-07', '2026-02-23'], B: ['2026-02-14', '2026-03-02'], C: ['2026-02-21', '2026-03-09'] },
  { name: 'Printemps', A: ['2026-04-04', '2026-04-20'], B: ['2026-04-11', '2026-04-27'], C: ['2026-04-18', '2026-05-04'] },
  { name: 'Été', A: ['2026-07-04', '2026-08-31'], B: ['2026-07-04', '2026-08-31'], C: ['2026-07-04', '2026-08-31'] },
  // 2026-2027
  { name: 'Toussaint', A: ['2026-10-17', '2026-11-02'], B: ['2026-10-17', '2026-11-02'], C: ['2026-10-17', '2026-11-02'] },
  { name: 'Noël', A: ['2026-12-19', '2027-01-04'], B: ['2026-12-19', '2027-01-04'], C: ['2026-12-19', '2027-01-04'] },
  { name: 'Hiver', A: ['2027-02-13', '2027-03-01'], B: ['2027-02-20', '2027-03-08'], C: ['2027-02-06', '2027-02-22'] },
  { name: 'Printemps', A: ['2027-04-10', '2027-04-26'], B: ['2027-04-17', '2027-05-03'], C: ['2027-04-03', '2027-04-19'] },
  { name: 'Été', A: ['2027-07-03', '2027-08-31'], B: ['2027-07-03', '2027-08-31'], C: ['2027-07-03', '2027-08-31'] },
];

const inRange = (dateKey, [start, end]) => dateKey >= start && dateKey <= end;

const isSchoolHoliday = (dateKey, zone) => {
  return SCHOOL_HOLIDAYS.some(period => {
    if (zone === 'Toutes') return inRange(dateKey, period.A) || inRange(dateKey, period.B) || inRange(dateKey, period.C);
    return inRange(dateKey, period[zone]);
  });
};

const isHighSeason = (dateKey, settings) => {
  if (settings.seasonMode === 'manuel') {
    const md = monthDay(dateKey);
    const start = settings.hauteSaisonDebut, end = settings.hauteSaisonFin;
    if (!start || !end) return false;
    return start <= end ? (md >= start && md <= end) : (md >= start || md <= end);
  }
  return isSchoolHoliday(dateKey, settings.zoneVacances || 'Toutes');
};

/* ==================================================================================
   STORAGE
   ================================================================================== */
const RES_KEY = 'skipro-reservations-v1';
const SETTINGS_KEY = 'skipro-settings-v1';

const DEFAULT_SETTINGS = {
  nom: 'Moniteur ESF', email: 'contact@exemple.com', devise: 'EUR', langue: 'Français',
  fuseauHoraire: 'Europe/Paris',
  adresse: '', telephone: '', siret: '', profession: 'Moniteur de ski indépendant',
  iban: '', bic: '', banque: '',
  matinDebut: '09:00', matinFin: '12:30', apresMidiDebut: '13:30', apresMidiFin: '17:00',
  tarifSkiHaute: 75, tarifSkiBasse: 55, tarifSnowboardHaute: 80, tarifSnowboardBasse: 60,
  tarifDemiJourneeHaute: 210, tarifDemiJourneeBasse: 150, tarifJourneeHaute: 370, tarifJourneeBasse: 270,
  hauteSaisonDebut: '12-20', hauteSaisonFin: '02-28', seasonMode: 'vacances', zoneVacances: 'Toutes',
  joursRepos: ['Dimanche'], theme: 'light',
  notifEmail: true, notifSMS: false
};

function seedReservations() {
  const today = new Date();
  const first = ['Marie', 'Thomas', 'Julia', 'Nicolas', 'Emma', 'Lucas', 'Sofia', 'Erik', 'Chloé', 'Antoine', 'Léa', 'Max'];
  const last = ['Dubois', 'Bergström', 'Moreau', 'Keller', 'Rossi', 'Novak', 'Petit', 'Ivanov', 'Garcia', 'Fischer'];
  const nat = ['Française', 'Suédoise', 'Allemande', 'Britannique', 'Italienne', 'Belge'];
  const items = []; let id = 1;
  for (let offset = -9; offset <= 10; offset++) {
    const d = addDays(today, offset);
    if (d.getDay() === 0) continue;
    const nbCours = offset === 0 ? 4 : (Math.random() > 0.35 ? (1 + Math.floor(Math.random() * 3)) : 0);
    for (let i = 0; i < nbCours; i++) {
      const startHour = 9 + Math.floor(Math.random() * 7);
      const duration = [1, 1.5, 2][Math.floor(Math.random() * 3)];
      const startM = startHour * 60, endM = startM + duration * 60;
      const discipline = DISCIPLINES[Math.floor(Math.random() * DISCIPLINES.length)];
      const prixHeure = discipline === 'Ski' ? 65 : 70;
      const nbPersonnes = Math.random() > 0.7 ? (2 + Math.floor(Math.random() * 3)) : 1;
      const isPast = offset < 0;
      items.push({
        id: id++, nom: last[Math.floor(Math.random() * last.length)], prenom: first[Math.floor(Math.random() * first.length)],
        telephone: '+33 6 ' + Math.floor(10 + Math.random() * 89) + ' ' + Math.floor(10 + Math.random() * 89) + ' ' + Math.floor(10 + Math.random() * 89) + ' ' + Math.floor(10 + Math.random() * 89),
        email: 'client' + id + '@exemple.com', nationalite: nat[Math.floor(Math.random() * nat.length)],
        langue: LANGUES[Math.floor(Math.random() * LANGUES.length)], age: 8 + Math.floor(Math.random() * 50),
        niveau: NIVEAUX[Math.floor(Math.random() * NIVEAUX.length)], discipline, nbPersonnes,
        station: STATIONS[Math.floor(Math.random() * STATIONS.length)], pointRdv: 'ESF - Front de neige',
        date: toKey(d), heureDebut: `${pad(startHour)}:00`, heureFin: `${pad(Math.floor(endM / 60))}:${pad(endM % 60)}`,
        prix: Math.round(prixHeure * duration * (nbPersonnes > 1 ? 1 + (nbPersonnes - 1) * 0.4 : 1)),
        statut: isPast ? 'Confirmée' : (Math.random() > 0.15 ? 'Confirmée' : 'En attente'),
        paiement: isPast ? (Math.random() > 0.2 ? 'Payé' : 'Non payé') : 'Non payé', notes: ''
      });
    }
  }
  return items;
}
const emptyForm = {
  nom: '', prenom: '', telephone: '', email: '', nationalite: '', langue: 'Français', age: '',
  niveau: 'Débutant', discipline: 'Ski', nbPersonnes: 1, station: STATIONS[0], pointRdv: '',
  date: toKey(new Date()), type: 'Heure', creneau: 'Matin', heureDebut: '09:00', heureFin: '10:00', prix: '', statut: 'Confirmée', paiement: 'Non payé', modePaiement: 'Non renseigné', notes: ''
};

async function loadReservations() {
  try { const r = await window.storage.get(RES_KEY); return JSON.parse(r.value); }
  catch (e) { return []; }
}
async function persistReservations(list) { try { await window.storage.set(RES_KEY, JSON.stringify(list)); } catch (e) { console.error(e); } }
async function loadSettings() {
  try { const r = await window.storage.get(SETTINGS_KEY); return { ...DEFAULT_SETTINGS, ...JSON.parse(r.value) }; }
  catch (e) { return DEFAULT_SETTINGS; }
}
async function persistSettings(s) { try { await window.storage.set(SETTINGS_KEY, JSON.stringify(s)); } catch (e) { console.error(e); } }

/* ==================================================================================
   RESPONSIVE STYLESHEET (mobile portrait first-class support)
   ================================================================================== */
const RESPONSIVE_CSS = `
  .app-root{ display:flex; height:100vh; }
  .sidebar{ width:220px; flex-shrink:0; display:flex; flex-direction:column; padding:22px 16px; }
  .sidebar-nav{ display:flex; flex-direction:column; gap:3px; }
  .nav-btn{ display:flex; align-items:center; gap:11px; padding:10px 12px; font-size:14px; }
  .main-content{ flex:1; padding:32px 36px; overflow-y:auto; min-width:0; }
  .kpi-grid-4{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  .kpi-grid-3{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  .chart-grid{ display:grid; grid-template-columns:1.4fr 1fr; gap:16px; }
  .two-col{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .clients-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  .form-grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .form-grid-3{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
  .header-row{ display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
  .cal-scroll{ overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .cal-min{ min-width:680px; }

  @media (max-width:900px){
    .kpi-grid-4, .kpi-grid-3{ grid-template-columns:repeat(2,1fr); }
    .chart-grid, .two-col{ grid-template-columns:1fr; }
    .clients-grid{ grid-template-columns:repeat(2,1fr); }
  }
  .mobile-topbar{ display:none; }
  @media (max-width:768px){
    .app-root{ display:block; height:auto; }
    .sidebar{ display:none; }
    .mobile-topbar{
      display:flex; align-items:center; justify-content:space-between;
      padding:14px 16px; position:sticky; top:0; z-index:50;
    }
    .main-content{ padding:18px 16px 32px; }
  }
  @media (max-width:600px){
    .kpi-grid-4, .kpi-grid-3, .clients-grid{ grid-template-columns:1fr; }
    .form-grid-2, .form-grid-3{ grid-template-columns:1fr; }
  }
`;

/* ==================================================================================
   SHARED UI
   ================================================================================== */
function Pill({ color, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 100, color, background: color + '18', whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />{children}
    </span>
  );
}
function KpiCard({ label, value, sub, icon: Icon, accent, C }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.iceLine}`, borderRadius: 14, padding: '18px 20px', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: '.03em' }}>{label}</div>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={15} color={accent} />
        </div>
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: C.navy, marginTop: 10 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function BlurGate({ subscribed, C, children }) {
  return (
    <div style={{ position: 'relative' }}>
      {!subscribed && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', border: `1px solid ${C.iceLine}`, borderRadius: 14, padding: '20px 26px', boxShadow: '0 12px 30px -10px rgba(0,0,0,0.2)', textAlign: 'center', maxWidth: 320 }}>
            <div style={{ fontWeight: 700, color: C.navy, marginBottom: 6 }}>Abonne-toi pour débloquer cette section</div>
            <div style={{ fontSize: 13, color: C.inkSoft }}>Rends-toi dans Paramètres pour t'abonner (29€/mois).</div>
          </div>
        </div>
      )}
      <div style={!subscribed ? { filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' } : {}}>
        {children}
      </div>
    </div>
  );
}

/* ==================================================================================
   RESERVATION MODAL
   ================================================================================== */
function ReservationModal({ initial, onSave, onDelete, onClose, C, settings }) {
  const langue = settings.langue;
  const [form, setForm] = useState({ type: 'Heure', creneau: 'Matin', ...initial });
  const isEdit = !!initial.id;
  const duration = useMemo(() => { const d = timeToMinutes(form.heureFin) - timeToMinutes(form.heureDebut); return d > 0 ? minutesLabel(d) : '—'; }, [form.heureDebut, form.heureFin]);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const CRENEAUX = getCreneaux(settings);

  const engagementLabel = (type) => type === 'Heure' ? tUI('engHeure', langue) : type === 'Demi-journée' ? tUI('engDemiJournee', langue) : tUI('engJournee', langue);
  const creneauLabel = (cren) => cren === 'Matin' ? tUI('crenMatin', langue) : tUI('crenApresMidi', langue);

  const priceForType = useCallback((type, creneau, dateKey) => {
    const high = isHighSeason(dateKey, settings);
    if (type === 'Journée') return high ? settings.tarifJourneeHaute : settings.tarifJourneeBasse;
    if (type === 'Demi-journée') return high ? settings.tarifDemiJourneeHaute : settings.tarifDemiJourneeBasse;
    return null;
  }, [settings]);

  const setEngagement = (e) => {
    const type = e.target.value;
    setForm(f => {
      if (type === 'Journée') return { ...f, type, heureDebut: JOURNEE_HOURS[0], heureFin: JOURNEE_HOURS[1], prix: priceForType(type, f.creneau, f.date) };
      if (type === 'Demi-journée') { const cren = f.creneau || 'Matin'; return { ...f, type, creneau: cren, heureDebut: CRENEAUX[cren][0], heureFin: CRENEAUX[cren][1], prix: priceForType(type, cren, f.date) }; }
      return { ...f, type };
    });
  };
  const setCreneau = (e) => {
    const cren = e.target.value;
    setForm(f => ({ ...f, creneau: cren, heureDebut: CRENEAUX[cren][0], heureFin: CRENEAUX[cren][1], prix: priceForType('Demi-journée', cren, f.date) }));
  };
  const setDate = (e) => {
    const date = e.target.value;
    setForm(f => ({ ...f, date, prix: f.type !== 'Heure' ? priceForType(f.type, f.creneau, date) : f.prix }));
  };

  const high = isHighSeason(form.date, settings);
  const hourlyHint = form.type === 'Heure' ? (form.discipline === 'Ski' ? (high ? settings.tarifSkiHaute : settings.tarifSkiBasse) : (high ? settings.tarifSnowboardHaute : settings.tarifSnowboardBasse)) : null;

  const inputStyle = { border: `1px solid ${C.iceLine}`, borderRadius: 8, padding: '8px 10px', fontSize: 14, fontFamily: 'Inter, sans-serif', color: C.ink, background: C.card };
  const disabledStyle = { ...inputStyle, background: C.snowDim, color: C.inkSoft };
  const field = (label, input) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.inkSoft }}>{label}</label>
      {input}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,18,27,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={onClose}>
      <div style={{ background: C.snow, borderRadius: 18, width: '100%', maxWidth: 640, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 30px 80px -30px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${C.iceLine}`, position: 'sticky', top: 0, background: C.snow, zIndex: 1 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: C.navy }}>{isEdit ? tUI('modalEditTitle', langue) : tUI('newReservation', langue)}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft }}><X size={20} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {ENGAGEMENTS.map(type => (
              <button key={type} type="button" onClick={() => setEngagement({ target: { value: type } })} style={{
                flex: 1, padding: '10px 8px', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
                border: `1px solid ${form.type === type ? ACCENTS.glacier : C.iceLine}`,
                background: form.type === type ? ACCENTS.glacier + '18' : C.card,
                color: form.type === type ? ACCENTS.glacierDeep : C.ink
              }}>{engagementLabel(type)}</button>
            ))}
          </div>
          <Pill color={high ? ACCENTS.red : ACCENTS.green}>{high ? tUI('highSeason', langue) : tUI('lowSeason', langue)}</Pill>
          {form.type === 'Demi-journée' && (
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.keys(CRENEAUX).map(cren => (
                <button key={cren} type="button" onClick={() => setCreneau({ target: { value: cren } })} style={{
                  flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  border: `1px solid ${form.creneau === cren ? ACCENTS.glacier : C.iceLine}`,
                  background: form.creneau === cren ? ACCENTS.glacier + '18' : C.card,
                  color: form.creneau === cren ? ACCENTS.glacierDeep : C.ink
                }}>{creneauLabel(cren)} ({CRENEAUX[cren][0]}–{CRENEAUX[cren][1]})</button>
              ))}
            </div>
          )}
          <div className="form-grid-2">
            {field(tUI('fPrenom', langue), <input style={inputStyle} value={form.prenom} onChange={set('prenom')} />)}
            {field(tUI('fNom', langue), <input style={inputStyle} value={form.nom} onChange={set('nom')} />)}
            {field(tUI('fTelephone', langue), <input style={inputStyle} value={form.telephone} onChange={set('telephone')} />)}
            {field(tUI('fEmail', langue), <input style={inputStyle} value={form.email} onChange={set('email')} />)}
            {field(tUI('fNationalite', langue), <input style={inputStyle} value={form.nationalite} onChange={set('nationalite')} />)}
            {field(tUI('fLangueParlee', langue), <select style={inputStyle} value={form.langue} onChange={set('langue')}>{LANGUES.map(l => <option key={l}>{l}</option>)}</select>)}
            {field(tUI('fAge', langue), <input type="number" style={inputStyle} value={form.age} onChange={set('age')} />)}
            {field(tUI('fNiveau', langue), <select style={inputStyle} value={form.niveau} onChange={set('niveau')}>{NIVEAUX.map(n => <option key={n}>{n}</option>)}</select>)}
            {field(tUI('fDiscipline', langue), <select style={inputStyle} value={form.discipline} onChange={set('discipline')}>{DISCIPLINES.map(d => <option key={d}>{d}</option>)}</select>)}
            {field(tUI('fNbPersonnes', langue), <input type="number" min="1" style={inputStyle} value={form.nbPersonnes} onChange={set('nbPersonnes')} />)}
            {field(tUI('fStation', langue), <select style={inputStyle} value={form.station} onChange={set('station')}>{Object.entries(STATIONS_BY_MASSIF).map(([massif, list]) => <optgroup key={massif} label={massif}>{list.map(s => <option key={s}>{s}</option>)}</optgroup>)}</select>)}
            {field(tUI('fPointRdv', langue), <input style={inputStyle} value={form.pointRdv} onChange={set('pointRdv')} />)}
            {field(tUI('fDate', langue), <input type="date" style={inputStyle} value={form.date} onChange={setDate} />)}
            {field(tUI('fHeureDebut', langue), <input type="time" disabled={form.type !== 'Heure'} style={form.type !== 'Heure' ? disabledStyle : inputStyle} value={form.heureDebut} onChange={set('heureDebut')} />)}
            {field(tUI('fHeureFin', langue), <input type="time" disabled={form.type !== 'Heure'} style={form.type !== 'Heure' ? disabledStyle : inputStyle} value={form.heureFin} onChange={set('heureFin')} />)}
            {field(tUI('fDuree', langue), <div style={{ ...inputStyle, background: C.snowDim, color: C.inkSoft }}>{duration}</div>)}
            {field(`${tUI('fPrix', langue)} (${settings.devise === 'USD' ? '$' : settings.devise === 'GBP' ? '£' : '€'})`, <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <input type="number" style={inputStyle} value={form.prix} onChange={set('prix')} />
              {hourlyHint && <span style={{ fontSize: 11.5, color: C.inkSoft }}>{tUI('suggestedRate', langue)} : {hourlyHint} {settings.devise || '€'}/h ({high ? tUI('highSeason', langue) : tUI('lowSeason', langue)})</span>}
            </div>)}
            {field(tUI('fStatut', langue), <select style={inputStyle} value={form.statut} onChange={set('statut')}>{STATUTS.map(s => <option key={s}>{s}</option>)}</select>)}
            {field(tUI('fModePaiement', langue), <select style={inputStyle} value={form.modePaiement || 'Non renseigné'} onChange={e => { const modePaiement = e.target.value; setForm(f => ({ ...f, modePaiement, paiement: modePaiement === 'Non renseigné' ? 'Non payé' : 'Payé' })); }}>{MODES_PAIEMENT.map(s => <option key={s}>{s}</option>)}</select>)}
            {field(tUI('fStatutPaiement', langue), <div style={{ ...inputStyle, background: C.snowDim, color: form.paiement === 'Payé' ? ACCENTS.green : C.inkSoft, fontWeight: 600 }}>{form.paiement}</div>)}
          </div>
          {field(tUI('fNotes', langue), <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.notes} onChange={set('notes')} />)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderTop: `1px solid ${C.iceLine}` }}>
          <div>{isEdit && <button onClick={() => onDelete(form.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: ACCENTS.red, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}><Trash2 size={15} /> {tUI('btnDelete', langue)}</button>}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${C.iceLine}`, background: C.card, color: C.ink, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>{tUI('btnCancel', langue)}</button>
            <button onClick={() => onSave(form)} style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: ACCENTS.glacier, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>{isEdit ? tUI('btnSave', langue) : tUI('btnCreateReservation', langue)}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================================
   DASHBOARD
   ================================================================================== */
function Dashboard({ reservations, onNewReservation, C, devise, subscribed, langue }) {
  const locale = LOCALE_MAP[langue] || 'fr-FR';
  const tt = (key) => tUI(key, langue);
  const today = new Date(); const todayKey = toKey(today); const weekStart = startOfWeek(today);
  const monthKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
  const inWeek = (k) => { const d = new Date(k + 'T00:00:00'); return d >= weekStart && d < addDays(weekStart, 7); };
  const inMonth = (k) => k.startsWith(monthKey);
  const active = reservations.filter(r => r.statut !== 'Annulée');
  const todayR = active.filter(r => r.date === todayKey);
  const weekR = active.filter(r => inWeek(r.date));
  const monthR = active.filter(r => inMonth(r.date));
  const seasonR = active;
  const hoursOf = (l) => l.reduce((s, r) => s + (timeToMinutes(r.heureFin) - timeToMinutes(r.heureDebut)) / 60, 0);
  const revenueOf = (l) => l.reduce((s, r) => s + Number(r.prix || 0), 0);
  const uniqueClients = new Set(seasonR.map(r => r.prenom + r.nom)).size;
  const newClientsThisMonthCount = new Set(monthR.map(r => r.prenom + r.nom)).size;
  const fillRate = Math.min(100, Math.round((hoursOf(weekR) / (8 * 6)) * 100));
  const lastPayments = [...reservations].filter(r => r.paiement === 'Payé').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const upcoming = [...reservations].filter(r => r.date >= todayKey && r.statut !== 'Annulée').sort((a, b) => (a.date + a.heureDebut).localeCompare(b.date + b.heureDebut)).slice(0, 5);
  const revEvolution = [];
  for (let i = -13; i <= 0; i++) { const d = addDays(today, i); const key = toKey(d); revEvolution.push({ label: d.toLocaleDateString(locale, { day: 'numeric', month: 'short' }), revenu: revenueOf(active.filter(r => r.date === key)) }); }
  const disciplineData = DISCIPLINES.map(d => ({ name: d, value: seasonR.filter(r => r.discipline === d).length }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="header-row">
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: C.navy }}>{tt('dashboard')}</h1>
          <p style={{ fontSize: 14, color: C.inkSoft, marginTop: 4 }}>{today.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={onNewReservation} style={{ display: 'flex', alignItems: 'center', gap: 8, background: ACCENTS.glacier, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}><Plus size={16} /> {tt('newReservation')}</button>
      </div>
      <div style={{ position: 'relative' }}>
        {!subscribed && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#fff', border: `1px solid ${C.iceLine}`, borderRadius: 14, padding: '20px 26px', boxShadow: '0 12px 30px -10px rgba(0,0,0,0.2)', textAlign: 'center', maxWidth: 320 }}>
              <div style={{ fontWeight: 700, color: C.navy, marginBottom: 6 }}>{tt('subscribeTitle')}</div>
              <div style={{ fontSize: 13, color: C.inkSoft }}>{tt('subscribeSub')}</div>
            </div>
          </div>
        )}
        <div className="kpi-grid-4" style={!subscribed ? { filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' } : {}}>
          <KpiCard C={C} label={tt('kpiTodayLessons')} value={todayR.length} sub={`${hoursOf(todayR).toFixed(1)}h ${tt('hoursTaught')}`} icon={CalendarIcon} accent={ACCENTS.blue} />
          <KpiCard C={C} label={tt('kpiWeekLessons')} value={weekR.length} sub={`${hoursOf(weekR).toFixed(1)}h ${tt('hoursTaught')}`} icon={Clock} accent={ACCENTS.green} />
          <KpiCard C={C} label={tt('kpiMonthRevenue')} value={fmtEUR(revenueOf(monthR), devise)} sub={`${monthR.length} ${tt('lessonsThisMonth')}`} icon={Euro} accent={ACCENTS.amber} />
          <KpiCard C={C} label={tt('kpiFillRate')} value={`${fillRate}%`} sub={tt('thisWeek')} icon={TrendingUp} accent={C.navy} />
        </div>
        <div className="kpi-grid-4" style={!subscribed ? { filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none', marginTop: 14 } : { marginTop: 14 }}>
          <KpiCard C={C} label={tt('kpiTodayRevenue')} value={fmtEUR(revenueOf(todayR), devise)} icon={Euro} accent={ACCENTS.green} />
          <KpiCard C={C} label={tt('kpiSeasonRevenue')} value={fmtEUR(revenueOf(seasonR), devise)} icon={Euro} accent={ACCENTS.blue} />
          <KpiCard C={C} label={tt('kpiTotalClients')} value={uniqueClients} sub={`${newClientsThisMonthCount} ${tt('newClientsThisMonth')}`} icon={Users} accent={ACCENTS.amber} />
          <KpiCard C={C} label={tt('kpiSeasonHours')} value={`${hoursOf(seasonR).toFixed(0)}h`} icon={Clock} accent={C.navy} />
        </div>
      </div>
      <div className="chart-grid">
        <div style={{ background: C.card, border: `1px solid ${C.iceLine}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14 }}>{tt('chartRevenue14d')}</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revEvolution}>
              <CartesianGrid stroke={C.ice} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={{ stroke: C.iceLine }} tickLine={false} interval={1} />
              <YAxis tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(v) => fmtEUR(v, devise)} contentStyle={{ borderRadius: 10, border: `1px solid ${C.iceLine}`, fontSize: 13 }} />
              <Line type="monotone" dataKey="revenu" stroke={ACCENTS.glacier} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.iceLine}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14 }}>{tt('chartDisciplineSplit')}</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={disciplineData}>
              <CartesianGrid stroke={C.ice} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.inkSoft }} axisLine={{ stroke: C.iceLine }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.iceLine}`, fontSize: 13 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>{disciplineData.map((d, i) => <Cell key={i} fill={disciplineColor(d.name)} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="two-col">
        <div style={{ background: C.card, border: `1px solid ${C.iceLine}`, borderRadius: 14, padding: '18px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 12 }}>{tt('upcomingLessons')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.length === 0 && <div style={{ fontSize: 13.5, color: C.inkSoft }}>{tt('noUpcomingLessons')}</div>}
            {upcoming.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: `1px dashed ${C.iceLine}` }}>
                <div><div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{r.prenom} {r.nom}</div><div style={{ fontSize: 12.5, color: C.inkSoft }}>{fmtDateShort(r.date)} · {r.heureDebut} · {r.station}</div></div>
                <Pill color={disciplineColor(r.discipline)}>{r.discipline}</Pill>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.iceLine}`, borderRadius: 14, padding: '18px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 12 }}>{tt('recentPayments')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lastPayments.length === 0 && <div style={{ fontSize: 13.5, color: C.inkSoft }}>{tt('noPaymentsRecorded')}</div>}
            {lastPayments.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: `1px dashed ${C.iceLine}` }}>
                <div><div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{r.prenom} {r.nom}</div><div style={{ fontSize: 12.5, color: C.inkSoft }}>{fmtDateShort(r.date)}</div></div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: ACCENTS.green }}>{fmtEUR(r.prix, devise)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================================
   CALENDAR
   ================================================================================== */
const DAY_START = 8, DAY_END = 19, ROW_HEIGHT = 52;

function MonthGrid({ anchor, reservations, onDayClick, C, langue }) {
  const days_short = DAYS_SHORT_MAP[langue] || DAYS_SHORT_MAP['Français'];
  const year = anchor.getFullYear(), month = anchor.getMonth();
  const start = startOfWeek(new Date(year, month, 1));
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const countFor = (key) => reservations.filter(r => r.date === key && r.statut !== 'Annulée').length;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.iceLine}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {days_short.map(d => <div key={d} style={{ textAlign: 'center', padding: '10px 0', fontSize: 11.5, fontWeight: 700, color: C.inkSoft, borderBottom: `1px solid ${C.iceLine}` }}>{d}</div>)}
        {days.map(d => {
          const key = toKey(d); const count = countFor(key); const inMonth = d.getMonth() === month;
          return (
            <div key={key} onClick={() => onDayClick(key)} style={{ minHeight: 84, borderRight: `1px solid ${C.iceLine}`, borderBottom: `1px solid ${C.iceLine}`, padding: 8, cursor: 'pointer', background: inMonth ? C.card : C.snowDim, opacity: inMonth ? 1 : 0.55 }}>
              <div style={{ fontSize: 12.5, fontWeight: key === toKey(new Date()) ? 700 : 500, color: key === toKey(new Date()) ? ACCENTS.glacier : C.ink }}>{d.getDate()}</div>
              {count > 0 && <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: ACCENTS.glacierDeep, background: C.ice, display: 'inline-block', padding: '2px 7px', borderRadius: 100 }}>{count} {tUI('lessonsCount', langue)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarView({ reservations, onSlotClick, onEventClick, C, subscribed, langue }) {
  const locale = LOCALE_MAP[langue] || 'fr-FR';
  const [view, setView] = useState('week');
  const [anchor, setAnchor] = useState(new Date());
  const weekStart = startOfWeek(anchor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);
  const byDate = useCallback((key) => reservations.filter(r => r.date === key && r.statut !== 'Annulée'), [reservations]);
  const navigate = (dir) => { if (view === 'month') setAnchor(d => { const x = new Date(d); x.setMonth(x.getMonth() + dir); return x; }); else if (view === 'week') setAnchor(d => addDays(d, dir * 7)); else setAnchor(d => addDays(d, dir)); };
  const label = view === 'month' ? anchor.toLocaleDateString(locale, { month: 'long', year: 'numeric' }) : view === 'week' ? `${weekDays[0].toLocaleDateString(locale, { day: 'numeric', month: 'short' })} — ${weekDays[6].toLocaleDateString(locale, { day: 'numeric', month: 'short' })}` : anchor.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

  const renderDayColumn = (day) => {
    const key = toKey(day); const events = byDate(key); const isToday = key === toKey(new Date());
    return (
      <div key={key} style={{ flex: 1, position: 'relative', borderLeft: `1px solid ${C.iceLine}` }}>
        {hours.map(h => <div key={h} onClick={() => onSlotClick(key, `${pad(h)}:00`)} style={{ height: ROW_HEIGHT, borderBottom: `1px solid ${C.iceLine}`, cursor: 'pointer' }} />)}
        {events.map(ev => {
          const startM = timeToMinutes(ev.heureDebut) - DAY_START * 60, endM = timeToMinutes(ev.heureFin) - DAY_START * 60;
          const top = (startM / 60) * ROW_HEIGHT, height = Math.max(((endM - startM) / 60) * ROW_HEIGHT, 24);
          return (
            <div key={ev.id} onClick={(e) => { e.stopPropagation(); onEventClick(ev); }} style={{ position: 'absolute', top, height, left: 4, right: 4, background: C.card, borderLeft: `3px solid ${disciplineColor(ev.discipline)}`, borderRadius: 6, padding: '4px 7px', boxShadow: '0 2px 8px -3px rgba(0,0,0,0.25)', cursor: 'pointer', overflow: 'hidden', zIndex: 2 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.prenom} {ev.nom}</div>
              <div style={{ fontSize: 10.5, color: C.inkSoft }}>{ev.heureDebut}–{ev.heureFin}</div>
            </div>
          );
        })}
        {isToday && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: `inset 0 0 0 2px ${ACCENTS.glacier}33` }} />}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="header-row">
        <div><h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: C.navy }}>{tUI('calendarTitle', langue)}</h1><p style={{ fontSize: 14, color: C.inkSoft, marginTop: 4, textTransform: 'capitalize' }}>{label}</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', border: `1px solid ${C.iceLine}`, borderRadius: 9, overflow: 'hidden' }}>
            {['day', 'week', 'month'].map(v => <button key={v} onClick={() => setView(v)} style={{ padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: view === v ? ACCENTS.glacier : C.card, color: view === v ? '#fff' : C.ink }}>{v === 'day' ? tUI('viewDay', langue) : v === 'week' ? tUI('viewWeek', langue) : tUI('viewMonth', langue)}</button>)}
          </div>
          <button onClick={() => navigate(-1)} style={{ border: `1px solid ${C.iceLine}`, background: C.card, color: C.ink, borderRadius: 8, padding: 8, cursor: 'pointer' }}><ChevronLeft size={16} /></button>
          <button onClick={() => setAnchor(new Date())} style={{ border: `1px solid ${C.iceLine}`, background: C.card, color: C.ink, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{tUI('today', langue)}</button>
          <button onClick={() => navigate(1)} style={{ border: `1px solid ${C.iceLine}`, background: C.card, color: C.ink, borderRadius: 8, padding: 8, cursor: 'pointer' }}><ChevronRight size={16} /></button>
        </div>
      </div>
      <BlurGate subscribed={subscribed} C={C}>
      {view === 'month' ? (
        <MonthGrid anchor={anchor} reservations={reservations} onDayClick={(key) => { setAnchor(new Date(key + 'T00:00:00')); setView('day'); }} C={C} langue={langue} />
      ) : (
        <div className="cal-scroll" style={{ background: C.card, border: `1px solid ${C.iceLine}`, borderRadius: 14, overflow: 'hidden' }}>
          <div className={view === 'week' ? 'cal-min' : ''}>
            <div style={{ display: 'flex' }}>
              <div style={{ width: 52, flexShrink: 0 }} />
              {(view === 'week' ? weekDays : [anchor]).map(d => (
                <div key={toKey(d)} style={{ flex: 1, textAlign: 'center', padding: '12px 0', borderBottom: `1px solid ${C.iceLine}`, borderLeft: `1px solid ${C.iceLine}` }}>
                  <div style={{ fontSize: 11.5, color: C.inkSoft, textTransform: 'uppercase', fontWeight: 600 }}>{d.toLocaleDateString(locale, { weekday: 'short' })}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: toKey(d) === toKey(new Date()) ? ACCENTS.glacier : C.navy }}>{d.getDate()}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ width: 52, flexShrink: 0 }}>{hours.map(h => <div key={h} style={{ height: ROW_HEIGHT, fontSize: 11, color: C.inkSoft, textAlign: 'right', paddingRight: 8, position: 'relative', top: -6 }}>{pad(h)}:00</div>)}</div>
              {(view === 'week' ? weekDays : [anchor]).map(renderDayColumn)}
            </div>
          </div>
        </div>
      )}
      </BlurGate>
    </div>
  );
}

/* ==================================================================================
   RESERVATIONS LIST
   ================================================================================== */
function ReservationsView({ reservations, onNew, onEdit, C, devise, langue }) {
  const [filter, setFilter] = useState(''); const [statutFilter, setStatutFilter] = useState('Tous');
  const filtered = reservations.filter(r => (statutFilter === 'Tous' || r.statut === statutFilter)).filter(r => (r.nom + r.prenom + r.station).toLowerCase().includes(filter.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date) || a.heureDebut.localeCompare(b.heureDebut));
  const th = { textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: '.03em', padding: '10px 14px', borderBottom: `1px solid ${C.iceLine}` };
  const td = { padding: '12px 14px', fontSize: 13.5, borderBottom: `1px solid ${C.iceLine}`, color: C.ink };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="header-row">
        <div><h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: C.navy }}>{tUI('reservations', langue)}</h1><p style={{ fontSize: 14, color: C.inkSoft, marginTop: 4 }}>{reservations.length} {tUI('totalReservations', langue)}</p></div>
        <button onClick={onNew} style={{ display: 'flex', alignItems: 'center', gap: 8, background: ACCENTS.glacier, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}><Plus size={16} /> {tUI('newReservation', langue)}</button>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input placeholder={tUI('searchClientStation', langue)} value={filter} onChange={e => setFilter(e.target.value)} style={{ flex: 1, border: `1px solid ${C.iceLine}`, borderRadius: 9, padding: '9px 14px', fontSize: 14, background: C.card, color: C.ink }} />
        <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)} style={{ border: `1px solid ${C.iceLine}`, borderRadius: 9, padding: '9px 14px', fontSize: 14, background: C.card, color: C.ink }}>{['Tous', ...STATUTS].map(s => <option key={s}>{s === 'Tous' ? tUI('filterAll', langue) : s}</option>)}</select>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.iceLine}`, borderRadius: 14, overflow: 'hidden', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>{tUI('thClient', langue)}</th><th style={th}>{tUI('fDate', langue)}</th><th style={th}>{tUI('thHoraire', langue)}</th><th style={th}>{tUI('fDiscipline', langue)}</th><th style={th}>{tUI('fStation', langue)}</th><th style={th}>{tUI('fPrix', langue)}</th><th style={th}>{tUI('fStatut', langue)}</th><th style={th}>{tUI('thPaiement', langue)}</th><th style={th}></th></tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => onEdit(r)}>
                <td style={td}>{r.prenom} {r.nom}</td><td style={td}>{fmtDateShort(r.date)}</td><td style={td}>{r.heureDebut}–{r.heureFin}</td>
                <td style={td}><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><Pill color={disciplineColor(r.discipline)}>{r.discipline}</Pill>{r.type && r.type !== 'Heure' && <Pill color={ACCENTS.amber}>{r.type}</Pill>}</div></td><td style={td}>{r.station}</td>
                <td style={{ ...td, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{fmtEUR(r.prix, devise)}</td>
                <td style={td}><Pill color={statutColor(r.statut)}>{r.statut}</Pill></td>
                <td style={td}><Pill color={r.paiement === 'Payé' ? ACCENTS.green : C.inkSoft}>{r.paiement}</Pill></td>
                <td style={{ ...td, textAlign: 'right' }}><Pencil size={14} color={C.inkSoft} /></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} style={{ ...td, textAlign: 'center', color: C.inkSoft, padding: '32px 14px' }}>{tUI('noResults', langue)}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==================================================================================
   CLIENTS (CRM)
   ================================================================================== */
function aggregateClients(reservations) {
  const map = {};
  reservations.forEach(r => { const key = (r.prenom + '|' + r.nom + '|' + r.telephone).toLowerCase(); if (!map[key]) map[key] = { key, prenom: r.prenom, nom: r.nom, telephone: r.telephone, email: r.email, nationalite: r.nationalite, langue: r.langue, reservations: [] }; map[key].reservations.push(r); });
  return Object.values(map).map(c => {
    const active = c.reservations.filter(r => r.statut !== 'Annulée');
    const totalHeures = active.reduce((s, r) => s + (timeToMinutes(r.heureFin) - timeToMinutes(r.heureDebut)) / 60, 0);
    const totalDepense = active.reduce((s, r) => s + Number(r.prix || 0), 0);
    const disciplines = {}; active.forEach(r => disciplines[r.discipline] = (disciplines[r.discipline] || 0) + 1);
    const preference = Object.entries(disciplines).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    const sorted = [...c.reservations].sort((a, b) => a.date.localeCompare(b.date));
    const niveau = sorted[sorted.length - 1]?.niveau || '—'; const lastDate = sorted[sorted.length - 1]?.date;
    const notes = c.reservations.map(r => r.notes).filter(Boolean);
    return { ...c, nbCours: active.length, totalHeures, totalDepense, preference, niveau, lastDate, notes };
  }).sort((a, b) => b.totalDepense - a.totalDepense);
}

function ClientModal({ client, onClose, C, devise, langue }) {
  const history = [...client.reservations].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,18,27,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={onClose}>
      <div style={{ background: C.snow, borderRadius: 18, width: '100%', maxWidth: 640, maxHeight: '86vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${C.iceLine}`, position: 'sticky', top: 0, background: C.snow }}>
          <div><div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: C.navy }}>{client.prenom} {client.nom}</div><div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2 }}>{client.telephone} · {client.email}</div></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkSoft }}><X size={20} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="kpi-grid-3">
            <KpiCard C={C} label={tUI('lessonsFollowed', langue)} value={client.nbCours} icon={Repeat} accent={ACCENTS.blue} />
            <KpiCard C={C} label={tUI('totalHours', langue)} value={`${client.totalHeures.toFixed(1)}h`} icon={TrendingUp} accent={ACCENTS.green} />
            <KpiCard C={C} label={tUI('totalSpent', langue)} value={fmtEUR(client.totalDepense, devise)} icon={Euro} accent={ACCENTS.amber} />
          </div>
          <div className="form-grid-2" style={{ fontSize: 13.5, color: C.ink }}>
            <div><span style={{ color: C.inkSoft }}>{tUI('fNationalite', langue)} :</span> {client.nationalite || '—'}</div>
            <div><span style={{ color: C.inkSoft }}>{tUI('fLangueParlee', langue)} :</span> {client.langue || '—'}</div>
            <div><span style={{ color: C.inkSoft }}>{tUI('fNiveau', langue)} :</span> {client.niveau}</div>
            <div><span style={{ color: C.inkSoft }}>{tUI('preferredDiscipline', langue)} :</span> {client.preference}</div>
          </div>
          {client.notes.length > 0 && (
            <div><div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 8 }}>{tUI('fNotes', langue)}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{client.notes.map((n, i) => <div key={i} style={{ fontSize: 13, color: C.inkSoft, background: C.snowDim, borderRadius: 8, padding: '8px 10px' }}>{n}</div>)}</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 8 }}>{tUI('lessonHistory', langue)}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', border: `1px solid ${C.iceLine}`, borderRadius: 9 }}>
                  <div><div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{fmtDateShort(r.date)} · {r.heureDebut}–{r.heureFin}</div><div style={{ fontSize: 12, color: C.inkSoft }}>{r.station} · {r.niveau}</div></div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Pill color={disciplineColor(r.discipline)}>{r.discipline}</Pill><span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13.5, color: C.ink }}>{fmtEUR(r.prix, devise)}</span></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 8 }}>{tUI('documents', langue)}</div>
            <div style={{ fontSize: 13, color: C.inkSoft, background: C.snowDim, borderRadius: 9, padding: '14px', textAlign: 'center' }}>{tUI('noDocuments', langue)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientsView({ reservations, C, devise, subscribed, langue }) {
  const [search, setSearch] = useState(''); const [selected, setSelected] = useState(null);
  const clients = useMemo(() => aggregateClients(reservations), [reservations]);
  const filtered = clients.filter(c => (c.prenom + c.nom).toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div><h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: C.navy }}>{tUI('clients', langue)}</h1><p style={{ fontSize: 14, color: C.inkSoft, marginTop: 4 }}>{clients.length} {tUI('clientsInCrm', langue)}</p></div>
      <BlurGate subscribed={subscribed} C={C}>
      <div style={{ position: 'relative', maxWidth: 360 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: C.inkSoft }} />
        <input placeholder={tUI('searchClient', langue)} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', border: `1px solid ${C.iceLine}`, borderRadius: 9, padding: '9px 14px 9px 34px', fontSize: 14, background: C.card, color: C.ink }} />
      </div>
      <div className="clients-grid">
        {filtered.map(c => (
          <div key={c.key} onClick={() => setSelected(c)} style={{ background: C.card, border: `1px solid ${C.iceLine}`, borderRadius: 14, padding: '18px 20px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{c.prenom} {c.nom}</div>
              <Pill color={disciplineColor(c.preference)}>{c.preference}</Pill>
            </div>
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 4 }}>{c.nationalite} · {c.niveau}</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
              <div><div style={{ fontSize: 11.5, color: C.inkSoft }}>{tUI('miniLessons', langue)}</div><div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: C.ink }}>{c.nbCours}</div></div>
              <div><div style={{ fontSize: 11.5, color: C.inkSoft }}>{tUI('miniHours', langue)}</div><div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: C.ink }}>{c.totalHeures.toFixed(1)}h</div></div>
              <div><div style={{ fontSize: 11.5, color: C.inkSoft }}>{tUI('miniSpent', langue)}</div><div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: ACCENTS.green }}>{fmtEUR(c.totalDepense, devise)}</div></div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ color: C.inkSoft, fontSize: 14 }}>{tUI('noClientsMatch', langue)}</div>}
      </div>
      </BlurGate>
      {selected && <ClientModal client={selected} onClose={() => setSelected(null)} C={C} devise={devise} langue={langue} />}
    </div>
  );
}

/* ==================================================================================
   PAIEMENTS
   ================================================================================== */
function InvoiceModal({ reservation, onClose, C, devise, settings }) {
  const invoiceNumber = `${String(reservation.id).slice(-6)}${new Date(reservation.date).getFullYear()}`;
  const todayStr = new Date().toLocaleDateString('fr-FR');
  const hasBank = settings.iban || settings.bic || settings.banque;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,18,27,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 560, padding: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: '#16232F' }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}>{settings.nom}{settings.profession ? `. ${settings.profession}` : ''}</div>
            {settings.adresse && <div>{settings.adresse}</div>}
            {settings.telephone && <div>{settings.telephone}</div>}
            {settings.email && <div>{settings.email}</div>}
            {settings.siret && <div>SIRET : {settings.siret}</div>}
          </div>
          <div style={{ textAlign: 'right', fontSize: 12.5, color: '#5A6B7A' }}>{todayStr}</div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: '#10233D' }}>INVOICE n°{invoiceNumber}</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#16232F', marginTop: 4 }}>{reservation.prenom} {reservation.nom}</div>
        </div>

        <div style={{ fontSize: 13.5, marginBottom: 10 }}>
          Cours de {reservation.discipline.toLowerCase()} à {reservation.station || ''} — {fmtDateShort(reservation.date)} ({reservation.heureDebut}–{reservation.heureFin})
        </div>

        <div style={{ textAlign: 'center', marginTop: 18, marginBottom: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#10233D' }}>TOTAL TTC : {fmtEUR(reservation.prix, devise)}</div>
          <div style={{ fontSize: 12, fontStyle: 'italic', color: '#5A6B7A', marginTop: 4 }}>TVA non applicable, article 293 B du CGI</div>
        </div>

        {reservation.modePaiement && reservation.modePaiement !== 'Non renseigné' && (
          <div style={{ fontSize: 12.5, color: '#5A6B7A', textAlign: 'center', marginTop: 14 }}>Réglé en direct — {reservation.modePaiement}</div>
        )}

        {hasBank && (
          <div style={{ marginTop: 26, paddingTop: 18, borderTop: `1px solid #D3DEE6`, fontSize: 12, color: '#5A6B7A', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, color: '#16232F', marginBottom: 6 }}>Relevé d'Identité Bancaire</div>
            <div>Titulaire du compte : {settings.nom}</div>
            {settings.iban && <div>IBAN : {settings.iban}</div>}
            {settings.bic && <div>BIC : {settings.bic}</div>}
            {settings.banque && <div>Banque : {settings.banque}</div>}
          </div>
        )}

        <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: '#10233D', color: '#fff', border: 'none', borderRadius: 9, padding: '11px', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 26 }}><Printer size={15} /> Imprimer / Enregistrer en PDF</button>
        <button onClick={onClose} style={{ display: 'block', margin: '10px auto 0', background: 'none', border: 'none', cursor: 'pointer', color: '#5A6B7A', fontSize: 13 }}>Fermer</button>
      </div>
    </div>
  );
}

function PaiementsView({ reservations, onUpdate, onDelete, C, devise, settings, subscribed }) {
  const [invoiceFor, setInvoiceFor] = useState(null);
  const [subView, setSubView] = useState('paiements'); // 'paiements' | 'factures'
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const sorted = [...reservations].filter(r => r.statut !== 'Annulée').sort((a, b) => b.date.localeCompare(a.date));
  const encaisse = sorted.filter(r => r.paiement === 'Payé').reduce((s, r) => s + Number(r.prix || 0), 0);
  const enAttente = sorted.filter(r => r.paiement !== 'Payé').reduce((s, r) => s + Number(r.prix || 0), 0);
  const factures = sorted.filter(r => (r.prenom + r.nom).toLowerCase().includes(search.toLowerCase()) || String(r.id).slice(-6).includes(search));
  const exportCSV = () => {
    const rows = [['Date', 'Client', 'Discipline', 'Station', 'Prix', 'Paiement', 'Mode de règlement']];
    sorted.forEach(r => rows.push([r.date, `${r.prenom} ${r.nom}`, r.discipline, r.station, r.prix, r.paiement, r.modePaiement || '']));
    const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'skipro-paiements.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  const handleDeleteClick = (id) => {
    if (confirmDeleteId === id) { onDelete(id); setConfirmDeleteId(null); }
    else setConfirmDeleteId(id);
  };
  const th = { textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: '.03em', padding: '10px 14px', borderBottom: `1px solid ${C.iceLine}` };
  const td = { padding: '11px 14px', fontSize: 13.5, borderBottom: `1px solid ${C.iceLine}`, color: C.ink };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="header-row">
        <div><h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: C.navy }}>Paiements &amp; Factures</h1><p style={{ fontSize: 14, color: C.inkSoft, marginTop: 4 }}>Suivi des encaissements, export comptable et factures clients</p></div>
        <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.card, border: `1px solid ${C.iceLine}`, color: C.ink, borderRadius: 9, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}><Download size={15} /> Exporter (CSV)</button>
      </div>
      <BlurGate subscribed={subscribed} C={C}>
      <div className="kpi-grid-3">
        <KpiCard C={C} label="Encaissé" value={fmtEUR(encaisse, devise)} icon={Euro} accent={ACCENTS.green} />
        <KpiCard C={C} label="En attente" value={fmtEUR(enAttente, devise)} icon={Euro} accent={ACCENTS.amber} />
        <KpiCard C={C} label="Total facturé" value={fmtEUR(encaisse + enAttente, devise)} icon={Euro} accent={C.navy} />
      </div>

      <div style={{ display: 'flex', border: `1px solid ${C.iceLine}`, borderRadius: 9, overflow: 'hidden', width: 'fit-content' }}>
        <button onClick={() => setSubView('paiements')} style={{ padding: '9px 18px', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, background: subView === 'paiements' ? ACCENTS.glacier : C.card, color: subView === 'paiements' ? '#fff' : C.ink }}>Suivi des paiements</button>
        <button onClick={() => setSubView('factures')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, background: subView === 'factures' ? ACCENTS.glacier : C.card, color: subView === 'factures' ? '#fff' : C.ink }}><FileText size={14} /> Factures ({sorted.length})</button>
      </div>

      {subView === 'paiements' ? (
        <div style={{ background: C.card, border: `1px solid ${C.iceLine}`, borderRadius: 14, overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Client</th><th style={th}>Date</th><th style={th}>Montant</th><th style={th}>Statut</th><th style={th}>Mode</th><th style={th}></th><th style={th}></th></tr></thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r.id}>
                  <td style={td}>{r.prenom} {r.nom}</td><td style={td}>{fmtDateShort(r.date)}</td>
                  <td style={{ ...td, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{fmtEUR(r.prix, devise)}</td>
                  <td style={td}><Pill color={r.paiement === 'Payé' ? ACCENTS.green : C.inkSoft}>{r.paiement}</Pill></td>
                  <td style={td}><select value={r.modePaiement || 'Non renseigné'} onChange={e => { const modePaiement = e.target.value; onUpdate({ ...r, modePaiement, paiement: modePaiement === 'Non renseigné' ? 'Non payé' : 'Payé' }); }} style={{ border: `1px solid ${C.iceLine}`, borderRadius: 7, padding: '5px 8px', fontSize: 12.5, color: C.inkSoft, fontWeight: 600, background: C.card }}>{MODES_PAIEMENT.map(m => <option key={m}>{m}</option>)}</select></td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <button onClick={() => setInvoiceFor(r)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: ACCENTS.glacier + '15', border: 'none', color: ACCENTS.glacierDeep, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, padding: '6px 12px', borderRadius: 7 }}><FileText size={13} /> Facture</button>
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    {confirmDeleteId === r.id ? (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => handleDeleteClick(r.id)} style={{ background: ACCENTS.red, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '6px 10px', borderRadius: 7 }}>Confirmer</button>
                        <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'none', border: `1px solid ${C.iceLine}`, color: C.ink, cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '6px 10px', borderRadius: 7 }}>Annuler</button>
                      </div>
                    ) : (
                      <button onClick={() => handleDeleteClick(r.id)} title="Supprimer cette facture" style={{ background: 'none', border: 'none', color: C.inkSoft, cursor: 'pointer', padding: 6 }}><Trash2 size={15} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ position: 'relative', maxWidth: 360 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: C.inkSoft }} />
            <input placeholder="Rechercher un client, un n° de facture..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', border: `1px solid ${C.iceLine}`, borderRadius: 9, padding: '9px 14px 9px 34px', fontSize: 14, background: C.card, color: C.ink }} />
          </div>
          <div className="clients-grid">
            {factures.map(r => (
              <div key={r.id} style={{ background: C.card, border: `1px solid ${C.iceLine}`, borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11.5, color: C.inkSoft, fontWeight: 600 }}>N° {String(r.id).slice(-6)}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginTop: 2 }}>{r.prenom} {r.nom}</div>
                  </div>
                  <Pill color={r.paiement === 'Payé' ? ACCENTS.green : ACCENTS.amber}>{r.paiement}</Pill>
                </div>
                <div style={{ fontSize: 12.5, color: C.inkSoft }}>{fmtDateShort(r.date)} · {r.discipline} · {r.station}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: C.navy }}>{fmtEUR(r.prix, devise)}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setInvoiceFor(r)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: ACCENTS.glacier, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, padding: '7px 13px', borderRadius: 8 }}><Printer size={13} /> Voir</button>
                    {confirmDeleteId === r.id ? (
                      <>
                        <button onClick={() => handleDeleteClick(r.id)} style={{ background: ACCENTS.red, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '7px 10px', borderRadius: 8 }}>Confirmer</button>
                        <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'none', border: `1px solid ${C.iceLine}`, color: C.ink, cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '7px 10px', borderRadius: 8 }}>Annuler</button>
                      </>
                    ) : (
                      <button onClick={() => handleDeleteClick(r.id)} title="Supprimer cette facture" style={{ background: 'none', border: `1px solid ${C.iceLine}`, color: C.inkSoft, cursor: 'pointer', padding: '7px 9px', borderRadius: 8 }}><Trash2 size={13} /></button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {factures.length === 0 && <div style={{ color: C.inkSoft, fontSize: 14 }}>Aucune facture ne correspond à votre recherche.</div>}
          </div>
        </div>
      )}

      </BlurGate>
      {invoiceFor && <InvoiceModal reservation={invoiceFor} onClose={() => setInvoiceFor(null)} C={C} devise={devise} settings={settings} />}
    </div>
  );
}

/* ==================================================================================
   STATISTIQUES
   ================================================================================== */
function StatsView({ reservations, C, devise, subscribed }) {
  const active = reservations.filter(r => r.statut !== 'Annulée');
  const clients = aggregateClients(reservations);
  const totalHeures = active.reduce((s, r) => s + (timeToMinutes(r.heureFin) - timeToMinutes(r.heureDebut)) / 60, 0);
  const totalRevenu = active.reduce((s, r) => s + Number(r.prix || 0), 0);
  const revenuMoyenHeure = totalHeures > 0 ? totalRevenu / totalHeures : 0;
  const revenuMoyenClient = clients.length > 0 ? totalRevenu / clients.length : 0;
  const tauxAnnulation = reservations.length > 0 ? (reservations.filter(r => r.statut === 'Annulée').length / reservations.length) * 100 : 0;
  const tauxFidelisation = clients.length > 0 ? (clients.filter(c => c.nbCours > 1).length / clients.length) * 100 : 0;
  const natCount = {}; clients.forEach(c => { const n = c.nationalite || 'Non renseignée'; natCount[n] = (natCount[n] || 0) + 1; });
  const natData = Object.entries(natCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
  const stationCount = {}; active.forEach(r => { stationCount[r.station] = (stationCount[r.station] || 0) + 1; });
  const stationData = Object.entries(stationCount).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div><h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: C.navy }}>Statistiques</h1><p style={{ fontSize: 14, color: C.inkSoft, marginTop: 4 }}>Vue d'ensemble de votre activité</p></div>
      <BlurGate subscribed={subscribed} C={C}>
      <div className="kpi-grid-4">
        <KpiCard C={C} label="Heures enseignées" value={`${totalHeures.toFixed(0)}h`} icon={TrendingUp} accent={ACCENTS.blue} />
        <KpiCard C={C} label="Cours réalisés" value={active.length} icon={Repeat} accent={ACCENTS.green} />
        <KpiCard C={C} label="Clients" value={clients.length} icon={Users} accent={ACCENTS.amber} />
        <KpiCard C={C} label="Revenu moyen / heure" value={fmtEUR(revenuMoyenHeure, devise)} icon={Euro} accent={C.navy} />
      </div>
      <div className="kpi-grid-4">
        <KpiCard C={C} label="Revenu moyen / client" value={fmtEUR(revenuMoyenClient, devise)} icon={Euro} accent={ACCENTS.blue} />
        <KpiCard C={C} label="Taux d'annulation" value={`${tauxAnnulation.toFixed(0)}%`} icon={TrendingDown} accent={ACCENTS.red} />
        <KpiCard C={C} label="Taux de fidélisation" value={`${tauxFidelisation.toFixed(0)}%`} sub="clients avec 2+ cours" icon={Repeat} accent={ACCENTS.green} />
        <KpiCard C={C} label="Revenu total" value={fmtEUR(totalRevenu, devise)} icon={Euro} accent={ACCENTS.amber} />
      </div>
      <div className="two-col">
        <div style={{ background: C.card, border: `1px solid ${C.iceLine}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14 }}><Globe2 size={15} /> Nationalités des clients</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={natData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid stroke={C.ice} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: C.ink }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.iceLine}`, fontSize: 13 }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} fill={ACCENTS.glacier} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.iceLine}`, borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14 }}><MapPin size={15} /> Stations les plus fréquentées</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stationData}>
              <CartesianGrid stroke={C.ice} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: C.inkSoft }} axisLine={{ stroke: C.iceLine }} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.iceLine}`, fontSize: 13 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>{stationData.map((d, i) => <Cell key={i} fill={i === 0 ? ACCENTS.amber : C.navy} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      </BlurGate>
    </div>
  );
}

/* ==================================================================================
   PARAMETRES
   ================================================================================== */
function ParametresView({ settings, onSave, C, subscribed }) {
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubscribe = async () => {
    setSubLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { alert('Erreur : ' + (data.error || 'inconnue')); setSubLoading(false); }
    } catch (e) {
      alert('Erreur de connexion à Stripe.');
      setSubLoading(false);
    }
  };
  const toggleJour = (j) => setForm(f => ({ ...f, joursRepos: f.joursRepos.includes(j) ? f.joursRepos.filter(x => x !== j) : [...f.joursRepos, j] }));
  const inputStyle = { border: `1px solid ${C.iceLine}`, borderRadius: 8, padding: '9px 11px', fontSize: 14, background: C.card, color: C.ink, width: '100%' };
  const section = (title, content) => (
    <div style={{ background: C.card, border: `1px solid ${C.iceLine}`, borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{title}</div>
      {content}
    </div>
  );
  const field = (label, input) => <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><label style={{ fontSize: 12, fontWeight: 600, color: C.inkSoft }}>{label}</label>{input}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 780 }}>
      <div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: C.navy }}>Paramètres</h1>
        <p style={{ fontSize: 14, color: C.inkSoft, marginTop: 4 }}>Personnalisez votre compte et vos tarifs</p>
      </div>

      {section('Abonnement', (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>SkiPro — 29€/mois</div>
            <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2 }}>Toutes les fonctionnalités incluses. Résiliable à tout moment.</div>
          </div>
          {subscribed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#E6F4EA', color: '#1E7A3D', borderRadius: 9, padding: '11px 18px', fontSize: 14, fontWeight: 600 }}>
              ✓ Abonnement actif
            </div>
          ) : (
            <button onClick={handleSubscribe} disabled={subLoading} style={{ background: '#2E6F8E', color: '#fff', border: 'none', borderRadius: 9, padding: '11px 22px', fontSize: 14, fontWeight: 600, cursor: subLoading ? 'default' : 'pointer', opacity: subLoading ? 0.7 : 1 }}>
              {subLoading ? 'Un instant...' : "S'abonner"}
            </button>
          )}
        </div>
      ))}

      <BlurGate subscribed={subscribed} C={C}>
      {section('Coordonnées', (
        <>
        <div className="form-grid-2">
          {field('Nom affiché', <input style={inputStyle} value={form.nom} onChange={set('nom')} />)}
          {field('E-mail', <input style={inputStyle} value={form.email} onChange={set('email')} />)}
          {field('Téléphone', <input style={inputStyle} value={form.telephone || ''} onChange={set('telephone')} />)}
          {field('Numéro SIRET', <input style={inputStyle} value={form.siret || ''} onChange={set('siret')} placeholder="XXX XXX XXX XXXXX" />)}
        </div>
        <div style={{ marginTop: 14 }}>
          {field('Adresse postale', <input style={inputStyle} value={form.adresse || ''} onChange={set('adresse')} placeholder="Numéro, rue, code postal, ville" />)}
        </div>
        </>
      ))}

      {section('Coordonnées bancaires (pour vos factures)', (
        <>
        <div className="form-grid-2">
          {field('IBAN', <input style={inputStyle} value={form.iban || ''} onChange={set('iban')} placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" />)}
          {field('BIC', <input style={inputStyle} value={form.bic || ''} onChange={set('bic')} placeholder="XXXXFRPPXXX" />)}
        </div>
        <div style={{ marginTop: 14 }}>
          {field('Nom de la banque', <input style={inputStyle} value={form.banque || ''} onChange={set('banque')} placeholder="Ex: Caisse d'Épargne Rhône Alpes" />)}
        </div>
        </>
      ))}

      {section('Préférences régionales', (
        <div className="form-grid-3">
          {field('Devise', <select style={inputStyle} value={form.devise} onChange={set('devise')}><option value="EUR">Euro (€)</option><option value="CHF">Franc suisse (CHF)</option><option value="USD">Dollar ($)</option></select>)}
          {field('Langue de l\'interface', <select style={inputStyle} value={form.langue} onChange={set('langue')}><option>Français</option><option>Anglais</option><option>Espagnol</option><option>Italien</option><option>Portugais</option></select>)}
          {field('Fuseau horaire', <select style={inputStyle} value={form.fuseauHoraire} onChange={set('fuseauHoraire')}><option value="Europe/Paris">Europe/Paris</option><option value="Europe/Zurich">Europe/Zurich</option></select>)}
        </div>
      ))}

      {section('Périodes de saison', (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setForm(f => ({ ...f, seasonMode: 'vacances' }))} style={{ flex: 1, padding: '9px 12px', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, border: `1px solid ${form.seasonMode === 'vacances' ? ACCENTS.glacier : C.iceLine}`, background: form.seasonMode === 'vacances' ? ACCENTS.glacier + '18' : C.card, color: form.seasonMode === 'vacances' ? ACCENTS.glacierDeep : C.ink }}>Vacances scolaires (auto)</button>
            <button type="button" onClick={() => setForm(f => ({ ...f, seasonMode: 'manuel' }))} style={{ flex: 1, padding: '9px 12px', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, border: `1px solid ${form.seasonMode === 'manuel' ? ACCENTS.glacier : C.iceLine}`, background: form.seasonMode === 'manuel' ? ACCENTS.glacier + '18' : C.card, color: form.seasonMode === 'manuel' ? ACCENTS.glacierDeep : C.ink }}>Période manuelle</button>
          </div>

          {form.seasonMode === 'vacances' ? (
            <div>
              {field('Zone académique de référence', (
                <select style={inputStyle} value={form.zoneVacances} onChange={set('zoneVacances')}>
                  <option value="Toutes">Toutes les zones (recommandé pour une clientèle nationale)</option>
                  <option value="A">Zone A</option>
                  <option value="B">Zone B</option>
                  <option value="C">Zone C</option>
                </select>
              ))}
              <p style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 10 }}>
                La haute saison correspond automatiquement aux vacances de Noël, d'Hiver et de Printemps (dates officielles Éducation nationale 2025-2026 et 2026-2027). "Toutes les zones" prend la période la plus large, utile si vos clients viennent de toute la France.
              </p>
            </div>
          ) : (
            <div>
              <div className="form-grid-2">
                {field('Début haute saison (MM-JJ)', <input style={inputStyle} placeholder="12-20" value={form.hauteSaisonDebut} onChange={set('hauteSaisonDebut')} />)}
                {field('Fin haute saison (MM-JJ)', <input style={inputStyle} placeholder="02-28" value={form.hauteSaisonFin} onChange={set('hauteSaisonFin')} />)}
              </div>
              <p style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 10 }}>Toute date hors de cette période est considérée en basse saison.</p>
            </div>
          )}
        </div>
      ))}

      {section('Tarifs horaires', (
        <div className="form-grid-2">
          {field(`Ski — Haute saison (${form.devise}/h)`, <input type="number" style={inputStyle} value={form.tarifSkiHaute} onChange={set('tarifSkiHaute')} />)}
          {field(`Ski — Basse saison (${form.devise}/h)`, <input type="number" style={inputStyle} value={form.tarifSkiBasse} onChange={set('tarifSkiBasse')} />)}
          {field(`Snowboard — Haute saison (${form.devise}/h)`, <input type="number" style={inputStyle} value={form.tarifSnowboardHaute} onChange={set('tarifSnowboardHaute')} />)}
          {field(`Snowboard — Basse saison (${form.devise}/h)`, <input type="number" style={inputStyle} value={form.tarifSnowboardBasse} onChange={set('tarifSnowboardBasse')} />)}
        </div>
      ))}

      {section('Tarifs forfaitaires', (
        <div className="form-grid-2">
          {field(`Demi-journée — Haute saison (${form.devise})`, <input type="number" style={inputStyle} value={form.tarifDemiJourneeHaute} onChange={set('tarifDemiJourneeHaute')} />)}
          {field(`Demi-journée — Basse saison (${form.devise})`, <input type="number" style={inputStyle} value={form.tarifDemiJourneeBasse} onChange={set('tarifDemiJourneeBasse')} />)}
          {field(`Journée — Haute saison (${form.devise})`, <input type="number" style={inputStyle} value={form.tarifJourneeHaute} onChange={set('tarifJourneeHaute')} />)}
          {field(`Journée — Basse saison (${form.devise})`, <input type="number" style={inputStyle} value={form.tarifJourneeBasse} onChange={set('tarifJourneeBasse')} />)}
        </div>
      ))}

      {section('Horaires des demi-journées', (
        <div className="form-grid-2">
          {field('Matin — début', <input type="time" style={inputStyle} value={form.matinDebut || '09:00'} onChange={set('matinDebut')} />)}
          {field('Matin — fin', <input type="time" style={inputStyle} value={form.matinFin || '12:30'} onChange={set('matinFin')} />)}
          {field('Après-midi — début', <input type="time" style={inputStyle} value={form.apresMidiDebut || '13:30'} onChange={set('apresMidiDebut')} />)}
          {field('Après-midi — fin', <input type="time" style={inputStyle} value={form.apresMidiFin || '17:00'} onChange={set('apresMidiFin')} />)}
        </div>
      ))}

      {section('Jours de repos', (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {JOURS.map(j => (
            <button key={j} onClick={() => toggleJour(j)} style={{ padding: '7px 14px', borderRadius: 100, border: `1px solid ${form.joursRepos.includes(j) ? ACCENTS.glacier : C.iceLine}`, background: form.joursRepos.includes(j) ? ACCENTS.glacier + '18' : C.card, color: form.joursRepos.includes(j) ? ACCENTS.glacierDeep : C.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{j}</button>
          ))}
        </div>
      ))}

      {section('Apparence', (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setForm(f => ({ ...f, theme: 'light' }))} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 9, border: `1px solid ${form.theme === 'light' ? ACCENTS.glacier : C.iceLine}`, background: form.theme === 'light' ? ACCENTS.glacier + '18' : C.card, color: C.ink, cursor: 'pointer', fontSize: 13.5, fontWeight: 600 }}><Sun size={15} /> Clair</button>
          <button onClick={() => setForm(f => ({ ...f, theme: 'dark' }))} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 9, border: `1px solid ${form.theme === 'dark' ? ACCENTS.glacier : C.iceLine}`, background: form.theme === 'dark' ? ACCENTS.glacier + '18' : C.card, color: C.ink, cursor: 'pointer', fontSize: 13.5, fontWeight: 600 }}><Moon size={15} /> Sombre</button>
        </div>
      ))}

      {section('Notifications', (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.ink }}><input type="checkbox" checked={form.notifEmail} onChange={e => setForm(f => ({ ...f, notifEmail: e.target.checked }))} /> Recevoir les confirmations par e-mail</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.ink }}><input type="checkbox" checked={form.notifSMS} onChange={e => setForm(f => ({ ...f, notifSMS: e.target.checked }))} /> Recevoir les rappels par SMS</label>
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => { onSave(form); setSaved(true); setTimeout(() => setSaved(false), 2000); }} style={{ background: ACCENTS.glacier, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Enregistrer</button>
        {saved && <span style={{ fontSize: 13.5, color: ACCENTS.green, fontWeight: 600 }}>Paramètres enregistrés ✓</span>}
      </div>
      </BlurGate>
    </div>
  );
}

/* ==================================================================================
   AUTH SCREEN (prototype visuel — non connecté à un vrai système d'authentification)
   ================================================================================== */
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [form, setForm] = useState({ nom: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [sentReset, setSentReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const C = PALETTES.light;
  const inputStyle = { border: `1px solid ${C.iceLine}`, borderRadius: 9, padding: '10px 12px 10px 38px', fontSize: 14.5, fontFamily: 'Inter, sans-serif', color: C.ink, background: '#fff', width: '100%' };
  const wrapField = (icon, input) => <div style={{ position: 'relative' }}>{icon}{input}</div>;

  const handleSubmit = async () => {
    if (mode === 'signup') {
      if (!form.nom || !form.email || !form.password) { setError('Merci de remplir tous les champs.'); return; }
      if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
      setError(''); setLoading(true);
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email, password: form.password, options: { data: { nom: form.nom } }
      });
      setLoading(false);
      if (signUpError) { setError(signUpError.message); return; }
      setError('Compte créé ! Vérifie tes e-mails pour confirmer ton adresse, puis connecte-toi.');
      setMode('login');
      return;
    } else if (mode === 'login') {
      if (!form.email || !form.password) { setError('Merci de renseigner ton e-mail et ton mot de passe.'); return; }
      setError(''); setLoading(true);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      setLoading(false);
      if (signInError) { setError(signInError.message); return; }
      onAuth();
      return;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.snow, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 28, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: C.navy }}>
          <span style={{ width: 20, height: 20, borderRadius: 5, background: `linear-gradient(135deg, ${ACCENTS.green} 33%, ${ACCENTS.blue} 33% 66%, #000 66%)` }} />
          SkiPro
        </div>
        <div style={{ background: '#fff', border: `1px solid ${C.iceLine}`, borderRadius: 18, padding: 28, boxShadow: '0 24px 60px -30px rgba(16,35,61,0.25)' }}>
          {mode !== 'forgot' && (
            <div style={{ display: 'flex', border: `1px solid ${C.iceLine}`, borderRadius: 9, overflow: 'hidden', marginBottom: 22 }}>
              <button onClick={() => { setMode('login'); setError(''); }} style={{ flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, background: mode === 'login' ? ACCENTS.glacier : '#fff', color: mode === 'login' ? '#fff' : C.ink }}>Connexion</button>
              <button onClick={() => { setMode('signup'); setError(''); }} style={{ flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, background: mode === 'signup' ? ACCENTS.glacier : '#fff', color: mode === 'signup' ? '#fff' : C.ink }}>Inscription</button>
            </div>
          )}

          {mode === 'forgot' ? (
            sentReset ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: 14, color: C.ink, marginBottom: 18 }}>Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé.</div>
                <button onClick={() => { setMode('login'); setSentReset(false); }} style={{ background: 'none', border: 'none', color: ACCENTS.glacierDeep, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Retour à la connexion</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: C.navy, marginBottom: 4 }}>Mot de passe oublié</div>
                  <div style={{ fontSize: 13, color: C.inkSoft }}>Indique ton e-mail, on t'enverra un lien de réinitialisation.</div>
                </div>
                {wrapField(<Mail size={15} color={C.inkSoft} style={{ position: 'absolute', left: 12, top: 12 }} />, <input placeholder="E-mail" style={inputStyle} value={form.email} onChange={set('email')} />)}
                <button onClick={async () => { await supabase.auth.resetPasswordForEmail(form.email); setSentReset(true); }} style={{ background: ACCENTS.glacier, color: '#fff', border: 'none', borderRadius: 9, padding: '11px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Envoyer le lien</button>
                <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: C.inkSoft, fontSize: 13, cursor: 'pointer' }}>← Retour à la connexion</button>
              </div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {mode === 'signup' && wrapField(<User size={15} color={C.inkSoft} style={{ position: 'absolute', left: 12, top: 12 }} />, <input placeholder="Prénom et nom (ex: Julien Berthier)" style={inputStyle} value={form.nom} onChange={set('nom')} />)}
              {wrapField(<Mail size={15} color={C.inkSoft} style={{ position: 'absolute', left: 12, top: 12 }} />, <input placeholder="E-mail" style={inputStyle} value={form.email} onChange={set('email')} />)}
              {wrapField(<Lock size={15} color={C.inkSoft} style={{ position: 'absolute', left: 12, top: 12 }} />, <input type="password" placeholder="Mot de passe" style={inputStyle} value={form.password} onChange={set('password')} />)}
              {mode === 'signup' && wrapField(<Lock size={15} color={C.inkSoft} style={{ position: 'absolute', left: 12, top: 12 }} />, <input type="password" placeholder="Confirmer le mot de passe" style={inputStyle} value={form.confirm} onChange={set('confirm')} />)}

              {mode === 'login' && (
                <div style={{ textAlign: 'right' }}>
                  <button onClick={() => { setMode('forgot'); setError(''); }} style={{ background: 'none', border: 'none', color: ACCENTS.glacierDeep, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Mot de passe oublié ?</button>
                </div>
              )}

              {error && <div style={{ fontSize: 12.5, color: ACCENTS.red, background: ACCENTS.red + '12', borderRadius: 8, padding: '9px 11px' }}>{error}</div>}

              <button onClick={handleSubmit} disabled={loading} style={{ background: ACCENTS.glacier, color: '#fff', border: 'none', borderRadius: 9, padding: '11px', fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Un instant...' : (mode === 'login' ? 'Se connecter' : 'Créer mon compte')}
              </button>
            </div>
          )}
        </div>
        <p style={{ textAlign: 'center', fontSize: 11.5, color: C.inkSoft, marginTop: 16 }}>Version prototype — l'authentification n'est pas encore reliée à une vraie base de données.</p>
      </div>
    </div>
  );
}

/* ==================================================================================
   APP SHELL
   ================================================================================== */
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('abonnement') === 'succes') {
        try { await window.storage.set('skipro-abonnement-v1', 'actif'); } catch (e) {}
        window.history.replaceState({}, '', window.location.pathname);
      }
      try {
        const r = await window.storage.get('skipro-abonnement-v1');
        setSubscribed(r.value === 'actif');
      } catch (e) { setSubscribed(false); }
    })();
  }, [authed]);
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      setAuthChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  const [reservations, setReservations] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet'; document.head.appendChild(link);
    (async () => {
      const [r, s] = await Promise.all([loadReservations(), loadSettings()]);
      setReservations(r); setSettings(s); setLoading(false);
    })();
  }, []);

  const C = PALETTES[settings.theme] || PALETTES.light;

  const saveAll = async (list) => { setReservations(list); await persistReservations(list); };
  const handleSave = async (form) => {
    const clean = { ...form, age: Number(form.age) || '', nbPersonnes: Number(form.nbPersonnes) || 1, prix: Number(form.prix) || 0 };
    const list = clean.id ? reservations.map(r => r.id === clean.id ? clean : r) : [...reservations, { ...clean, id: Date.now() }];
    await saveAll(list); setModal(null);
  };
  const handleDelete = async (id) => { await saveAll(reservations.filter(r => r.id !== id)); setModal(null); };
  const handleUpdate = async (updated) => { const list = reservations.map(r => r.id === updated.id ? updated : r); await saveAll(list); };
  const handleSaveSettings = async (form) => { setSettings(form); await persistSettings(form); };
  const openNew = (date, heureDebut) => setModal({ ...emptyForm, id: null, date: date || emptyForm.date, heureDebut: heureDebut || emptyForm.heureDebut, heureFin: heureDebut ? `${pad(Number(heureDebut.split(':')[0]) + 1)}:00` : emptyForm.heureFin });
  const openEdit = (r) => setModal(r);

  const navItems = [
    { id: 'dashboard', label: tUI('dashboard', settings.langue), icon: LayoutDashboard },
    { id: 'calendar', label: tUI('calendar', settings.langue), icon: CalendarIcon },
    { id: 'reservations', label: tUI('reservations', settings.langue), icon: Repeat },
    { id: 'clients', label: tUI('clients', settings.langue), icon: Users },
    { id: 'paiements', label: tUI('paiements', settings.langue), icon: FileText },
    { id: 'stats', label: tUI('stats', settings.langue), icon: BarChart3 },
  ];

  if (!authChecked) return null;
  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)} />;

  const allTabLabel = tab === 'parametres' ? tUI('parametres', settings.langue) : (navItems.find(n => n.id === tab)?.label || 'SkiPro');

  return (
    <div className="app-root" style={{ background: C.snow, fontFamily: 'Inter, sans-serif', color: C.ink }}>
      <style>{RESPONSIVE_CSS}</style>

      <div className="mobile-topbar" style={{ background: C.sidebar, color: C.sidebarText }}>
        <button onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Menu size={22} /></button>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15 }}>{allTabLabel}</div>
        <div style={{ width: 22 }} />
      </div>

      {mobileMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'relative', width: 260, maxWidth: '80vw', height: '100%', background: C.sidebar, color: C.sidebarText, padding: '22px 16px', display: 'flex', flexDirection: 'column', boxShadow: '6px 0 24px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, background: `linear-gradient(135deg, ${ACCENTS.green} 33%, ${ACCENTS.blue} 33% 66%, #000 66%)` }} />
                SkiPro
              </div>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {navItems.map(item => {
                const Icon = item.icon; const activeTab = tab === item.id;
                return (
                  <button key={item.id} onClick={() => { setTab(item.id); setMobileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14.5, fontWeight: 500, background: activeTab ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab ? '#fff' : 'rgba(255,255,255,0.68)' }}>
                    <Icon size={17} /> {item.label}
                  </button>
                );
              })}
            </nav>
            <button onClick={() => { setTab('parametres'); setMobileMenuOpen(false); }} style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14.5, background: tab === 'parametres' ? 'rgba(255,255,255,0.1)' : 'transparent', color: tab === 'parametres' ? '#fff' : 'rgba(255,255,255,0.68)' }}>
              <SettingsIcon size={17} /> Paramètres
            </button>
            <button onClick={() => { setAuthed(false); setMobileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14.5, background: 'transparent', color: 'rgba(255,255,255,0.5)' }}>
              <LogOut size={17} /> Déconnexion
            </button>
          </div>
        </div>
      )}

      <aside className="sidebar" style={{ background: C.sidebar, color: C.sidebarText }}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 8px 26px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>
          <span style={{ width: 18, height: 18, borderRadius: 5, background: `linear-gradient(135deg, ${ACCENTS.green} 33%, ${ACCENTS.blue} 33% 66%, #000 66%)`, flexShrink: 0 }} />
          SkiPro
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon; const activeTab = tab === item.id;
            return (
              <button key={item.id} className="nav-btn" onClick={() => setTab(item.id)} style={{ borderRadius: 9, border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 500, background: activeTab ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab ? '#fff' : 'rgba(255,255,255,0.68)' }}>
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
        </nav>
        <button className="nav-btn" onClick={() => setTab('parametres')} style={{ marginTop: 'auto', borderRadius: 9, border: 'none', cursor: 'pointer', textAlign: 'left', background: tab === 'parametres' ? 'rgba(255,255,255,0.1)' : 'transparent', color: tab === 'parametres' ? '#fff' : 'rgba(255,255,255,0.68)' }}>
          <SettingsIcon size={16} /> {tUI('parametres', settings.langue)}
        </button>
        <button className="nav-btn" onClick={() => supabase.auth.signOut()} style={{ borderRadius: 9, border: 'none', cursor: 'pointer', textAlign: 'left', background: 'transparent', color: 'rgba(255,255,255,0.5)' }}>
          <LogOut size={16} /> {tUI('deconnexion', settings.langue)}
        </button>
      </aside>

      <main className="main-content">
        {loading ? (
          <div style={{ color: C.inkSoft, fontSize: 14 }}>Chargement…</div>
        ) : tab === 'dashboard' ? (
          <Dashboard reservations={reservations} onNewReservation={() => openNew()} C={C} devise={settings.devise} subscribed={subscribed} langue={settings.langue} />
        ) : tab === 'calendar' ? (
          <CalendarView reservations={reservations} onSlotClick={openNew} onEventClick={openEdit} C={C} subscribed={subscribed} langue={settings.langue} />
        ) : tab === 'reservations' ? (
          <ReservationsView reservations={reservations} onNew={() => openNew()} onEdit={openEdit} C={C} devise={settings.devise} langue={settings.langue} />
        ) : tab === 'clients' ? (
          <ClientsView reservations={reservations} C={C} devise={settings.devise} subscribed={subscribed} langue={settings.langue} />
        ) : tab === 'paiements' ? (
          <PaiementsView reservations={reservations} onUpdate={handleUpdate} onDelete={handleDelete} C={C} devise={settings.devise} settings={settings} subscribed={subscribed} />
        ) : tab === 'stats' ? (
          <StatsView reservations={reservations} C={C} devise={settings.devise} subscribed={subscribed} />
        ) : (
          <ParametresView settings={settings} onSave={handleSaveSettings} C={C} subscribed={subscribed} />
        )}
      </main>

      {modal && <ReservationModal initial={modal} onSave={handleSave} onDelete={handleDelete} onClose={() => setModal(null)} C={C} settings={settings} />}
    </div>
  );
}
