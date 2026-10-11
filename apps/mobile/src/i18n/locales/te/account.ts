/**
 * Everyday Telugu UI copy, not ritual text (§15 — see `content/timings.json`'s
 * own note on this boundary). Machine-translated; flagged for a native-speaker
 * copy pass before release, same as `locales/te/common.ts`.
 *
 * The Privacy Policy's own legal body text (`app/profile/privacy.tsx`'s
 * `Section` blocks) is intentionally left in English — only its screen title
 * and draft banner are UI chrome.
 */
export default {
  account: {
    signedIn: 'సైన్ ఇన్ అయ్యారు',
    accountFallback: 'ఖాతా',
    providerGoogle: 'గూగుల్',
    providerApple: 'ఆపిల్',
    lastSynced: 'చివరిసారి సింక్ అయింది {{date}}',
    notSyncedYet: 'ఇంకా సింక్ కాలేదు',
    guestTitle: 'మీరు ePoojaను గెస్ట్‌గా ఉపయోగిస్తున్నారు',
    guestBody:
      'మీ ప్రొఫైల్ ఈ పరికరంలోనే ఉంటుంది. బ్యాకప్ చేసి మరో ఫోన్‌లో ఉపయోగించడానికి సైన్ ఇన్ చేయండి.',
    signInWithGoogle: 'గూగుల్‌తో సైన్ ఇన్ చేయండి',
    openingGoogle: 'గూగుల్ తెరుస్తోంది…',
    signInWithApple: 'ఆపిల్‌తో సైన్ ఇన్ చేయండి',
    openingApple: 'ఆపిల్ తెరుస్తోంది…',
    noBackend:
      'ఈ బిల్డ్‌లో బ్యాకెండ్ కాన్ఫిగర్ చేయలేదు — ఒకటి సిద్ధమైనప్పుడు సైన్-ఇన్ పనిచేస్తుంది.',
    signOut: 'సైన్ అవుట్ చేయండి',
    deleteMyAccount: 'నా ఖాతాను తొలగించండి',
    deleteConfirmWarning:
      'ఇది మీ ఖాతా, సింక్ చేసిన ప్రొఫైల్ మరియు పూజా చరిత్రను మా సర్వర్ల నుండి శాశ్వతంగా తొలగిస్తుంది. మీ ప్రొఫైల్ ఈ పరికరంలో అలాగే ఉంటుంది.',
    confirmDelete: 'తొలగించడాన్ని నిర్ధారించండి',
    deleting: 'తొలగిస్తోంది…',
    deleteGenericError:
      'మీ ఖాతాను తొలగించలేకపోయాము. దయచేసి మళ్ళీ ప్రయత్నించండి లేదా మద్దతును సంప్రదించండి.',
    privacyPolicyLink: 'గోప్యతా విధానం',
    failureNoBackend: 'ఈ బిల్డ్‌లో సైన్-ఇన్ ఇంకా సెటప్ చేయలేదు.',
    failureUnsupportedPlatform: 'ఈ సైన్-ఇన్ పద్ధతి ఈ పరికరంలో అందుబాటులో లేదు.',
    failureCancelled: 'సైన్-ఇన్ రద్దు చేయబడింది.',
    failureProviderError: 'ఏదో పొరపాటు జరిగింది — దయచేసి మళ్ళీ ప్రయత్నించండి.',
  },
  privacy: {
    title: 'గోప్యతా విధానం',
    draftBanner:
      'ముసాయిదా — న్యాయ సలహాదారుచే ఇంకా సమీక్షించబడలేదు. ఆమోదించిన విధానంతో భర్తీ చేసి, కింద ఉన్న ఖాళీలను పూరించే వరకు దీన్ని యాప్ స్టోర్‌కు సమర్పించవద్దు.',
  },
  storage: {
    statusBundled: 'యాప్‌తో కలిసి ఉంది',
    statusNotDownloaded: 'డౌన్‌లోడ్ కాలేదు',
    statusDownloading: 'డౌన్‌లోడ్ అవుతోంది…',
    statusDownloaded: 'డౌన్‌లోడ్ అయింది',
    statusFailed: 'డౌన్‌లోడ్ విఫలమైంది',
    checkForUpdates: 'అప్‌డేట్‌ల కోసం చూడండి',
    checking: 'తనిఖీ చేస్తోంది…',
    upToDate: 'అంతా తాజాగా ఉంది.',
    updatedCount: '{{count}} ప్యాక్(లు) అప్‌డేట్ చేయబడ్డాయి.',
    noBackend:
      'ఈ బిల్డ్‌లో బ్యాకెండ్ కాన్ఫిగర్ చేయలేదు — పైన ఉన్న ప్రతి పూజ యాప్‌తో కలిసి వచ్చినదే.',
  },
};
