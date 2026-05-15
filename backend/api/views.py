import pandas as pd
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Dataset, ColumnMetadata, DataLineage, DatasetRelationship
from .serializers import DatasetSerializer, ColumnMetadataSerializer
from . import ai_engine

class DatasetViewSet(viewsets.ModelViewSet):
    queryset = Dataset.objects.all().order_by('-uploaded_at')
    serializer_class = DatasetSerializer

    def create(self, request, *args, **kwargs):
        file_obj = request.data.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        dataset = Dataset.objects.create(name=file_obj.name, file=file_obj)
        
        # Process with pandas
        try:
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(dataset.file.path)
            elif file_obj.name.endswith('.xlsx'):
                df = pd.read_excel(dataset.file.path)
            elif file_obj.name.endswith('.json'):
                df = pd.read_json(dataset.file.path)
            else:
                return Response({'error': 'Unsupported file format'}, status=status.HTTP_400_BAD_REQUEST)

            # Generate Dataset Metadata
            total_rows = len(df)
            health_score = 100
            
            cols_info = []
            
            # Step 1: Extract all metadata using pandas locally
            for col in df.columns:
                null_count = int(df[col].isnull().sum())
                unique_count = int(df[col].nunique())
                data_type = str(df[col].dtype)
                sample_vals = df[col].dropna().astype(str).unique()[:3].tolist()
                
                cols_info.append({
                    "name": col, "type": data_type, "nulls": null_count, "uniques": unique_count, "samples": sample_vals
                })
                
                if null_count > 0:
                    health_score -= (null_count / total_rows) * 10
            
            # Step 2: Make ONE API call to get all column descriptions
            ai_descriptions = ai_engine.get_all_columns_metadata(dataset.name, cols_info)
            
            # Step 3: Save to DB
            for info in cols_info:
                col_name = info['name']
                ai_desc = ai_descriptions.get(col_name, "AI description not available.")
                
                ColumnMetadata.objects.create(
                    dataset=dataset,
                    name=col_name,
                    data_type=info['type'],
                    ai_description=ai_desc,
                    null_count=info['nulls'],
                    unique_count=info['uniques'],
                    sample_values=info['samples']
                )
                
                # We update the dict to pass it to the summary generator
                info['desc'] = ai_desc
            
            dataset.health_score = max(0, min(100, int(health_score)))
            dataset.summary = ai_engine.generate_dataset_summary(dataset.name, cols_info)
            dataset.status = 'completed'
            dataset.save()
            
            # Create Lineage
            DataLineage.objects.create(
                dataset=dataset,
                source_name=file_obj.name,
                transformation_step="Raw Upload & Pandas Extraction"
            )

            # Simple Relationship Detection (Cross-Dataset)
            existing_datasets = Dataset.objects.exclude(id=dataset.id)
            for other_ds in existing_datasets:
                for other_col in other_ds.columns.all():
                    for col_info in cols_info:
                        if other_col.name.lower() == col_info['name'].lower() and other_col.data_type == col_info['type']:
                            # e.g., 'customer_id' matches 'customer_id'
                            DatasetRelationship.objects.create(
                                source_dataset=dataset,
                                target_dataset=other_ds,
                                source_column=col_info['name'],
                                target_column=other_col.name,
                                confidence_score=0.9
                            )

            serializer = self.get_serializer(dataset)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            dataset.status = 'failed'
            dataset.save()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        import json
        from django.http import HttpResponse
        dataset = self.get_object()
        format_type = request.query_params.get('format', 'json')
        
        cols = dataset.columns.all()
        data = []
        for c in cols:
            data.append({
                "name": c.name,
                "type": c.data_type,
                "null_count": c.null_count,
                "description": c.ai_description
            })
            
        if format_type == 'json':
            response = HttpResponse(json.dumps(data, indent=2), content_type='application/json')
            response['Content-Disposition'] = f'attachment; filename="{dataset.name}_metadata.json"'
            return response
            
        elif format_type == 'csv':
            import csv
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{dataset.name}_metadata.csv"'
            writer = csv.writer(response)
            writer.writerow(['Column', 'Type', 'Null Count', 'Description'])
            for row in data:
                writer.writerow([row['name'], row['type'], row['null_count'], row['description']])
            return response

        return Response({'error': 'Format not supported'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def query(self, request, pk=None):
        dataset = self.get_object()
        query = request.data.get('query', '')
        
        columns = dataset.columns.all()
        cols_info = [{"name": c.name, "description": c.ai_description} for c in columns]
        
        response_text = ai_engine.analyze_query(dataset.name, cols_info, query)
        return Response({'answer': response_text})
