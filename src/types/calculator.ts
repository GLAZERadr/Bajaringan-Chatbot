/**
 * Calculator Types for Bajaringan Roof Materials Calculator
 * Based on Code Kalkulator Pelana v2.3.0
 */

// Roof Types
export type RoofModel = 'Pelana' | 'Limas' | 'Datar';
export type BuildingType = 'Residential' | 'Industrial';
export type CoverType = 'Genteng Metal' | 'Spandek' | 'uPVC';

// Calculator Input
export interface CalculatorInput {
  // Geometry
  panjang: number;      // Length (m)
  lebar: number;        // Width (m)
  overstek: number;     // Overhang per side (m)
  sudut: number;        // Pitch angle (degrees)

  // Type
  modelAtap: RoofModel;
  buildingType: BuildingType;
  jenisAtap: CoverType;

  // Prices (optional)
  hargaKanalC?: number;
  hargaPurlin?: number;
  hargaReng?: number;
  hargaGording?: number;
  hargaMetal?: number;
  hargaSpandek?: number;
  hargaUPVC?: number;
  hargaSekrupAtap?: number;
  hargaSekrupRangka?: number;
  upahPerM2?: number;
}

// Calculator Results
export interface CalculatorResults {
  // Area
  roofAreaGeom: number;       // Geometric area (m²)
  roofAreaMaterial: number;   // Material area with waste factor (m²)
  slopeLength: number;        // Slope length (m)

  // Materials
  kanalCCount: number;        // Main frame (Kanal C or Purlin)
  rengCount: number;          // Secondary frame (Reng or Gording)
  sheetsCount: number;        // Sheets/tiles count

  // Screws (dual system)
  screwsRoofing: number;      // Roofing screws (attach cover to frame)
  screwsFrame: number;        // Frame screws (structural connections)
  screwsTotal: number;        // Total screws

  // Costs
  kanalCCost: number;
  rengCost: number;
  sheetsCost: number;
  screwsCost: number;
  laborCost: number;
  totalCost: number;

  // Additional info
  sheetAreaEach?: number;
  areaCheck?: number;
  cutLength?: number;
  stockLength?: number;
  wastePerSheet?: number;
}

// Constants
export const BAR_LEN = 6.0;  // Standard bar length (m)
export const CANAL_C_COVERAGE = 1.5;  // Canal C coverage (m² per batang)

// Waste Factors
export const ROOF_WASTE_FACTORS = {
  'Pelana': 1.00,   // No additional waste (2 rectangular slopes)
  'Limas': 1.085,   // +8.5% waste (calibrated to Kencana)
  'Datar': 1.00,    // Minimal waste (flat)
};

// Screw Density (pcs/m²)
export const SCREW_DENSITY = {
  ROOFING: {
    'Genteng Metal': 10,
    'Spandek': 8,
    'uPVC': 8,
  },
  FRAME: 20,  // All types
};

// Cover Defaults
export const COVER_DEFAULTS = {
  'Genteng Metal': {
    lebarEfektif: 0.616,   // m² per lembar (area-based)
    panjangEfektif: 1.00,  // Not applicable
    jarakReng: 0.21,       // 21 cm
    sekrupAtapPerM2: 10,
    sekrupRangkaPerM2: 20,
    koefReng: 1.10,
  },
  'Spandek': {
    lebarEfektif: 1.00,    // m
    panjangEfektif: 6.00,  // m (stock length)
    jarakReng: 1.00,       // 1.0 m (gording)
    sekrupAtapPerM2: 8,
    sekrupRangkaPerM2: 20,
    koefReng: 0.8,
  },
  'uPVC': {
    lebarEfektif: 0.86,    // m
    panjangEfektif: 6.00,  // m (stock length)
    jarakReng: 1.00,       // 1.0 m (gording)
    sekrupAtapPerM2: 8,
    sekrupRangkaPerM2: 20,
    koefReng: 0.8,
  },
};

// Industrial Spacing
export const INDUSTRIAL_SPACING = {
  purlinSpacing: 1.5,   // Purlin/CNP spacing (m)
  gordingSpacing: 1.2,  // Gording spacing (m)
};
