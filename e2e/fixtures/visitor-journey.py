"""Two salons that already know one person by email, only in the disposable E2E database.

Salon A takes online bookings. Salon B is fine for now - the test makes it stop paying
later, after the visitor is linked. The visitor account itself is NOT created here:
the test registers it through the real signup mail.
"""
import json
import os
import uuid
from datetime import UTC, datetime, time, timedelta
from urllib.parse import urlparse

url = urlparse(os.environ['DATABASE_URL'])
assert os.environ.get('E2E_PG_CONTAINER'), 'Use scripts/e2e.sh'
assert url.hostname in ('localhost', '127.0.0.1') and url.path == '/xtrix_e2e_test'

from app.api.core.security import get_password_hash
from app.api.crud.crud_public_booking import ensure_client_relations
from app.db import models  # noqa: F401
from app.db.models.business import Business
from app.db.models.client import Client
from app.db.models.public_booking import PublicBookingSettings
from app.db.models.service import Service
from app.db.models.subscription import Subscription
from app.db.models.subscription_plan import SubscriptionPlan
from app.db.models.user import User
from app.db.models.visit import Visit
from app.db.models.work_schedule import WorkSchedule
from app.db.session import SessionLocal

now = datetime.now(UTC).replace(tzinfo=None)
suffix = uuid.uuid4().hex
crm_password = 'Ok!E2e-Owner-58x'
visitor_email = f'journey-{suffix}@example.com'
with SessionLocal() as db:
    plan = SubscriptionPlan(code=f'journey-{suffix}', name='Synthetic CRM', period_days=30, price=200)
    db.add(plan)
    db.flush()
    salons = []
    for key, name, currency, zone in [('a', 'Journey Salon A', 'CZK', 'Europe/Prague'),
                                      ('b', 'Journey Salon B', 'EUR', 'Europe/Vienna')]:
        business = Business(name=f'{name} {suffix[:6]}', business_type='salon', currency=currency, timezone=zone,
                            address=f'{key.upper()} Street 1')
        db.add(business)
        db.flush()
        owner = User(full_name=f'Journey Owner {key.upper()}', email=f'journey-owner-{key}-{suffix}@example.com',
                     hashed_password=get_password_hash(crm_password), role='business_owner', business_id=business.id)
        db.add(owner)
        db.flush()
        db.add(Subscription(user_id=owner.id, plan_id=plan.id, status='active', current_period_end=now + timedelta(days=90)))
        # the same person as the salon typed them in, the visitor signs up with this email later
        client = Client(full_name='Journey Visitor', owner_id=owner.id, contact_email=visitor_email, language='en')
        db.add(client)
        db.flush()
        ensure_client_relations(db, client.id, business.id, owner.id)
        visits = {}
        for kind, start, status in [('upcoming', now + timedelta(days=5 if key == 'a' else 6), 'planned'),
                                    ('past', datetime(2024, 3, 1, 9) + timedelta(days=0 if key == 'a' else 1), 'completed')]:
            visit = Visit(client_id=client.id, specialist_id=owner.id, business_id=business.id,
                          date_start=start.replace(second=0, microsecond=0),
                          date_end=start.replace(second=0, microsecond=0) + timedelta(minutes=45),
                          status=status, service_name=f'Journey {key.upper()} {kind}', price=500,
                          currency_snapshot=currency)
            db.add(visit)
            db.flush()
            visits[kind] = visit.id
        salon = {'key': key, 'businessId': business.id, 'name': business.name, 'ownerId': owner.id,
                 'ownerEmail': owner.email, 'clientId': client.id, 'visits': visits}
        if key == 'a':
            service = Service(name='Journey Cut', specialist_id=owner.id, business_id=business.id,
                              duration_minutes=30, price=500, is_active=True)
            db.add(service)
            slug = f'journey-{suffix}'
            db.add(PublicBookingSettings(business_id=business.id, slug=slug, is_enabled=True))
            for weekday in range(7):
                db.add(WorkSchedule(specialist_id=owner.id, weekday=weekday, start_time=time(8), end_time=time(20)))
            salon['slug'] = slug
        salons.append(salon)
    db.commit()
    print(json.dumps({'email': visitor_email, 'crmPassword': crm_password, 'salons': salons}))
