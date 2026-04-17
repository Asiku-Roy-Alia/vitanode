from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ["title", "document_type", "patient", "mime_type", "is_verified", "created_at"]
    list_filter = ["document_type", "is_verified"]
