"""Profile security fixture: the same email has separate CRM and visitor accounts."""
import json
import os
import uuid
from datetime import UTC, datetime, timedelta
from urllib.parse import urlparse

from app.api.core.security import get_password_hash
from app.api.core.visitor_passwords import hash_password
from app.api.core.visitor_sessions import create_session, lock_verified_account
from app.db import models  # noqa: F401
from app.db.models.business import Business
from app.db.models.client import Client
from app.db.models.service import Service
from app.db.models.user import User
from app.db.models.visit import Visit
from app.db.models.visitor_access import VisitorGrant
from app.db.models.visitor_account import VisitorAccount
from app.db.session import SessionLocal

url = urlparse(os.environ['DATABASE_URL'])
assert os.environ.get('E2E_PG_CONTAINER'), 'Use scripts/e2e.sh'
assert url.hostname in ('localhost', '127.0.0.1') and url.path == '/xtrix_e2e_test'

now = datetime.now(UTC).replace(tzinfo=None)
suffix = uuid.uuid4().hex
email = f'profile-{suffix}@example.com'
password = 'Ok!E2e-Visitor-58x'
with SessionLocal() as db:
    business = Business(name='Profile Salon', business_type='salon', currency='CZK', timezone='Europe/Prague')
    db.add(business)
    db.flush()
    # No CRM subscription: account security must remain available anyway.
    staff = User(full_name='Profile Owner', email=email, hashed_password=get_password_hash(password),
                 role='business_owner', business_id=business.id)
    db.add(staff)
    db.flush()
    client = Client(full_name='Synthetic Profile Client', contact_email=email, owner_id=staff.id)
    service = Service(name='Profile Cut', specialist_id=staff.id, business_id=business.id,
                      duration_minutes=30, price=500, is_active=True)
    account = VisitorAccount(email_canonical=email, email_verified_at=now, hashed_password=hash_password(password))
    other = VisitorAccount(email_canonical=f'profile-other-{suffix}@example.com', email_verified_at=now,
                           hashed_password=hash_password(password))
    db.add_all([client, service, account, other])
    db.flush()
    visit = Visit(client_id=client.id, specialist_id=staff.id, business_id=business.id, service_id=service.id,
                  date_start=now + timedelta(days=1), date_end=now + timedelta(days=1, minutes=30),
                  status='planned', service_name='Profile Cut', price=500, currency_snapshot='CZK')
    db.add(visit)
    db.flush()
    db.add(VisitorGrant(account_id=account.id, business_id=business.id, client_id=client.id, scope='client'))
    sessions = []
    for owner in [account, account, other]:
        session, token = create_session(db, lock_verified_account(db, owner.id))
        sessions.append({'token': token, 'expiresAt': session.expires_at.isoformat() + 'Z'})
        if len(sessions) == 1:
            session.created_at = now - timedelta(minutes=6)
    result = {'email': email, 'newEmail': f'profile-new-{suffix}@example.com', 'password': password,
              'accountId': account.id, 'staffId': staff.id, 'clientId': client.id, 'visitId': visit.id,
              'businessId': business.id, 'sessions': sessions}
    db.commit()
    print(json.dumps(result))
