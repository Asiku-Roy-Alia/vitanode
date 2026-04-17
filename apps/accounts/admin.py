from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Patient, Provider, Identifier, Device

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["username", "email", "role", "is_active", "date_joined"]
    list_filter = ["role", "is_active"]
    fieldsets = BaseUserAdmin.fieldsets + (
        ("MyHealth", {"fields": ("role", "phone_number", "phone_verified")}),
    )

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ["first_name", "last_name", "gender", "date_of_birth", "primary_facility", "is_active"]
    list_filter = ["gender", "is_active"]
    search_fields = ["first_name", "last_name", "uuid"]

@admin.register(Provider)
class ProviderAdmin(admin.ModelAdmin):
    list_display = ["name", "facility", "specialization"]
    search_fields = ["name"]

@admin.register(Identifier)
class IdentifierAdmin(admin.ModelAdmin):
    list_display = ["patient", "identifier_type", "identifier_value"]

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ["user", "device_type", "device_name", "last_seen", "is_active"]
