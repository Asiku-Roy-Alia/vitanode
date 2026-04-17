from django.contrib import admin
from .models import Consent, ShareToken

@admin.register(Consent)
class ConsentAdmin(admin.ModelAdmin):
    list_display = ["patient", "granted_to_provider", "granted_to_facility", "is_active", "expires_at"]
    list_filter = ["is_active"]

@admin.register(ShareToken)
class ShareTokenAdmin(admin.ModelAdmin):
    list_display = ["patient", "is_used", "is_single_use", "expires_at", "created_at"]
    list_filter = ["is_used"]
