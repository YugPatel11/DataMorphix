from django.db import models


class Dataset(models.Model):
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='datasets/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='processing')
    health_score = models.IntegerField(null=True, blank=True)
    summary = models.TextField(null=True, blank=True)
    row_count = models.IntegerField(null=True, blank=True)
    current_version = models.IntegerField(default=0)
    max_version = models.IntegerField(default=0)

    def __str__(self):
        return self.name


class ColumnMetadata(models.Model):
    dataset = models.ForeignKey(Dataset, related_name='columns', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    data_type = models.CharField(max_length=100)
    ai_description = models.TextField(null=True, blank=True)
    null_count = models.IntegerField(default=0)
    unique_count = models.IntegerField(default=0)
    sample_values = models.JSONField(default=list)
    suggested_name = models.CharField(max_length=255, null=True, blank=True)
    advanced_stats = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.dataset.name} - {self.name}"


class DataLineage(models.Model):
    dataset = models.ForeignKey(Dataset, related_name='lineage', on_delete=models.CASCADE)
    source_name = models.CharField(max_length=255)
    transformation_step = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.dataset.name} - {self.transformation_step}"


class DatasetRelationship(models.Model):
    source_dataset = models.ForeignKey(Dataset, related_name='outgoing_relations', on_delete=models.CASCADE)
    target_dataset = models.ForeignKey(Dataset, related_name='incoming_relations', on_delete=models.CASCADE)
    source_column = models.CharField(max_length=255)
    target_column = models.CharField(max_length=255)
    confidence_score = models.FloatField(default=1.0)

    def __str__(self):
        return f"{self.source_dataset.name}.{self.source_column} -> {self.target_dataset.name}.{self.target_column}"


class GovernanceIssue(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    dataset = models.ForeignKey(Dataset, related_name='governance_issues', on_delete=models.CASCADE)
    issue_type = models.CharField(max_length=100)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='medium')
    column_name = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.severity}] {self.dataset.name} - {self.issue_type}"
