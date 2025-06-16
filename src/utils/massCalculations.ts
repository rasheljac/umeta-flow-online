
// Enhanced molecular mass and m/z calculations
export interface IonizationMode {
  name: string;
  massShift: number;
  charge: number;
  polarity: 'positive' | 'negative';
}

// Comprehensive ionization modes for metabolomics with exact masses
export const IONIZATION_MODES: IonizationMode[] = [
  { name: '[M+H]+', massShift: 1.007276, charge: 1, polarity: 'positive' },
  { name: '[M+Na]+', massShift: 22.989218, charge: 1, polarity: 'positive' },
  { name: '[M+K]+', massShift: 38.963158, charge: 1, polarity: 'positive' },
  { name: '[M+NH4]+', massShift: 18.033823, charge: 1, polarity: 'positive' },
  { name: '[M+2H]2+', massShift: 2.014552, charge: 2, polarity: 'positive' },
  { name: '[M-H]-', massShift: -1.007276, charge: 1, polarity: 'negative' },
  { name: '[M+Cl]-', massShift: 34.969402, charge: 1, polarity: 'negative' },
  { name: '[M+HCOO]-', massShift: 44.998201, charge: 1, polarity: 'negative' },
  { name: '[M+CH3COO]-', massShift: 59.013851, charge: 1, polarity: 'negative' },
  { name: '[M-H2O-H]-', massShift: -19.01839, charge: 1, polarity: 'negative' }
];

// Enhanced atomic masses with high precision
const ATOMIC_MASSES: { [key: string]: number } = {
  'C': 12.0000000, 'H': 1.0078250, 'O': 15.9949146, 'N': 14.0030740,
  'S': 31.9720718, 'P': 30.9737633, 'Cl': 34.9688527, 'Br': 78.9183376,
  'F': 18.9984032, 'I': 126.904473, 'Na': 22.9897677, 'K': 38.9637074,
  'Ca': 39.9625906, 'Mg': 23.9850423, 'Fe': 55.9349393, 'Zn': 63.9291448,
  'Cu': 62.9295989, 'Mn': 54.9380471, 'Mo': 95.9596657, 'Se': 79.9165196,
  'Si': 27.9769265, 'B': 11.0093055, 'Al': 26.9815385
};

export const calculateExactMassFromFormula = (formula: string): number => {
  if (!formula || typeof formula !== 'string') return 0;
  
  const cleanFormula = formula.replace(/\s+/g, '');
  let mass = 0;
  
  try {
    // Handle formulas with brackets - enhanced recursion
    let expandedFormula = cleanFormula;
    
    // Expand brackets (handles nested brackets recursively)
    let iterations = 0;
    while (expandedFormula.includes('(') && iterations < 10) {
      expandedFormula = expandedFormula.replace(/\(([^()]+)\)(\d*)/g, (match, content, multiplier) => {
        const mult = parseInt(multiplier) || 1;
        let expanded = '';
        const contentRegex = /([A-Z][a-z]?)(\d*)/g;
        let contentMatch;
        
        while ((contentMatch = contentRegex.exec(content)) !== null) {
          const element = contentMatch[1];
          const count = (parseInt(contentMatch[2]) || 1) * mult;
          expanded += element + (count > 1 ? count : '');
        }
        return expanded;
      });
      iterations++;
    }
    
    // Parse expanded formula with enhanced regex
    const regex = /([A-Z][a-z]?)(\d*)/g;
    let match;
    
    while ((match = regex.exec(expandedFormula)) !== null) {
      const element = match[1];
      const count = parseInt(match[2]) || 1;
      const atomicMass = ATOMIC_MASSES[element];
      
      if (atomicMass) {
        mass += atomicMass * count;
      } else {
        console.warn(`Unknown element: ${element} in formula: ${formula}`);
        // Don't fail completely - continue with known elements
      }
    }
    
    return Math.round(mass * 1000000) / 1000000; // Round to 6 decimal places
  } catch (error) {
    console.error(`Error calculating mass for formula ${formula}:`, error);
    return 0;
  }
};

export const calculateTheoreticalMZ = (
  exactMass: number,
  ionizationMode: IonizationMode
): number => {
  if (exactMass === 0) return 0;
  const mz = (exactMass + ionizationMode.massShift) / Math.abs(ionizationMode.charge);
  return Math.round(mz * 1000000) / 1000000; // High precision
};

export const calculateAllTheoreticalMZ = (
  exactMass: number,
  polarity?: 'positive' | 'negative'
): { mode: IonizationMode; mz: number }[] => {
  const modes = polarity 
    ? IONIZATION_MODES.filter(mode => mode.polarity === polarity)
    : IONIZATION_MODES;
    
  return modes.map(mode => ({
    mode,
    mz: calculateTheoreticalMZ(exactMass, mode)
  })).filter(item => item.mz > 0); // Only return valid m/z values
};

export const findMassMatches = (
  observedMZ: number,
  theoreticalMZList: { mode: IonizationMode; mz: number }[],
  tolerancePPM: number = 10
): { mode: IonizationMode; mz: number; ppmError: number }[] => {
  const matches = [];
  
  for (const theoretical of theoreticalMZList) {
    if (theoretical.mz <= 0) continue; // Skip invalid m/z values
    
    const ppmError = Math.abs((observedMZ - theoretical.mz) / theoretical.mz * 1000000);
    
    if (ppmError <= tolerancePPM) {
      matches.push({
        ...theoretical,
        ppmError: Math.round(ppmError * 100) / 100 // Round to 2 decimal places
      });
    }
  }
  
  return matches.sort((a, b) => a.ppmError - b.ppmError);
};
