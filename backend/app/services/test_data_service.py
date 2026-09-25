from app.services.data_service import load_data


print("=" * 60)
print("JanAudit Data Service Test")
print("=" * 60)


data = load_data()

scored_results = data["scored_results"]
mp_summary = data["mp_summary"]


print(
    f"\nScored results: "
    f"{len(scored_results):,} rows"
)

print(
    f"MP summary: "
    f"{len(mp_summary):,} rows"
)


print("\nFirst work:")

print(
    scored_results.iloc[0][
        [
            "Work ID",
            "Work Description",
            "Category",
            "State",
            "composite_risk_score",
            "anomaly_label",
        ]
    ]
)


print("\nData service working.")