import sqlite3

conn = sqlite3.connect("legal_metrology.db")
cursor = conn.cursor()
tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;").fetchall()
print("=== DATABASE TABLES & ROW COUNTS ===")
for t in tables:
    tname = t[0]
    if tname.startswith("sqlite_"):
        continue
    count = cursor.execute(f"SELECT COUNT(*) FROM `{tname}`;").fetchone()[0]
    print(f"Table: {tname:<20} | Rows: {count}")

print("\n=== SAMPLE PRODUCTS IN DATABASE ===")
for row in cursor.execute("SELECT id, product_name, brand, net_quantity, unit, mrp FROM products LIMIT 5;").fetchall():
    print(f"ID #{row[0]}: {row[1]} ({row[2]}) - {row[3]} {row[4]} @ Rs. {row[5]}")

print("\n=== SAMPLE STATUTORY RULES IN DATABASE ===")
for row in cursor.execute("SELECT rule_code, rule_name, severity, active FROM compliance_rules LIMIT 5;").fetchall():
    print(f"Rule {row[0]}: {row[1]} [{row[2]}] (Active: {row[3]})")

print("\n=== SAMPLE USERS ===")
for row in cursor.execute("SELECT id, name, email, role, status FROM users;").fetchall():
    print(f"User #{row[0]}: {row[1]} <{row[2]}> - Role: {row[3]} ({row[4]})")

conn.close()
