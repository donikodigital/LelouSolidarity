//web/lib/i18n/dict/install.ts
// Textes de l'installation de l'application (bannière, guide iPhone, carte du profil).
// Pas de version pular : la langue retombe sur le français (voir pair.ts).
import { pair } from '../pair';

export const install = pair(
  {
    bannerTitle: 'Installer l’application',
    bannerText:
      'Ajoutez LELOU SOLIDARITY à votre écran d’accueil : accès en un geste, en plein écran, comme une vraie application.',
    install: 'Installer',
    later: 'Plus tard',
    howTo: 'Comment faire ?',
    done: 'Application installée !',
    guideTitle: 'Ajouter à l’écran d’accueil',
    guideIntro: 'Sur iPhone et iPad, l’installation se fait en 3 gestes depuis le menu Partager.',
    step1: 'Touchez le bouton Partager',
    step1Hint: 'Le carré avec une flèche vers le haut, dans la barre de Safari.',
    step2: 'Choisissez « Sur l’écran d’accueil »',
    step2Hint: 'Faites défiler la liste des actions si vous ne la voyez pas.',
    step3: 'Touchez « Ajouter »',
    step3Hint: 'L’icône apparaît sur votre écran d’accueil, comme une vraie application.',
    guideNote: 'Vous ne voyez pas l’option ? Ouvrez cette page dans Safari.',
    gotIt: 'J’ai compris',
    cardTitle: 'Application',
    cardDescription: 'Installez LELOU SOLIDARITY sur cet appareil pour y accéder comme une application.',
    cardInstalled: 'L’application est installée sur cet appareil.',
    cardMenuHint:
      'Si votre navigateur le permet, ouvrez son menu puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».',
  },
  {
    bannerTitle: 'Install the app',
    bannerText:
      'Add LELOU SOLIDARITY to your home screen: one-tap access, full screen, just like a real app.',
    install: 'Install',
    later: 'Later',
    howTo: 'How to?',
    done: 'App installed!',
    guideTitle: 'Add to Home Screen',
    guideIntro: 'On iPhone and iPad, installing takes 3 taps from the Share menu.',
    step1: 'Tap the Share button',
    step1Hint: 'The square with an upward arrow, in the Safari toolbar.',
    step2: 'Choose “Add to Home Screen”',
    step2Hint: 'Scroll down the list of actions if you do not see it.',
    step3: 'Tap “Add”',
    step3Hint: 'The icon appears on your home screen, like a real app.',
    guideNote: 'Cannot see the option? Open this page in Safari.',
    gotIt: 'Got it',
    cardTitle: 'App',
    cardDescription: 'Install LELOU SOLIDARITY on this device to open it like an app.',
    cardInstalled: 'The app is installed on this device.',
    cardMenuHint:
      'If your browser allows it, open its menu and choose “Install app” or “Add to Home Screen”.',
  },
);
