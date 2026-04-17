from django.contrib import admin
from .models import DailySummary

@admin.register(DailySummary)
class DailySummaryAdmin(admin.ModelAdmin):
    list_display = ["date", "facility", "patients_enrolled", "encounters_created", "qr_shares_generated"]
    date_hierarchy = "date"
