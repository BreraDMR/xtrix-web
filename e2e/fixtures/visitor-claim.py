"""Bookable salon and two independent visitors, only in the disposable E2E database."""
import json
import os
import uuid
from datetime import UTC, datetime, time, timedelta
from urllib.parse import urlparse

from app.api.core.visitor_passwords import hash_password
from app.api.core.visitor_sessions import create_session, lock_verified_account
from app.db import models  # noqa: F401
from app.db.models.business import Business
from app.db.models.public_booking import PublicBookingSettings
from app.db.models.service import Service
from app.db.models.subscription import Subscription
from app.db.models.subscription_plan import SubscriptionPlan
from app.db.models.user import User
from app.db.models.visitor_account import VisitorAccount
from app.db.models.work_schedule import WorkSchedule
from app.db.session import SessionLocal

url = urlparse(os.environ['DATABASE_URL'])
assert os.environ.get('E2E_PG_CONTAINER'), 'Use scripts/e2e.sh'
assert url.hostname in ('localhost', '127.0.0.1') and url.path == '/xtrix_e2e_test'

now = datetime.now(UTC).replace(tzinfo=None)
suffix = uuid.uuid4().hex
password = 'Ok!E2e-Visitor-58x'
with SessionLocal() as db:
    business = Business(name='Guest Claim Salon', business_type='salon', currency='CZK', timezone='Europe/Prague')
    plan = SubscriptionPlan(code=f'claim-{suffix}', name='Synthetic CRM', period_days=30, price=200)
    db.add_all([business, plan])
    db.flush()
    staff = User(full_name='Claim Master', email=f'claim-staff-{suffix}@example.com',
                 hashed_password='synthetic', role='business_owner', business_id=business.id)
    db.add(staff)
    db.flush()
    db.add(Subscription(user_id=staff.id, plan_id=plan.id, status='active', current_period_end=now + timedelta(days=90)))
    service = Service(name='Guest Claim Cut', specialist_id=staff.id, business_id=business.id,
                      duration_minutes=30, price=500, is_active=True)
    db.add(service)
    slug = f'claim-{suffix}'
    db.add(PublicBookingSettings(business_id=business.id, slug=slug, is_enabled=True))
    for weekday in range(7):
        db.add(WorkSchedule(specialist_id=staff.id, weekday=weekday, start_time=time(8), end_time=time(20)))
    accounts = []
    for kind in ['owner', 'other']:
        account = VisitorAccount(email_canonical=f'claim-{kind}-{suffix}@example.com', email_verified_at=now,
                                 hashed_password=hash_password(password))
        db.add(account)
        db.flush()
        session, token = create_session(db, lock_verified_account(db, account.id))
        accounts.append({'email': account.email_canonical, 'password': password,
                         'session': {'token': token, 'expiresAt': session.expires_at.isoformat() + 'Z'}})
    db.flush()
    result = {'slug': slug, 'businessId': business.id, 'accounts': accounts}
    db.commit()
    print(json.dumps(result))
