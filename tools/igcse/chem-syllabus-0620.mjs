// IGCSE Chemistry 0620 (Cambridge): papers, topics and the keyword rules that sort questions into topics.
// Used by build-chem-bank.mjs.
export const CODE = '0620';
export const LEVEL = 'Cambridge IGCSE';
export const ID_PREFIX = 'ch-';
export const FIG_DIR = 'figures/chemistry';
export const OUT = (paper) => `data/chemistry-paper${paper}.json`;
export const PAPERS = {
  1: 'Multiple Choice (Core)',
  2: 'Multiple Choice (Extended)',
  3: 'Theory (Core)',
  4: 'Theory (Extended)',
  5: 'Practical Test',
  6: 'Alternative to Practical',
};
export const MCQ = new Set([1, 2]);
export const PRACTICAL = new Set([5, 6]);
export const PRACTICAL_TOPIC = 12;
// Every paper can test any topic.
export const chaptersFor = () => Object.keys(TOPICS).map(Number);

// Topics of the 0620 syllabus (2023–2025 and 2026–2028).
export const TOPICS = {
  1: ['States of matter', [
    ['diffusion', /diffus/i],
    ['changes of state and kinetic particle theory', /./],
  ]],
  2: ['Atoms, elements and compounds', [
    ['isotopes', /isotope/i],
    ['atomic structure and electronic configuration', /\b(proton|neutron|electron(ic)? (configuration|arrangement|shell)|nucleon|atomic number|mass number|sub-?atomic)/i],
    ['giant covalent structures', /\b(diamond|graphite|silicon\(IV\) oxide|silicon dioxide|giant covalent|macromolecul)/i],
    ['metallic bonding', /metallic bond|sea of (delocalised )?electrons/i],
    ['ionic bonding', /\bionic|lattice|dot-and-cross.*ion/i],
    ['covalent bonding', /covalent|dot-and-cross|shared pair|simple molecul/i],
    ['elements, compounds and mixtures', /./],
  ]],
  3: ['Stoichiometry', [
    ['concentration and titration calculations', /\b(concentration|mol ?\/ ?dm|titrat)/i],
    ['gas volumes', /\b(24 ?dm|24 ?000|volume of (gas|carbon dioxide|hydrogen|oxygen))/i],
    ['percentage yield and purity', /percentage (yield|purity|composition)|% yield/i],
    ['empirical and molecular formulae', /empirical|molecular formula/i],
    ['the mole and reacting masses', /\b(mole|moles|relative (formula|molecular|atomic) mass|M ?r\b|A ?r\b|mass of)/i],
    ['formulae and equations', /./],
  ]],
  4: ['Electrochemistry', [
    ['fuel cells', /fuel cell/i],
    ['electroplating', /electroplat/i],
    ['half-equations at electrodes', /half-?equation|ionic half/i],
    ['electrolysis', /./],
  ]],
  5: ['Chemical energetics', [
    ['bond energies', /bond energ/i],
    ['energy level diagrams', /energy level|reaction pathway|activation energy/i],
    ['exothermic and endothermic reactions', /./],
  ]],
  6: ['Chemical reactions', [
    ['rate of reaction', /\b(rate|collision|catalyst|surface area|enzyme)/i],
    ['reversible reactions and equilibrium', /\b(reversible|equilibrium|Haber|Contact process|⇌)/i],
    ['redox', /\b(redox|oxidi[sz]|reduc|oxidation (number|state)|electron (loss|gain))/i],
    ['physical and chemical changes', /./],
  ]],
  7: ['Acids, bases and salts', [
    ['preparation of salts', /\b(prepar|crystalli[sz]|filtrat|making a salt|titration method)/i],
    ['oxides', /\b(amphoteric|basic oxide|acidic oxide|neutral oxide)/i],
    ['pH and indicators', /\b(pH|indicator|litmus|methyl orange|thymolphthalein)/i],
    ['properties of acids and bases', /./],
  ]],
  8: ['The Periodic Table', [
    ['Group I', /\b(Group I\b|alkali metal|lithium|sodium|potassium|rubidium)/i],
    ['Group VII', /\b(Group VII|halogen|chlorine|bromine|iodine|fluorine|astatine)/i],
    ['transition elements', /transition (element|metal)/i],
    ['noble gases', /noble gas|Group VIII|helium|neon|argon/i],
    ['arrangement of elements', /./],
  ]],
  9: ['Metals', [
    ['extraction of metals', /\b(blast furnace|extract|bauxite|cryolite|hematite|haematite|zinc blende)/i],
    ['corrosion of metals', /\b(rust|corrosion|galvani[sz]|sacrificial)/i],
    ['reactivity series', /\b(reactivity|displace)/i],
    ['alloys', /\b(alloy|brass|stainless steel)/i],
    ['properties and uses of metals', /./],
  ]],
  10: ['Chemistry of the environment', [
    ['water', /\b(water treatment|chlorination|anhydrous|cobalt\(II\) chloride|copper\(II\) sulfate|purity of water|fertiliser|NPK)/i],
    ['air quality and climate', /./],
  ]],
  11: ['Organic chemistry', [
    ['polymers', /\b(polymer|poly\(|monomer|addition polymeri[sz]|condensation polymer|nylon|PET|protein|amino acid)/i],
    ['fuels and fractional distillation', /\b(petroleum|crude oil|fraction|naphtha|bitumen|refinery gas|kerosene|diesel)/i],
    ['alkanes', /\balkane|substitution|methane|ethane|propane|butane/i],
    ['alkenes', /\balkene|cracking|ethene|propene|bromine water|unsaturated/i],
    ['alcohols', /\b(alcohol|ethanol|fermentation|methanol|propanol)/i],
    ['carboxylic acids and esters', /\b(carboxylic|ethanoic|ester|propanoic|methanoic|butanoic)/i],
    ['formulae, functional groups and homologous series', /./],
  ]],
  12: ['Experimental techniques and chemical analysis', [
    ['chromatography', /chromatogra|R ?f\b|locating agent|solvent front|baseline/i],
    ['tests for ions', /\b(flame test|precipitate|aqueous sodium hydroxide|aqueous ammonia|acidified|silver nitrate|barium|test for (the )?(ion|cation|anion))/i],
    ['tests for gases', /\b(limewater|glowing splint|lighted splint|damp (red|blue) litmus|test for (a )?gas)/i],
    ['acid–base titrations', /\b(titration|burette|pipette|end-?point)/i],
    ['separation and purification', /\b(filtration|distillation|crystalli[sz]ation|separat|purif|melting point|boiling point)/i],
    ['experimental design and apparatus', /./],
  ]],
};

export const HINTS = {
  1: /\b(solids?|liquids?|melting|boiling|freezing|evaporat|condens|sublim|diffus|kinetic particle|states? of matter|change of state|heating curve|cooling curve)\w*/gi,
  2: /\b(atom|proton|neutron|electron|isotope|ionic|covalent|bonding|lattice|giant|diamond|graphite|dot-and-cross|shell|metallic bond)\w*/gi,
  3: /\b(mole|moles|mol\b|M ?r\b|A ?r\b|relative (formula|molecular|atomic) mass|empirical|molecular formula|concentration|mol ?\/ ?dm|yield|purity|24 ?dm|stoichiometr|empirical)\w*/gi,
  4: /\b(electrolys|electrolyte|electrode|anode|cathode|cations?|anions?|electroplat|fuel cell|half-?equation|graphite electrodes|inert electrode)\w*/gi,
  5: /\b(exothermic|endothermic|enthalpy|ΔH|energy level|bond energ|activation energy|kJ ?\/ ?mol|reaction pathway|heat|energy)\w*/gi,
  6: /\b(rate|catalyst|collision|surface area|reversible|equilibrium|Haber|Contact process|redox|oxidi[sz]|reduc|oxidation number|oxidising agent|reducing agent|photochemical|⇌)\w*/gi,
  7: /\b(acid|alkali|base|bases|pH|indicator|neutrali[sz]|salt|titration|amphoteric|oxide|proton (donor|acceptor)|hydroxide|carbonate|crystals)\w*/gi,
  8: /\b(Periodic Table|group|period|Group I|Group VII|Group VIII|halogen|alkali metal|noble gas|transition (element|metal)|lithium|sodium|potassium|chlorine|bromine|iodine|fluorine|helium|argon|neon)\b/gi,
  9: /\b(metal|alloy|reactivity|displace|extract|blast furnace|ore|rust|corrosion|galvani[sz]|sacrificial|aluminium|iron|zinc|copper|steel|bauxite|cryolite|hematite)\w*/gi,
  10: /\b(water treatment|chlorination|fertiliser|NPK|greenhouse|climate|global warming|acid rain|pollut|carbon monoxide|nitrogen oxides|sulfur dioxide|catalytic converter|photosynthesis|clean air|air)\w*/gi,
  11: /\b(alkane|alkene|alcohol|ethanol|carboxylic|ester|polymer|monomer|cracking|fraction|petroleum|crude oil|homologous|functional group|general formula|ultraviolet|isomer|hydrocarbon|methane|ethene|propene|fermentation|structural formula|displayed formula|nylon|PET|amino acid|protein|saturated|unsaturated)\w*/gi,
  12: /\b(chromatogra|R ?f\b|precipitate|flame test|limewater|splint|litmus|test for|tests? \d|burette|pipette|filt|distillation|crystalli[sz]ation|apparatus|measuring cylinder|thermometer|stop-?watch|condenser|fume cupboard|separat|purif|solvent front|baseline|locating agent)\w*/gi,
};

// MCQ papers follow the syllabus order; question number → likely topic.
export const MCQ_ORDER = [[2, 1], [7, 2], [12, 3], [14, 4], [16, 5], [20, 6], [24, 7], [27, 8], [30, 9], [33, 10], [39, 11], [40, 12]];


// Extra points when a question clearly belongs to a topic.
export function strong(ch, text) {
  let score = 0;
  if (ch === 6 && /Haber|Contact process|equilibrium|reversible|\brate\b/i.test(text)) score += 8;
  if (ch === 5 && /temperature (change|rise|decrease|increase)|exothermic|endothermic|enthalpy/i.test(text)) score += 8;
  if (ch === 12 && /tests? on (the )?(solid|solution|substance)|identify the (gas|ion|solid|solution)|chromatogra/i.test(text)) score += 6;
  if (ch === 8 && /transition (element|metal)|Group (I|VII|VIII)\b|Periodic Table|halogen|alkali metal|noble gas/i.test(text)) score += 5;
  if (ch === 10 && /acid rain|greenhouse|climate|pollut|catalytic converter|water treatment|fertiliser/i.test(text)) score += 5;
  if (ch === 4 && /electrolys/i.test(text)) score += 8;
  if (ch === 12 && /chromatogra|flame test|test for (the )?(ion|gas)/i.test(text)) score += 8;
  if (ch === 11 && /homologous|functional group|polymer|ester|alcohol|alkene|alkane/i.test(text)) score += 3;
  if (ch === 5 && /bond energ|energy level diagram|exothermic|endothermic/i.test(text)) score += 6;
  if (ch === 3 && /calculate .*(mass|moles?|volume|concentration|percentage)|empirical formula/i.test(text)) score += 5;
  return score;
}
