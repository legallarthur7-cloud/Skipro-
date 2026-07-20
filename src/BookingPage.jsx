import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, User, Send, CheckCircle2, Globe2 } from 'lucide-react';

const COLORS = {
  snow: '#FAFBFC', snowDim: '#F0F3F6', ice: '#E4EBF0', iceLine: '#D3DEE6',
  navy: '#10233D', ink: '#16232F', inkSoft: '#5A6B7A',
  glacier: '#2E6F8E', glacierDeep: '#1F5470', green: '#2F8F5B', blue: '#2E6F8E', amber: '#C99A46'
};

const STATIONS_BY_MASSIF = {
  'Alpes du Nord': [
    'Chamonix-Mont-Blanc', 'Megève', 'Saint-Gervais-les-Bains', 'Combloux', 'Les Contamines-Montjoie', 'Cordon', 'Les Houches',
    'Morzine', 'Avoriaz', 'Les Gets', 'Châtel', "Saint-Jean-d'Aulps",
    'La Clusaz', 'Le Grand-Bornand',
    'Flaine', 'Samoëns', "Les Carroz-d'Arâches", 'Sixt-Fer-à-Cheval',
    'Praz-sur-Arly', 'Notre-Dame-de-Bellecombe', 'Crest-Voland', 'Les Saisies', 'Hauteluce',
    'Courchevel', 'Méribel', 'Val Thorens', 'Les Menuires', 'Saint-Martin-de-Belleville', 'La Tania',
    'Tignes', "Val d'Isère", 'Les Arcs', 'La Plagne', 'Peisey-Vallandry', 'Champagny-en-Vanoise', 'Bourg-Saint-Maurice', 'Sainte-Foy-Tarentaise',
    'Valmorel', 'Saint-François-Longchamp', 'Valloire', 'Valfréjus', 'Aussois', 'Bonneval-sur-Arc', 'Val-Cenis', 'La Norma', 'Orelle',
    'Les Deux Alpes', "Alpe d'Huez", 'Chamrousse', 'Villard-de-Lans', 'Corrençon-en-Vercors', 'Autrans-Méaudre',
    "Le Collet d'Allevard", 'Les Sept Laux', 'Oz-en-Oisans', 'Vaujany', 'Auris-en-Oisans', 'La Grave'
  ],
  'Alpes du Sud': [
    'Serre Chevalier', 'Montgenèvre', 'Puy-Saint-Vincent', 'Vars', 'Risoul', 'Orcières-Merlette',
    'Superdévoluy', 'Ancelle', 'Pra-Loup', "La Foux d'Allos", 'Le Sauze', 'Auron', 'Isola 2000', 'Valberg', 'Gréolières-les-Neiges'
  ],
  'Pyrénées': [
    'La Pierre Saint-Martin', 'Gourette', 'Artouste', 'Le Somport',
    'Peyragudes', 'Piau-Engaly', 'Saint-Lary-Soulan', 'Luz-Ardiden', 'Barèges', 'La Mongie', 'Cauterets', 'Luchon-Superbagnères', 'Peyresourde',
    'Ax 3 Domaines', 'Ascou-Pailhères', 'Guzet', 'Le Mourtis',
    'Font-Romeu', 'Les Angles', 'Formiguères', 'Puyvalador', 'Porté-Puymorens', "Les Cambre d'Aze"
  ],
  'Jura': ['Les Rousses', 'Métabief', 'Mijoux-Monts Jura', 'Lélex', 'Chapelle-des-Bois'],
  'Vosges': ['La Bresse-Hohneck', 'Gérardmer', 'Le Markstein', 'Ventron', 'Lac Blanc-Orbey', 'Xonrupt-Longemer', 'Schnepfenried'],
  'Massif Central': ['Super Besse', 'Le Mont-Dore', 'Le Lioran', 'Chalmazel', 'La Bourboule', 'Chastreix-Sancy', 'Prat-de-Bouc'],
  'Corse': ['Ghisoni-Capannelle', "Val d'Ese", 'Haut Asco']
};
const STATIONS = Object.values(STATIONS_BY_MASSIF).flat();

const DISCIPLINES = ['Ski', 'Snowboard'];
const NIVEAUX = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'];
const ENGAGEMENTS = ['Heure', 'Demi-journée', 'Journée'];
const CRENEAUX_KEYS = ['Matin', 'Après-midi'];
const JOURNEE_HOURS = ['09:00', '16:30'];
const LANGUES_CANON = ['Français', 'Anglais', 'Allemand', 'Espagnol', 'Italien', 'Portugais', 'Russe'];

// Créneaux demi-journée : dépendent des horaires personnalisés du moniteur (Paramètres > Horaires),
// avec repli sur les valeurs par défaut si non renseignés.
function getCreneaux(settings) {
  return {
    'Matin': [settings.matinDebut || '09:00', settings.matinFin || '12:30'],
    'Après-midi': [settings.apresMidiDebut || '13:30', settings.apresMidiFin || '17:00']
  };
}

const DEFAULT_SETTINGS = {
  nom: 'Moniteur ESF', profession: 'Moniteur de ski indépendant', devise: 'EUR',
  matinDebut: '09:00', matinFin: '12:30', apresMidiDebut: '13:30', apresMidiFin: '17:00',
  tarifSkiHaute: 75, tarifSkiBasse: 55, tarifSnowboardHaute: 80, tarifSnowboardBasse: 60,
  tarifDemiJourneeHaute: 210, tarifDemiJourneeBasse: 150, tarifJourneeHaute: 370, tarifJourneeBasse: 270,
  seasonMode: 'vacances', zoneVacances: 'Toutes', hauteSaisonDebut: '12-20', hauteSaisonFin: '02-28'
};

const pad = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthDay = (dateKey) => dateKey.slice(5);
const fmtEUR = (n, devise = 'EUR') => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise, maximumFractionDigits: 0 }).format(n || 0);
const timeToMinutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const minutesToTime = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

const HEURE_DURATION = 60; // durée par défaut d'un cours "Heure"

// busySlots vient de l'API publique : uniquement { date, heureDebut, heureFin } des réservations non annulées.
const busyIntervals = (dateKey, busySlots) =>
  busySlots.filter(r => r.date === dateKey).map(r => [timeToMinutes(r.heureDebut), timeToMinutes(r.heureFin)]);

const overlaps = (start, end, intervals) => intervals.some(([s, e]) => start < e && end > s);

const availableHourStarts = (dateKey, busySlots, workStart, workEnd) => {
  const busy = busyIntervals(dateKey, busySlots);
  const starts = [];
  for (let m = workStart; m + HEURE_DURATION <= workEnd; m += 30) {
    if (!overlaps(m, m + HEURE_DURATION, busy)) starts.push(m);
  }
  return starts;
};
const isCreneauFree = (dateKey, creneau, busySlots, creneaux) => {
  const busy = busyIntervals(dateKey, busySlots);
  const [s, e] = creneaux[creneau].map(timeToMinutes);
  return !overlaps(s, e, busy);
};
const isJourneeFree = (dateKey, busySlots) => {
  const busy = busyIntervals(dateKey, busySlots);
  const [s, e] = JOURNEE_HOURS.map(timeToMinutes);
  return !overlaps(s, e, busy);
};

const SCHOOL_HOLIDAYS = [
  { name: 'Toussaint', A: ['2025-10-18', '2025-11-03'], B: ['2025-10-18', '2025-11-03'], C: ['2025-10-18', '2025-11-03'] },
  { name: 'Noël', A: ['2025-12-20', '2026-01-05'], B: ['2025-12-20', '2026-01-05'], C: ['2025-12-20', '2026-01-05'] },
  { name: 'Hiver', A: ['2026-02-07', '2026-02-23'], B: ['2026-02-14', '2026-03-02'], C: ['2026-02-21', '2026-03-09'] },
  { name: 'Printemps', A: ['2026-04-04', '2026-04-20'], B: ['2026-04-11', '2026-04-27'], C: ['2026-04-18', '2026-05-04'] },
  { name: 'Été', A: ['2026-07-04', '2026-08-31'], B: ['2026-07-04', '2026-08-31'], C: ['2026-07-04', '2026-08-31'] },
  { name: 'Toussaint', A: ['2026-10-17', '2026-11-02'], B: ['2026-10-17', '2026-11-02'], C: ['2026-10-17', '2026-11-02'] },
  { name: 'Noël', A: ['2026-12-19', '2027-01-04'], B: ['2026-12-19', '2027-01-04'], C: ['2026-12-19', '2027-01-04'] },
  { name: 'Hiver', A: ['2027-02-13', '2027-03-01'], B: ['2027-02-20', '2027-03-08'], C: ['2027-02-06', '2027-02-22'] },
  { name: 'Printemps', A: ['2027-04-10', '2027-04-26'], B: ['2027-04-17', '2027-05-03'], C: ['2027-04-03', '2027-04-19'] },
  { name: 'Été', A: ['2027-07-03', '2027-08-31'], B: ['2027-07-03', '2027-08-31'], C: ['2027-07-03', '2027-08-31'] },
];
const inRange = (dateKey, [start, end]) => dateKey >= start && dateKey <= end;
const isSchoolHoliday = (dateKey, zone) => SCHOOL_HOLIDAYS.some(p => zone === 'Toutes' ? (inRange(dateKey, p.A) || inRange(dateKey, p.B) || inRange(dateKey, p.C)) : inRange(dateKey, p[zone]));
const isHighSeason = (dateKey, settings) => {
  if (settings.seasonMode === 'manuel') {
    const md = monthDay(dateKey); const start = settings.hauteSaisonDebut, end = settings.hauteSaisonFin;
    if (!start || !end) return false;
    return start <= end ? (md >= start && md <= end) : (md >= start || md <= end);
  }
  return isSchoolHoliday(dateKey, settings.zoneVacances || 'Toutes');
};

/* ==================================================================================
   TRANSLATIONS
   ================================================================================== */
const UI_LANGS = [
  { code: 'fr', label: 'FR' }, { code: 'en', label: 'EN' }, { code: 'es', label: 'ES' },
  { code: 'de', label: 'DE' }, { code: 'it', label: 'IT' }, { code: 'pt', label: 'PT' }
];

const T = {
  fr: {
title: 'Réserver un cours', subtitle: (nom) => `Remplis ce formulaire, ${nom} confirmera ta réservation rapidement.`,
    sectionInfo: 'Tes informations', sectionCourse: 'Ton cours',
    prenom: 'Prénom *', nom: 'Nom *', telephone: 'Téléphone *', email: 'E-mail', nationalite: 'Nationalité',
    langue: 'Langue parlée', age: 'Âge', nbPersonnes: 'Nombre de personnes',
    discipline: 'Discipline', niveau: 'Niveau', station: 'Station', date: 'Date souhaitée',
    priceLabel: (s) => `Tarif indicatif (${s})`, perHour: ' — par heure', heureLabel: 'Heure',
    message: 'Un message pour le moniteur ? (optionnel)', messagePh: 'Précisions, disponibilités, questions...',
    submit: 'Envoyer ma demande', submitting: 'Envoi en cours...',
    paymentNote: (nom) => `Le règlement se fait directement avec ${nom}, en espèces, carte ou virement — aucun paiement n'est demandé ici.`,
    errorRequired: 'Merci de renseigner au minimum ton prénom, nom, téléphone et la date souhaitée.',
    successTitle: 'Demande envoyée !', successBody: (prenom, nom) => `Merci ${prenom} ! Ta demande de cours a bien été transmise. ${nom} va la confirmer et te recontacter par téléphone ou e-mail.`,
    newRequest: 'Faire une nouvelle demande', high: 'haute saison', low: 'basse saison',
    paymentMethod: 'Mode de paiement', payCard: 'Carte bancaire', payCash: 'Especes',
    depositNote: 'Un acompte de 15% est demande pour confirmer une reservation reglee en especes.',
    depositAmountLabel: (s) => `Montant de l'acompte : ${s}`,
    payDepositButton: "Payer l'acompte et confirmer", payingRedirect: 'Redirection vers le paiement securise...',
    paymentSuccessTitle: 'Acompte recu !', paymentSuccessBody: (prenom, nom) => `Merci ${prenom} ! Ton acompte a bien ete recu. ${nom} va confirmer ta reservation.`,
    paymentCancelTitle: 'Paiement annule', paymentCancelBody: "Le paiement a ete annule, ta reservation n'a pas ete confirmee. Tu peux reessayer.",
    retryPayment: 'Reessayer',
    notFoundTitle: 'Lien introuvable', notFoundBody: "Ce lien de réservation n'existe pas ou n'est plus actif.",
    loading: 'Chargement...',
    engagements: { 'Heure': 'Heure', 'Demi-journée': 'Demi-journée', 'Journée': 'Journée' },
    disciplines: { Ski: 'Ski', Snowboard: 'Snowboard' },
    niveaux: { Débutant: 'Débutant', Intermédiaire: 'Intermédiaire', Avancé: 'Avancé', Expert: 'Expert' },
    creneaux: { 'Matin': 'Matin', 'Après-midi': 'Après-midi' },
    langues: { Français: 'Français', Anglais: 'Anglais', Allemand: 'Allemand', Espagnol: 'Espagnol', Italien: 'Italien', Portugais: 'Portugais', Russe: 'Russe' }
  },
  en: {
    title: 'Book a lesson', subtitle: (nom) => `Fill in this form and ${nom} will confirm your booking shortly.`,
    sectionInfo: 'Your details', sectionCourse: 'Your lesson',
    prenom: 'First name *', nom: 'Last name *', telephone: 'Phone *', email: 'E-mail', nationalite: 'Nationality',
    langue: 'Spoken language', age: 'Age', nbPersonnes: 'Number of people',
    discipline: 'Discipline', niveau: 'Level', station: 'Resort', date: 'Preferred date',
    priceLabel: (s) => `Estimated price (${s})`, perHour: ' — per hour', heureLabel: 'Time',
    message: 'A message for the instructor? (optional)', messagePh: 'Details, availability, questions...',
    submit: 'Send my request', submitting: 'Sending...',
    paymentNote: (nom) => `Payment is made directly with ${nom}, by cash, card or bank transfer — no payment is requested here.`,
    errorRequired: 'Please provide at least your first name, last name, phone number and preferred date.',
    successTitle: 'Request sent!', successBody: (prenom, nom) => `Thanks ${prenom}! Your lesson request has been sent. ${nom} will confirm it and get back to you by phone or e-mail.`,
    newRequest: 'Make a new request', high: 'high season', low: 'low season',
    paymentMethod: 'Payment method', payCard: 'Card', payCash: 'Cash',
    depositNote: 'A 15% deposit is required to confirm a booking paid in cash.',
    depositAmountLabel: (s) => `Deposit amount: ${s}`,
    payDepositButton: 'Pay deposit and confirm', payingRedirect: 'Redirecting to secure payment...',
    paymentSuccessTitle: 'Deposit received!', paymentSuccessBody: (prenom, nom) => `Thanks ${prenom}! Your deposit has been received. ${nom} will confirm your booking.`,
    paymentCancelTitle: 'Payment cancelled', paymentCancelBody: 'The payment was cancelled, your booking was not confirmed. You can try again.',
    retryPayment: 'Try again',
    notFoundTitle: 'Link not found', notFoundBody: 'This booking link does not exist or is no longer active.',
    loading: 'Loading...',
    engagements: { 'Heure': 'Hour', 'Demi-journée': 'Half-day', 'Journée': 'Full day' },
    disciplines: { Ski: 'Ski', Snowboard: 'Snowboard' },
    niveaux: { Débutant: 'Beginner', Intermédiaire: 'Intermediate', Avancé: 'Advanced', Expert: 'Expert' },
    creneaux: { 'Matin': 'Morning', 'Après-midi': 'Afternoon' },
    langues: { Français: 'French', Anglais: 'English', Allemand: 'German', Espagnol: 'Spanish', Italien: 'Italian', Portugais: 'Portuguese', Russe: 'Russian' }
  },
  es: {
    title: 'Reservar una clase', subtitle: (nom) => `Rellena este formulario y ${nom} confirmará tu reserva enseguida.`,
    sectionInfo: 'Tus datos', sectionCourse: 'Tu clase',
    prenom: 'Nombre *', nom: 'Apellido *', telephone: 'Teléfono *', email: 'Correo electrónico', nationalite: 'Nacionalidad',
    langue: 'Idioma hablado', age: 'Edad', nbPersonnes: 'Número de personas',
    discipline: 'Disciplina', niveau: 'Nivel', station: 'Estación', date: 'Fecha deseada',
    priceLabel: (s) => `Precio orientativo (${s})`, perHour: ' — por hora', heureLabel: 'Hora',
    message: '¿Un mensaje para el monitor? (opcional)', messagePh: 'Detalles, disponibilidad, preguntas...',
    submit: 'Enviar mi solicitud', submitting: 'Enviando...',
    paymentNote: (nom) => `El pago se realiza directamente con ${nom}, en efectivo, tarjeta o transferencia — no se solicita ningún pago aquí.`,
    errorRequired: 'Por favor indica al menos tu nombre, apellido, teléfono y la fecha deseada.',
    successTitle: '¡Solicitud enviada!', successBody: (prenom, nom) => `¡Gracias ${prenom}! Tu solicitud de clase ha sido enviada. ${nom} la confirmará y se pondrá en contacto contigo por teléfono o correo.`,
    newRequest: 'Hacer una nueva solicitud', high: 'temporada alta', low: 'temporada baja',
    paymentMethod: 'Metodo de pago', payCard: 'Tarjeta', payCash: 'Efectivo',
    depositNote: 'Se requiere un deposito del 15% para confirmar una reserva pagada en efectivo.',
    depositAmountLabel: (s) => `Importe del deposito: ${s}`,
    payDepositButton: 'Pagar el deposito y confirmar', payingRedirect: 'Redirigiendo al pago seguro...',
    paymentSuccessTitle: 'Deposito recibido!', paymentSuccessBody: (prenom, nom) => `Gracias ${prenom}! Tu deposito ha sido recibido. ${nom} confirmara tu reserva.`,
    paymentCancelTitle: 'Pago cancelado', paymentCancelBody: 'El pago fue cancelado, tu reserva no ha sido confirmada. Puedes intentarlo de nuevo.',
    retryPayment: 'Intentar de nuevo',
    notFoundTitle: 'Enlace no encontrado', notFoundBody: 'Este enlace de reserva no existe o ya no está activo.',
    loading: 'Cargando...',
    engagements: { 'Heure': 'Hora', 'Demi-journée': 'Media jornada', 'Journée': 'Jornada completa' },
    disciplines: { Ski: 'Esquí', Snowboard: 'Snowboard' },
    niveaux: { Débutant: 'Principiante', Intermédiaire: 'Intermedio', Avancé: 'Avanzado', Expert: 'Experto' },
    creneaux: { 'Matin': 'Mañana', 'Après-midi': 'Tarde' },
    langues: { Français: 'Francés', Anglais: 'Inglés', Allemand: 'Alemán', Espagnol: 'Español', Italien: 'Italiano', Portugais: 'Portugués', Russe: 'Ruso' }
  },
  de: {
    title: 'Skikurs buchen', subtitle: (nom) => `Fülle dieses Formular aus, ${nom} bestätigt deine Buchung in Kürze.`,
    sectionInfo: 'Deine Angaben', sectionCourse: 'Dein Kurs',
    prenom: 'Vorname *', nom: 'Nachname *', telephone: 'Telefon *', email: 'E-Mail', nationalite: 'Nationalität',
    langue: 'Gesprochene Sprache', age: 'Alter', nbPersonnes: 'Anzahl Personen',
    discipline: 'Disziplin', niveau: 'Niveau', station: 'Skigebiet', date: 'Gewünschtes Datum',
    priceLabel: (s) => `Richtpreis (${s})`, perHour: ' — pro Stunde', heureLabel: 'Uhrzeit',
    message: 'Eine Nachricht an den Skilehrer? (optional)', messagePh: 'Details, Verfügbarkeit, Fragen...',
    submit: 'Anfrage senden', submitting: 'Wird gesendet...',
    paymentNote: (nom) => `Die Zahlung erfolgt direkt bei ${nom}, in bar, per Karte oder Überweisung — hier wird keine Zahlung verlangt.`,
    errorRequired: 'Bitte gib mindestens Vorname, Nachname, Telefonnummer und gewünschtes Datum an.',
    successTitle: 'Anfrage gesendet!', successBody: (prenom, nom) => `Danke ${prenom}! Deine Kursanfrage wurde übermittelt. ${nom} wird sie bestätigen und sich telefonisch oder per E-Mail bei dir melden.`,
    newRequest: 'Neue Anfrage stellen', high: 'Hochsaison', low: 'Nebensaison',
    paymentMethod: 'Zahlungsmethode', payCard: 'Karte', payCash: 'Bar',
    depositNote: 'Fur eine bar bezahlte Buchung ist eine Anzahlung von 15% erforderlich.',
    depositAmountLabel: (s) => `Anzahlungsbetrag: ${s}`,
    payDepositButton: 'Anzahlung bezahlen und bestatigen', payingRedirect: 'Weiterleitung zur sicheren Zahlung...',
    paymentSuccessTitle: 'Anzahlung erhalten!', paymentSuccessBody: (prenom, nom) => `Danke ${prenom}! Deine Anzahlung wurde erhalten. ${nom} wird deine Buchung bestatigen.`,
    paymentCancelTitle: 'Zahlung abgebrochen', paymentCancelBody: 'Die Zahlung wurde abgebrochen, deine Buchung wurde nicht bestatigt. Du kannst es erneut versuchen.',
    retryPayment: 'Erneut versuchen',
    notFoundTitle: 'Link nicht gefunden', notFoundBody: 'Dieser Buchungslink existiert nicht mehr oder ist nicht aktiv.',
    loading: 'Wird geladen...',
    engagements: { 'Heure': 'Stunde', 'Demi-journée': 'Halbtags', 'Journée': 'Ganztags' },
    disciplines: { Ski: 'Ski', Snowboard: 'Snowboard' },
    niveaux: { Débutant: 'Anfänger', Intermédiaire: 'Fortgeschritten', Avancé: 'Sehr fortgeschritten', Expert: 'Experte' },
    creneaux: { 'Matin': 'Vormittag', 'Après-midi': 'Nachmittag' },
    langues: { Français: 'Französisch', Anglais: 'Englisch', Allemand: 'Deutsch', Espagnol: 'Spanisch', Italien: 'Italienisch', Portugais: 'Portugiesisch', Russe: 'Russisch' }
  },
  it: {
    title: 'Prenota una lezione', subtitle: (nom) => `Compila questo modulo, ${nom} confermerà la tua prenotazione a breve.`,
    sectionInfo: 'I tuoi dati', sectionCourse: 'La tua lezione',
    prenom: 'Nome *', nom: 'Cognome *', telephone: 'Telefono *', email: 'E-mail', nationalite: 'Nazionalità',
    langue: 'Lingua parlata', age: 'Età', nbPersonnes: 'Numero di persone',
    discipline: 'Disciplina', niveau: 'Livello', station: 'Stazione', date: 'Data desiderata',
    priceLabel: (s) => `Tariffa indicativa (${s})`, perHour: ' — all\'ora', heureLabel: 'Orario',
    message: 'Un messaggio per il maestro? (opzionale)', messagePh: 'Dettagli, disponibilità, domande...',
    submit: 'Invia la mia richiesta', submitting: 'Invio in corso...',
    paymentNote: (nom) => `Il pagamento avviene direttamente con ${nom}, in contanti, con carta o bonifico — nessun pagamento richiesto qui.`,
    errorRequired: 'Indica almeno nome, cognome, telefono e data desiderata.',
    successTitle: 'Richiesta inviata!', successBody: (prenom, nom) => `Grazie ${prenom}! La tua richiesta di lezione è stata inviata. ${nom} la confermerà e ti ricontatterà per telefono o e-mail.`,
    newRequest: 'Fai una nuova richiesta', high: 'alta stagione', low: 'bassa stagione',
    paymentMethod: 'Metodo di pagamento', payCard: 'Carta', payCash: 'Contanti',
    depositNote: 'E richiesto un acconto del 15% per confermare una prenotazione pagata in contanti.',
    depositAmountLabel: (s) => `Importo dell'acconto: ${s}`,
    payDepositButton: "Paga l'acconto e conferma", payingRedirect: 'Reindirizzamento al pagamento sicuro...',
    paymentSuccessTitle: 'Acconto ricevuto!', paymentSuccessBody: (prenom, nom) => `Grazie ${prenom}! Il tuo acconto e stato ricevuto. ${nom} confermera la tua prenotazione.`,
    paymentCancelTitle: 'Pagamento annullato', paymentCancelBody: 'Il pagamento e stato annullato, la tua prenotazione non e stata confermata. Puoi riprovare.',
    retryPayment: 'Riprova',
    notFoundTitle: 'Link non trovato', notFoundBody: 'Questo link di prenotazione non esiste più o non è attivo.',
    loading: 'Caricamento...',
    engagements: { 'Heure': 'Ora', 'Demi-journée': 'Mezza giornata', 'Journée': 'Giornata intera' },
    disciplines: { Ski: 'Sci', Snowboard: 'Snowboard' },
    niveaux: { Débutant: 'Principiante', Intermédiaire: 'Intermedio', Avancé: 'Avanzato', Expert: 'Esperto' },
    creneaux: { 'Matin': 'Mattina', 'Après-midi': 'Pomeriggio' },
    langues: { Français: 'Francese', Anglais: 'Inglese', Allemand: 'Tedesco', Espagnol: 'Spagnolo', Italien: 'Italiano', Portugais: 'Portoghese', Russe: 'Russo' }
  },
  pt: {
    title: 'Reservar uma aula', subtitle: (nom) => `Preenche este formulário e ${nom} confirmará a tua reserva em breve.`,
    sectionInfo: 'Os teus dados', sectionCourse: 'A tua aula',
    prenom: 'Nome *', nom: 'Apelido *', telephone: 'Telefone *', email: 'E-mail', nationalite: 'Nacionalidade',
    langue: 'Idioma falado', age: 'Idade', nbPersonnes: 'Número de pessoas',
    discipline: 'Modalidade', niveau: 'Nível', station: 'Estação', date: 'Data pretendida',
    priceLabel: (s) => `Preço indicativo (${s})`, perHour: ' — por hora', heureLabel: 'Hora',
    message: 'Uma mensagem para o monitor? (opcional)', messagePh: 'Detalhes, disponibilidade, perguntas...',
    submit: 'Enviar o meu pedido', submitting: 'A enviar...',
    paymentNote: (nom) => `O pagamento é feito diretamente com ${nom}, em dinheiro, cartão ou transferência — não é pedido nenhum pagamento aqui.`,
    errorRequired: 'Por favor indica pelo menos o teu nome, apelido, telefone e a data pretendida.',
    successTitle: 'Pedido enviado!', successBody: (prenom, nom) => `Obrigado ${prenom}! O teu pedido de aula foi enviado. ${nom} vai confirmá-lo e entrar em contacto por telefone ou e-mail.`,
    newRequest: 'Fazer um novo pedido', high: 'época alta', low: 'época baixa',
    paymentMethod: 'Metodo de pagamento', payCard: 'Cartao', payCash: 'Dinheiro',
    depositNote: 'E necessario um sinal de 15% para confirmar uma reserva paga em dinheiro.',
    depositAmountLabel: (s) => `Valor do sinal: ${s}`,
    payDepositButton: 'Pagar o sinal e confirmar', payingRedirect: 'A redirecionar para o pagamento seguro...',
    paymentSuccessTitle: 'Sinal recebido!', paymentSuccessBody: (prenom, nom) => `Obrigado ${prenom}! O teu sinal foi recebido. ${nom} vai confirmar a tua reserva.`,
    paymentCancelTitle: 'Pagamento cancelado', paymentCancelBody: 'O pagamento foi cancelado, a tua reserva nao foi confirmada. Podes tentar novamente.',
    retryPayment: 'Tentar novamente',
    notFoundTitle: 'Link não encontrado', notFoundBody: 'Este link de reserva não existe ou já não está ativo.',
    loading: 'A carregar...',
    engagements: { 'Heure': 'Hora', 'Demi-journée': 'Meio-dia', 'Journée': 'Dia inteiro' },
    disciplines: { Ski: 'Esqui', Snowboard: 'Snowboard' },
    niveaux: { Débutant: 'Iniciante', Intermédiaire: 'Intermédio', Avancé: 'Avançado', Expert: 'Especialista' },
    creneaux: { 'Matin': 'Manhã', 'Après-midi': 'Tarde' },
    langues: { Français: 'Francês', Anglais: 'Inglês', Allemand: 'Alemão', Espagnol: 'Espanhol', Italien: 'Italiano', Portugais: 'Português', Russe: 'Russo' }
  }
};

async function fetchPublicBooking(slug) {
  const res = await fetch(`/api/public-booking?slug=${encodeURIComponent(slug)}`);
  const data = await res.json();
if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
  return data; // { userId, settings, busySlots }
}

async function postPublicBooking(slug, reservation) {
  const res = await fetch('/api/public-booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, reservation })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
  return data; // { ok, id }
}

async function createDepositSession(slug, reservationId, amount, devise, prenom) {
  const res = await fetch('/api/create-deposit-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, reservationId, amount, devise, prenom })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
  return data; // { url }
}

const emptyForm = {
  prenom: '', nom: '', telephone: '', email: '', nationalite: '', langue: 'Français', age: '',
  discipline: 'Ski', niveau: 'Débutant', nbPersonnes: 1, station: STATIONS[0],
  date: toKey(new Date()), type: 'Heure', creneau: 'Matin', modePaiement: 'Carte', message: ''
};

export default function BookingPage({ slug }) {
  const [uiLang, setUiLang] = useState('fr');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [reservations, setReservations] = useState([]); // busySlots renvoyés par l'API publique
  const [form, setForm] = useState(emptyForm);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [paymentReturn, setPaymentReturn] = useState(null); // 'succes' | 'annule' | null
  const [paymentPrenom, setPaymentPrenom] = useState('');
  const t = T[uiLang];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paiementStatus = params.get('paiement');
    if (paiementStatus === 'succes' || paiementStatus === 'annule') setPaymentReturn(paiementStatus);
    const prenomFromUrl = params.get('prenom');
    if (prenomFromUrl) setPaymentPrenom(prenomFromUrl);
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet'; document.head.appendChild(link);
    (async () => {
      try {
        const data = await fetchPublicBooking(slug);
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        setReservations(data.busySlots || []);
      } catch (e) {
        setNotFound(true);
      } finally {
        setReady(true);
      }
    })();
  }, [slug]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const high = isHighSeason(form.date, settings);
  const seasonLabel = high ? t.high : t.low;

  const creneaux = useMemo(() => getCreneaux(settings), [settings]);
  const workStart = useMemo(() => timeToMinutes(settings.matinDebut || '09:00'), [settings]);
  const workEnd = useMemo(() => timeToMinutes(settings.apresMidiFin || '17:00'), [settings]);

  const hourOptions = useMemo(() => availableHourStarts(form.date, reservations, workStart, workEnd), [form.date, reservations, workStart, workEnd]);
  const matinFree = useMemo(() => isCreneauFree(form.date, 'Matin', reservations, creneaux), [form.date, reservations, creneaux]);
  const apremFree = useMemo(() => isCreneauFree(form.date, 'Après-midi', reservations, creneaux), [form.date, reservations, creneaux]);
  const journeeFree = useMemo(() => isJourneeFree(form.date, reservations), [form.date, reservations]);
  const noAvailabilityAtAll = hourOptions.length === 0 && !matinFree && !apremFree && !journeeFree;

  // Corrige automatiquement la sélection si elle devient indisponible (changement de date, données chargées, etc.)
  useEffect(() => {
    setForm(f => {
      if (f.type === 'Heure') {
        if (hourOptions.length > 0 && !hourOptions.includes(timeToMinutes(f.heureDebut || '09:00'))) {
          const start = hourOptions[0];
          return { ...f, heureDebut: minutesToTime(start), heureFin: minutesToTime(start + HEURE_DURATION) };
        }
      } else if (f.type === 'Demi-journée') {
        if (f.creneau === 'Matin' && !matinFree && apremFree) return { ...f, creneau: 'Après-midi', heureDebut: creneaux['Après-midi'][0], heureFin: creneaux['Après-midi'][1] };
        if (f.creneau === 'Après-midi' && !apremFree && matinFree) return { ...f, creneau: 'Matin', heureDebut: creneaux['Matin'][0], heureFin: creneaux['Matin'][1] };
      } else if (f.type === 'Journée' && !journeeFree && hourOptions.length > 0) {
        const start = hourOptions[0];
        return { ...f, type: 'Heure', heureDebut: minutesToTime(start), heureFin: minutesToTime(start + HEURE_DURATION) };
      }
      return f;
    });
  }, [form.date, reservations]); // eslint-disable-line react-hooks/exhaustive-deps

  const estimate = (() => {
    if (form.type === 'Journée') return high ? settings.tarifJourneeHaute : settings.tarifJourneeBasse;
    if (form.type === 'Demi-journée') return high ? settings.tarifDemiJourneeHaute : settings.tarifDemiJourneeBasse;
    const rate = form.discipline === 'Ski' ? (high ? settings.tarifSkiHaute : settings.tarifSkiBasse) : (high ? settings.tarifSnowboardHaute : settings.tarifSnowboardBasse);
    return rate;
  })();
  const depositAmount = Math.round(Number(estimate) * 0.15);

  const setType = (type) => {
    if (type === 'Journée' && !journeeFree) return;
    setForm(f => {
      if (type === 'Journée') return { ...f, type, heureDebut: JOURNEE_HOURS[0], heureFin: JOURNEE_HOURS[1] };
      if (type === 'Demi-journée') {
        const cren = matinFree ? 'Matin' : (apremFree ? 'Après-midi' : (f.creneau || 'Matin'));
        return { ...f, type, creneau: cren, heureDebut: creneaux[cren][0], heureFin: creneaux[cren][1] };
      }
      const start = hourOptions[0];
      return start !== undefined ? { ...f, type, heureDebut: minutesToTime(start), heureFin: minutesToTime(start + HEURE_DURATION) } : { ...f, type };
    });
  };
  const setCreneau = (cren) => { if ((cren === 'Matin' && !matinFree) || (cren === 'Après-midi' && !apremFree)) return; setForm(f => ({ ...f, creneau: cren, heureDebut: creneaux[cren][0], heureFin: creneaux[cren][1] })); };
  const setHeureDebut = (e) => { const start = Number(e.target.value); setForm(f => ({ ...f, heureDebut: minutesToTime(start), heureFin: minutesToTime(start + HEURE_DURATION) })); };

  const handleSubmit = async () => {
    if (!form.prenom || !form.nom || !form.telephone || !form.date) { setError(t.errorRequired); return; }
    setError(''); setLoading(true);
    const heureDebut = form.heureDebut || creneaux['Matin'][0];
    const heureFin = form.heureFin || creneaux['Matin'][1];
    const reservation = {
      nom: form.nom, prenom: form.prenom, telephone: form.telephone, email: form.email,
      nationalite: form.nationalite, langue: form.langue, age: Number(form.age) || '', niveau: form.niveau,
      discipline: form.discipline, nbPersonnes: Number(form.nbPersonnes) || 1, station: form.station,
      pointRdv: '', date: form.date, type: form.type, creneau: form.creneau, heureDebut, heureFin,
      prix: estimate, modePaiement: form.modePaiement,
      ...(form.modePaiement === 'Espèces' ? { garantieMontant: depositAmount, garantieStatut: 'En attente' } : {}),
      notes: form.message ? `Demande en ligne (${uiLang.toUpperCase()}) : ${form.message}` : `Demande envoyée via le formulaire en ligne (langue : ${uiLang.toUpperCase()}).`
    };
    try {
      const result = await postPublicBooking(slug, reservation);
      if (form.modePaiement === 'Espèces') {
        const { url } = await createDepositSession(slug, result.id, depositAmount, settings.devise, form.prenom);
        window.location.href = url;
        return;
      }
      setLoading(false);
      setSent(true);
    } catch (e) {
      setLoading(false);
      // Si le créneau vient d'être pris par quelqu'un d'autre, on rafraîchit les disponibilités affichées
      try { const fresh = await fetchPublicBooking(slug); setReservations(fresh.busySlots || []); } catch (_) { /* ignore */ }
      setError(e.message || "Une erreur est survenue lors de l'envoi. Merci de réessayer.");
    }
  };
const inputStyle = { border: `1px solid ${COLORS.iceLine}`, borderRadius: 9, padding: '10px 12px', fontSize: 14.5, fontFamily: 'Inter, sans-serif', color: COLORS.ink, background: '#fff', width: '100%' };
  const field = (label, input) => <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.inkSoft }}>{label}</label>{input}</div>;

  const LangSwitcher = (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginBottom: 14 }}>
      {UI_LANGS.map(l => (
        <button key={l.code} onClick={() => setUiLang(l.code)} style={{
          padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700,
          border: `1px solid ${uiLang === l.code ? COLORS.glacier : COLORS.iceLine}`,
          background: uiLang === l.code ? COLORS.glacier : '#fff',
          color: uiLang === l.code ? '#fff' : COLORS.inkSoft
        }}>{l.label}</button>
      ))}
    </div>
  );

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.snow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: COLORS.inkSoft, fontSize: 14.5 }}>
        {t.loading}
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.snow, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center', background: '#fff', border: `1px solid ${COLORS.iceLine}`, borderRadius: 18, padding: '40px 32px' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 21, fontWeight: 700, color: COLORS.navy, marginBottom: 10 }}>{t.notFoundTitle}</h1>
          <p style={{ fontSize: 14.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>{t.notFoundBody}</p>
        </div>
      </div>
    );
  }

  if (paymentReturn === 'succes') {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.snow, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center', background: '#fff', border: `1px solid ${COLORS.iceLine}`, borderRadius: 18, padding: '40px 32px' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: COLORS.green + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <CheckCircle2 size={26} color={COLORS.green} />
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 21, fontWeight: 700, color: COLORS.navy, marginBottom: 10 }}>{t.paymentSuccessTitle}</h1>
          <p style={{ fontSize: 14.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>{t.paymentSuccessBody(paymentPrenom || form.prenom, settings.nom)}</p>
        </div>
      </div>
    );
  }

  if (paymentReturn === 'annule') {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.snow, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center', background: '#fff', border: `1px solid ${COLORS.iceLine}`, borderRadius: 18, padding: '40px 32px' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 21, fontWeight: 700, color: COLORS.navy, marginBottom: 10 }}>{t.paymentCancelTitle}</h1>
          <p style={{ fontSize: 14.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>{t.paymentCancelBody}</p>
          <button onClick={() => setPaymentReturn(null)} style={{ marginTop: 24, background: COLORS.glacier, color: '#fff', border: 'none', borderRadius: 9, padding: '11px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t.retryPayment}</button>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.snow, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 440, width: '100%' }}>
          {LangSwitcher}
          <div style={{ textAlign: 'center', background: '#fff', border: `1px solid ${COLORS.iceLine}`, borderRadius: 18, padding: '40px 32px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: COLORS.green + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <CheckCircle2 size={26} color={COLORS.green} />
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 21, fontWeight: 700, color: COLORS.navy, marginBottom: 10 }}>{t.successTitle}</h1>
            <p style={{ fontSize: 14.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>{t.successBody(form.prenom, settings.nom)}</p>
            <button onClick={() => { setForm(emptyForm); setSent(false); }} style={{ marginTop: 24, background: COLORS.glacier, color: '#fff', border: 'none', borderRadius: 9, padding: '11px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t.newRequest}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.snow, fontFamily: 'Inter, sans-serif', color: COLORS.ink, padding: '32px 16px 60px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19, color: COLORS.navy }}>
            <span style={{ width: 20, height: 20, borderRadius: 5, background: `linear-gradient(135deg, ${COLORS.green} 33%, ${COLORS.blue} 33% 66%, #000 66%)` }} />
            SkiPro
          </div>
        </div>
        {LangSwitcher}
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>{t.title}</h1>
        <p style={{ fontSize: 14.5, color: COLORS.inkSoft, marginBottom: 28 }}>{t.subtitle(settings.nom)}</p>

        <div style={{ background: '#fff', border: `1px solid ${COLORS.iceLine}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, color: COLORS.navy, marginBottom: 14 }}><User size={15} /> {t.sectionInfo}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {field(t.prenom, <input style={inputStyle} value={form.prenom} onChange={set('prenom')} />)}
              {field(t.nom, <input style={inputStyle} value={form.nom} onChange={set('nom')} />)}
              {field(t.telephone, <input style={inputStyle} value={form.telephone} onChange={set('telephone')} />)}
              {field(t.email, <input style={inputStyle} value={form.email} onChange={set('email')} />)}
              {field(t.nationalite, <input style={inputStyle} value={form.nationalite} onChange={set('nationalite')} />)}
              {field(t.langue, <select style={inputStyle} value={form.langue} onChange={set('langue')}>{LANGUES_CANON.map(l => <option key={l} value={l}>{t.langues[l]}</option>)}</select>)}
              {field(t.age, <input type="number" style={inputStyle} value={form.age} onChange={set('age')} />)}
              {field(t.nbPersonnes, <input type="number" min="1" style={inputStyle} value={form.nbPersonnes} onChange={set('nbPersonnes')} />)}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, color: COLORS.navy, marginBottom: 14 }}><Calendar size={15} /> {t.sectionCourse}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              {field(t.discipline, <select style={inputStyle} value={form.discipline} onChange={set('discipline')}>{DISCIPLINES.map(d => <option key={d} value={d}>{t.disciplines[d]}</option>)}</select>)}
              {field(t.niveau, <select style={inputStyle} value={form.niveau} onChange={set('niveau')}>{NIVEAUX.map(n => <option key={n} value={n}>{t.niveaux[n]}</option>)}</select>)}
              {field(t.station, <select style={inputStyle} value={form.station} onChange={set('station')}>{Object.entries(STATIONS_BY_MASSIF).map(([massif, list]) => <optgroup key={massif} label={massif}>{list.map(s => <option key={s}>{s}</option>)}</optgroup>)}</select>)}
              {field(t.date, <input type="date" style={inputStyle} value={form.date} onChange={set('date')} />)}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {ENGAGEMENTS.map(type => {
                const disabled = type === 'Journée' && !journeeFree;
                return (
                  <button key={type} type="button" disabled={disabled} onClick={() => setType(type)} style={{ flex: 1, padding: '9px 8px', borderRadius: 9, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, border: `1px solid ${form.type === type ? COLORS.glacier : COLORS.iceLine}`, background: disabled ? COLORS.snowDim : (form.type === type ? COLORS.glacier + '18' : '#fff'), color: disabled ? COLORS.inkSoft : (form.type === type ? COLORS.glacierDeep : COLORS.ink), opacity: disabled ? 0.6 : 1 }}>{t.engagements[type]}</button>
                );
              })}
            </div>
            {form.type === 'Demi-journée' && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {CRENEAUX_KEYS.map(cren => {
                  const free = cren === 'Matin' ? matinFree : apremFree;
                  return (
                    <button key={cren} type="button" disabled={!free} onClick={() => setCreneau(cren)} style={{ flex: 1, padding: '8px', borderRadius: 8, cursor: free ? 'pointer' : 'not-allowed', fontSize: 12.5, fontWeight: 600, border: `1px solid ${form.creneau === cren ? COLORS.glacier : COLORS.iceLine}`, background: !free ? COLORS.snowDim : (form.creneau === cren ? COLORS.glacier + '18' : '#fff'), color: !free ? COLORS.inkSoft : (form.creneau === cren ? COLORS.glacierDeep : COLORS.ink), opacity: free ? 1 : 0.6 }}>{t.creneaux[cren]} ({creneaux[cren][0]}–{creneaux[cren][1]}){!free ? ' 🚫' : ''}</button>
                  );
                })}
              </div>
            )}
            {form.type === 'Heure' && (
              hourOptions.length > 0 ? (
                <div style={{ marginBottom: 10 }}>
                  {field(t.heureLabel, <select style={inputStyle} value={timeToMinutes(form.heureDebut || minutesToTime(hourOptions[0]))} onChange={setHeureDebut}>
                    {hourOptions.map(m => <option key={m} value={m}>{minutesToTime(m)} – {minutesToTime(m + HEURE_DURATION)}</option>)}
                  </select>)}
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: COLORS.amber, background: COLORS.amber + '15', borderRadius: 8, padding: '9px 11px', marginBottom: 10 }}>
                  Aucun horaire disponible à cette date — merci de choisir un autre jour.
                </div>
              )
            )}
            {noAvailabilityAtAll && (
              <div style={{ fontSize: 12.5, color: COLORS.amber, background: COLORS.amber + '15', borderRadius: 8, padding: '9px 11px', marginBottom: 10 }}>
                Cette date est complète, quel que soit le format de cours. Merci de choisir une autre date.
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLORS.snowDim, borderRadius: 9, padding: '10px 14px' }}>
              <span style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{t.priceLabel(seasonLabel)}{form.type === 'Heure' ? t.perHour : ''}</span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: COLORS.navy }}>{fmtEUR(estimate, settings.devise)}</span>
            </div>
          </div>
{field(t.paymentMethod, <div style={{ display: 'flex', gap: 8 }}>
  <button type="button" onClick={() => setForm(f => ({ ...f, modePaiement: 'Carte' }))} style={{ flex: 1, padding: '9px 8px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600, border: `1px solid ${form.modePaiement === 'Carte' ? COLORS.glacier : COLORS.iceLine}`, background: form.modePaiement === 'Carte' ? COLORS.glacier + '18' : '#fff', color: form.modePaiement === 'Carte' ? COLORS.glacierDeep : COLORS.ink }}>{t.payCard}</button>
  <button type="button" onClick={() => setForm(f => ({ ...f, modePaiement: 'Espèces' }))} style={{ flex: 1, padding: '9px 8px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600, border: `1px solid ${form.modePaiement === 'Espèces' ? COLORS.glacier : COLORS.iceLine}`, background: form.modePaiement === 'Espèces' ? COLORS.glacier + '18' : '#fff', color: form.modePaiement === 'Espèces' ? COLORS.glacierDeep : COLORS.ink }}>{t.payCash}</button>
</div>)}
{form.modePaiement === 'Espèces' && (
  <div style={{ fontSize: 12.5, color: COLORS.navy, background: COLORS.glacier + '12', borderRadius: 8, padding: '9px 11px' }}>
    {t.depositNote} {t.depositAmountLabel(fmtEUR(depositAmount, settings.devise))}
  </div>
)}

{field(t.message, <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.message} onChange={set('message')} placeholder={t.messagePh} />)}

          {error && <div style={{ fontSize: 13, color: COLORS.amber, background: COLORS.amber + '15', borderRadius: 8, padding: '10px 12px' }}>{error}</div>}

          <button onClick={handleSubmit} disabled={loading || noAvailabilityAtAll} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: COLORS.glacier, color: '#fff', border: 'none', borderRadius: 9, padding: '13px', fontSize: 14.5, fontWeight: 600, cursor: (loading || noAvailabilityAtAll) ? 'default' : 'pointer', opacity: (loading || noAvailabilityAtAll) ? 0.6 : 1 }}>
            <Send size={16} /> {loading ? (form.modePaiement === 'Espèces' ? t.payingRedirect : t.submitting) : (form.modePaiement === 'Espèces' ? t.payDepositButton : t.submit)}
          </button>
          <p style={{ fontSize: 11.5, color: COLORS.inkSoft, textAlign: 'center' }}>{t.paymentNote(settings.nom)}</p>
        </div>
      </div>
    </div>
  );
}