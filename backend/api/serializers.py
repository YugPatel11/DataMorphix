from rest_framework import serializers
from .models import Dataset, ColumnMetadata

class ColumnMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ColumnMetadata
        fields = '__all__'

class DatasetSerializer(serializers.ModelSerializer):
    columns = ColumnMetadataSerializer(many=True, read_only=True)

    class Meta:
        model = Dataset
        fields = ['id', 'name', 'file', 'uploaded_at', 'status', 'health_score', 'summary', 'columns']
