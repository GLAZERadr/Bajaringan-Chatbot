/**
 * Calculator API Route
 * Handles roof materials calculation requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateRoofMaterials, validateCalculatorInput, formatCurrency } from '@/utils/calculator';
import { CalculatorInput } from '@/types/calculator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: Partial<CalculatorInput> = await request.json();

    // Validate input
    const validation = validateCalculatorInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Calculate materials
    const results = calculateRoofMaterials(body as CalculatorInput);

    // Format response with human-readable values
    const response = {
      success: true,
      input: body,
      results: {
        area: {
          geometric: {
            value: results.roofAreaGeom,
            unit: 'm²',
            formatted: `${results.roofAreaGeom.toFixed(2)} m²`,
          },
          material: {
            value: results.roofAreaMaterial,
            unit: 'm²',
            formatted: `${results.roofAreaMaterial.toFixed(2)} m²`,
          },
          slopeLength: {
            value: results.slopeLength,
            unit: 'm',
            formatted: `${results.slopeLength.toFixed(2)} m`,
          },
        },
        materials: {
          mainFrame: {
            name: body.buildingType === 'Industrial' ? 'Purlin/CNP' : 'Kanal C',
            count: results.kanalCCount,
            unit: 'batang',
            cost: results.kanalCCost,
            costFormatted: formatCurrency(results.kanalCCost),
          },
          secondaryFrame: {
            name: body.buildingType === 'Industrial' ? 'Gording' : 'Reng',
            count: results.rengCount,
            unit: 'batang',
            cost: results.rengCost,
            costFormatted: formatCurrency(results.rengCost),
          },
          cover: {
            name: body.jenisAtap,
            count: results.sheetsCount,
            unit: body.jenisAtap === 'Genteng Metal' ? 'lembar' : 'lembar',
            cost: results.sheetsCost,
            costFormatted: formatCurrency(results.sheetsCost),
            areaEach: results.sheetAreaEach,
            cutLength: results.cutLength,
            stockLength: results.stockLength,
            wastePerSheet: results.wastePerSheet,
          },
          screws: {
            roofing: {
              count: results.screwsRoofing,
              unit: 'buah',
              description: 'Sekrup atap (cover ke rangka)',
            },
            frame: {
              count: results.screwsFrame,
              unit: 'buah',
              description: 'Sekrup rangka (koneksi struktural)',
            },
            total: {
              count: results.screwsTotal,
              unit: 'buah',
              cost: results.screwsCost,
              costFormatted: formatCurrency(results.screwsCost),
            },
          },
        },
        costs: {
          labor: {
            value: results.laborCost,
            formatted: formatCurrency(results.laborCost),
          },
          total: {
            value: results.totalCost,
            formatted: formatCurrency(results.totalCost),
          },
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Calculator error:', error);

    return NextResponse.json(
      {
        error: 'Calculation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
