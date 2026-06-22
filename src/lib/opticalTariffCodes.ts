export type LensTint = 'BLANC' | 'TEINTE';

export interface LensTariffCode {
  code: string;
  price: number;
  kind: 'SPHERIQUE' | 'CYL_0_25_2_00' | 'CYL_2_25_4_00';
  sphereMin: number;
  sphereMax: number;
}

interface TariffRow {
  code: string;
  sphereMin: number;
  sphereMax: number;
  blanc: number;
  teinte: number;
}

const SPHERICAL_ROWS: TariffRow[] = [
  { code: '400', sphereMin: 0, sphereMax: 2, blanc: 31, teinte: 36 },
  { code: '401', sphereMin: 2.25, sphereMax: 4, blanc: 35, teinte: 40 },
  { code: '402', sphereMin: 4.25, sphereMax: 6, blanc: 41, teinte: 46 },
  { code: '403', sphereMin: 6.5, sphereMax: 8, blanc: 50, teinte: 55 },
  { code: '404', sphereMin: 8.5, sphereMax: 10, blanc: 61, teinte: 66 },
  { code: '405', sphereMin: 10.5, sphereMax: 14, blanc: 73, teinte: 78 },
  { code: '406', sphereMin: 15, sphereMax: 20, blanc: 99, teinte: 104 },
];

const CYLINDER_LOW_ROWS: TariffRow[] = [
  { code: '407', sphereMin: 0, sphereMax: 2, blanc: 48, teinte: 53 },
  { code: '408', sphereMin: 2.25, sphereMax: 4, blanc: 52, teinte: 57 },
  { code: '409', sphereMin: 4.25, sphereMax: 6, blanc: 60, teinte: 65 },
  { code: '410', sphereMin: 6.5, sphereMax: 8, blanc: 74, teinte: 79 },
  { code: '411', sphereMin: 8.5, sphereMax: 10, blanc: 85, teinte: 90 },
  { code: '412', sphereMin: 10.5, sphereMax: 14, blanc: 103, teinte: 108 },
  { code: '413', sphereMin: 15, sphereMax: 20, blanc: 128, teinte: 133 },
];

const CYLINDER_HIGH_ROWS: TariffRow[] = [
  { code: '414', sphereMin: 0, sphereMax: 2, blanc: 50, teinte: 55 },
  { code: '415', sphereMin: 2.25, sphereMax: 4, blanc: 55, teinte: 60 },
  { code: '416', sphereMin: 4.25, sphereMax: 6, blanc: 63, teinte: 68 },
  { code: '417', sphereMin: 6.5, sphereMax: 8, blanc: 77, teinte: 82 },
  { code: '418', sphereMin: 8.5, sphereMax: 10, blanc: 88, teinte: 93 },
  { code: '419', sphereMin: 10.5, sphereMax: 14, blanc: 108, teinte: 113 },
  { code: '420', sphereMin: 15, sphereMax: 20, blanc: 154, teinte: 159 },
];

function findSphereBand(rows: TariffRow[], sphereAbs: number): TariffRow | undefined {
  return rows.find((row) => sphereAbs >= row.sphereMin && sphereAbs <= row.sphereMax);
}

export function getSimpleFoyerOrganicTariffCode(
  sphere?: number,
  cylinder?: number,
  tint: LensTint = 'BLANC'
): LensTariffCode | undefined {
  if (sphere == null) return undefined;

  const sphereAbs = Math.abs(sphere);
  const cylinderAbs = Math.abs(cylinder ?? 0);

  let kind: LensTariffCode['kind'] = 'SPHERIQUE';
  let row: TariffRow | undefined;

  if (cylinderAbs === 0) {
    row = findSphereBand(SPHERICAL_ROWS, sphereAbs);
  } else if (cylinderAbs >= 0.25 && cylinderAbs <= 2) {
    kind = 'CYL_0_25_2_00';
    row = findSphereBand(CYLINDER_LOW_ROWS, sphereAbs);
  } else if (cylinderAbs >= 2.25 && cylinderAbs <= 4) {
    kind = 'CYL_2_25_4_00';
    row = findSphereBand(CYLINDER_HIGH_ROWS, sphereAbs);
  }

  if (!row) return undefined;

  return {
    code: row.code,
    price: tint === 'TEINTE' ? row.teinte : row.blanc,
    kind,
    sphereMin: row.sphereMin,
    sphereMax: row.sphereMax,
  };
}
