from django.urls import path
from .views import AnalyticsSummaryView

urlpatterns = [
    path("admin/analytics/summary/", AnalyticsSummaryView.as_view(), name="analytics-summary"),
]
