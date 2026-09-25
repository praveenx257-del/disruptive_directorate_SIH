"""
Synthetic MPLADS dataset generator.

Real MPLADS transaction data is not publicly queryable at record level, so this
module produces a statistically realistic synthetic dataset that mirrors the
shape of real scheme data (works, sanctions, expenditure, progress) and
deliberately seeds a known set of anomaly patterns so the ML pipeline in
app/ml/* has genuine signal to detect during demos and testing:

  1. Cost overruns              - sanctioned/actual spend far exceeds estimate
  2. Ghost / stalled works      - high fund utilization, near-zero physical progress
  3. Duplicate works            - near-identical work descriptions in the same district
  4. Vendor concentration       - one vendor receiving payments across many unrelated works
  5. Round-tripping payments    - suspiciously round-number, rapid-succession payments
  6. Pre-sanction disbursement  - expenditure dated before the work was sanctioned
"""
import random
from datetime import date, timedelta

from faker import Faker
from sqlalchemy.orm import Session

from app.models import MemberOfParliament, Work, Expenditure, ProgressUpdate

fake = Faker("en_IN")
random.seed(42)
Faker.seed(42)

STATES = {
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut"],
    "Maharashtra": ["Pune", "Nagpur", "Nashik", "Thane", "Aurangabad"],
    "Tamil Nadu": ["Chennai", "Madurai", "Coimbatore", "Salem", "Trichy"],
    "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Belagavi", "Mangaluru"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
    "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
}

PARTIES = ["INC", "BJP", "AITC", "DMK", "AAP", "SP", "JD(U)", "NCP", "BSP", "Independent"]

CATEGORIES = {
    "Drinking Water Supply": (300000, 3500000),
    "Roads & Bridges": (500000, 9000000),
    "Education Infrastructure": (200000, 4000000),
    "Health Infrastructure": (300000, 5000000),
    "Sanitation": (150000, 2000000),
    "Rural Electrification": (200000, 3000000),
    "Sports Infrastructure": (300000, 2500000),
    "Community Halls": (400000, 3000000),
    "Irrigation": (500000, 6000000),
    "Disaster Relief Works": (200000, 4000000),
}

WORK_TEMPLATES = {
    "Drinking Water Supply": [
        "Installation of overhead water tank at {loc}",
        "Bore-well and hand pump installation in {loc} village",
        "Piped water supply extension to {loc} ward",
    ],
    "Roads & Bridges": [
        "Construction of cement concrete road from {loc} to main highway",
        "Repair and widening of village road in {loc}",
        "Construction of foot bridge over drain at {loc}",
    ],
    "Education Infrastructure": [
        "Construction of additional classrooms at {loc} Govt School",
        "Renovation of school building at {loc}",
        "Construction of boundary wall for {loc} Primary School",
    ],
    "Health Infrastructure": [
        "Upgradation of Primary Health Centre at {loc}",
        "Construction of sub-health centre building in {loc}",
        "Provision of medical equipment for {loc} PHC",
    ],
    "Sanitation": [
        "Construction of community toilet complex at {loc}",
        "Drainage system improvement in {loc} ward",
        "Solid waste management facility at {loc}",
    ],
    "Rural Electrification": [
        "Street light installation on {loc} main road",
        "Solar street lighting project in {loc} village",
    ],
    "Sports Infrastructure": [
        "Development of playground at {loc}",
        "Construction of open gym facility in {loc} park",
    ],
    "Community Halls": [
        "Construction of community hall at {loc}",
        "Renovation of panchayat bhawan in {loc}",
    ],
    "Irrigation": [
        "Construction of check dam near {loc}",
        "Canal lining and repair work in {loc}",
    ],
    "Disaster Relief Works": [
        "Flood protection embankment at {loc}",
        "Repair of storm-damaged infrastructure in {loc}",
    ],
}

IMPLEMENTING_AGENCIES = [
    "District Rural Development Agency",
    "Public Works Department",
    "Municipal Corporation",
    "Zilla Parishad",
    "State Public Health Engineering Dept.",
    "Cantonment Board",
]

VENDOR_POOL = [fake.company() for _ in range(60)]
# A small handful of "shell-like" vendors reused disproportionately across
# unrelated works/MPs/districts - a classic red flag for collusion or
# fund round-tripping.
SUSPICIOUS_VENDORS = ["Shree Balaji Infra Traders", "Om Sai Construction Co.", "Metro Bharat Enterprises"]


def _random_date(start: date, end: date) -> date:
    delta = (end - start).days
    if delta <= 0:
        return start
    return start + timedelta(days=random.randint(0, delta))


def generate_mps(n: int = 60) -> list[MemberOfParliament]:
    mps = []
    for i in range(n):
        state = random.choice(list(STATES.keys()))
        mps.append(
            MemberOfParliament(
                name=fake.name(),
                house=random.choices(["Lok Sabha", "Rajya Sabha"], weights=[0.7, 0.3])[0],
                state=state,
                constituency=f"{random.choice(STATES[state])} {'Rural' if random.random() < 0.5 else 'Urban'}",
                party=random.choice(PARTIES),
                term_start=date(2024, 6, random.randint(1, 28)),
            )
        )
    return mps


def _make_description(category: str, district: str) -> str:
    template = random.choice(WORK_TEMPLATES[category])
    loc = f"{district} {random.choice(['Ward 1', 'Ward 2', 'Ward 3', 'Sector 4', 'Colony', 'Village Panchayat'])}"
    return template.format(loc=loc)


def generate_works_and_transactions(mps: list[MemberOfParliament], db: Session, works_per_mp: int = 12):
    """
    Populates works, expenditure and progress-update records, and returns the
    list of Work ORM objects (still transient / pending) for later flush.
    Deliberately injects anomaly patterns at controlled rates so the ML layer
    has genuine, labeled-in-spirit signal to surface.
    """
    all_works: list[Work] = []
    work_counter = 1000
    duplicate_pool: dict[str, list[str]] = {}  # district -> [descriptions] to force duplicates

    for mp in mps:
        for _ in range(works_per_mp):
            category = random.choice(list(CATEGORIES.keys()))
            lo, hi = CATEGORIES[category]
            district = random.choice(STATES[mp.state])

            # ~6% chance: reuse a very recent description in the same district
            # to simulate duplicate / split works designed to bypass approval limits
            force_duplicate = random.random() < 0.06 and district in duplicate_pool and duplicate_pool[district]
            if force_duplicate:
                description = random.choice(duplicate_pool[district])
            else:
                description = _make_description(category, district)
                duplicate_pool.setdefault(district, []).append(description)

            estimated_cost = round(random.uniform(lo, hi), -2)

            # ~10% chance of a material cost overrun at sanction stage itself
            if random.random() < 0.10:
                sanctioned_amount = round(estimated_cost * random.uniform(1.35, 1.9), -2)
            else:
                sanctioned_amount = round(estimated_cost * random.uniform(0.85, 1.08), -2)

            sanction_date = _random_date(date(2024, 7, 1), date(2026, 6, 1))
            expected_completion = sanction_date + timedelta(days=random.randint(120, 540))

            work_counter += 1
            work_code = f"MPLADS/{mp.state[:2].upper()}/{work_counter}"

            status_roll = random.random()
            if status_roll < 0.35:
                status = "Completed"
                actual_completion = expected_completion + timedelta(days=random.randint(-30, 120))
                physical_progress = 100.0
            elif status_roll < 0.85:
                status = "In Progress"
                actual_completion = None
                physical_progress = round(random.uniform(10, 95), 1)
            else:
                status = "Stalled"
                actual_completion = None
                physical_progress = round(random.uniform(0, 30), 1)

            work = Work(
                work_code=work_code,
                mp=mp,
                category=category,
                description=description,
                district=district,
                state=mp.state,
                implementing_agency=random.choice(IMPLEMENTING_AGENCIES),
                estimated_cost=estimated_cost,
                sanctioned_amount=sanctioned_amount,
                sanction_date=sanction_date,
                expected_completion=expected_completion,
                actual_completion=actual_completion,
                status=status,
                physical_progress_pct=physical_progress,
                latitude=round(random.uniform(8.0, 34.0), 5),
                longitude=round(random.uniform(70.0, 89.0), 5),
            )
            db.add(work)
            all_works.append(work)

            _generate_expenditure_and_progress(db, work, status)

    return all_works


def _generate_expenditure_and_progress(db: Session, work: Work, status: str):
    n_payments = random.randint(1, 4)
    remaining = work.sanctioned_amount
    cursor_date = work.sanction_date

    # financial progress that should, in a healthy work, track physical progress
    target_financial_pct = work.physical_progress_pct

    # ~8% chance: financial progress is inflated far beyond physical progress
    # (classic fund-misuse / fudged-utilization-certificate pattern)
    inflate_financial = random.random() < 0.08
    if inflate_financial and status != "Completed":
        target_financial_pct = min(100.0, work.physical_progress_pct + random.uniform(40, 70))

    disbursed_pct = 0.0
    for i in range(n_payments):
        is_last = i == n_payments - 1
        if is_last:
            amount = remaining
        else:
            share = random.uniform(0.2, 0.5)
            amount = round(remaining * share, -2)
        amount = max(amount, 0)
        remaining -= amount

        cursor_date = cursor_date + timedelta(days=random.randint(15, 150))

        # ~3% chance: payment dated before the work's own sanction date
        txn_date = cursor_date
        if random.random() < 0.03:
            txn_date = work.sanction_date - timedelta(days=random.randint(5, 40))

        # vendor selection: occasionally funnel through a "suspicious" vendor
        if random.random() < 0.05:
            vendor_name = random.choice(SUSPICIOUS_VENDORS)
        else:
            vendor_name = random.choice(VENDOR_POOL)

        # round-tripping style: suspicious vendors tend to get suspiciously round amounts
        if vendor_name in SUSPICIOUS_VENDORS:
            amount = round(amount, -4) or 10000.0

        db.add(
            Expenditure(
                work=work,
                transaction_date=txn_date,
                amount=amount,
                payment_stage="Advance" if i == 0 else ("Final" if is_last else "Installment"),
                vendor_name=vendor_name,
                vendor_account=f"VAC{random.randint(100000000, 999999999)}",
                mode=random.choices(["Bank Transfer", "PFMS", "Cheque"], weights=[0.6, 0.35, 0.05])[0],
            )
        )

        disbursed_pct = min(100.0, disbursed_pct + (amount / work.sanctioned_amount * 100 if work.sanctioned_amount else 0))
        db.add(
            ProgressUpdate(
                work=work,
                update_date=txn_date,
                physical_progress_pct=round(min(work.physical_progress_pct, disbursed_pct + random.uniform(-5, 5)), 1),
                financial_progress_pct=round(min(target_financial_pct, disbursed_pct), 1) if not inflate_financial else round(min(100.0, disbursed_pct + random.uniform(20, 40)), 1),
                remarks=random.choice([None, None, "Site inspected", "Awaiting material supply", "Contractor mobilized"]),
            )
        )


def seed_database(db: Session, n_mps: int = 60, works_per_mp: int = 12):
    """Wipes and repopulates all tables with a fresh synthetic dataset."""
    from app.models import Alert

    db.query(Alert).delete()
    db.query(ProgressUpdate).delete()
    db.query(Expenditure).delete()
    db.query(Work).delete()
    db.query(MemberOfParliament).delete()
    db.commit()

    mps = generate_mps(n_mps)
    db.add_all(mps)
    db.flush()

    generate_works_and_transactions(mps, db, works_per_mp=works_per_mp)
    db.commit()
