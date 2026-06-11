from django.contrib import admin
from .models import Dataset, ColumnMetadata, DataLineage, DatasetRelationship, GovernanceIssue

@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'uploaded_at', 'status', 'health_score', 'row_count')
    search_fields = ('name', 'status')
    list_filter = ('status', 'uploaded_at')

@admin.register(ColumnMetadata)
class ColumnMetadataAdmin(admin.ModelAdmin):
    list_display = ('id', 'dataset', 'name', 'data_type', 'null_count', 'unique_count')
    search_fields = ('name', 'data_type', 'dataset__name')
    list_filter = ('data_type',)

@admin.register(DataLineage)
class DataLineageAdmin(admin.ModelAdmin):
    list_display = ('id', 'dataset', 'source_name', 'transformation_step', 'created_at')
    search_fields = ('source_name', 'transformation_step', 'dataset__name')
    list_filter = ('created_at',)

@admin.register(DatasetRelationship)
class DatasetRelationshipAdmin(admin.ModelAdmin):
    list_display = ('id', 'source_dataset', 'source_column', 'target_dataset', 'target_column', 'confidence_score')
    search_fields = ('source_column', 'target_column', 'source_dataset__name', 'target_dataset__name')

@admin.register(GovernanceIssue)
class GovernanceIssueAdmin(admin.ModelAdmin):
    list_display = ('id', 'dataset', 'issue_type', 'severity', 'column_name', 'created_at')
    search_fields = ('issue_type', 'column_name', 'dataset__name')
    list_filter = ('severity', 'issue_type', 'created_at')

