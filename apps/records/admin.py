from django.contrib import admin
from .models import Encounter, Observation, Medication, LabResult

@admin.register(Encounter)
class EncounterAdmin(admin.ModelAdmin):
    list_display = ["patient", "encounter_type", "status", "facility", "start_time"]
    list_filter = ["encounter_type", "status"]
    date_hierarchy = "start_time"

@admin.register(Observation)
class ObservationAdmin(admin.ModelAdmin):
    list_display = ["encounter", "display_name", "value_numeric", "value_text", "unit", "status"]

@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ["name", "dose", "frequency", "start_date", "end_date"]

@admin.register(LabResult)
class LabResultAdmin(admin.ModelAdmin):
    list_display = ["test_name", "result_value", "unit", "is_abnormal", "status"]
    list_filter = ["status", "is_abnormal"]
