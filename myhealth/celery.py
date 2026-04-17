import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myhealth.settings")
app = Celery("myhealth")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
