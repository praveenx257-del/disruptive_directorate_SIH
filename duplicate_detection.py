"""
Duplicate / near-duplicate work detection.

MPs and implementing agencies sometimes split a single large work into
several smaller ones with near-identical descriptions (to stay under
approval thresholds), or the same work gets sanctioned twice under
different work codes. We detect this with TF-IDF text vectorization +
cosine similarity, scoped to the same district (comparing across the whole
country would both be slow and produce meaningless coincidental matches).
"""
from __future__ import annotations

from collections import defaultdict

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

SIMILARITY_THRESHOLD = 0.75


def find_duplicate_works(works_df: pd.DataFrame) -> dict[int, list[dict]]:
    """
    Returns {work_id: [{"work_id": other_id, "work_code": ..., "similarity": float}, ...]}
    for every work that has at least one near-duplicate in the same district.
    """
    duplicates: dict[int, list[dict]] = defaultdict(list)

    for district, group in works_df.groupby("district"):
        if len(group) < 2:
            continue

        vectorizer = TfidfVectorizer(stop_words="english")
        try:
            tfidf = vectorizer.fit_transform(group["description"].fillna(""))
        except ValueError:
            continue  # empty vocabulary in this district, skip

        sim_matrix = cosine_similarity(tfidf)
        ids = group["work_id"].tolist()
        codes = group["work_code"].tolist()

        for i in range(len(ids)):
            for j in range(i + 1, len(ids)):
                score = sim_matrix[i, j]
                if score >= SIMILARITY_THRESHOLD:
                    duplicates[ids[i]].append({"work_id": ids[j], "work_code": codes[j], "similarity": round(float(score), 3)})
                    duplicates[ids[j]].append({"work_id": ids[i], "work_code": codes[i], "similarity": round(float(score), 3)})

    return duplicates
