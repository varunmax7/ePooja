/**
 * Chant Player (§8.6) UI chrome — not the mantra/instruction/Sankalpam text
 * itself, which stays script-selected via `mantraScript` and is never
 * translated by `uiLang` (§9.3's two-axis split).
 */
export default {
  closePlayerA11y: 'Close player',
  optionsA11y: 'Player options',
  preparingSankalpam: 'Preparing today’s Sankalpam…',
  unknownPuja: "That pooja isn't in this app yet.",
  stepCaption: 'Step {{current}} of {{total}}: {{title}}',
  play: 'Play',
  pause: 'Pause',
  previousStep: 'Previous step',
  nextStep: 'Next step',
  chantMode: 'Chant Mode',
  guidedMode: 'Guided Narration Mode',
  samagriChecklist: 'Samagri checklist',
  offerA11y: 'Offer, {{count}} of {{total}}',
  sayGotraAloud: 'Say your gotra aloud',
  sayNameAloud: 'Say your name aloud',
  completed: {
    title: 'Pooja Sampoornam',
    body: '{{title}} is complete.',
  },
  settings: {
    title: 'Player settings',
    autoAdvance: 'Auto-advance to next step',
    showMeaning: 'Show meaning',
  },
};
