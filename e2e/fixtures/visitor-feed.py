"""Synthetic history for browser tests, confined to the runner's disposable database."""
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
from app.db.models.user import User
from app.db.models.visit import Visit
from app.db.models.visitor_access import VisitorGrant
from app.db.models.visitor_account import VisitorAccount
from app.db.session import SessionLocal

now = datetime.now(UTC).replace(tzinfo=None)
suffix = uuid.uuid4().hex
with SessionLocal() as db:
    account = VisitorAccount(email_canonical=f'feed-{suffix}@example.com', email_verified_at=now)
    empty = VisitorAccount(email_canonical=f'empty-{suffix}@example.com', email_verified_at=now)
    db.add_all([account, empty])
    db.flush()
    salons = []
    for index, (currency, zone) in enumerate([('CZK', 'Europe/Prague'), ('EUR', 'Pacific/Kiritimati')]):
        business = Business(name=f'Feed Salon {index + 1}', business_type='salon', currency=currency, timezone=zone)
        db.add(business)
        db.flush()
        staff = User(full_name='Feed Master', email=f'feed-staff-{index}-{suffix}@example.com',
                     hashed_password='synthetic', role='business_owner', business_id=business.id)
        db.add(staff)
        db.flush()
        client = Client(full_name='Feed Visitor', owner_id=staff.id)
        db.add(client)
        db.flush()
        db.add(VisitorGrant(account_id=account.id, business_id=business.id, client_id=client.id, scope='client'))
        salons.append((business, staff, client))
    entries = []
    for category, count in [('upcoming', 30), ('past', 28), ('cancelled', 2)]:
        for index in range(count):
            business, staff, client = salons[index % 2]
            # Equal starts exercise the ID tie-breaker across page boundaries.
            start = now + timedelta(days=40 + index // 2) if category != 'past' else datetime(2020, 1, 1) + timedelta(days=index // 2)
            visit = Visit(client_id=client.id, specialist_id=staff.id, business_id=business.id,
                          date_start=start, date_end=start + timedelta(minutes=45),
                          status={'upcoming': 'planned', 'past': 'completed', 'cancelled': 'cancelled'}[category],
                          service_name=f'Feed {category} {index + 1}', price=650.5 if index % 2 == 0 else 28,
                          currency_snapshot=business.currency)
            db.add(visit)
            db.flush()
            entries.append({'id': visit.id, 'business_id': business.id, 'category': category})
    session, token = create_session(db, lock_verified_account(db, account.id))
    empty_session, empty_token = create_session(db, lock_verified_account(db, empty.id))
    result = {'session': {'token': token, 'expiresAt': session.expires_at.isoformat() + 'Z'},
              'emptySession': {'token': empty_token, 'expiresAt': empty_session.expires_at.isoformat() + 'Z'},
              'salons': [{'id': b.id, 'name': b.name} for b, _, _ in salons], 'entries': entries}
    db.commit()
    print(json.dumps(result))
