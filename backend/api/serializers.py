from rest_framework import serializers
from .models import Dataset, ColumnMetadata, DataLineage, DatasetRelationship

class ColumnMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ColumnMetadata
        fields = '__all__'

class DataLineageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataLineage
        fields = '__all__'

class DatasetRelationshipSerializer(serializers.ModelSerializer):
    target_dataset_name = serializers.CharField(source='target_dataset.name', read_only=True)
    class Meta:
        model = DatasetRelationship
        fields = '__all__'

class DatasetSerializer(serializers.ModelSerializer):
    columns = ColumnMetadataSerializer(many=True, read_only=True)
    lineage = DataLineageSerializer(many=True, read_only=True)
    outgoing_relations = DatasetRelationshipSerializer(many=True, read_only=True)

    class Meta:
        model = Dataset
        fields = ['id', 'name', 'file', 'uploaded_at', 'status', 'health_score', 'summary', 'columns', 'lineage', 'outgoing_relations']
