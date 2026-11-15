// Cambridge International AS & A Level Chemistry 9701: papers, topics and the keyword rules that sort
// questions into topics. Used by build-chem-bank.mjs.
export const CODE = '9701';
export const LEVEL = 'Cambridge International AS & A Level';
export const ID_PREFIX = 'ac-';
export const FIG_DIR = 'figures/chemistry-alevel';
export const OUT = (paper) => `data/chemistry-alevel-paper${paper}.json`;
export const PAPERS = {
  1: 'Multiple Choice (AS)',
  2: 'AS Level Structured Questions',
  3: 'Advanced Practical Skills (AS)',
  4: 'A Level Structured Questions',
  5: 'Planning, Analysis and Evaluation',
};
export const MCQ = new Set([1]);
export const PRACTICAL = new Set([3, 5]);
export const PRACTICAL_TOPIC = 22;

const AS = Array.from({ length: 22 }, (_, i) => i + 1);
const ALL = Array.from({ length: 37 }, (_, i) => i + 1);
// AS papers (1–3) test topics 1–22; Paper 4 and 5 can test the whole syllabus.
export const chaptersFor = (paper) => (paper <= 3 ? AS : ALL);

const t = (name, subs = []) => [name, [...subs, [name.toLowerCase(), /./]]];

// Topics of the 9701 syllabus (2022–2024 and 2025–2027): 1–22 AS Level, 23–37 A Level.
export const TOPICS = {
  1: t('Atomic structure', [['ionisation energies', /ionisation energ/i], ['electronic configuration', /electronic configuration|orbital|subshell|1s/i]]),
  2: t('Atoms, molecules and stoichiometry', [['mole calculations', /mol\b|moles|mass of|volume of/i], ['empirical and molecular formulae', /empirical|molecular formula/i]]),
  3: t('Chemical bonding', [['shapes of molecules', /shape|VSEPR|bond angle/i], ['intermolecular forces', /hydrogen bond|van der Waals|intermolecular|dipole/i], ['ionic, covalent and metallic bonding', /ionic|covalent|metallic|dative/i]]),
  4: t('States of matter', [['ideal gases', /ideal gas|pV ?= ?nRT/i], ['lattice structures', /lattice|giant/i]]),
  5: t('Chemical energetics', [['Hess’s law', /Hess|enthalpy cycle/i], ['bond energies', /bond energ/i], ['enthalpy changes', /enthalpy|ΔH/i]]),
  6: t('Electrochemistry', [['redox and oxidation numbers', /oxidation number|redox|oxidi[sz]|reduc/i]]),
  7: t('Equilibria', [['acids and bases', /Brønsted|Bronsted|conjugate|strong acid|weak acid/i], ['equilibrium constants', /\bK ?[cp]\b|equilibrium constant|Le Chatelier/i]]),
  8: t('Reaction kinetics', [['catalysis', /catalys/i], ['Boltzmann distribution', /Boltzmann/i]]),
  9: t('The Periodic Table: chemical periodicity', [['oxides and chlorides of Period 3', /oxide|chloride/i]]),
  10: t('Group 2'),
  11: t('Group 17'),
  12: t('Nitrogen and sulfur'),
  13: t('An introduction to AS Level organic chemistry', [['isomerism', /isomer/i], ['naming and formulae', /name|formula/i]]),
  14: t('Hydrocarbons', [['alkenes', /alkene|addition/i], ['alkanes', /alkane|free.radical|substitution/i]]),
  15: t('Halogen compounds'),
  16: t('Hydroxy compounds'),
  17: t('Carbonyl compounds'),
  18: t('Carboxylic acids and derivatives'),
  19: t('Nitrogen compounds'),
  20: t('Polymerisation'),
  21: t('Organic synthesis'),
  22: t('Analytical techniques', [['infrared spectroscopy', /infrared|IR\b|wavenumber/i], ['mass spectrometry', /mass spectr|M\+1|molecular ion/i]]),
  23: t('Chemical energetics (A Level)', [['lattice energy and Born–Haber cycles', /lattice energy|Born.Haber/i], ['entropy and Gibbs free energy', /entropy|ΔS|Gibbs|ΔG|feasib/i]]),
  24: t('Electrochemistry (A Level)', [['electrode potentials', /E ?⦵|E\s?°|electrode potential|cell potential|Nernst/i], ['electrolysis calculations', /Faraday|electrolys/i]]),
  25: t('Equilibria (A Level)', [['buffers and pH', /buffer|pH|K ?a\b|pK ?a/i], ['solubility product', /K ?sp|solubility product|common ion/i], ['partition coefficients', /partition/i]]),
  26: t('Reaction kinetics (A Level)', [['rate equations and orders', /rate equation|order|rate constant|half-life/i]]),
  27: t('Group 2 (A Level)'),
  28: t('Chemistry of transition elements', [['complex ions and ligands', /ligand|complex|coordination/i]]),
  29: t('An introduction to A Level organic chemistry', [['optical isomerism', /chiral|optical|enantiomer/i]]),
  30: t('Hydrocarbons: arenes'),
  31: t('Halogen compounds (A Level)'),
  32: t('Hydroxy compounds: phenol'),
  33: t('Carboxylic acids and derivatives (A Level)'),
  34: t('Nitrogen compounds (A Level)', [['amino acids and proteins', /amino acid|peptide|protein|zwitterion/i], ['amines and azo dyes', /amine|azo|diazonium/i]]),
  35: t('Polymerisation (A Level)'),
  36: t('Organic synthesis (A Level)'),
  37: t('Analytical techniques (A Level)', [['NMR spectroscopy', /NMR|chemical shift|δ|splitting/i], ['chromatography', /chromatogra|R ?f\b/i]]),
};

const re = (s) => new RegExp(`\\b(${s})\\w*`, 'gi');
export const HINTS = {
  1: re('proton|neutron|electronic configuration|electron shell|isotope|nucleon|orbital|subshell|ionisation energ|atomic radius|ionic radius'),
  2: re('mole|mol\\b|relative (atomic|molecular|formula) mass|M ?r\\b|A ?r\\b|empirical|molecular formula|Avogadro|percentage yield|atom economy|concentration|titration'),
  3: re('covalent|ionic bond|metallic bond|dative|electronegativ|shape|bond angle|VSEPR|hydrogen bond|van der Waals|intermolecular|dipole|sigma|pi bond|hybridis|lone pair'),
  4: re('ideal gas|pV|gas constant|lattice|giant|simple molecular|states? of matter'),
  5: re('enthalpy|ΔH|exothermic|endothermic|Hess|bond energ|calorimet|specific heat|temperature (change|rise)'),
  6: re('oxidation number|oxidation state|redox|oxidis|reduc|disproportionat'),
  7: re('equilibri|Le Chatelier|K ?c|K ?p|Brønsted|Bronsted|conjugate|reversible|Haber|Contact process|strong acid|weak acid'),
  8: re('rate|catalys|activation energy|Boltzmann|collision'),
  9: re('Period 3|periodicity|sodium|magnesium|aluminium|silicon|phosphorus|chlorine|argon|oxide|chloride|electrical conductivity|melting point'),
  10: re('Group 2|beryllium|magnesium|calcium|strontium|barium|thermal (de)?compos|limestone|lime'),
  11: re('Group 17|halogen|chlorine|bromine|iodine|fluorine|halide|hydrogen halide|silver nitrate|disproportionat'),
  12: re('nitrogen|ammonia|ammonium|nitrate|NO ?x|sulfur|sulfuric|SO ?2|SO ?3|acid rain|catalytic converter|PAN'),
  13: re('functional group|homologous|isomer|structural formula|skeletal|displayed formula|nucleophile|electrophile|free radical|IUPAC|name'),
  14: re('alkane|alkene|hydrocarbon|cracking|free.radical substitution|electrophilic addition|ethene|propene|combustion'),
  15: re('halogenoalkane|bromoalkane|chloroalkane|iodoalkane|nucleophilic substitution|S ?N ?1|S ?N ?2|CFC'),
  16: re('alcohol|ethanol|propan-[12]-ol|hydroxy|oxidation of alcohol|dehydration|ester'),
  17: re('aldehyde|ketone|carbonyl|2,4-DNPH|Tollens|Fehling|hydroxynitrile|HCN'),
  18: re('carboxylic|ester|ethanoic|hydrolysis'),
  19: re('nitrile|amine|amide|primary amine'),
  20: re('polymer|monomer|poly\\(|addition polymer'),
  21: re('synthesis|synthetic route|reagents and conditions'),
  22: re('infrared|IR spectrum|wavenumber|mass spectr|molecular ion|M\\+1|absorption'),
  23: re('lattice energy|Born.Haber|electron affinity|enthalpy of (hydration|solution|atomisation)|entropy|ΔS|Gibbs|ΔG|feasib|spontaneous'),
  24: re('electrode potential|E ?⦵|standard cell|half-cell|salt bridge|Nernst|Faraday|electrolysis|electroplat|fuel cell'),
  25: re('buffer|K ?a|pK ?a|K ?w|pH|K ?sp|solubility product|common ion|partition|K ?pc'),
  26: re('rate equation|rate constant|order of reaction|first order|second order|zero order|half-life|initial rate|rate-determining|homogeneous catalys|heterogeneous'),
  27: re('Group 2 (nitrates|carbonates|hydroxides|sulfates)|thermal stability|solubility of Group 2'),
  28: re('transition element|transition metal|complex ion|ligand|coordination number|d.orbital|d.block|chromium|manganese|iron\\(|cobalt|nickel|copper\\(|vanadium|stereoisomer|cis|trans|colour of'),
  29: re('chiral|optical isomer|enantiomer|stereo|racemic'),
  30: re('benzene|arene|methylbenzene|phenyl|electrophilic substitution|Friedel|nitration'),
  31: re('chlorobenzene|aryl halide'),
  32: re('phenol|phenoxide'),
  33: re('acyl chloride|acid anhydride|ethanoyl chloride|carboxylic acid'),
  34: re('amine|phenylamine|amide|amino acid|peptide|protein|zwitterion|diazonium|azo|electrophoresis'),
  35: re('condensation polymer|polyester|polyamide|nylon|Kevlar|biodegrad'),
  36: re('synthesis|synthetic route|retrosynthe|chiral drug'),
  37: re('NMR|chemical shift|δ|splitting|multiplet|D ?2 ?O|TMS|chromatogra|R ?f\\b|retention'),
};

// The AS multiple-choice paper follows the syllabus order; question number → likely topic.
export const MCQ_ORDER = [[2, 1], [5, 2], [8, 3], [9, 4], [11, 5], [12, 6], [14, 7], [16, 8], [18, 9], [20, 10], [22, 11],
  [24, 12], [25, 13], [27, 14], [29, 15], [31, 16], [33, 17], [35, 18], [36, 19], [37, 20], [38, 21], [40, 22]];

// Extra points when a question clearly belongs to a topic.
export function strong(ch, text) {
  const has = (r) => r.test(text);
  if (ch === 23 && has(/lattice energy|Born.Haber|entropy|Gibbs|ΔG|ΔS\b/i)) return 10;
  if (ch === 24 && has(/electrode potential|E ?⦵|E\s?°|Nernst|Faraday/i)) return 10;
  if (ch === 25 && has(/buffer|K ?sp|solubility product|partition coefficient|\bK ?a\b|pK ?a/i)) return 10;
  if (ch === 26 && has(/rate equation|rate constant|order (of|with respect)|half-life/i)) return 10;
  if (ch === 28 && has(/transition element|complex ion|ligand|coordination number/i)) return 10;
  if (ch === 29 && has(/chiral|optical isomer|enantiomer/i)) return 8;
  if (ch === 30 && has(/benzene|arene|electrophilic substitution/i)) return 8;
  if (ch === 32 && has(/phenol/i)) return 8;
  if (ch === 33 && has(/acyl chloride|anhydride/i)) return 8;
  if (ch === 34 && has(/amino acid|peptide|diazonium|azo|phenylamine|electrophoresis/i)) return 8;
  if (ch === 35 && has(/condensation polymer|polyester|polyamide/i)) return 8;
  if (ch === 37 && has(/NMR|chemical shift/i)) return 10;
  if (ch === 34 && has(/\bamines?\b|\bamides?\b|basicit|ethylamine|diethylamine|ethanamide/i)) return 8;
  if (ch === 33 && has(/acidit|chloroethanoic|bromoethanoic|carboxylic acid/i)) return 6;
  if (ch === 23 && has(/electron affinit/i)) return 8;
  if (ch === 22 && has(/infrared|mass spectr|wavenumber/i)) return 8;
  if (ch === 1 && has(/ionisation energ|electronic configuration|orbital/i)) return 6;
  if (ch === 3 && has(/shape|bond angle|hydrogen bond|intermolecular/i)) return 5;
  if (ch === 5 && has(/enthalpy change|Hess|bond energ/i)) return 5;
  if (ch === 7 && has(/equilibrium|K ?c|K ?p|Le Chatelier/i)) return 6;
  if (ch === 8 && has(/Boltzmann|rate of reaction|catalyst/i)) return 5;
  if (ch === 10 && has(/Group 2/i)) return 6;
  if (ch === 11 && has(/Group 17|halogen|halide/i)) return 6;
  if (ch === 15 && has(/halogenoalkane|nucleophilic substitution/i)) return 6;
  if (ch === 17 && has(/aldehyde|ketone|carbonyl|Tollens|Fehling|DNPH/i)) return 6;
  return 0;
}
