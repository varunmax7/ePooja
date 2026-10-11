/**
 * `EnumSearchPicker` and `FamilyMemberForm` are shared between onboarding and
 * Profile (`components/onboarding/EnumSearchPicker.tsx`,
 * `components/family/FamilyMemberForm.tsx`), so their strings live in their
 * own namespace rather than duplicated under both callers'.
 */
export default {
  search: 'Search',
  searchPlaceholder: 'Type in Telugu or English…',
  noMatch: 'No match. Try a different spelling.',
  iDontKnow: "I don't know",
  name: 'Name',
  relation: 'Relation',
  relationSpouse: 'Spouse',
  relationSon: 'Son',
  relationDaughter: 'Daughter',
  relationFather: 'Father',
  relationMother: 'Mother',
  relationOther: 'Other',
  male: 'Male',
  female: 'Female',
  nakshatram: 'Nakshatram (optional)',
  nakshatramTitle: 'Nakshatram',
  rasi: 'Rasi (optional)',
  rasiTitle: 'Rasi',
  notSet: 'Not set',
  includeInSankalpam: 'Include in Sankalpam',
  add: 'Add',
};
