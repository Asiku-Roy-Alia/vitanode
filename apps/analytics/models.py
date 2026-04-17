"""
Analytics: Lightweight aggregated reporting for the admin dashboard.
Supports KPI tracking defined in Section 19 of the technical doc.
"""
from django.db import models
from apps.core.models import TimeStampedModel


class DailySummary(TimeStampedModel):
    """Pre-computed daily aggregate for dashboard performance."""
    date = models.DateField(db_index=True)
    facility = models.ForeignKey(
        "core.Facility", on_delete=models.CASCADE, null=True, blank=True, related_name="daily_summaries"
    )
    patients_enrolled = models.PositiveIntegerField(default=0)
    encounters_created = models.PositiveIntegerField(default=0)
    documents_uploaded = models.PositiveIntegerField(default=0)
    qr_shares_generated = models.PositiveIntegerField(default=0)
    qr_shares_redeemed = models.PositiveIntegerField(default=0)
    successful_syncs = models.PositiveIntegerField(default=0)
    failed_syncs = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ["date", "facility"]
        ordering = ["-date"]

    def __str__(self):
        label = self.facility.name if self.facility else "All Facilities"
        return f"{self.date} - {label}"
