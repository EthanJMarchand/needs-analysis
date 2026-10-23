# Needs analysis worksheet

A browser worksheet for an Alberta life insurance needs analysis and a retirement savings check. It runs as static files. Netlify publishes this folder with no build step. Nothing is sent to a server, and nothing is stored in the browser. Print the client letter and the advisor record if they need to be kept.

The client letter is the reason why letter: what was discussed, what the numbers show, and what was advised. The advisor record is the needs-analysis file. Copy the letter when it should go in an email.

## What the worksheet does

- The meeting starts by choosing life insurance, disability, and critical illness, financial planning, or both. Sections that do not belong to that choice stay off the page and out of the letter.
- Life insurance income replacement is income times the percent times the years. $100,000 at 70% for 10 years is $700,000. The death section starts at 70% and 10 years. Each adult is recommended separately, under the name entered for that person. The worksheet starts as Person 1. A spouse is Person 2 until a name is entered. Each child already born is Child 1, Child 2, and so on, with a life amount and a critical illness amount. A child who is only hoped for does not get a policy amount. The chart shows the amount on the left and age along the bottom. The need does not fall below final expenses plus probate, both adjusted for inflation.
- Disability is a monthly benefit. Critical illness is one lump sum for the months of earned income needed to recover, starting at 12 months and 70% of earned income. Investment income is not replaced. The worksheet records the amounts. It does not choose a product.
- The chart shows the capital need if death happens at each age, and it runs to the likely age at death. The years of income stay at the number chosen until retirement is that close, then they step down one year at a time. A person who is 30, retiring at 70, with 15 years of income, keeps all 15 years through age 55, then 14 years at 56, and 5 years at 65. Those income dollars, education, and final expenses rise with inflation. The mortgage pays down in a straight line and is not increased for inflation. Planned children add an education amount. If there is no mortgage and a house purchase is planned, the future mortgage appears on the chart.
- CPP is estimated from average earnings over the last five years, compared with the yearly maximum pensionable earnings, and capped at the age-65 maximum. Leave that field blank to use this year's income. OAS is estimated from years lived in Canada after age 18, out of 40. Leave that field blank to assume residence since 18. Either amount can be typed, or set to the maximum.
- Retirement savings stay in today's dollars. Estimated rate of return while saving and estimated rate of return in retirement are separate sliders. Each rate is used as entered. Inflation is not taken off those rates. The monthly shortfall is the income still missing after CPP, OAS, and what the portfolio can pay. Pessimistic, average, and optimistic show wealth at two percentage points around the return that was entered. The inflation slider only translates a yearly income target into the year of retirement. It does not shrink the life insurance number or the return.
- TFSA and RRSP deposits are limited by the room entered for this year. Future room is projected and is not added to the current room. Tax uses the latest combined federal and provincial brackets on file. The client can put the RRSP tax saving back into the RRSP. If the RRSP does not roll to a spouse, the early-death slider shows the tax of taking the RRSP into one year.

## Update the figures once a year

Add a year by copying the newest block in the file. Do not change older years.

| File | What to add |
| --- | --- |
| `data/inflation-canada.js` | The new annual CPI percent from Statistics Canada table 18-10-0005-01. The slider starts at the 100-year average of this file. |
| `data/tfsa-contribution-limit.js` | The new annual TFSA dollar limit, and set `taxYear` to that year. |
| `data/rrsp-limits.js` | The new RRSP dollar limit. Set `contributionYear` and `nextYearDollarLimit`. |
| `data/cpp-amounts.js` | The new maximum monthly CPP at 65, YMPE, and YAMPE. |
| `data/oas-amounts.js` | The new OAS maximums and the recovery-tax threshold. |
| `data/tax-brackets.js` | Combined federal and provincial brackets for the new year, for every province and territory. Quebec federal tax is reduced by the 16.5% abatement in the calculator. Ontario surtax bands go in `ontarioSurtax` when they apply. The 2025 tax year is not in the file yet. |
| `data/life-expectancy.js` | The new Statistics Canada life expectancy at birth, if a new release replaces 2023. |
| `data/probate-fees.js` | A province's schedule when the fee changes. Set `asOf`. |
| `data/planning-assumptions.js` | Only if the default planning choices should change. Inflation is not a field in this file. |

Publish the folder again after the edit. No build is required.
# needs-analysis
