import pandas as pd
from django.test import TestCase

from .views import DatasetViewSet


class InternalColumnRelationsTests(TestCase):
    def setUp(self):
        self.view = DatasetViewSet()

    def test_detects_numeric_relationship_inside_one_table(self):
        df = pd.DataFrame({
            'sales': [100, 200, 300, 400, 500],
            'profit': [10, 20, 30, 40, 50],
            'region': ['North', 'South', 'East', 'West', 'North'],
        })

        relations = self.view._internal_column_relations(df)

        self.assertTrue(any(
            relation['left_column'] == 'sales'
            and relation['right_column'] == 'profit'
            and relation['relationship_type'] == 'Numeric correlation'
            for relation in relations
        ))

    def test_detects_category_to_measure_relationship_inside_one_table(self):
        df = pd.DataFrame({
            'plan': ['Basic', 'Basic', 'Basic', 'Pro', 'Pro', 'Pro'],
            'monthly_revenue': [20, 22, 18, 95, 100, 105],
            'customer_id': [1, 2, 3, 4, 5, 6],
        })

        relations = self.view._internal_column_relations(df)

        self.assertTrue(any(
            relation['left_column'] == 'plan'
            and relation['right_column'] == 'monthly_revenue'
            and relation['relationship_type'] == 'Category affects measure'
            for relation in relations
        ))
