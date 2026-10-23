import { CAPITAL_GAINS_INCLUSION } from "./death-tax.js";
import { taxOnInclusion } from "./tax.js";

function grow(balance, rate) {
  if (balance <= 0) return 0;
  if (!(rate > -1)) return 0;
  return balance * (1 + rate);
}

function taxNominal(nominalBase, nominalInclusion, factor, province) {
  if (nominalInclusion <= 0) return 0;
  const scale = factor > 0 ? factor : 1;
  const result = taxOnInclusion(nominalBase / scale, nominalInclusion / scale, province);
  return result ? result.tax * scale : 0;
}

// The slider is the most someone would contribute. Unused room carries forward.
// Once that room is gone, a year is limited to the new room arriving that year.
export function depositsOverYears({ desiredAnnual, openingRoom, newRoomByYear = [], years }) {
  let available = Math.max(0, openingRoom);
  const want = Math.max(0, desiredAnnual);
  const deposits = [];
  const count = Math.max(0, years);
  for (let year = 0; year < count; year += 1) {
    if (year > 0) available += Math.max(0, newRoomByYear[year - 1] || 0);
    const deposit = Math.min(want, available);
    available -= deposit;
    deposits.push(deposit);
  }
  return deposits;
}

function inclusionFor(taken, balance, acb, kind) {
  if (taken <= 0 || balance <= 0) return 0;
  if (kind === "rrsp") return taken;
  const gain = Math.max(0, balance - acb);
  return taken * (gain / balance) * CAPITAL_GAINS_INCLUSION;
}

function takeTaxable({ balance, acb, kind, need, base, factor, province }) {
  if (need <= 0 || balance <= 0) return { taken: 0, tax: 0, net: 0, balance, acb, base };
  const taxOn = (taken) => taxNominal(base, inclusionFor(taken, balance, acb, kind), factor, province);
  const netOf = (taken) => taken - taxOn(taken);
  let taken = balance;
  if (netOf(balance) > need) {
    let low = 0;
    let high = balance;
    for (let step = 0; step < 28; step += 1) {
      const mid = (low + high) / 2;
      if (netOf(mid) >= need) high = mid;
      else low = mid;
    }
    taken = high;
  }
  const tax = taxOn(taken);
  const acbLeft = balance > 0 ? acb * ((balance - taken) / balance) : 0;
  return {
    taken,
    tax,
    net: taken - tax,
    balance: balance - taken,
    acb: acbLeft,
    base: base + inclusionFor(taken, balance, acb, kind),
  };
}

// CPP counts from retirement. OAS counts from 65. Both rise with inflation.
// The recovery screen uses today's OAS threshold against today's pension income.
function pensionCash({
  retired,
  age,
  partnerAge,
  clientCpp,
  clientOas,
  partnerCpp,
  partnerOas,
  otherIncome,
  threshold,
  rate,
}) {
  if (!retired) return 0;
  const cpp = Math.max(0, clientCpp);
  let oas = age >= 65 ? Math.max(0, clientOas) : 0;
  const proxy = Math.max(0, otherIncome) + cpp + oas;
  if (threshold > 0 && proxy > threshold) {
    oas -= Math.min(oas, rate * (proxy - threshold));
  }
  const spouseCpp = Math.max(0, partnerCpp);
  const spouseOas = partnerAge == null || partnerAge >= 65 ? Math.max(0, partnerOas) : 0;
  return cpp + oas + spouseCpp + spouseOas;
}

// Year-by-year balances. Contributions are capped by room. At retirement,
// contributions stop. CPP and OAS cover part of the after-tax income, and the
// accounts withdraw the rest, from the RRSP, then non-registered, then the TFSA, then other assets.
export function projectPortfolio({
  currentAge,
  retirementAge,
  years,
  inflationRate = 0,
  savingsReturn = 0,
  retirementReturn = 0,
  otherReturn = 0,
  desiredIncomeToday = 0,
  tfsaAnnual = 0,
  rrspAnnual = 0,
  nonRegAnnual = 0,
  tfsaOpening = 0,
  rrspOpening = 0,
  nonRegOpening = 0,
  otherOpening = 0,
  tfsaRoomNow = 0,
  rrspRoomNow = 0,
  tfsaNewRoom = [],
  rrspNewRoom = [],
  province = "AB",
  clientCppToday = 0,
  clientOasToday = 0,
  partnerCppToday = 0,
  partnerOasToday = 0,
  partnerAge = null,
  otherIncomeToday = 0,
  oasRecoveryThreshold = 0,
  oasRecoveryRate = 0,
  workingIncomeToday = 0,
  rollover = false,
  startYear = 2026,
}) {
  const span = Math.max(0, Math.round(years));
  const ageNow = Number(currentAge);
  const retire = Number(retirementAge);
  const inflation = Number.isFinite(inflationRate) ? inflationRate : 0;
  const savingYears = Number.isFinite(ageNow) && Number.isFinite(retire) ? Math.max(0, retire - ageNow) : 0;
  const tfsaDeposits = depositsOverYears({ desiredAnnual: tfsaAnnual, openingRoom: tfsaRoomNow, newRoomByYear: tfsaNewRoom, years: savingYears });
  const rrspDeposits = depositsOverYears({ desiredAnnual: rrspAnnual, openingRoom: rrspRoomNow, newRoomByYear: rrspNewRoom, years: savingYears });
  let tfsa = Math.max(0, tfsaOpening);
  let rrsp = Math.max(0, rrspOpening);
  let nonReg = Math.max(0, nonRegOpening);
  let nonRegAcb = 0;
  let other = Math.max(0, otherOpening);
  let otherAcb = other;
  const rows = [];
  let depletedAge = null;

  for (let year = 0; year <= span; year += 1) {
    const age = ageNow + year;
    const retired = Number.isFinite(retire) && age >= retire;
    const factor = (1 + inflation) ** year;
    const portfolioRate = retired ? retirementReturn : savingsReturn;
    tfsa = grow(tfsa, portfolioRate);
    rrsp = grow(rrsp, portfolioRate);
    nonReg = grow(nonReg, portfolioRate);
    other = grow(other, otherReturn);
    let tfsaIn = 0;
    let rrspIn = 0;
    let nonRegIn = 0;
    if (!retired) {
      tfsaIn = tfsaDeposits[year] || 0;
      rrspIn = rrspDeposits[year] || 0;
      nonRegIn = Math.max(0, nonRegAnnual);
      tfsa += tfsaIn;
      rrsp += rrspIn;
      nonReg += nonRegIn;
      nonRegAcb += nonRegIn;
    }

    const pension = pensionCash({
      retired,
      age,
      partnerAge: Number.isFinite(partnerAge) ? partnerAge + year : null,
      clientCpp: clientCppToday,
      clientOas: clientOasToday,
      partnerCpp: partnerCppToday,
      partnerOas: partnerOasToday,
      otherIncome: otherIncomeToday,
      threshold: oasRecoveryThreshold,
      rate: oasRecoveryRate,
    });
    const pensionNominal = pension * factor;
    const otherNominal = Math.max(0, otherIncomeToday) * factor;
    const pensionTax = taxNominal(otherNominal, pensionNominal, factor, province);
    const afterTaxPension = Math.max(0, pensionNominal - pensionTax);
    const target = retired ? Math.max(0, desiredIncomeToday) * factor : 0;
    let need = Math.max(0, target - afterTaxPension);
    let tax = 0;
    let base = otherNominal + pensionNominal;
    const rrspTake = takeTaxable({ balance: rrsp, acb: 0, kind: "rrsp", need, base, factor, province });
    rrsp = rrspTake.balance;
    need = Math.max(0, need - rrspTake.net);
    tax += rrspTake.tax;
    base = rrspTake.base;
    const nonRegTake = takeTaxable({ balance: nonReg, acb: nonRegAcb, kind: "nonReg", need, base, factor, province });
    nonReg = nonRegTake.balance;
    nonRegAcb = nonRegTake.acb;
    need = Math.max(0, need - nonRegTake.net);
    tax += nonRegTake.tax;
    base = nonRegTake.base;
    const tfsaTake = Math.min(tfsa, need);
    tfsa -= tfsaTake;
    need -= tfsaTake;
    const otherTake = takeTaxable({ balance: other, acb: otherAcb, kind: "other", need, base, factor, province });
    other = otherTake.balance;
    otherAcb = otherTake.acb;
    need = Math.max(0, need - otherTake.net);
    tax += otherTake.tax;

    const deathBase = retired ? otherNominal + pensionNominal : Math.max(0, workingIncomeToday) * factor;
    const deathInclusion = (rollover ? 0 : rrsp)
      + Math.max(0, nonReg - nonRegAcb) * CAPITAL_GAINS_INCLUSION
      + Math.max(0, other - otherAcb) * CAPITAL_GAINS_INCLUSION;
    const deathTax = taxNominal(deathBase, deathInclusion, factor, province);
    const total = tfsa + rrsp + nonReg + other;
    const short = retired && need > 1;
    if (short && depletedAge == null) depletedAge = age;
    rows.push({
      year,
      calendarYear: startYear + year,
      age,
      retired,
      tfsaIn,
      rrspIn,
      nonRegIn,
      pension: pensionNominal,
      withdrawal: Math.max(0, target - afterTaxPension - need),
      tax,
      deathTax,
      tfsa,
      rrsp,
      nonReg,
      other,
      total,
      short,
    });
  }

  return {
    rows,
    depletedAge,
    ending: rows.length ? rows[rows.length - 1].total : 0,
    monthly: {
      tfsa: Math.max(0, tfsaAnnual) / 12,
      rrsp: Math.max(0, rrspAnnual) / 12,
      nonReg: Math.max(0, nonRegAnnual) / 12,
    },
  };
}
