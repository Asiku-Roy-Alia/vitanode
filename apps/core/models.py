"""
Core models: Facility and shared utilities.
"""
import uuid
from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base for all models requiring timestamps."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Facility(TimeStampedModel):
    """Health facility: clinic, hospital, or health centre."""
    id = models.BigAutoField(primary_key=True)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=64, unique=True, help_text="Ministry of Health facility code")
    address = models.TextField(blank=True, default="")
    district = models.CharField(max_length=128, blank=True, default="")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    contact_phone = models.CharField(max_length=20, blank=True, default="")
    contact_email = models.EmailField(blank=True, default="")
    facility_type = models.CharField(
        max_length=32,
        choices=[
            ("hc2", "Health Centre II"),
            ("hc3", "Health Centre III"),
            ("hc4", "Health Centre IV"),
            ("hospital", "Hospital"),
            ("rrh", "Regional Referral Hospital"),
            ("nrh", "National Referral Hospital"),
            ("private", "Private Clinic"),
        ],
        default="hc3",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "facilities"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.code})"
