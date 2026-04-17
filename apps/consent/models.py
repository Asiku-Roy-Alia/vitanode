"""
Consent and QR-based sharing: the core patient empowerment feature.
Implements Section 9 of the technical doc (QR sharing flow).
"""
import uuid
import secrets
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from apps.core.models import TimeStampedModel


class Consent(TimeStampedModel):
    """
    A consent record granting a provider or facility time-limited
    access to specific categories of patient data.
    """
    SCOPE_CHOICES = [
        ("encounters", "Encounters"),
        ("observations", "Observations"),
        ("medications", "Medications"),
        ("lab_results", "Lab Results"),
        ("documents", "Documents"),
        ("full", "Full Record Access"),
    ]
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    patient = models.ForeignKey("accounts.Patient", on_delete=models.CASCADE, related_name="consents")
    granted_to_provider = models.ForeignKey(
        "accounts.Provider", on_delete=models.SET_NULL, null=True, blank=True, related_name="received_consents"
    )
    granted_to_facility = models.ForeignKey(
        "core.Facility", on_delete=models.SET_NULL, null=True, blank=True, related_name="received_consents"
    )
    scope = models.JSONField(default=list, help_text="List of data categories shared")
    purpose = models.TextField(blank=True, default="", help_text="Reason for sharing")
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        target = self.granted_to_provider or self.granted_to_facility or "Unspecified"
        return f"Consent: {self.patient} -> {target}"

    def is_valid(self):
        return self.is_active and not self.revoked_at and self.expires_at > timezone.now()

    def revoke(self):
        self.revoked_at = timezone.now()
        self.is_active = False
        self.save(update_fields=["revoked_at", "is_active", "updated_at"])


class ShareToken(TimeStampedModel):
    """
    A short-lived QR code token for instant provider access.
    Flow: Patient generates token -> QR displayed -> Provider scans ->
    Provider receives scoped, time-limited access to patient records.
    """
    token = models.CharField(max_length=128, unique=True, db_index=True)
    patient = models.ForeignKey("accounts.Patient", on_delete=models.CASCADE, related_name="share_tokens")
    consent = models.OneToOneField(Consent, on_delete=models.CASCADE, related_name="share_token", null=True, blank=True)
    scope = models.JSONField(default=list)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    used_by = models.ForeignKey(
        "accounts.Provider", on_delete=models.SET_NULL, null=True, blank=True, related_name="scanned_tokens"
    )
    is_single_use = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"QR Token for {self.patient} (expires {self.expires_at})"

    @classmethod
    def generate(cls, patient, scope, ttl_minutes=None):
        if ttl_minutes is None:
            ttl_minutes = settings.QR_TOKEN_DEFAULT_TTL_MINUTES
        ttl_minutes = min(ttl_minutes, settings.QR_TOKEN_MAX_TTL_MINUTES)

        token_value = secrets.token_urlsafe(48)
        expires = timezone.now() + timedelta(minutes=ttl_minutes)

        return cls.objects.create(
            token=token_value,
            patient=patient,
            scope=scope,
            expires_at=expires,
        )

    def is_valid(self):
        if self.is_single_use and self.is_used:
            return False
        return self.expires_at > timezone.now()

    def redeem(self, provider):
        if not self.is_valid():
            return None
        self.is_used = True
        self.used_at = timezone.now()
        self.used_by = provider
        self.save(update_fields=["is_used", "used_at", "used_by", "updated_at"])

        consent = Consent.objects.create(
            patient=self.patient,
            granted_to_provider=provider,
            scope=self.scope,
            purpose="QR code sharing",
            expires_at=self.expires_at,
        )
        self.consent = consent
        self.save(update_fields=["consent"])
        return consent
