// Cambridge International AS & A Level Biology 9700: papers, topics and the keyword rules that sort
// questions into topics. Used by build-chem-bank.mjs (node build-chem-bank.mjs … 9700).
export const CODE = '9700';
export const LEVEL = 'Cambridge International AS & A Level';
export const ID_PREFIX = 'ab-';
export const FIG_DIR = 'figures/biology-alevel';
export const OUT = (paper) => `data/biology-alevel-paper${paper}.json`;
export const PAPERS = {
  1: 'Multiple Choice (AS)',
  2: 'AS Level Structured Questions',
  3: 'Advanced Practical Skills (AS)',
  4: 'A Level Structured Questions',
  5: 'Planning, Analysis and Evaluation',
};
export const MCQ = new Set([1]);
export const PRACTICAL = new Set([3, 5]);
// Biology has no separate practical topic: practical questions go to the topic they are about.
export const PRACTICAL_TOPIC = null;

const AS = Array.from({ length: 11 }, (_, i) => i + 1);
const ALL = Array.from({ length: 19 }, (_, i) => i + 1);
// AS papers (1–3) test topics 1–11; Papers 4 and 5 can test the whole syllabus.
export const chaptersFor = (paper) => (paper <= 3 ? AS : ALL);

const t = (name, subs = []) => [name, [...subs, [name.toLowerCase(), /./]]];

// Topics of the 9700 syllabus (2022–2024 and 2025–2027): 1–11 AS Level, 12–19 A Level.
export const TOPICS = {
  1: t('Cell structure', [['microscopy and magnification', /microscop|magnification|resolution|eyepiece graticule|stage micrometer/i], ['cell organelles', /organelle|mitochondri|ribosome|Golgi|endoplasmic|nucleolus|chloroplast|lysosome|centriole/i], ['prokaryotes and viruses', /prokaryot|bacteri|virus/i]]),
  2: t('Biological molecules', [['carbohydrates', /glucose|starch|glycogen|cellulose|glycosidic|sugar|sucrose|maltose/i], ['lipids', /lipid|triglyceride|phospholipid|fatty acid|ester bond/i], ['proteins', /protein|amino acid|peptide|haemoglobin|collagen|tertiary|quaternary/i], ['water', /water|hydrogen bond/i], ['biochemical tests', /Benedict|biuret|iodine|emulsion/i]]),
  3: t('Enzymes', [['enzyme inhibition', /inhibit/i], ['factors affecting enzyme activity', /temperature|pH|concentration|V ?max|K ?m\b/i]]),
  4: t('Cell membranes and transport', [['osmosis and water potential', /osmosis|water potential|plasmolys/i], ['membrane structure', /fluid mosaic|phospholipid|cholesterol|glycoprotein/i], ['diffusion and active transport', /diffusion|active transport|endocytosis|exocytosis|carrier|channel/i]]),
  5: t('The mitotic cell cycle', [['mitosis', /mitosis|prophase|metaphase|anaphase|telophase|spindle/i], ['chromosomes and telomeres', /chromosome|chromatid|centromere|telomere|stem cell|cancer/i]]),
  6: t('Nucleic acids and protein synthesis', [['DNA replication', /replication|semi-conservative|DNA polymerase/i], ['transcription and translation', /transcription|translation|mRNA|tRNA|codon|anticodon|ribosome/i], ['gene mutations', /mutation|substitution|deletion|insertion/i]]),
  7: t('Transport in plants', [['transpiration', /transpiration|stomata|potometer|xerophyt/i], ['translocation', /phloem|translocation|sucrose|sieve tube|companion cell|mass flow/i], ['xylem and water movement', /xylem|apoplast|symplast|endodermis|Casparian/i]]),
  8: t('Transport in mammals', [['the heart and cardiac cycle', /heart|cardiac|atri|ventric|SAN|AVN|Purkyne|ECG/i], ['blood and haemoglobin', /haemoglobin|red blood cell|oxygen dissociation|Bohr|carbonic anhydrase|plasma/i], ['blood vessels', /arter|vein|capillar|tissue fluid|lymph/i]]),
  9: t('Gas exchange', [['the gas exchange system', /alveol|trachea|bronch|cartilage|cilia|goblet|surfactant/i]]),
  10: t('Infectious diseases', [['antibiotics and resistance', /antibiotic|penicillin|resistan/i], ['diseases and their transmission', /cholera|malaria|tuberculosis|TB\b|HIV|AIDS|measles|pathogen|transmi/i]]),
  11: t('Immunity', [['antibodies and vaccination', /antibod|vaccin|monoclonal|immunity/i], ['lymphocytes', /lymphocyte|B-?cell|T-?cell|phagocyt|antigen/i]]),
  12: t('Energy and respiration', [['glycolysis, Krebs cycle and oxidative phosphorylation', /glycolysis|Krebs|link reaction|oxidative phosphorylation|electron transport|NAD|FAD|chemiosmo/i], ['respiratory quotient and anaerobic respiration', /RQ|respiratory quotient|anaerobic|lactate|ethanol|respirometer/i], ['ATP', /ATP/i]]),
  13: t('Photosynthesis', [['light-dependent reactions', /light.dependent|photosystem|photolysis|cyclic|non-cyclic|thylakoid/i], ['Calvin cycle and limiting factors', /Calvin|RuBisCO|RuBP|GP\b|TP\b|limiting factor/i], ['photosynthetic pigments', /pigment|chlorophyll|chromatography|absorption spectrum|action spectrum/i]]),
  14: t('Homeostasis', [['the kidney and osmoregulation', /kidney|nephron|ultrafiltration|loop of Henle|ADH|collecting duct|osmoregulat|urea/i], ['blood glucose', /insulin|glucagon|blood glucose|diabet|adrenaline|cyclic AMP/i], ['homeostasis in plants', /stomata|guard cell|abscisic|ABA/i]]),
  15: t('Control and coordination', [['nerve impulses and synapses', /neurone|action potential|synap|acetylcholine|myelin|resting potential|sensory|motor/i], ['muscle contraction', /muscle|sarcomere|actin|myosin|neuromuscular/i], ['plant responses and hormones', /auxin|gibberellin|Venus fly trap|IAA/i], ['hormones and the endocrine system', /hormone|endocrine|menstrual|contracepti|FSH|LH|oestrogen|progesterone/i]]),
  16: t('Inherited change', [['meiosis', /meiosis|crossing over|independent assortment|haploid|diploid/i], ['genetic crosses and chi-squared', /dihybrid|monohybrid|chi.squared|χ|epistasis|linkage|sex.linked|test cross/i], ['gene control', /lac operon|transcription factor|repressor|gibberellin|DELLA/i]]),
  17: t('Selection and evolution', [['natural and artificial selection', /natural selection|selective breeding|artificial selection|directional|stabilising|disruptive/i], ['Hardy–Weinberg', /Hardy.Weinberg/i], ['speciation', /speciation|allopatric|sympatric|isolat/i]]),
  18: t('Classification, biodiversity and conservation', [['classification', /domain|kingdom|taxon|classif/i], ['biodiversity and sampling', /biodiversity|Simpson|quadrat|transect|mark.release|Spearman|Pearson/i], ['conservation', /conservation|endangered|CITES|zoo|seed bank|culling|invasive/i]]),
  19: t('Genetic technology', [['recombinant DNA and genetic engineering', /recombinant|plasmid|restriction enzyme|ligase|vector|genetically modified|GM\b|transgenic/i], ['PCR and gel electrophoresis', /PCR|polymerase chain|electrophoresis|microarray|sequencing/i], ['genetic technology in medicine', /gene therapy|genetic screening|insulin|bioinformatics/i]]),
};

const re = (s) => new RegExp(`\\b(${s})\\w*`, 'gi');
export const HINTS = {
  1: re('cell structure|organelle|microscop|magnification|resolution|eyepiece graticule|stage micrometer|mitochondri|ribosome|Golgi|endoplasmic reticulum|rough ER|smooth ER|nucleolus|nuclear envelope|lysosome|centriole|microtubule|microvill|cell wall|plasmodesmat|prokaryot|eukaryot|virus|bacteri|ATP'),
  2: re('carbohydrate|monosaccharide|disaccharide|polysaccharide|glucose|starch|amylose|amylopectin|glycogen|cellulose|glycosidic|sucrose|maltose|lipid|triglyceride|phospholipid|fatty acid|ester bond|protein|amino acid|peptide bond|primary structure|secondary structure|tertiary|quaternary|haemoglobin|collagen|hydrogen bond|disulfide|ionic bond|Benedict|biuret|emulsion test|reducing sugar|water'),
  3: re('enzyme|active site|substrate|lock and key|induced fit|activation energy|inhibit|V ?max|K ?m\\b|Michaelis|immobilised|denatur'),
  4: re('membrane|fluid mosaic|phospholipid bilayer|cholesterol|glycoprotein|glycolipid|diffusion|facilitated diffusion|osmosis|water potential|active transport|endocytosis|exocytosis|carrier protein|channel protein|plasmolys|turgid|surface area to volume|cell signalling'),
  5: re('mitosis|mitotic|cell cycle|interphase|prophase|metaphase|anaphase|telophase|cytokinesis|spindle|chromatid|centromere|telomere|stem cell|cancer|tumour'),
  6: re('DNA|RNA|nucleotide|base pair|adenine|thymine|cytosine|guanine|uracil|replication|semi-conservative|DNA polymerase|helicase|transcription|translation|mRNA|tRNA|codon|anticodon|polypeptide|gene mutation|triplet'),
  7: re('xylem|phloem|transpiration|stomata|stomatal|root hair|apoplast|symplast|endodermis|Casparian|cohesion|tension|potometer|translocation|sieve tube|companion cell|mass flow|xerophyt|sucrose|source|sink'),
  8: re('heart|cardiac|atri|ventric|valve|sinoatrial|atrioventricular|SAN|AVN|Purkyne|bundle of His|ECG|arter|vein|capillar|tissue fluid|lymph|blood|haemoglobin|red blood cell|erythrocyte|oxygen dissociation|Bohr|carbonic anhydrase|chloride shift|plasma|neutrophil'),
  9: re('gas exchange|lung|alveol|trachea|bronch|cartilage|cilia|ciliated|goblet cell|mucus|smooth muscle|elastic fibre|surfactant|ventilation|squamous'),
  10: re('infectious disease|pathogen|cholera|malaria|Plasmodium|tuberculosis|TB\\b|HIV|AIDS|measles|Vibrio|Mycobacterium|transmi|vector|antibiotic|penicillin|resistan'),
  11: re('immun|antibod|antigen|lymphocyte|B-?lymphocyte|T-?lymphocyte|plasma cell|memory cell|phagocyt|macrophage|neutrophil|vaccin|monoclonal|helper T|killer T|autoimmune|myasthenia'),
  12: re('respiration|ATP|glycolysis|pyruvate|link reaction|acetyl|Krebs|NAD|FAD|oxidative phosphorylation|electron transport chain|chemiosmo|ATP synthase|anaerobic|lactate|ethanol|respiratory quotient|RQ\\b|respirometer|mitochondri|yeast|rice'),
  13: re('photosynthes|chloroplast|thylakoid|grana|stroma|photosystem|chlorophyll|carotenoid|pigment|light-dependent|light-independent|photolysis|photophosphorylation|Calvin|RuBisCO|RuBP|GP\\b|triose phosphate|limiting factor|absorption spectrum|action spectrum|C4|maize|sorghum|Rf'),
  14: re('homeostasis|negative feedback|thermoregulat|kidney|nephron|glomerulus|Bowman|ultrafiltration|selective reabsorption|loop of Henle|collecting duct|ADH|aquaporin|osmoregulat|urea|urine|insulin|glucagon|blood glucose|diabet|adrenaline|cyclic AMP|second messenger|glycogenolysis|guard cell|abscisic|ABA'),
  15: re('nervous|neurone|sensory|motor neurone|relay|reflex|action potential|resting potential|depolaris|repolaris|refractory|myelin|node of Ranvier|saltatory|synap|acetylcholine|neurotransmitter|receptor|muscle|sarcomere|actin|myosin|neuromuscular|tropomyosin|troponin|hormone|endocrine|menstrual|contracepti|FSH|LH|oestrogen|progesterone|auxin|IAA|gibberellin|Venus fly trap'),
  16: re('meiosis|homologous|crossing over|independent assortment|haploid|diploid|gamete|allele|genotype|phenotype|dominant|recessive|codominan|monohybrid|dihybrid|sex.linked|autosomal|linkage|epistasis|chi.squared|χ|test cross|lac operon|transcription factor|repressor|DELLA|mutation'),
  17: re('variation|continuous|discontinuous|natural selection|selection pressure|stabilising|directional|disruptive|genetic drift|founder effect|bottleneck|Hardy.Weinberg|allele frequenc|artificial selection|selective breeding|inbreeding|hybrid|speciation|allopatric|sympatric|evolution|reproductive isolation|t-test'),
  18: re('species|ecosystem|niche|biodiversity|Simpson|index of diversity|quadrat|transect|mark.release.recapture|Lincoln|Spearman|Pearson|correlation|classification|taxonom|domain|kingdom|Archaea|Bacteria|Eukarya|conservation|endangered|extinct|CITES|zoo|seed bank|culling|invasive|national park|IVF|embryo transfer'),
  19: re('genetic technology|genetic engineering|recombinant|plasmid|restriction enzyme|sticky end|ligase|reverse transcriptase|vector|promoter|marker gene|GFP|genetically modified|GM\\b|transgenic|PCR|polymerase chain|Taq|primer|electrophoresis|microarray|sequencing|bioinformatics|gene therapy|genetic screening|Bt|herbicide.resistant|Golden Rice'),
};

// The AS multiple-choice paper follows the syllabus order; question number → likely topic.
export const MCQ_ORDER = [[6, 1], [11, 2], [14, 3], [18, 4], [21, 5], [25, 6], [29, 7], [33, 8], [35, 9], [38, 10], [40, 11]];

// Extra points when a question clearly belongs to a topic.
export function strong(ch, text) {
  const has = (r) => r.test(text);
  if (ch === 1 && has(/magnification|eyepiece graticule|stage micrometer|electron micrograph|organelle/i)) return 8;
  if (ch === 2 && has(/Benedict|biuret|emulsion|glycosidic|triglyceride|peptide bond|haemoglobin structure|collagen/i)) return 6;
  if (ch === 3 && has(/enzyme|active site|V ?max|K ?m\b|inhibitor/i)) return 8;
  if (ch === 4 && has(/water potential|fluid mosaic|osmosis|plasmolys/i)) return 8;
  if (ch === 5 && has(/mitosis|cell cycle|telomere|prophase|metaphase|anaphase|telophase/i)) return 8;
  if (ch === 6 && has(/transcription|translation|codon|replication|mRNA|tRNA/i)) return 6;
  if (ch === 7 && has(/xylem|phloem|transpiration|translocation|potometer/i)) return 8;
  if (ch === 8 && has(/cardiac cycle|heart|oxygen dissociation|Bohr|haemoglobin|tissue fluid/i)) return 6;
  if (ch === 9 && has(/alveol|trachea|bronch|gas exchange/i)) return 8;
  if (ch === 10 && has(/cholera|malaria|tuberculosis|HIV|measles|antibiotic resistance|penicillin/i)) return 8;
  if (ch === 11 && has(/antibod|vaccin|lymphocyte|monoclonal|memory cell/i)) return 8;
  if (ch === 12 && has(/glycolysis|Krebs|link reaction|oxidative phosphorylation|respiratory quotient|respirometer|anaerobic respiration/i)) return 10;
  if (ch === 13 && has(/photosynthes|photosystem|Calvin|RuBisCO|chlorophyll|limiting factor/i)) return 10;
  if (ch === 14 && has(/kidney|nephron|loop of Henle|ADH|insulin|glucagon|blood glucose|homeostasis|guard cell/i)) return 10;
  if (ch === 15 && has(/action potential|neurone|synap|sarcomere|muscle contraction|auxin|gibberellin|menstrual|Venus fly trap/i)) return 10;
  if (ch === 16 && has(/meiosis|dihybrid|monohybrid|chi.squared|χ|epistasis|sex.linked|lac operon|genetic diagram/i)) return 10;
  if (ch === 17 && has(/natural selection|Hardy.Weinberg|speciation|selective breeding|genetic drift|t-test/i)) return 10;
  if (ch === 18 && has(/Simpson|biodiversity|classification|domain|conservation|endangered|quadrat|Spearman|mark.release/i)) return 10;
  if (ch === 19 && has(/recombinant|plasmid|restriction enzyme|PCR|electrophoresis|gene therapy|genetically modified|microarray/i)) return 10;
  return 0;
}
