export function estimateCpp(averageIncome, ympe, maxAnnual) {
  if (ympe <= 0 || maxAnnual <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, averageIncome) / ympe);
  return Math.round(ratio * maxAnnual * 100) / 100;
}

export function estimateOas(yearsInCanadaAfter18, maxAnnual) {
  const years = Math.min(40, Math.max(0, yearsInCanadaAfter18));
  return Math.round((years / 40) * Math.max(0, maxAnnual) * 100) / 100;
}

export function residenceYearsFromAge(age) {
  if (!Number.isFinite(age)) return 0;
  return Math.max(0, Math.min(40, Math.floor(age - 18)));
}
