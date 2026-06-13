import pandas as pd
import json
import csv
import math
from django.http import HttpResponse
from django.shortcuts import render
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from .models import Dataset, ColumnMetadata, DataLineage, DatasetRelationship, GovernanceIssue
from .serializers import DatasetSerializer, ColumnMetadataSerializer, GovernanceIssueSerializer, SearchResultSerializer
from . import ai_engine
from . import governance_engine


class DatasetViewSet(viewsets.ModelViewSet):
    queryset = Dataset.objects.all().order_by('-uploaded_at')
    serializer_class = DatasetSerializer

    def _read_dataframe(self, file_path, file_name):
        """Read a file into a pandas DataFrame based on extension."""
        extension = file_name.lower().rsplit('.', 1)[-1] if '.' in file_name else ''
        if extension == 'csv':
            try:
                return pd.read_csv(file_path)
            except UnicodeDecodeError:
                return pd.read_csv(file_path, encoding='latin1')
        elif extension in {'xlsx', 'xlsm'}:
            return pd.read_excel(file_path, engine='openpyxl')
        elif extension == 'xls':
            return pd.read_excel(file_path)
        elif extension == 'json':
            return pd.read_json(file_path)
        return None

    def _safe_float(self, value, default: float = 0.0) -> float:
        """Convert pandas/numpy values into regular Python floats for JSON serialization."""
        try:
            if pd.isna(value):
                return default
            return float(value)
        except (TypeError, ValueError):
            return default

    def _numeric_relation(self, left_name: str, right_name: str, left_series: pd.Series, right_series: pd.Series) -> dict | None:
        """
        Detect a linear relationship between two numeric columns.
        Uses Pearson correlation coefficient.
        """
        pair = pd.DataFrame({
            left_name: pd.to_numeric(left_series, errors='coerce'),
            right_name: pd.to_numeric(right_series, errors='coerce'),
        }).dropna()

        if len(pair) < 3:
            return None

        # Compute Pearson correlation coefficient
        correlation = self._safe_float(pair[left_name].corr(pair[right_name]))
        score = abs(correlation)
        if score < 0.55:
            return None

        direction = 'move together' if correlation > 0 else 'move in opposite directions'
        return {
            'left_column': left_name,
            'right_column': right_name,
            'relationship_type': 'Numeric correlation',
            'score': round(score, 2),
            'evidence': f'Pearson correlation: {correlation:.2f}',
            'explanation': f'Values in these two columns tend to {direction}.',
        }

    def _categorical_relation(self, left_name: str, right_name: str, left_series: pd.Series, right_series: pd.Series) -> dict | None:
        """
        Detect association between two category-like columns using Cramer's V.
        Cramer's V measures the strength of association between two nominal variables.
        """
        pair = pd.DataFrame({
            'left': left_series,
            'right': right_series,
        }).dropna()

        if len(pair) < 3:
            return None

        left_unique = pair['left'].nunique()
        right_unique = pair['right'].nunique()
        if left_unique < 2 or right_unique < 2:
            return None

        # Very high-cardinality columns create noisy cross-tabs, so skip them here.
        if left_unique > 50 or right_unique > 50:
            return None

        # Create contingency table
        table = pd.crosstab(pair['left'].astype(str), pair['right'].astype(str))
        if table.shape[0] < 2 or table.shape[1] < 2:
            return None

        # Compute Chi-Square statistic and Cramer's V
        total = table.values.sum()
        expected = table.sum(axis=1).to_numpy()[:, None] * table.sum(axis=0).to_numpy()[None, :] / total
        chi_square = (((table.to_numpy() - expected) ** 2) / expected).sum()
        denominator = min(table.shape[0] - 1, table.shape[1] - 1)
        score = math.sqrt((chi_square / total) / denominator) if denominator > 0 else 0

        if score < 0.35:
            return None

        return {
            'left_column': left_name,
            'right_column': right_name,
            'relationship_type': 'Category association',
            'score': round(score, 2),
            'evidence': f"Cramer's V: {score:.2f}",
            'explanation': 'The category choices in one column often line up with the other.',
        }

    def _category_to_number_relation(self, category_name: str, number_name: str, category_series: pd.Series, number_series: pd.Series) -> dict | None:
        """
        Detect whether a category column separates a numeric measure into clear groups.
        Uses the correlation ratio (Eta), representing the proportion of variance explained.
        """
        pair = pd.DataFrame({
            'category': category_series,
            'value': pd.to_numeric(number_series, errors='coerce'),
        }).dropna()

        if len(pair) < 3:
            return None

        group_count = pair['category'].nunique()
        if group_count < 2 or group_count > 50:
            return None

        # Calculate between-group variance and total variance
        overall_mean = pair['value'].mean()
        grouped = pair.groupby(pair['category'].astype(str))['value']
        between_group_variance = sum(len(values) * ((values.mean() - overall_mean) ** 2) for _, values in grouped)
        total_variance = ((pair['value'] - overall_mean) ** 2).sum()
        score = math.sqrt(between_group_variance / total_variance) if total_variance > 0 else 0

        if score < 0.35:
            return None

        return {
            'left_column': category_name,
            'right_column': number_name,
            'relationship_type': 'Category affects measure',
            'score': round(score, 2),
            'evidence': f'Correlation ratio: {score:.2f}',
            'explanation': f'Numeric values in {number_name} change noticeably across {category_name} groups.',
        }

    def _missing_value_relation(self, left_name: str, right_name: str, left_series: pd.Series, right_series: pd.Series) -> dict | None:
        """
        Detect columns that become blank together (shared missingness).
        Uses Jaccard similarity index on missing value indicators.
        """
        left_missing = left_series.isna()
        right_missing = right_series.isna()
        union = int((left_missing | right_missing).sum())

        if union == 0:
            return None

        overlap = int((left_missing & right_missing).sum())
        score = overlap / union
        if score < 0.75:
            return None

        return {
            'left_column': left_name,
            'right_column': right_name,
            'relationship_type': 'Shared missing pattern',
            'score': round(score, 2),
            'evidence': f'{overlap} shared blank rows',
            'explanation': 'These columns are frequently blank on the same rows.',
        }

    def _internal_column_relations(self, df: pd.DataFrame) -> list[dict]:
        """
        Find useful relationships between columns inside one selected dataset.
        Checks for shared missing patterns, correlations, and categorical associations.
        """
        columns = list(df.columns)
        relations = []

        for left_index, left_name in enumerate(columns):
            for right_name in columns[left_index + 1:]:
                left_series = df[left_name]
                right_series = df[right_name]
                candidates = []

                # Check shared missing pattern
                missing_match = self._missing_value_relation(left_name, right_name, left_series, right_series)
                if missing_match:
                    candidates.append(missing_match)

                # Determine variable types
                left_is_numeric = pd.api.types.is_numeric_dtype(left_series)
                right_is_numeric = pd.api.types.is_numeric_dtype(right_series)

                if left_is_numeric and right_is_numeric:
                    relation = self._numeric_relation(left_name, right_name, left_series, right_series)
                elif left_is_numeric and not right_is_numeric:
                    relation = self._category_to_number_relation(right_name, left_name, right_series, left_series)
                elif right_is_numeric and not left_is_numeric:
                    relation = self._category_to_number_relation(left_name, right_name, left_series, right_series)
                else:
                    relation = self._categorical_relation(left_name, right_name, left_series, right_series)

                if relation:
                    candidates.append(relation)

                if candidates:
                    best_relation = max(candidates, key=lambda item: item['score'])
                    relations.append(best_relation)

        relations.sort(key=lambda item: item['score'], reverse=True)
        return relations[:24]

    def _process_dataset(self, dataset, df):
        """Core processing logic: metadata extraction, AI analysis, governance, lineage, relationships."""
        total_rows = len(df)

        # ── Step 1: Extract column metadata via Pandas ──
        cols_info = []
        for col in df.columns:
            null_count = int(df[col].isnull().sum())
            unique_count = int(df[col].nunique())
            data_type = str(df[col].dtype)
            sample_vals = df[col].dropna().astype(str).unique()[:3].tolist()

            advanced_stats = {}
            if pd.api.types.is_numeric_dtype(df[col]):
                col_data = df[col].dropna()
                if len(col_data) > 0:
                    advanced_stats = {
                        "min": float(col_data.min()),
                        "max": float(col_data.max()),
                        "mean": float(col_data.mean()),
                        "median": float(col_data.median()),
                        "std": float(col_data.std()) if len(col_data) > 1 else 0.0
                    }
            else:
                top_values = df[col].value_counts().head(10).to_dict()
                advanced_stats = {
                    "top_values": {str(k): int(v) for k, v in top_values.items()}
                }

            cols_info.append({
                "name": col, "type": data_type,
                "nulls": null_count, "uniques": unique_count,
                "samples": sample_vals,
                "advanced_stats": advanced_stats
            })

        # ── Step 2: AI column descriptions (one batched API call) ──
        ai_descriptions = ai_engine.get_all_columns_metadata(dataset.name, cols_info)

        # ── Step 3: AI rename suggestions (one batched API call) ──
        rename_suggestions = ai_engine.get_all_rename_suggestions(
            [info['name'] for info in cols_info]
        )

        # ── Step 4: Save column metadata to DB ──
        for info in cols_info:
            col_name = info['name']
            ai_desc = ai_descriptions.get(col_name, "AI description not available.")
            suggested = rename_suggestions.get(col_name, col_name)

            ColumnMetadata.objects.create(
                dataset=dataset,
                name=col_name,
                data_type=info['type'],
                ai_description=ai_desc,
                null_count=info['nulls'],
                unique_count=info['uniques'],
                sample_values=info['samples'],
                suggested_name=suggested,
                advanced_stats=info['advanced_stats']
            )
            info['desc'] = ai_desc

        # ── Step 5: Health score (comprehensive) ──
        dataset.health_score = governance_engine.compute_health_score(df)
        dataset.row_count = total_rows
        dataset.summary = ai_engine.generate_dataset_summary(dataset.name, cols_info)
        dataset.status = 'completed'
        dataset.save()

        # ── Step 6: Data lineage ──
        DataLineage.objects.create(
            dataset=dataset,
            source_name=dataset.name,
            transformation_step="Raw Upload"
        )
        DataLineage.objects.create(
            dataset=dataset,
            source_name=dataset.name,
            transformation_step="Pandas Extraction & Type Detection"
        )
        DataLineage.objects.create(
            dataset=dataset,
            source_name=dataset.name,
            transformation_step="AI Metadata Generation (Gemini)"
        )
        DataLineage.objects.create(
            dataset=dataset,
            source_name=dataset.name,
            transformation_step="Governance & Quality Analysis"
        )

        # ── Step 7: Cross-dataset relationship detection ──
        existing_datasets = Dataset.objects.exclude(id=dataset.id)
        for other_ds in existing_datasets:
            for other_col in other_ds.columns.all():
                for col_info in cols_info:
                    if (other_col.name.lower() == col_info['name'].lower()
                            and other_col.data_type == col_info['type']):
                        DatasetRelationship.objects.create(
                            source_dataset=dataset,
                            target_dataset=other_ds,
                            source_column=col_info['name'],
                            target_column=other_col.name,
                            confidence_score=0.9
                        )

        # ── Step 8: Governance checks ──
        all_ds_cols = {}
        for other_ds in existing_datasets:
            ds_col_map = {}
            for c in other_ds.columns.all():
                ds_col_map[c.name] = c.data_type
            all_ds_cols[other_ds.name] = ds_col_map

        issues = governance_engine.analyze_governance(df, dataset, all_ds_cols)
        for issue in issues:
            GovernanceIssue.objects.create(
                dataset=dataset,
                issue_type=issue['type'],
                severity=issue['severity'],
                column_name=issue['column'],
                message=issue['message']
            )

    def create(self, request, *args, **kwargs):
        file_obj = request.data.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        dataset = Dataset.objects.create(name=file_obj.name, file=file_obj)

        try:
            import os
            from pathlib import Path
            old_path = dataset.file.path
            media_dir = Path(old_path).parent
            new_name = f"{dataset.id}_v0_{file_obj.name}"
            new_path = media_dir / new_name

            os.rename(old_path, new_path)

            dataset.file = f"datasets/{new_name}"
            dataset.current_version = 0
            dataset.max_version = 0
            dataset.save()

            df = self._read_dataframe(new_path, file_obj.name)
            if df is None:
                return Response({'error': 'Unsupported file format'}, status=status.HTTP_400_BAD_REQUEST)

            self._process_dataset(dataset, df)

            serializer = self.get_serializer(dataset)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            dataset.status = 'failed'
            dataset.save()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ── Natural Language Query ──
    @action(detail=True, methods=['post'])
    def query(self, request, pk=None):
        dataset = self.get_object()
        query_text = request.data.get('query', '')

        columns = dataset.columns.all()
        cols_info = [{
            "name": c.name,
            "type": c.data_type,
            "description": c.ai_description,
            "sample_values": c.sample_values
        } for c in columns]

        ai_plan = ai_engine.analyze_query(dataset.name, cols_info, query_text)
        
        answer = ai_plan.get('answer', 'AI answer not available.')
        chart_type = ai_plan.get('chart_type')
        pandas_code = ai_plan.get('pandas_code')
        x_label = ai_plan.get('x_label', 'Category')
        y_label = ai_plan.get('y_label', 'Value')

        chart_data = None

        if pandas_code:
            try:
                df = self._read_dataframe(dataset.file.path, dataset.name)
                if df is not None:
                    import pandas as pd
                    # Safe execution
                    allowed_globals = {"df": df, "pd": pd}
                    res = eval(pandas_code, allowed_globals)
                    
                    if hasattr(res, 'to_dict'):
                        res_dict = res.to_dict()
                    elif isinstance(res, dict):
                        res_dict = res
                    else:
                        res_dict = {}

                    if isinstance(res_dict, dict):
                        chart_data = []
                        for k, v in res_dict.items():
                            try:
                                val = float(v)
                            except (ValueError, TypeError):
                                val = v
                            chart_data.append({
                                "name": str(k),
                                "value": val
                            })
            except Exception as e:
                print(f"Error executing pandas query code: {e}")
                chart_type = None

        return Response({
            'answer': answer,
            'chart_type': chart_type,
            'chart_data': chart_data,
            'x_label': x_label,
            'y_label': y_label
        })

    # ── Export (JSON / CSV / PDF / Excel) ──
    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        dataset = self.get_object()
        format_type = request.query_params.get('type', 'json')

        cols = dataset.columns.all()
        data = []
        for c in cols:
            data.append({
                "name": c.name,
                "type": c.data_type,
                "null_count": c.null_count,
                "unique_count": c.unique_count,
                "description": c.ai_description,
                "suggested_name": c.suggested_name,
            })

        if format_type == 'json':
            response = HttpResponse(json.dumps(data, indent=2), content_type='application/json')
            response['Content-Disposition'] = f'attachment; filename="{dataset.name}_metadata.json"'
            return response

        elif format_type == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{dataset.name}_metadata.csv"'
            writer = csv.writer(response)
            writer.writerow(['Column', 'Type', 'Null Count', 'Unique Count', 'Description', 'Suggested Name'])
            for row in data:
                writer.writerow([row['name'], row['type'], row['null_count'], row['unique_count'], row['description'], row['suggested_name']])
            return response

        elif format_type == 'excel':
            import openpyxl
            from io import BytesIO
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Metadata"
            ws.append(['Column', 'Type', 'Null Count', 'Unique Count', 'Description', 'Suggested Name'])
            for row in data:
                ws.append([row['name'], row['type'], row['null_count'], row['unique_count'], row['description'], row['suggested_name']])
            buffer = BytesIO()
            wb.save(buffer)
            buffer.seek(0)
            response = HttpResponse(buffer.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="{dataset.name}_metadata.xlsx"'
            return response

        elif format_type == 'pdf':
            from io import BytesIO
            from reportlab.lib.pagesizes import letter, landscape
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib import colors
            from reportlab.lib.styles import getSampleStyleSheet

            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
            styles = getSampleStyleSheet()
            elements = []

            elements.append(Paragraph(f"DataMorphix — {dataset.name} Metadata Report", styles['Title']))
            elements.append(Spacer(1, 12))
            elements.append(Paragraph(f"Health Score: {dataset.health_score}/100 | Rows: {dataset.row_count} | Columns: {len(data)}", styles['Normal']))
            elements.append(Spacer(1, 12))

            table_data = [['Column', 'Type', 'Nulls', 'Uniques', 'Description']]
            for row in data:
                desc = (row['description'] or '')[:60]
                table_data.append([row['name'], row['type'], str(row['null_count']), str(row['unique_count']), desc])

            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
            ]))
            elements.append(table)
            doc.build(elements)
            buffer.seek(0)

            response = HttpResponse(buffer.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{dataset.name}_metadata.pdf"'
            return response

        return Response({'error': 'Unsupported format. Use: json, csv, excel, pdf'}, status=status.HTTP_400_BAD_REQUEST)

    # ── Governance Issues ──
    @action(detail=True, methods=['get'])
    def governance(self, request, pk=None):
        dataset = self.get_object()
        issues = dataset.governance_issues.all().order_by('-severity')
        serializer = GovernanceIssueSerializer(issues, many=True)
        return Response(serializer.data)

    # ── Usage Insights ──
    @action(detail=True, methods=['get'])
    def usage_insights(self, request, pk=None):
        dataset = self.get_object()
        try:
            df = self._read_dataframe(dataset.file.path, dataset.name)
            if df is None:
                return Response({'error': 'Cannot read dataset file'}, status=status.HTTP_400_BAD_REQUEST)
            insights = governance_engine.compute_usage_insights(df)
            return Response(insights)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Relationships inside the selected table
    @action(detail=True, methods=['get'], url_path='internal-relations')
    def internal_relations(self, request, pk=None):
        dataset = self.get_object()
        try:
            df = self._read_dataframe(dataset.file.path, dataset.name)
            if df is None:
                return Response({'error': 'Cannot read dataset file'}, status=status.HTTP_400_BAD_REQUEST)

            relations = self._internal_column_relations(df)
            return Response(relations)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ── Adaptive Analytics ──
    @action(detail=True, methods=['get'], url_path='analytics')
    def analytics(self, request, pk=None):
        """
        Return AI-generated adaptive analytics plan with executed chart data.
        Results are cached in the DB so the AI is called only ONCE per dataset version.
        Pass ?refresh=1 to force regeneration (invalidates cache).
        """
        dataset = self.get_object()
        force_refresh = request.query_params.get('refresh', '0') == '1'

        # Return cached result if available
        if dataset.analytics_cache and not force_refresh:
            return Response(dataset.analytics_cache)

        try:
            df = self._read_dataframe(dataset.file.path, dataset.name)
            if df is None:
                return Response({'error': 'Cannot read dataset file'}, status=status.HTTP_400_BAD_REQUEST)

            # Build columns info with advanced stats for the AI planner
            cols_info = []
            for col in df.columns:
                null_count = int(df[col].isnull().sum())
                unique_count = int(df[col].nunique())
                advanced_stats = {}
                if pd.api.types.is_numeric_dtype(df[col]):
                    col_data = df[col].dropna()
                    if len(col_data) > 0:
                        advanced_stats = {
                            'min': float(col_data.min()),
                            'max': float(col_data.max()),
                            'mean': float(col_data.mean()),
                        }
                else:
                    top_values = df[col].value_counts().head(10).to_dict()
                    advanced_stats = {'top_values': {str(k): int(v) for k, v in top_values.items()}}

                cols_info.append({
                    'name': col,
                    'type': str(df[col].dtype),
                    'nulls': null_count,
                    'uniques': unique_count,
                    'advanced_stats': advanced_stats,
                })

            # Single AI call -> get full analytics plan
            plan = ai_engine.generate_adaptive_analytics_plan(dataset.name, cols_info)

            if not plan:
                return Response({'error': 'AI could not generate analytics plan.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            # Execute pandas code for each plan item
            results = []
            CHART_COLORS = [
                '#6366f1', '#8b5cf6', '#38bdf8', '#10b981',
                '#f59e0b', '#ef4444', '#ec4899', '#14b8a6',
                '#f97316', '#a855f7', '#06b6d4', '#84cc16',
            ]

            for item in plan:
                pandas_code = item.get('pandas_code')
                chart_data = None

                if pandas_code:
                    try:
                        allowed_globals = {'df': df, 'pd': pd}
                        res = eval(pandas_code, allowed_globals)

                        if hasattr(res, 'to_dict'):
                            res_dict = res.to_dict()
                        elif isinstance(res, dict):
                            res_dict = res
                        else:
                            res_dict = {}

                        if isinstance(res_dict, dict) and res_dict:
                            chart_data = []
                            for idx, (k, v) in enumerate(res_dict.items()):
                                try:
                                    val = float(v)
                                except (ValueError, TypeError):
                                    val = 0.0
                                chart_data.append({
                                    'name': str(k)[:30],
                                    'value': val,
                                    'color': CHART_COLORS[idx % len(CHART_COLORS)],
                                })
                    except Exception as e:
                        print(f"[Analytics] pandas exec error for '{item.get('title')}': {e}")

                if chart_data:
                    results.append({
                        'title': item.get('title', 'Analysis'),
                        'analysis_type': item.get('analysis_type', 'general'),
                        'chart_type': item.get('chart_type', 'bar'),
                        'x_label': item.get('x_label', 'Category'),
                        'y_label': item.get('y_label', 'Value'),
                        'insight': item.get('insight', ''),
                        'chart_data': chart_data,
                    })

            response_data = {
                'dataset_id': dataset.id,
                'dataset_name': dataset.name,
                'total_analyses': len(results),
                'analyses': results,
            }

            # Cache to DB to avoid recomputing on every load
            dataset.analytics_cache = response_data
            dataset.save(update_fields=['analytics_cache'])

            return Response(response_data)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Rename Suggestions
    @action(detail=True, methods=['get'], url_path='rename-suggestions')
    def rename_suggestions(self, request, pk=None):
        dataset = self.get_object()
        cols = dataset.columns.all()
        suggestions = []
        for c in cols:
            suggestions.append({
                'column': c.name,
                'suggested_name': c.suggested_name or c.name,
                'data_type': c.data_type,
            })
        return Response(suggestions)

    # ── Reprocess (Real-time metadata update) ──
    @action(detail=True, methods=['post'])
    def reprocess(self, request, pk=None):
        dataset = self.get_object()
        try:
            df = self._read_dataframe(dataset.file.path, dataset.name)
            if df is None:
                return Response({'error': 'Cannot read dataset file'}, status=status.HTTP_400_BAD_REQUEST)

            # Clear old data + analytics cache
            dataset.columns.all().delete()
            dataset.lineage.all().delete()
            dataset.outgoing_relations.all().delete()
            dataset.governance_issues.all().delete()
            dataset.analytics_cache = None
            dataset.status = 'processing'
            dataset.save()

            # Re-run full processing
            self._process_dataset(dataset, df)

            serializer = self.get_serializer(dataset)
            return Response(serializer.data)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        import os
        dataset = self.get_object()
        try:
            if dataset.file and os.path.exists(dataset.file.path):
                os.remove(dataset.file.path)
        except Exception as e:
            print(f"Error deleting file: {e}")
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def modify(self, request, pk=None):
        dataset = self.get_object()
        instruction = request.data.get('instruction', '').strip()
        if not instruction:
            return Response({'error': 'No instruction provided'}, status=status.HTTP_400_BAD_REQUEST)

        columns = dataset.columns.all()
        columns_info = [{
            "name": c.name,
            "type": c.data_type,
            "description": c.ai_description
        } for c in columns]

        code = ai_engine.generate_modification_code(dataset.name, columns_info, instruction)
        if not code:
            return Response({'error': 'AI failed to generate modification code.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            df = self._read_dataframe(dataset.file.path, dataset.name)
            if df is None:
                return Response({'error': 'Failed to read current dataset file.'}, status=status.HTTP_400_BAD_REQUEST)

            allowed_globals = {"df": df, "pd": pd}
            exec(code, allowed_globals)
            df = allowed_globals.get("df")

            new_version = dataset.current_version + 1
            import os
            from pathlib import Path
            media_dir = Path(dataset.file.path).parent
            
            # Clean name version suffix
            original_filename = dataset.name
            new_filename = f"{dataset.id}_v{new_version}_{original_filename}"
            new_filepath = media_dir / new_filename

            extension = original_filename.lower().rsplit('.', 1)[-1] if '.' in original_filename else ''
            if extension == 'csv':
                df.to_csv(new_filepath, index=False)
            elif extension in {'xlsx', 'xlsm', 'xls'}:
                df.to_excel(new_filepath, index=False, engine='openpyxl')
            elif extension == 'json':
                df.to_json(new_filepath, orient='records', indent=2)
            else:
                return Response({'error': 'Unsupported file format for saving.'}, status=status.HTTP_400_BAD_REQUEST)

            dataset.current_version = new_version
            dataset.max_version = new_version
            dataset.file = f"datasets/{new_filename}"
            dataset.analytics_cache = None
            dataset.save()

            dataset.columns.all().delete()
            dataset.lineage.all().delete()
            dataset.outgoing_relations.all().delete()
            dataset.governance_issues.all().delete()
            dataset.status = 'processing'
            dataset.save()

            self._process_dataset(dataset, df)

            DataLineage.objects.create(
                dataset=dataset,
                source_name=dataset.name,
                transformation_step=f"Modified via AI: {instruction}"
            )

            serializer = self.get_serializer(dataset)
            return Response(serializer.data)

        except Exception as e:
            return Response({'error': f"Failed to execute modification code: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def undo(self, request, pk=None):
        dataset = self.get_object()
        if dataset.current_version <= 0:
            return Response({'error': 'Already at initial version'}, status=status.HTTP_400_BAD_REQUEST)

        prev_version = dataset.current_version - 1
        original_name = dataset.name

        import os
        from pathlib import Path
        media_dir = Path(dataset.file.path).parent
        version_filename = f"{dataset.id}_v{prev_version}_{original_name}"
        version_path = media_dir / version_filename

        if not os.path.exists(version_path):
            return Response({'error': f"File for version {prev_version} not found on disk."}, status=status.HTTP_404_NOT_FOUND)

        dataset.current_version = prev_version
        dataset.file = f"datasets/{version_filename}"
        dataset.save()

        df = self._read_dataframe(version_path, original_name)
        dataset.columns.all().delete()
        dataset.lineage.all().delete()
        dataset.outgoing_relations.all().delete()
        dataset.governance_issues.all().delete()

        self._process_dataset(dataset, df)

        DataLineage.objects.create(
            dataset=dataset,
            source_name=dataset.name,
            transformation_step=f"Reverted to version {prev_version} via Undo"
        )

        serializer = self.get_serializer(dataset)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def redo(self, request, pk=None):
        dataset = self.get_object()
        if dataset.current_version >= dataset.max_version:
            return Response({'error': 'Already at newest version'}, status=status.HTTP_400_BAD_REQUEST)

        next_version = dataset.current_version + 1
        original_name = dataset.name

        import os
        from pathlib import Path
        media_dir = Path(dataset.file.path).parent
        version_filename = f"{dataset.id}_v{next_version}_{original_name}"
        version_path = media_dir / version_filename

        if not os.path.exists(version_path):
            return Response({'error': f"File for version {next_version} not found on disk."}, status=status.HTTP_404_NOT_FOUND)

        dataset.current_version = next_version
        dataset.file = f"datasets/{version_filename}"
        dataset.save()

        df = self._read_dataframe(version_path, original_name)
        dataset.columns.all().delete()
        dataset.lineage.all().delete()
        dataset.outgoing_relations.all().delete()
        dataset.governance_issues.all().delete()

        self._process_dataset(dataset, df)

        DataLineage.objects.create(
            dataset=dataset,
            source_name=dataset.name,
            transformation_step=f"Restored version {next_version} via Redo"
        )

        serializer = self.get_serializer(dataset)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def download_data(self, request, pk=None):
        dataset = self.get_object()
        format_type = request.query_params.get('type', 'csv').lower()

        df = self._read_dataframe(dataset.file.path, dataset.name)
        if df is None:
            return Response({'error': 'Cannot read dataset file'}, status=status.HTTP_400_BAD_REQUEST)

        original_name = dataset.name.rsplit('.', 1)[0]

        if format_type == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{original_name}_v{dataset.current_version}.csv"'
            df.to_csv(response, index=False)
            return response
        elif format_type == 'json':
            response = HttpResponse(df.to_json(orient='records', indent=2), content_type='application/json')
            response['Content-Disposition'] = f'attachment; filename="{original_name}_v{dataset.current_version}.json"'
            return response
        elif format_type == 'excel':
            from io import BytesIO
            buffer = BytesIO()
            df.to_excel(buffer, index=False, engine='openpyxl')
            buffer.seek(0)
            response = HttpResponse(buffer.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="{original_name}_v{dataset.current_version}.xlsx"'
            return response

        return Response({'error': 'Unsupported format. Use csv, json, or excel.'}, status=status.HTTP_400_BAD_REQUEST)


# ── Global Search (not part of the ViewSet) ──
@api_view(['GET'])
def search_datasets(request):
    """Search columns across all datasets by keyword."""
    q = request.query_params.get('q', '').strip()
    if not q:
        return Response([])

    columns = ColumnMetadata.objects.filter(
        Q(name__icontains=q) |
        Q(ai_description__icontains=q) |
        Q(data_type__icontains=q)
    ).select_related('dataset')[:50]

    results = []
    for col in columns:
        results.append({
            'dataset_id': col.dataset.id,
            'dataset_name': col.dataset.name,
            'column_name': col.name,
            'data_type': col.data_type,
            'ai_description': col.ai_description,
        })

    return Response(results)


def index_view(request):
    return render(request, 'index.html')
