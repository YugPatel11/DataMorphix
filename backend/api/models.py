from django.db import models

class Dataset(models.Model):
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='datasets/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='processing')
    health_score = models.IntegerField(null=True, blank=True)
    summary = models.TextField(null=True, blank=True)

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

    def __str__(self):
        return f"{self.dataset.name} - {self.name}"
