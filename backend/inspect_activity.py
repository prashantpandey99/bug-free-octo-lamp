"""
Legal Metrology Database Inspector Utility
Quickly view newly registered users and all system operations/audit logs.
Run in terminal:
    python backend/inspect_activity.py
"""

import sqlite3
import os
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "legal_metrology.db")

def print_header(title):
    print("\n" + "=" * 90)
    print(f"  {title.upper()}")
    print("=" * 90)

def inspect_users(limit=10):
    print_header(f"Newly Registered Users (Last {limit})")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, email, role, organization, status, created_at
        FROM users
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        print("  No users found in database.")
        return

    print(f"{'ID':<5} {'Name':<22} {'Email':<32} {'Role':<12} {'Created At'}")
    print("-" * 90)
    for r in rows:
        uid, name, email, role, org, status, created = r
        clean_created = str(created)[:19] if created else "N/A"
        print(f"#{uid:<4} {name[:20]:<22} {email[:30]:<32} {role:<12} {clean_created}")

def inspect_operations(limit=15):
    print_header(f"Recent Operations & Audit Trail (Last {limit})")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, timestamp, user_email, action, entity, details
        FROM audit_logs
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        print("  No audit operations recorded yet.")
        return

    print(f"{'Timestamp':<20} {'User':<28} {'Action':<22} {'Details'}")
    print("-" * 90)
    for r in rows:
        lid, ts, email, action, entity, details = r
        clean_ts = str(ts)[:19] if ts else "N/A"
        clean_email = (email or "Anonymous")[:26]
        clean_action = (action or "N/A")[:20]
        clean_details = (details or "")[:35]
        print(f"{clean_ts:<20} {clean_email:<28} {clean_action:<22} {clean_details}")

if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print(f"Database not found at: {DB_PATH}")
        sys.exit(1)
    
    inspect_users(10)
    inspect_operations(15)
    print("\n" + "=" * 90)
    print("  Tip: You can also view this visually in the Web App under the 'Admin Command' portal.")
    print("=" * 90 + "\n")
