import pandas as pd
import json
import csv
from django.http import HttpResponse
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
        if file_name.endswith('.csv'):
            return pd.read_csv(file_path)
        elif file_name.endswith('.xlsx'):
            return pd.read_excel(file_path)
        elif file_name.endswith('.json'):
            return pd.read_json(file_path)
        return None

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

            cols_info.append({
                "name": col, "type": data_type,
                "nulls": null_count, "uniques": unique_count,
                "samples": sample_vals
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
                suggested_name=suggested
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
            df = self._read_dataframe(dataset.file.path, file_obj.name)
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
        query = request.data.get('query', '')

        columns = dataset.columns.all()
        cols_info = [{"name": c.name, "type": c.data_type, "description": c.ai_description} for c in columns]

        response_text = ai_engine.analyze_query(dataset.name, cols_info, query)
        return Response({'answer': response_text})

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

    # ── Rename Suggestions ──
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

            # Clear old data
            dataset.columns.all().delete()
            dataset.lineage.all().delete()
            dataset.outgoing_relations.all().delete()
            dataset.governance_issues.all().delete()
            dataset.status = 'processing'
            dataset.save()

            # Re-run full processing
            self._process_dataset(dataset, df)

            serializer = self.get_serializer(dataset)
            return Response(serializer.data)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
