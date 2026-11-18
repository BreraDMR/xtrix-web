"""Public visit details in a disposable database, including an expired salon."""
import json
import os
import uuid
from datetime import UTC, datetime, timedelta
from urllib.parse import urlparse

url = urlparse(os.environ['DATABASE_URL'])
assert os.environ.get('E2E_PG_CONTAINER'), 'Use scripts/e2e.sh'
assert url.hostname in ('localhost', '127.0.0.1') and url.path == '/xtrix_e2e_test'

from app.api.core.visitor_sessions import create_session, lock_verified_account
from app.db import models  # noqa: F401
from app.db.models.business import Business
from app.db.models.client import Client
from app.db.models.service import Service
from app.db.models.subscription import Subscription
from app.db.models.subscription_plan import SubscriptionPlan
from app.db.models.user import User
from app.db.models.visit import Visit
from app.db.models.visit_item import VisitItem
from app.db.models.visitor_access import VisitorGrant
from app.db.models.visitor_account import VisitorAccount
from app.db.session import SessionLocal

now = datetime.now(UTC).replace(tzinfo=None)
suffix = uuid.uuid4().hex
with SessionLocal() as db:
    account = VisitorAccount(email_canonical=f'detail-{suffix}@example.com', email_verified_at=now)
    plan = SubscriptionPlan(code=f'detail-{suffix}', name='Synthetic CRM', period_days=30, price=200)
    db.add_all([account, plan])
    db.flush()
    entries = []
    for state, zone in [('active', 'Europe/Prague'), ('expired', 'Pacific/Kiritimati'),
                        ('completed', 'Europe/Prague'), ('deleted', 'Europe/Prague')]:
        business = Business(name=f'Detail Salon {state}', business_type='salon', currency='CZK', timezone=zone,
                            address='Detail Street 12, Prague', phone='+420600111222', email='detail@example.com',
                            deleted_at=now if state == 'deleted' else None)
        db.add(business)
        db.flush()
        staff = User(full_name='Detail Master', email=f'detail-staff-{state}-{suffix}@example.com',
                     hashed_password='synthetic', role='business_owner', business_id=business.id)
        db.add(staff)
        db.flush()
        db.add(Subscription(user_id=staff.id, plan_id=plan.id, status='active',
                            current_period_end=now + timedelta(days=-10 if state == 'expired' else 90)))
        client = Client(full_name='PRIVATE VISITOR NAME', owner_id=staff.id)
        service = Service(name='Detail Haircut', specialist_id=staff.id, business_id=business.id,
                          duration_minutes=60, price=650, is_active=True)
        db.add_all([client, service])
        db.flush()
        start = datetime(2020, 1, 15, 9) if state == 'completed' else now.replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=40)
        visit = Visit(client_id=client.id, specialist_id=staff.id, business_id=business.id, service_id=service.id,
                      date_start=start, date_end=start + timedelta(minutes=90),
                      status='completed' if state == 'completed' else 'planned', service_name='Detail Haircut',
                      price=1050, currency_snapshot='CZK', client_confirmed_at=now - timedelta(days=1),
                      note='PRIVATE CRM NOTE')
        db.add(visit)
        db.flush()
        # Insert out of order so the API/UI must use the stored chain positions.
        for position, name, offset, duration, price in [(1, 'Detail Styling', 60, 30, None),
                                                        (0, 'Detail Haircut', 0, 60, 650)]:
            db.add(VisitItem(visit_id=visit.id, position=position, service_id=service.id,
                             specialist_id=staff.id, service_name=name, price=price, duration_minutes=duration,
                             date_start=start + timedelta(minutes=offset), date_end=start + timedelta(minutes=offset + duration)))
        db.add(VisitorGrant(account_id=account.id, business_id=business.id, client_id=client.id, scope='client'))
        entries.append({'id': visit.id, 'state': state, 'salon': business.name})
    session, token = create_session(db, lock_verified_account(db, account.id))
    result = {'session': {'token': token, 'expiresAt': session.expires_at.isoformat() + 'Z'}, 'entries': entries}
    db.commit()
    print(json.dumps(result))
