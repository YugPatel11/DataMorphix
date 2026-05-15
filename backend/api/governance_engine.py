"""
Governance & Consistency Engine for DataMorphix.
Analyzes datasets for quality issues, naming conflicts, and schema problems.
"""
import pandas as pd
from difflib import SequenceMatcher


def analyze_governance(df, dataset, all_datasets_columns=None):
    """
    Run all governance checks on a dataset.
    Returns a list of issue dicts: {type, severity, column, message}
    """
    issues = []
    issues.extend(_check_missing_values(df))
    issues.extend(_check_empty_columns(df))
    issues.extend(_check_duplicate_columns(df))
    issues.extend(_check_naming_inconsistencies(df))
    issues.extend(_check_duplicate_rows(df))
    if all_datasets_columns:
        issues.extend(_check_cross_dataset_conflicts(df, all_datasets_columns))
    return issues


def _check_missing_values(df):
    """Flag columns with high null percentages."""
    issues = []
    total = len(df)
    if total == 0:
        return issues
    for col in df.columns:
        null_pct = (df[col].isnull().sum() / total) * 100
        if null_pct > 50:
            issues.append({
                'type': 'missing_values',
                'severity': 'high',
                'column': col,
                'message': f"Column '{col}' has {null_pct:.1f}% missing values — consider removing or imputing."
            })
        elif null_pct > 20:
            issues.append({
                'type': 'missing_values',
                'severity': 'medium',
                'column': col,
                'message': f"Column '{col}' has {null_pct:.1f}% missing values."
            })
    return issues


def _check_empty_columns(df):
    """Detect columns that are entirely empty."""
    issues = []
    for col in df.columns:
        if df[col].isnull().all():
            issues.append({
                'type': 'empty_column',
                'severity': 'high',
                'column': col,
                'message': f"Column '{col}' is completely empty — should be removed."
            })
    return issues


def _check_duplicate_columns(df):
    """Detect columns with identical data."""
    issues = []
    cols = list(df.columns)
    checked = set()
    for i, col1 in enumerate(cols):
        for col2 in cols[i + 1:]:
            pair_key = tuple(sorted([col1, col2]))
            if pair_key in checked:
                continue
            checked.add(pair_key)
            try:
                if df[col1].equals(df[col2]):
                    issues.append({
                        'type': 'duplicate_column',
                        'severity': 'high',
                        'column': f"{col1}, {col2}",
                        'message': f"Columns '{col1}' and '{col2}' contain identical data — one should be removed."
                    })
            except Exception:
                pass
    return issues


def _check_naming_inconsistencies(df):
    """Detect columns with very similar names that might be duplicates."""
    issues = []
    cols = list(df.columns)
    checked = set()
    for i, col1 in enumerate(cols):
        for col2 in cols[i + 1:]:
            pair_key = tuple(sorted([col1, col2]))
            if pair_key in checked:
                continue
            checked.add(pair_key)
            # Normalize for comparison
            norm1 = col1.lower().replace('_', '').replace('-', '').replace(' ', '')
            norm2 = col2.lower().replace('_', '').replace('-', '').replace(' ', '')
            similarity = SequenceMatcher(None, norm1, norm2).ratio()
            if similarity > 0.8 and col1 != col2:
                issues.append({
                    'type': 'naming_inconsistency',
                    'severity': 'medium',
                    'column': f"{col1}, {col2}",
                    'message': f"Columns '{col1}' and '{col2}' have similar names ({similarity:.0%} match) — may represent the same field."
                })
    return issues


def _check_duplicate_rows(df):
    """Check for duplicate rows in the dataset."""
    issues = []
    dup_count = df.duplicated().sum()
    if dup_count > 0:
        pct = (dup_count / len(df)) * 100
        severity = 'high' if pct > 10 else 'medium'
        issues.append({
            'type': 'duplicate_rows',
            'severity': severity,
            'column': '__all__',
            'message': f"Dataset contains {dup_count} duplicate rows ({pct:.1f}% of total)."
        })
    return issues


def _check_cross_dataset_conflicts(df, all_datasets_columns):
    """Check for schema conflicts with other datasets' columns."""
    issues = []
    current_cols = {col: str(df[col].dtype) for col in df.columns}

    for ds_name, ds_cols in all_datasets_columns.items():
        for col_name, col_type in current_cols.items():
            if col_name in ds_cols and ds_cols[col_name] != col_type:
                issues.append({
                    'type': 'schema_conflict',
                    'severity': 'medium',
                    'column': col_name,
                    'message': f"Column '{col_name}' is '{col_type}' here but '{ds_cols[col_name]}' in dataset '{ds_name}' — type mismatch."
                })
    return issues


def compute_health_score(df):
    """
    Compute a comprehensive health score (0-100).
    Penalizes: null values, duplicate rows, empty columns, duplicate columns.
    """
    score = 100.0
    total_rows = len(df)
    total_cols = len(df.columns)

    if total_rows == 0 or total_cols == 0:
        return 0

    # Penalty for nulls (up to -30)
    total_cells = total_rows * total_cols
    null_cells = df.isnull().sum().sum()
    null_ratio = null_cells / total_cells
    score -= null_ratio * 30

    # Penalty for duplicate rows (up to -20)
    dup_rows = df.duplicated().sum()
    dup_ratio = dup_rows / total_rows
    score -= dup_ratio * 20

    # Penalty for empty columns (up to -20)
    empty_cols = sum(1 for col in df.columns if df[col].isnull().all())
    empty_ratio = empty_cols / total_cols
    score -= empty_ratio * 20

    # Penalty for duplicate columns (up to -15)
    dup_cols = 0
    cols = list(df.columns)
    for i, col1 in enumerate(cols):
        for col2 in cols[i + 1:]:
            try:
                if df[col1].equals(df[col2]):
                    dup_cols += 1
            except Exception:
                pass
    if total_cols > 1:
        score -= (dup_cols / total_cols) * 15

    # Penalty for columns with inconsistent types (mixed types) (up to -15)
    mixed_type_cols = 0
    for col in df.columns:
        non_null = df[col].dropna()
        if len(non_null) > 0:
            types = non_null.apply(type).nunique()
            if types > 1:
                mixed_type_cols += 1
    score -= (mixed_type_cols / total_cols) * 15

    return max(0, min(100, int(score)))


def compute_usage_insights(df):
    """
    Compute usage insights for all columns.
    Returns list of dicts with column stats.
    """
    insights = []
    total_rows = len(df)

    for col in df.columns:
        null_count = int(df[col].isnull().sum())
        null_pct = round((null_count / total_rows) * 100, 1) if total_rows > 0 else 0
        unique_count = int(df[col].nunique())
        unique_pct = round((unique_count / total_rows) * 100, 1) if total_rows > 0 else 0
        is_empty = df[col].isnull().all()
        is_constant = unique_count <= 1

        # Check if column might be an ID (all unique, non-null)
        is_potential_id = (unique_count == total_rows) and (null_count == 0)

        insights.append({
            'column': col,
            'null_count': null_count,
            'null_pct': null_pct,
            'unique_count': unique_count,
            'unique_pct': unique_pct,
            'is_empty': is_empty,
            'is_constant': is_constant,
            'is_potential_id': is_potential_id,
            'data_type': str(df[col].dtype),
        })

    return insights
