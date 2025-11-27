/**
 * Roof Materials Calculator
 * Based on Code Kalkulator Pelana v2.3.0 - Kencana Calibrated
 */

import {
  CalculatorInput,
  CalculatorResults,
  BAR_LEN,
  CANAL_C_COVERAGE,
  ROOF_WASTE_FACTORS,
  SCREW_DENSITY,
  COVER_DEFAULTS,
  INDUSTRIAL_SPACING,
} from '@/types/calculator';

/**
 * Main calculation function
 */
export function calculateRoofMaterials(inputs: CalculatorInput): CalculatorResults {
  const {
    modelAtap,
    buildingType = 'Residential',
    panjang,
    lebar,
    overstek,
    sudut,
    jenisAtap,
    hargaKanalC = 0,
    hargaPurlin = 0,
    hargaReng = 0,
    hargaGording = 0,
    hargaMetal = 0,
    hargaSpandek = 0,
    hargaUPVC = 0,
    hargaSekrupAtap = 0,
    hargaSekrupRangka = 0,
    upahPerM2 = 0,
  } = inputs;

  // Validate model atap
  if (!modelAtap) {
    throw new Error('Pilih model atap terlebih dahulu (Pelana, Limas, atau Datar).');
  }

  // Determine if Industrial mode
  const isIndustrial = buildingType === 'Industrial';

  // Get defaults for current cover type
  const defaults = COVER_DEFAULTS[jenisAtap];
  const lebarEfektif = defaults.lebarEfektif;
  const panjangEfektif = defaults.panjangEfektif;
  const sekrupAtapPerM2 = defaults.sekrupAtapPerM2;
  const sekrupRangkaPerM2 = defaults.sekrupRangkaPerM2;
  const jarakReng = defaults.jarakReng;

  // Calculate roof geometry
  const thetaRad = (sudut * Math.PI) / 180;
  const cosTheta = Math.cos(thetaRad);

  // Validation for slope angle
  if (modelAtap !== 'Datar' && (cosTheta < 0.2 || sudut > 60)) {
    throw new Error('Sudut terlalu besar. Kurangi sudut kemiringan (max 60°).');
  }

  let roofAreaGeom: number;
  let roofAreaMaterial: number;
  let S: number;  // slope length
  let Lh: number; // horizontal length

  // Effective dimensions with overhang
  const L_eff = panjang + 2 * overstek;
  const B_eff = lebar + 2 * overstek;

  // Calculate area based on roof type
  if (modelAtap === 'Datar') {
    // FLAT ROOF (Industrial only)
    roofAreaGeom = L_eff * B_eff;
    roofAreaMaterial = roofAreaGeom * ROOF_WASTE_FACTORS['Datar'];
    S = B_eff / 2;
    Lh = L_eff;
  } else if (modelAtap === 'Pelana') {
    // GABLE ROOF (2 rectangular slopes)
    Lh = L_eff;
    S = (lebar / 2 + overstek) / cosTheta;
    roofAreaGeom = 2 * Lh * S;
    roofAreaMaterial = roofAreaGeom * ROOF_WASTE_FACTORS['Pelana'];
  } else {
    // LIMAS (HIP ROOF) - Kencana calibrated
    roofAreaGeom = (L_eff * B_eff) / cosTheta;
    roofAreaMaterial = roofAreaGeom * ROOF_WASTE_FACTORS['Limas'];
    S = (B_eff / 2) / cosTheta;
    Lh = L_eff;
  }

  // Main frame count (Kanal C / Purlin)
  const kanalCCount =
    modelAtap === 'Limas' && !isIndustrial
      ? Math.floor(roofAreaMaterial / CANAL_C_COVERAGE)
      : Math.ceil(roofAreaMaterial / CANAL_C_COVERAGE);

  // Secondary frame count (Reng / Gording)
  let rengCount: number;
  const activeJarakReng = isIndustrial
    ? INDUSTRIAL_SPACING.gordingSpacing
    : jarakReng;

  if (modelAtap === 'Limas' && !isIndustrial) {
    // LIMAS RESIDENTIAL: Geometric calculation (Kencana)
    const slopeWidth = (B_eff / 2) / cosTheta;
    const planHipHalf = Math.hypot(L_eff / 2, B_eff / 2);
    const slopeHip = planHipHalf / cosTheta;
    const nWidth = Math.ceil(slopeWidth / activeJarakReng);
    const nHip = Math.ceil(slopeHip / activeJarakReng);
    rengCount = 2 * nWidth + nHip + 1;
  } else if (modelAtap === 'Pelana' && !isIndustrial) {
    // PELANA RESIDENTIAL: Geometric method
    const slopeLength = (lebar / 2 + overstek) / cosTheta;
    const nRengPerSide = Math.ceil(slopeLength / activeJarakReng);
    const totalRengM = 2 * nRengPerSide * L_eff;
    rengCount = Math.ceil(totalRengM / BAR_LEN);
  } else if (modelAtap === 'Limas' && isIndustrial) {
    // LIMAS INDUSTRIAL: Geometric with hip factor
    const slopeWidth = (B_eff / 2) / cosTheta;
    const planHipHalf = Math.hypot(L_eff / 2, B_eff / 2);
    const slopeHip = planHipHalf / cosTheta;
    const nWidth = Math.ceil(slopeWidth / activeJarakReng);
    const nHip = Math.ceil(slopeHip / activeJarakReng);
    rengCount = 2 * nWidth + nHip + 1;
  } else {
    // PELANA INDUSTRIAL & DATAR: Area-based
    const totalGordingM = (roofAreaMaterial * 1.10) / activeJarakReng;
    rengCount = Math.ceil(totalGordingM / BAR_LEN);
  }

  // Sheets count
  let sheetsCount: number;
  let sheetAreaEff: number;
  let areaCheck: number | undefined;
  let cutLength: number | undefined;
  let stockLength: number | undefined;
  let wastePerSheet: number | undefined;

  if (jenisAtap === 'Genteng Metal') {
    // GENTENG METAL - Area-based
    const AREA_PER_GENTENG = lebarEfektif;
    sheetsCount = Math.ceil(roofAreaMaterial / AREA_PER_GENTENG);
    sheetAreaEff = AREA_PER_GENTENG;
    areaCheck = sheetsCount * sheetAreaEff;
  } else if (modelAtap === 'Datar') {
    // DATAR - Spandek/uPVC
    const lanes = Math.ceil(L_eff / lebarEfektif);
    const totalLength = lanes * B_eff;
    sheetsCount = Math.ceil(totalLength / panjangEfektif);
    cutLength = B_eff;
    stockLength = panjangEfektif;
    wastePerSheet = Math.max(0, stockLength - cutLength);
    sheetAreaEff = lebarEfektif * cutLength;
    areaCheck = sheetsCount * sheetAreaEff;
  } else if (modelAtap === 'Limas') {
    // LIMAS - Spandek/uPVC
    const lanes = Math.ceil(L_eff / lebarEfektif);
    const slopeWidth = S;
    const totalLength = lanes * slopeWidth * 2 * 1.10;
    sheetsCount = Math.ceil(totalLength / panjangEfektif);
    cutLength = slopeWidth;
    stockLength = panjangEfektif;
    wastePerSheet = Math.max(0, stockLength - cutLength);
    sheetAreaEff = lebarEfektif * cutLength;
    areaCheck = sheetsCount * sheetAreaEff;
  } else {
    // PELANA - Spandek/uPVC
    const lanes = Math.ceil(L_eff / lebarEfektif);
    const slopeLength = S;
    const totalLength = lanes * slopeLength * 2;
    sheetsCount = Math.ceil(totalLength / panjangEfektif);
    cutLength = slopeLength;
    stockLength = panjangEfektif;
    wastePerSheet = Math.max(0, stockLength - cutLength);
    sheetAreaEff = lebarEfektif * cutLength;
    areaCheck = sheetsCount * sheetAreaEff;
  }

  // Screws (dual system)
  const screwsRoofing = Math.ceil(roofAreaMaterial * sekrupAtapPerM2);
  const screwsFrame = Math.ceil(roofAreaMaterial * sekrupRangkaPerM2);
  const screwsTotal = screwsRoofing + screwsFrame;

  // Costs
  const kanalCCost = isIndustrial ? kanalCCount * hargaPurlin : kanalCCount * hargaKanalC;
  const rengCost = isIndustrial ? rengCount * hargaGording : rengCount * hargaReng;

  let sheetsCost = 0;
  if (jenisAtap === 'Genteng Metal') sheetsCost = sheetsCount * hargaMetal;
  else if (jenisAtap === 'Spandek') sheetsCost = sheetsCount * hargaSpandek;
  else if (jenisAtap === 'uPVC') sheetsCost = sheetsCount * hargaUPVC;

  const screwsRoofingCost = screwsRoofing * hargaSekrupAtap;
  const screwsFrameCost = screwsFrame * hargaSekrupRangka;
  const screwsCost = screwsRoofingCost + screwsFrameCost;

  const laborCost = roofAreaMaterial * upahPerM2;
  const totalCost = kanalCCost + rengCost + sheetsCost + screwsCost + laborCost;

  return {
    roofAreaGeom,
    roofAreaMaterial,
    slopeLength: S,
    kanalCCount,
    rengCount,
    sheetsCount,
    sheetAreaEach: sheetAreaEff,
    areaCheck,
    cutLength,
    stockLength,
    wastePerSheet,
    screwsRoofing,
    screwsFrame,
    screwsTotal,
    kanalCCost,
    rengCost,
    sheetsCost,
    screwsCost,
    laborCost,
    totalCost,
  };
}

/**
 * Format currency in Indonesian Rupiah
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Validate calculator input
 */
export function validateCalculatorInput(inputs: Partial<CalculatorInput>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!inputs.modelAtap) {
    errors.push('Model atap harus dipilih (Pelana, Limas, atau Datar)');
  }

  if (!inputs.panjang || inputs.panjang <= 0) {
    errors.push('Panjang harus lebih dari 0 meter');
  }

  if (!inputs.lebar || inputs.lebar <= 0) {
    errors.push('Lebar harus lebih dari 0 meter');
  }

  if (inputs.overstek === undefined || inputs.overstek < 0) {
    errors.push('Overstek harus 0 atau lebih');
  }

  if (!inputs.sudut || inputs.sudut < 0 || inputs.sudut > 60) {
    errors.push('Sudut kemiringan harus antara 0-60 derajat');
  }

  if (inputs.modelAtap === 'Datar' && inputs.buildingType !== 'Industrial') {
    errors.push('Atap Datar hanya tersedia untuk bangunan Industrial');
  }

  if (!inputs.jenisAtap) {
    errors.push('Jenis atap harus dipilih (Genteng Metal, Spandek, atau uPVC)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
