from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DatasetViewSet, search_datasets

router = DefaultRouter()
router.register(r'datasets', DatasetViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('search/', search_datasets, name='search-datasets'),
]
