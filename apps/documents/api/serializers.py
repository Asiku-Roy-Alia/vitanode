from rest_framework import serializers
from apps.documents.models import Document


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "uuid", "patient", "encounter", "document_type", "title",
            "description", "mime_type", "file", "file_size_bytes",
            "is_verified", "verified_by", "created_at",
        ]
        read_only_fields = ["uuid", "file_hash", "file_size_bytes", "created_at"]

    def create(self, validated_data):
        file_obj = validated_data.get("file")
        doc = Document(**validated_data)
        if file_obj:
            content = file_obj.read()
            doc.compute_hash(content)
            doc.file_size_bytes = len(content)
            file_obj.seek(0)
        doc.save()
        return doc


class DocumentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["uuid", "document_type", "title", "mime_type", "file_size_bytes", "is_verified", "created_at"]
