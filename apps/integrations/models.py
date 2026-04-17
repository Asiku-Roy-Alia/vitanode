"""
Integrations: FHIR adapter config, facility integration keys, sync changes.
Implements Sections 7 and 8 of the technical doc.
"""
import uuid
import secrets
from django.db import models
from apps.core.models import TimeStampedModel


class IntegrationConfig(TimeStampedModel):
    """Configuration for a facility's EMR integration."""
    SYSTEM_CHOICES = [
        ("openmrs", "OpenMRS"),
        ("ugandaemr", "UgandaEMR"),
        ("dhis2", "DHIS2"),
        ("custom", "Custom FHIR Server"),
    ]
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    facility = models.ForeignKey("core.Facility", on_delete=models.CASCADE, related_name="integrations")
    system_type = models.CharField(max_length=16, choices=SYSTEM_CHOICES)
    base_url = models.URLField(help_text="Base URL of the external EMR or FHIR server")
    api_key = models.CharField(max_length=255, default="", blank=True)
    hmac_secret = models.CharField(
        max_length=128, default="", blank=True,
        help_text="Pre-shared HMAC key for signing integration requests"
    )
    is_active = models.BooleanField(default=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    sync_direction = models.CharField(
        max_length=8,
        choices=[("push", "Push Only"), ("pull", "Pull Only"), ("both", "Bidirectional")],
        default="both",
    )

    def __str__(self):
        return f"{self.facility.name} <-> {self.system_type}"

    @classmethod
    def generate_api_key(cls):
        return secrets.token_urlsafe(32)


class SyncChange(TimeStampedModel):
    """
    Change log entry for offline sync.
    Client-side changes are queued locally and posted to the server on connectivity.
    Server replies with changes since the client's last sync timestamp.
    """
    CHANGE_TYPES = [
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
    ]
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    device = models.ForeignKey("accounts.Device", on_delete=models.SET_NULL, null=True, related_name="sync_changes")
    model_name = models.CharField(max_length=64, help_text="Django model that was changed")
    object_id = models.CharField(max_length=64)
    change_type = models.CharField(max_length=8, choices=CHANGE_TYPES)
    payload = models.JSONField(default=dict)
    client_timestamp = models.DateTimeField(help_text="Timestamp from the client device")
    synced_at = models.DateTimeField(null=True, blank=True)
    is_synced = models.BooleanField(default=False)
    conflict_resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ["-client_timestamp"]
        indexes = [
            models.Index(fields=["model_name", "object_id"]),
            models.Index(fields=["device", "is_synced"]),
        ]

    def __str__(self):
        return f"{self.change_type} {self.model_name}:{self.object_id}"
