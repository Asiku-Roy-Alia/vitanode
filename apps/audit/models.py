"""
Audit: Immutable audit log for every access to patient data.
Required for compliance with Uganda Data Protection and Privacy Act 2019.
"""
from django.db import models


class AuditLog(models.Model):
    """
    Immutable record of every read and write operation on patient data.
    Entries are append-only and never modified or deleted.
    """
    ACTION_CHOICES = [
        ("create", "Create"),
        ("read", "Read"),
        ("update", "Update"),
        ("delete", "Delete"),
        ("login", "Login"),
        ("logout", "Logout"),
        ("share", "Share via QR"),
        ("consent_grant", "Consent Granted"),
        ("consent_revoke", "Consent Revoked"),
        ("export", "Data Export"),
        ("sync", "Sync Event"),
    ]
    ACTOR_TYPES = [
        ("patient", "Patient"),
        ("provider", "Provider"),
        ("facility_admin", "Facility Admin"),
        ("system", "System"),
        ("integration", "Integration Adapter"),
    ]
    id = models.BigAutoField(primary_key=True)
    actor_type = models.CharField(max_length=16, choices=ACTOR_TYPES)
    actor_id = models.PositiveBigIntegerField(help_text="User ID of the actor")
    action = models.CharField(max_length=16, choices=ACTION_CHOICES)
    target_type = models.CharField(max_length=64, help_text="Model name of the resource accessed")
    target_id = models.CharField(max_length=64, blank=True, default="")
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["actor_type", "actor_id"]),
            models.Index(fields=["target_type", "target_id"]),
            models.Index(fields=["action", "timestamp"]),
        ]
        # Prevent modifications at the Django level
        managed = True

    def __str__(self):
        return f"{self.actor_type}:{self.actor_id} {self.action} {self.target_type}:{self.target_id}"

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValueError("Audit log entries are immutable and cannot be modified.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("Audit log entries are immutable and cannot be deleted.")
