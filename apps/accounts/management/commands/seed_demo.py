"""
Management command to seed realistic demo data for investor presentations.
Creates facilities, patients, providers, encounters, observations, medications,
lab results, documents, and QR share tokens.

Usage: python manage.py seed_demo
"""
import random
from datetime import timedelta, date
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.core.models import Facility
from apps.accounts.models import Patient, Provider, Identifier, Device
from apps.records.models import Encounter, Observation, Medication, LabResult
from apps.documents.models import Document
from apps.consent.models import Consent, ShareToken

User = get_user_model()

# Realistic Ugandan data
FACILITIES = [
    {"name": "Mulago National Referral Hospital", "code": "MUL-001", "facility_type": "nrh", "district": "Kampala"},
    {"name": "Mildmay Uganda", "code": "MIL-001", "facility_type": "hospital", "district": "Kampala"},
    {"name": "Kiruddu General Hospital", "code": "KIR-001", "facility_type": "hospital", "district": "Kampala"},
    {"name": "Entebbe Regional Referral Hospital", "code": "ENT-001", "facility_type": "rrh", "district": "Wakiso"},
    {"name": "Nakaseke Health Centre IV", "code": "NAK-001", "facility_type": "hc4", "district": "Nakaseke"},
]

FIRST_NAMES_M = ["James", "Robert", "David", "Samuel", "Joseph", "Peter", "Ronald", "Isaac", "Moses", "Brian"]
FIRST_NAMES_F = ["Sarah", "Grace", "Peace", "Mercy", "Joan", "Agnes", "Harriet", "Florence", "Esther", "Brenda"]
LAST_NAMES = ["Mukasa", "Namugera", "Okello", "Atim", "Nankya", "Ssempala", "Nabukenya", "Kizza", "Baguma", "Tumusiime"]

DIAGNOSES = [
    (["B20"], "HIV infection"),
    (["A15.0"], "Pulmonary tuberculosis"),
    (["E11.9"], "Type 2 diabetes mellitus"),
    (["I10"], "Essential hypertension"),
    (["O80"], "Normal delivery"),
    (["J06.9"], "Upper respiratory infection"),
    (["B50.9"], "Malaria"),
    (["A09"], "Gastroenteritis"),
    (["D50.9"], "Iron deficiency anaemia"),
    (["N39.0"], "Urinary tract infection"),
]

MEDICATIONS_LIST = [
    ("Tenofovir/Lamivudine/Dolutegravir", "TLD", "1 tablet", "once daily", "oral"),
    ("Metformin", "Metformin 500mg", "500mg", "twice daily", "oral"),
    ("Amlodipine", "Amlodipine 5mg", "5mg", "once daily", "oral"),
    ("Artemether-Lumefantrine", "Coartem", "4 tablets", "twice daily for 3 days", "oral"),
    ("Amoxicillin", "Amoxicillin 500mg", "500mg", "three times daily", "oral"),
    ("Paracetamol", "Paracetamol 1g", "1g", "three times daily", "oral"),
    ("Iron/Folate", "Ferrous sulphate + Folic acid", "1 tablet", "once daily", "oral"),
    ("Cotrimoxazole", "Septrin 960mg", "960mg", "once daily", "oral"),
]

LAB_TESTS = [
    ("CD4 Count", "24467-3", "cells/uL", 200, 1500, False),
    ("Viral Load", "25836-8", "copies/mL", 0, 50, True),
    ("Random Blood Sugar", "2345-7", "mmol/L", 3.9, 7.8, False),
    ("HbA1c", "4548-4", "%", 4.0, 6.5, False),
    ("Haemoglobin", "718-7", "g/dL", 12.0, 17.0, False),
    ("Malaria RDT", "32700-7", "", 0, 1, True),
    ("Creatinine", "2160-0", "umol/L", 62, 106, False),
    ("Blood Pressure Systolic", "8480-6", "mmHg", 90, 140, False),
    ("Blood Pressure Diastolic", "8462-4", "mmHg", 60, 90, False),
    ("BMI", "39156-5", "kg/m2", 18.5, 30.0, False),
]


class Command(BaseCommand):
    help = "Seed the database with realistic demo data for investor presentations"

    def add_arguments(self, parser):
        parser.add_argument("--patients", type=int, default=25, help="Number of patients to create")
        parser.add_argument("--clear", action="store_true", help="Clear existing demo data before seeding")

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Clearing existing data...")
            ShareToken.objects.all().delete()
            Consent.objects.all().delete()
            Document.objects.all().delete()
            LabResult.objects.all().delete()
            Medication.objects.all().delete()
            Observation.objects.all().delete()
            Encounter.objects.all().delete()
            Identifier.objects.all().delete()
            Device.objects.all().delete()
            Provider.objects.all().delete()
            Patient.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            Facility.objects.all().delete()

        self.stdout.write("Creating facilities...")
        facilities = []
        for f_data in FACILITIES:
            fac, _ = Facility.objects.get_or_create(code=f_data["code"], defaults=f_data)
            facilities.append(fac)

        self.stdout.write("Creating provider accounts...")
        providers = []
        provider_specs = [
            ("dr.mukasa", "John", "Mukasa", "Internal Medicine"),
            ("dr.nambi", "Helen", "Nambi", "Obstetrics and Gynaecology"),
            ("dr.okot", "Francis", "Okot", "Paediatrics"),
            ("nurse.apio", "Betty", "Apio", "General Nursing"),
        ]
        for uname, fname, lname, spec in provider_specs:
            user, created = User.objects.get_or_create(
                username=uname,
                defaults={
                    "first_name": fname, "last_name": lname,
                    "email": f"{uname}@myhealth.ug", "role": "provider",
                }
            )
            if created:
                user.set_password("demo1234")
                user.save()
            prov, _ = Provider.objects.get_or_create(
                user=user,
                defaults={
                    "name": f"{fname} {lname}",
                    "facility": random.choice(facilities),
                    "specialization": spec,
                    "license_number": f"UG-MD-{random.randint(10000, 99999)}",
                }
            )
            providers.append(prov)

        self.stdout.write("Creating admin account...")
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "first_name": "System", "last_name": "Admin",
                "email": "admin@myhealth.ug", "role": "sys_admin",
                "is_staff": True, "is_superuser": True,
            }
        )
        if created:
            admin_user.set_password("admin1234")
            admin_user.save()

        num_patients = options["patients"]
        self.stdout.write(f"Creating {num_patients} patients with clinical histories...")

        for i in range(num_patients):
            gender = random.choice(["M", "F"])
            fname = random.choice(FIRST_NAMES_M if gender == "M" else FIRST_NAMES_F)
            lname = random.choice(LAST_NAMES)
            username = f"patient.{fname.lower()}.{lname.lower()}.{i}"

            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "first_name": fname, "last_name": lname,
                    "email": f"{username}@example.com", "role": "patient",
                }
            )
            if created:
                user.set_password("demo1234")
                user.save()

            dob = date(
                random.randint(1960, 2005),
                random.randint(1, 12),
                random.randint(1, 28),
            )
            patient, _ = Patient.objects.get_or_create(
                user=user,
                defaults={
                    "first_name": fname, "last_name": lname,
                    "date_of_birth": dob, "gender": gender,
                    "primary_facility": random.choice(facilities),
                }
            )
            patient.set_phone(f"+2567{random.randint(10000000, 99999999)}")
            patient.save()

            # Create 2-8 encounters spanning the past 2 years
            num_encounters = random.randint(2, 8)
            for j in range(num_encounters):
                days_ago = random.randint(1, 730)
                start = timezone.now() - timedelta(days=days_ago)
                end = start + timedelta(hours=random.randint(1, 4))
                diag_codes, diag_name = random.choice(DIAGNOSES)

                enc = Encounter.objects.create(
                    patient=patient,
                    provider=random.choice(providers),
                    facility=random.choice(facilities),
                    encounter_type=random.choice(["outpatient", "chronic_review", "lab_only", "anc"]),
                    status="finished",
                    chief_complaint=diag_name,
                    notes=f"Patient presented with {diag_name.lower()}. Examined and treated accordingly.",
                    diagnosis_codes=diag_codes,
                    start_time=start,
                    end_time=end,
                )

                # Vitals for each encounter
                vitals = [
                    ("vital_sign", "8310-5", "Body Temperature", random.uniform(36.0, 38.5), "C"),
                    ("vital_sign", "8867-4", "Heart Rate", random.randint(60, 100), "bpm"),
                    ("vital_sign", "9279-1", "Respiratory Rate", random.randint(14, 22), "breaths/min"),
                    ("vital_sign", "29463-7", "Body Weight", random.uniform(45, 95), "kg"),
                ]
                for obs_type, code, name, val, unit in vitals:
                    Observation.objects.create(
                        encounter=enc,
                        observation_type=obs_type,
                        code=code,
                        display_name=name,
                        value_numeric=Decimal(str(round(val, 1))),
                        unit=unit,
                        status="final",
                        recorded_at=start,
                    )

                # 1-3 lab results per encounter
                for test_name, test_code, unit, low, high, is_binary in random.sample(LAB_TESTS, random.randint(1, 3)):
                    if is_binary:
                        val = random.choice([0, 1])
                        result_text = "Positive" if val == 1 else "Negative"
                        abnormal = val == 1
                    else:
                        val = round(random.uniform(low * 0.7, high * 1.3), 1)
                        result_text = str(val)
                        abnormal = val < low or val > high

                    LabResult.objects.create(
                        encounter=enc,
                        test_name=test_name,
                        test_code=test_code,
                        result_value=result_text,
                        result_numeric=Decimal(str(val)) if not is_binary else None,
                        unit=unit,
                        reference_range=f"{low}-{high}" if not is_binary else "Negative",
                        is_abnormal=abnormal,
                        status="final",
                        recorded_at=start + timedelta(hours=1),
                        verified_by=random.choice(providers),
                    )

                # 1-2 medications per encounter
                for med_data in random.sample(MEDICATIONS_LIST, random.randint(1, 2)):
                    name, generic, dose, freq, route = med_data
                    duration = random.choice([5, 7, 14, 30, 90, 180])
                    Medication.objects.create(
                        encounter=enc,
                        name=name,
                        generic_name=generic,
                        dose=dose,
                        frequency=freq,
                        route=route,
                        duration_days=duration,
                        start_date=start.date(),
                        end_date=(start + timedelta(days=duration)).date(),
                    )

            # Generate a QR share token for a few patients
            if i < 5:
                ShareToken.generate(
                    patient=patient,
                    scope=["encounters", "lab_results", "medications"],
                    ttl_minutes=60,
                )

        # Print summary
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  DEMO DATA SEEDED SUCCESSFULLY"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(f"  Facilities:    {Facility.objects.count()}")
        self.stdout.write(f"  Patients:      {Patient.objects.count()}")
        self.stdout.write(f"  Providers:     {Provider.objects.count()}")
        self.stdout.write(f"  Encounters:    {Encounter.objects.count()}")
        self.stdout.write(f"  Observations:  {Observation.objects.count()}")
        self.stdout.write(f"  Lab Results:   {LabResult.objects.count()}")
        self.stdout.write(f"  Medications:   {Medication.objects.count()}")
        self.stdout.write(f"  QR Tokens:     {ShareToken.objects.count()}")
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("  Demo credentials:"))
        self.stdout.write(f"  Admin:     admin / admin1234")
        self.stdout.write(f"  Provider:  dr.mukasa / demo1234")
        self.stdout.write(f"  Patient:   (see database for usernames) / demo1234")
        self.stdout.write(self.style.SUCCESS("=" * 60))
