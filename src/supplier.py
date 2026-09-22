from src.database import Database


class SupplierManager:
    def __init__(self):
        self.db = Database()

    def add_supplier(self, name, company=None, phone=None, email=None):
        query = """
            INSERT INTO suppliers (name, company, phone, email)
            VALUES (%s, %s, %s, %s)
        """
        return self.db.execute(
            query,
            (name, company, phone, email)
        )

    def get_all_suppliers(self):
        query = """
            SELECT
                s.supplier_id,
                s.name,
                s.company,
                s.phone,
                s.email,
                s.created_at,
                COUNT(DISTINCT p.product_id) AS product_count,
                (
                    SELECT COUNT(*)
                    FROM purchases pu
                    WHERE pu.supplier_id = s.supplier_id
                ) AS purchase_count
            FROM suppliers s
            LEFT JOIN products p
                ON p.supplier_id = s.supplier_id
            GROUP BY
                s.supplier_id,
                s.name,
                s.company,
                s.phone,
                s.email,
                s.created_at
            ORDER BY s.supplier_id DESC
        """
        return self.db.execute(query, fetch=True)

    def get_supplier(self, supplier_id):
        query = """
            SELECT
                s.supplier_id,
                s.name,
                s.company,
                s.phone,
                s.email,
                s.created_at,
                COUNT(DISTINCT p.product_id) AS product_count,
                (
                    SELECT COUNT(*)
                    FROM purchases pu
                    WHERE pu.supplier_id = s.supplier_id
                ) AS purchase_count
            FROM suppliers s
            LEFT JOIN products p
                ON p.supplier_id = s.supplier_id
            WHERE s.supplier_id = %s
            GROUP BY
                s.supplier_id,
                s.name,
                s.company,
                s.phone,
                s.email,
                s.created_at
        """
        result = self.db.execute(query, (supplier_id,), fetch=True)
        return result[0] if result else None

    def search_supplier(self, keyword):
        query = """
            SELECT
                s.supplier_id,
                s.name,
                s.company,
                s.phone,
                s.email,
                s.created_at,
                COUNT(DISTINCT p.product_id) AS product_count,
                (
                    SELECT COUNT(*)
                    FROM purchases pu
                    WHERE pu.supplier_id = s.supplier_id
                ) AS purchase_count
            FROM suppliers s
            LEFT JOIN products p
                ON p.supplier_id = s.supplier_id
            WHERE s.name LIKE %s
               OR s.company LIKE %s
               OR s.phone LIKE %s
               OR s.email LIKE %s
            GROUP BY
                s.supplier_id,
                s.name,
                s.company,
                s.phone,
                s.email,
                s.created_at
            ORDER BY s.name
        """
        pattern = f"%{keyword}%"
        return self.db.execute(
            query,
            (pattern, pattern, pattern, pattern),
            fetch=True
        )

    def update_supplier(self, supplier_id, name, company=None, phone=None, email=None):
        query = """
            UPDATE suppliers
            SET
                name = %s,
                company = %s,
                phone = %s,
                email = %s
            WHERE supplier_id = %s
        """
        return self.db.execute(
            query,
            (name, company, phone, email, supplier_id)
        )

    def delete_supplier(self, supplier_id):
        query = """
            DELETE FROM suppliers
            WHERE supplier_id = %s
        """
        return self.db.execute(query, (supplier_id,))
