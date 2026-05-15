# DataMorphix — Complete All Remaining Features

Complete all 14 missing/incomplete features identified in the analysis, keeping SQLite as the database.

## Proposed Changes

### Phase 1: Backend Foundation

#### [NEW] [requirements.txt](file:///f:/DataMatrix/DataMorphix/backend/requirements.txt)
Document all Python dependencies: `django`, `djangorestframework`, `django-cors-headers`, `pandas`, `openpyxl`, `google-generativeai`, `reportlab` (PDF export).

---

#### [MODIFY] [models.py](file:///f:/DataMatrix/DataMorphix/backend/api/models.py)
Add new models:
- `GovernanceIssue` — stores detected quality issues (duplicate columns, naming conflicts, missing values, schema conflicts)
- `UsageInsight` — stores column usage statistics (empty %, duplicate %, frequency)
- Add `row_count` field to `Dataset` model

---

#### [NEW] [governance_engine.py](file:///f:/DataMatrix/DataMorphix/backend/api/governance_engine.py)
New module to analyze datasets for:
- Duplicate columns (identical data in different columns)
- Inconsistent naming (`cust_name` vs `customer_name`)
- Missing value analysis (columns with high null %)
- Schema conflicts across datasets
- Empty columns detection

---

#### [MODIFY] [ai_engine.py](file:///f:/DataMatrix/DataMorphix/backend/api/ai_engine.py)
- Add `suggest_governance_fixes()` — AI-powered suggestions for governance issues
- Ensure `suggest_rename()` is integrated into the upload pipeline

---

#### [MODIFY] [views.py](file:///f:/DataMatrix/DataMorphix/backend/api/views.py)
Add new endpoints:
- `GET /api/datasets/{id}/governance/` — Run governance checks and return issues
- `GET /api/datasets/{id}/usage-insights/` — Return column usage statistics
- `GET /api/datasets/{id}/rename-suggestions/` — Return AI rename suggestions for all columns
- `GET /api/search/?q=keyword` — Search columns across all datasets by keyword
- `POST /api/datasets/{id}/reprocess/` — Re-analyze dataset (real-time metadata update)
- Update `export` to support PDF and Excel formats
- Improve health score calculation (nulls + duplicates + empty columns + format issues)

---

#### [MODIFY] [serializers.py](file:///f:/DataMatrix/DataMorphix/backend/api/serializers.py)
Add serializers for `GovernanceIssue`, `UsageInsight`, and search results.

---

#### [MODIFY] [urls.py](file:///f:/DataMatrix/DataMorphix/backend/api/urls.py)
Add route for the global search endpoint.

---

### Phase 2: Frontend Restructure & Components

#### [MODIFY] [index.html](file:///f:/DataMatrix/DataMorphix/frontend/index.html)
- Update title to "DataMorphix — AI Data Dictionary"
- Add meta description for SEO
- Add Google Fonts (Inter)

---

#### [MODIFY] [index.css](file:///f:/DataMatrix/DataMorphix/frontend/src/index.css)
Replace Tailwind directives and add custom CSS variables/design tokens for the theme.

---

#### [DELETE] [App.css](file:///f:/DataMatrix/DataMorphix/frontend/src/App.css)
Remove the Vite boilerplate CSS (unused).

---

#### [MODIFY] [main.jsx](file:///f:/DataMatrix/DataMorphix/frontend/src/main.jsx)
Add `BrowserRouter` wrapper from `react-router-dom`.

---

#### [MODIFY] [App.jsx](file:///f:/DataMatrix/DataMorphix/frontend/src/App.jsx)
Refactor into a layout with routing:
- Persistent sidebar navigation
- Routes to Dashboard, Dataset Detail, Search, Governance pages
- Global search bar in header

---

#### [NEW] [api.js](file:///f:/DataMatrix/DataMorphix/frontend/src/api.js)
Centralized API service with all axios calls:
- `fetchDatasets()`, `uploadDataset()`, `queryDataset()`, `exportDataset()`
- `getGovernance()`, `getUsageInsights()`, `getRenameSuggestions()`
- `searchDatasets()`, `reprocessDataset()`

---

#### [NEW] Frontend Components (`frontend/src/components/`)

| File | Purpose |
|------|---------|
| `Sidebar.jsx` | Dataset list + upload area + navigation links |
| `DashboardCharts.jsx` | Bar chart (nulls) + Pie chart (types) + stat cards |
| `DataDictionary.jsx` | Column metadata table with AI descriptions |
| `QueryPanel.jsx` | Natural language query input + AI response display |
| `LineageView.jsx` | Visual lineage flow (Raw → Processed → Final) |
| `RelationshipsView.jsx` | Table/cards showing cross-dataset column relationships |
| `GovernancePanel.jsx` | Warnings/alerts for quality issues with severity badges |
| `UsageInsights.jsx` | Column usage stats (empty %, duplicate %, frequency) |
| `RenameSuggestions.jsx` | AI rename suggestions table with current → suggested |
| `ExportButtons.jsx` | Download buttons for JSON/CSV/PDF/Excel |
| `SearchPage.jsx` | Global search input + results across all datasets |

---

### Phase 3: Wiring & Polish

- Connect all new components to the backend API endpoints
- Add loading spinners and error states
- Add row count stat card to the dashboard
- Ensure responsive layout (mobile-friendly)
- Clean up all unused imports and boilerplate

---

## Verification Plan

### Automated Tests
- Run `python manage.py check` to verify Django config
- Run `npm run build` in frontend to verify no compilation errors

### Manual Verification
- Upload a CSV file and verify full pipeline: AI metadata → lineage → relationships → governance → health score
- Test all export formats (JSON, CSV, PDF, Excel)
- Test cross-dataset search
- Test NL query system
- Verify all frontend pages render correctly

---

> [!IMPORTANT]
> **Database**: Keeping SQLite (`db.sqlite3`) as requested. PostgreSQL/Neo4j migration deferred.
> 
> **AI**: All AI features work with Gemini API key set via `GEMINI_API_KEY` env var. Without a key, fallback mock text is returned.
