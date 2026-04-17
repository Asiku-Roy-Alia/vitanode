from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from apps.accounts.models import Patient
from apps.records.models import Encounter
from apps.documents.models import Document
from apps.consent.models import ShareToken


class AnalyticsSummaryView(APIView):
    """GET /api/v1/admin/analytics/summary/ - Dashboard KPIs."""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        return Response({
            "total_patients": Patient.objects.count(),
            "patients_last_30_days": Patient.objects.filter(created_at__gte=thirty_days_ago).count(),
            "total_encounters": Encounter.objects.count(),
            "encounters_last_30_days": Encounter.objects.filter(created_at__gte=thirty_days_ago).count(),
            "total_documents": Document.objects.count(),
            "qr_shares_generated": ShareToken.objects.count(),
            "qr_shares_redeemed": ShareToken.objects.filter(is_used=True).count(),
            "encounters_by_type": list(
                Encounter.objects.values("encounter_type")
                .annotate(count=Count("id"))
                .order_by("-count")
            ),
        })
