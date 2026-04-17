from django.contrib import admin
from .models import IntegrationConfig, SyncChange

@admin.register(IntegrationConfig)
class IntegrationConfigAdmin(admin.ModelAdmin):
    list_display = ["facility", "system_type", "is_active", "sync_direction", "last_sync_at"]
    list_filter = ["system_type", "is_active"]

@admin.register(SyncChange)
class SyncChangeAdmin(admin.ModelAdmin):
    list_display = ["model_name", "object_id", "change_type", "is_synced", "client_timestamp"]
    list_filter = ["change_type", "is_synced"]
