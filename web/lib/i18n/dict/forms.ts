//web/lib/i18n/dict/forms.ts
import { pair } from '../pair';

export const forms = pair(
  {
    defaultCountry: 'États-Unis',
    page: {
      title: 'Formulaire d’adhésion',
      back: 'Retour',
      subtitle:
        'Renseignez vos informations et votre photo d’identité. Votre carte de membre vous sera envoyée par e-mail dès qu’elle sera générée.',
      steps: ['Remplissez le formulaire', 'L’administrateur valide', 'Recevez votre carte par e-mail'],
    },
    labels: {
      firstName: 'Prénom',
      lastName: 'Nom',
      city: 'Ville de résidence',
      state: 'État',
      country: 'Pays',
      phone: 'Téléphone',
      email: 'Adresse e-mail',
    },
    phoneInvalid:
      'Numéro de téléphone invalide : indiquez les 10 chiffres du numéro américain, par exemple (718) 555-0123.',
    allRequired: 'Tous les champs sont obligatoires.',
    sending: 'Envoi en cours...',
    sendRequest: 'Envoyer ma demande',
    request: {
      openButton: 'Demander votre formulaire d’adhésion',
      modalTitle: 'Demander votre formulaire d’adhésion',
      message:
        'Bonjour, je me permets de vous demander de m’envoyer mon formulaire d’adhésion de Lelou Solidarity afin que je puisse obtenir ma carte de membre. Vous trouverez mes informations personnelles ci-jointes.',
      sentTitle: 'Demande envoyée !',
      sentText:
        'L’administrateur a bien reçu votre demande. Vous recevrez votre formulaire d’adhésion par e-mail. Pensez à vérifier vos courriers indésirables.',
      tooMany: 'Trop de demandes envoyées depuis cet appareil. Merci de réessayer un peu plus tard.',
      networkError: 'Impossible d’envoyer votre demande, vérifiez votre connexion.',
      honeypot: 'Ne pas remplir',
    },
    member: {
      birthYearInvalid: 'Année de naissance invalide : indiquez 4 chiffres entre {min} et {max}.',
      photoRequired: 'La photo d’identité est obligatoire.',
      networkError: 'Impossible d’envoyer le formulaire, vérifiez votre connexion.',
      lockedNameCity: 'nom, prénom, ville',
      lockedState: 'état',
      lockedCountry: 'pays',
      lockedPhoneEmail: 'téléphone et e-mail',
      sentTitle: 'Demande envoyée !',
      sentText:
        'Nous avons bien reçu vos informations. Un e-mail de confirmation vous a été envoyé. Votre carte de membre vous parviendra par e-mail dès qu’elle sera générée par l’administrateur.',
      backHome: 'Retour à l’accueil',
      checkingTitle: 'Vérification de votre lien…',
      checkingSlow: 'Le serveur se réveille, cela peut prendre quelques secondes. Merci de patienter.',
      checkingText: 'Un instant, nous préparons votre formulaire.',
      usedTitle: 'Ce lien a déjà été utilisé',
      usedText:
        'Une demande d’adhésion a déjà été envoyée avec ce lien : le formulaire ne peut plus être rempli. Si c’est votre demande, vous recevrez votre carte de membre par e-mail. Pour toute question ou correction, contactez l’association.',
      invalidTitle: 'Lien invalide',
      invalidText:
        'Ce lien n’est pas reconnu. Utilisez le bouton « Remplir le formulaire » de l’e-mail que vous avez reçu, ou contactez l’association pour obtenir un nouveau lien.',
      missingTitle: 'Accès par e-mail uniquement',
      missingText:
        'Le formulaire s’ouvre depuis le lien personnel que vous avez reçu par e-mail. Cliquez sur le bouton « Remplir le formulaire » de ce message. Pas de lien ? Contactez l’association pour en recevoir un.',
      errorTitle: 'Vérification impossible',
      errorText:
        'Nous n’arrivons pas à joindre le serveur pour vérifier votre lien. Vérifiez votre connexion puis réessayez : votre lien reste valable.',
      retry: 'Réessayer',
      accessCode: 'Code d’accès',
      yourAccessCode: 'Votre code d’accès',
      codeAutofilled: 'Votre code a été renseigné automatiquement.',
      lockedNotice:
        'Les champs grisés ({fields}) reprennent les informations de votre demande. Complétez simplement les autres champs.',
      personalInfo: 'Informations personnelles',
      birthYear: 'Année de naissance',
      birthCity: 'Ville de naissance',
      origin: 'Origine',
      originCity: 'Ville d’origine',
      originLocality: 'Localité d’origine',
      residence: 'Résidence',
      address: 'Adresse',
      zipCode: 'Code postal',
      contact: 'Contact',
      mobilePhone: 'Téléphone portable',
      oneTimeLink: 'Ce lien ne peut être utilisé qu’une seule fois.',
    },
  },
  {
    defaultCountry: 'United States',
    page: {
      title: 'Membership form',
      back: 'Back',
      subtitle:
        'Enter your information and your ID photo. Your membership card will be sent to you by e-mail as soon as it is generated.',
      steps: ['Fill in the form', 'The administrator approves', 'Receive your card by e-mail'],
    },
    labels: {
      firstName: 'First name',
      lastName: 'Last name',
      city: 'City of residence',
      state: 'State',
      country: 'Country',
      phone: 'Phone',
      email: 'E-mail address',
    },
    phoneInvalid:
      'Invalid phone number: enter the 10 digits of the US number, for example (718) 555-0123.',
    allRequired: 'All fields are required.',
    sending: 'Sending...',
    sendRequest: 'Send my request',
    request: {
      openButton: 'Request your membership form',
      modalTitle: 'Request your membership form',
      message:
        'Hello, I kindly ask you to send me my Lelou Solidarity membership form so that I can obtain my membership card. You will find my personal information attached.',
      sentTitle: 'Request sent!',
      sentText:
        'The administrator has received your request. You will receive your membership form by e-mail. Remember to check your spam folder.',
      tooMany: 'Too many requests sent from this device. Please try again a little later.',
      networkError: 'Unable to send your request, please check your connection.',
      honeypot: 'Do not fill in',
    },
    member: {
      birthYearInvalid: 'Invalid birth year: enter 4 digits between {min} and {max}.',
      photoRequired: 'The ID photo is required.',
      networkError: 'Unable to send the form, please check your connection.',
      lockedNameCity: 'name, city',
      lockedState: 'state',
      lockedCountry: 'country',
      lockedPhoneEmail: 'phone and e-mail',
      sentTitle: 'Request sent!',
      sentText:
        'We have received your information. A confirmation e-mail has been sent to you. Your membership card will reach you by e-mail as soon as the administrator generates it.',
      backHome: 'Back to home',
      checkingTitle: 'Checking your link…',
      checkingSlow: 'The server is waking up, this may take a few seconds. Thank you for waiting.',
      checkingText: 'One moment, we are preparing your form.',
      usedTitle: 'This link has already been used',
      usedText:
        'A membership request has already been sent with this link: the form can no longer be filled in. If it is your request, you will receive your membership card by e-mail. For any question or correction, contact the association.',
      invalidTitle: 'Invalid link',
      invalidText:
        'This link is not recognized. Use the “Fill in the form” button in the e-mail you received, or contact the association to get a new link.',
      missingTitle: 'E-mail access only',
      missingText:
        'The form opens from the personal link you received by e-mail. Click the “Fill in the form” button in that message. No link? Contact the association to receive one.',
      errorTitle: 'Unable to verify',
      errorText:
        'We cannot reach the server to verify your link. Check your connection and try again: your link is still valid.',
      retry: 'Try again',
      accessCode: 'Access code',
      yourAccessCode: 'Your access code',
      codeAutofilled: 'Your code was filled in automatically.',
      lockedNotice:
        'The greyed-out fields ({fields}) come from your request. Simply complete the other fields.',
      personalInfo: 'Personal information',
      birthYear: 'Year of birth',
      birthCity: 'City of birth',
      origin: 'Origin',
      originCity: 'City of origin',
      originLocality: 'Locality of origin',
      residence: 'Residence',
      address: 'Address',
      zipCode: 'ZIP code',
      contact: 'Contact',
      mobilePhone: 'Mobile phone',
      oneTimeLink: 'This link can only be used once.',
    },
  },
  // Pular (Fuuta Jallon) — première version à faire relire par un locuteur
  {
    defaultCountry: 'États-Unis',
    page: {
      title: 'Formulaire naatugo e kawtal',
      back: 'Rutto',
      subtitle:
        'Winndu ko haani e foto maaɗa. Karte maaɗa maa nelda ma e imeel ndeen ɗum waɗaama.',
      steps: ['Winndu e formulaire', 'Administrateur hoolan', 'Heɓu karte maaɗa e imeel'],
    },
    labels: {
      firstName: 'Innde',
      lastName: 'Yettoode',
      city: 'Wuro hoɗorde',
      state: 'État',
      country: 'Leydi',
      phone: 'Telefon',
      email: 'Imeel',
    },
    phoneInvalid:
      'Limngal telefon ngal wooɗaa: winndu 10 limle telefon Ameriki, no (718) 555-0123.',
    allRequired: 'Ko fuu ɗon haani winndugo.',
    sending: 'E neldude...',
    sendRequest: 'Neldu ƴamol am',
    request: {
      openButton: 'Ƴamu formulaire naatugo e kawtal',
      modalTitle: 'Ƴamu formulaire naatugo e kawtal',
      message:
        'Assalaamu alaykum, mi ƴami on neldu mi formulaire naatugo e Lelou Solidarity, ngam mi heɓa karte am kawtaaɗo. Ko mi winndi ɗon e ɗoo.',
      sentTitle: 'Ƴamol neldaama!',
      sentText:
        'Administrateur hebii ƴamol maaɗa. A heɓan formulaire maaɗa e imeel. Ƴeewtu e imeel ɗi njahaaki (spam) boo.',
      tooMany: 'Ƴamle ɗuuɗi ngam telefon ɗo. Ɗaɓɓitu ɓaawo seeɗa.',
      networkError: 'Mi waawaa neldugo ƴamol maaɗa, ƴeewtu internet maaɗa.',
      honeypot: 'Taa winndu',
    },
    member: {
      birthYearInvalid: 'Hitaande danyugo wooɗaa: winndu 4 limle hakkunde {min} e {max}.',
      photoRequired: 'Foto maaɗa haani.',
      networkError: 'Mi waawaa neldugo formulaire, ƴeewtu internet maaɗa.',
      lockedNameCity: 'innde, wuro',
      lockedState: 'état',
      lockedCountry: 'leydi',
      lockedPhoneEmail: 'telefon e imeel',
      sentTitle: 'Ƴamol neldaama!',
      sentText:
        'Min hebii ko winndu maaɗa. Imeel hoolaago neldaama. Karte maaɗa maa yottina ma e imeel ndeen administrateur waɗi ɗum.',
      backHome: 'Rutto e ɗoo',
      checkingTitle: 'Mi ƴeewtii lien maaɗa…',
      checkingSlow: 'Serveur ɗon fennoo, ɗum waawi nanndude seeɗa. Reen seeɗa.',
      checkingText: 'Reen seeɗa, min ɗon taaskude formulaire maaɗa.',
      usedTitle: 'Lien ngoo huutinaama',
      usedText:
        'Ƴamol naatugo neldaama e lien ngoo: formulaire waawaa winndeede fahin. Si ko ƴamol maaɗa, a heɓan karte maaɗa e imeel. Ngam ɗum yiɗi ko woɗɗa, ɗaɓɓu kawtal.',
      invalidTitle: 'Lien ngoo wooɗaa',
      invalidText:
        'Lien ngoo anndaaka. Huutinan buutoŋ « Winndu e formulaire » ngon e imeel ma heɓi, malla ɗaɓɓu kawtal ngam lien hesere.',
      missingTitle: 'Imeel tan',
      missingText:
        'Formulaire maaɗa ɗon maɓɓee e lien maaɗa mo a heɓi e imeel. Taɓɓu buutoŋ « Winndu e formulaire » e imeel ɗoon. Walaa lien? ɗaɓɓu kawtal ngam heɓugo.',
      errorTitle: 'Mi waawaa ƴeewtugo',
      errorText:
        'Mi waawaa jokkude e serveur ngam ƴeewtugo lien maaɗa. Ƴeewtu internet maaɗa, ɗaɓɓitu: lien maaɗa ɗon hoolaa.',
      retry: 'Ɗaɓɓitu',
      accessCode: 'Kodo naatugo',
      yourAccessCode: 'Kodo maaɗa',
      codeAutofilled: 'Kodo maaɗa winndaama hoore mum.',
      lockedNotice:
        'Fiilannde bonnde ({fields}) ngam ko winndu ƴamol maaɗa. Winndu tan woɗɗa.',
      personalInfo: 'Anndinol hoore maaɗa',
      birthYear: 'Hitaande danyugo',
      birthCity: 'Wuro danyirde',
      origin: 'Puɗɗorde',
      originCity: 'Wuro puɗɗorde',
      originLocality: 'Saare puɗɗorde',
      residence: 'Hoɗorde',
      address: 'Aderes',
      zipCode: 'Code postal',
      contact: 'Jokkondiral',
      mobilePhone: 'Telefon portable',
      oneTimeLink: 'Lien ngoo huutinaama nde gooto tan.',
    },
  },
);
