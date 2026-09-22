from src.database import Database
from mysql.connector import Error


class PurchaseManager:
    def __init__(self):
        self.db = Database()

    def create_purchase(self, supplier_id, items):
        connection = self.db.connect()

        if not connection:
            return False

        cursor = connection.cursor(dictionary=True)

        try:
            if not items:
                raise ValueError("At least one purchase item is required.")

            # Validate supplier first.
            cursor.execute(
                """
                SELECT supplier_id
                FROM suppliers
                WHERE supplier_id = %s
                """,
                (supplier_id,)
            )

            supplier = cursor.fetchone()

            if not supplier:
                raise ValueError("Supplier not found.")

            total_amount = 0
            validated_items = []

            for item in items:
                quantity = int(item["quantity"])
                unit_cost = float(item["unit_cost"])

                if quantity <= 0:
                    raise ValueError("Purchase quantity must be greater than 0.")

                if unit_cost < 0:
                    raise ValueError("Unit cost cannot be negative.")

                cursor.execute(
                    """
                    SELECT product_id, name
                    FROM products
                    WHERE product_id = %s
                    FOR UPDATE
                    """,
                    (item["product_id"],)
                )

                product = cursor.fetchone()

                if not product:
                    raise ValueError(
                        f"Product {item['product_id']} not found."
                    )

                subtotal = quantity * unit_cost
                total_amount += subtotal

                validated_items.append(
                    {
                        "product_id": product["product_id"],
                        "quantity": quantity,
                        "unit_cost": unit_cost,
                        "subtotal": subtotal,
                    }
                )

            cursor.execute(
                """
                INSERT INTO purchases
                (supplier_id, total_amount)
                VALUES (%s, %s)
                """,
                (supplier_id, total_amount)
            )

            purchase_id = cursor.lastrowid

            for item in validated_items:
                cursor.execute(
                    """
                    INSERT INTO purchase_items
                    (purchase_id, product_id, quantity, unit_cost, subtotal)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        purchase_id,
                        item["product_id"],
                        item["quantity"],
                        item["unit_cost"],
                        item["subtotal"],
                    )
                )

                cursor.execute(
                    """
                    UPDATE products
                    SET quantity = quantity + %s
                    WHERE product_id = %s
                    """,
                    (item["quantity"], item["product_id"])
                )

            connection.commit()
            return purchase_id

        except (Error, ValueError) as error:
            connection.rollback()
            print(f"Purchase failed: {error}")
            return False

        finally:
            cursor.close()
            connection.close()

    def get_purchases(self):
        query = """
            SELECT
                p.purchase_id,
                p.supplier_id,
                COALESCE(s.company, s.name) AS supplier,
                p.total_amount,
                p.purchase_date
            FROM purchases p
            JOIN suppliers s
                ON p.supplier_id = s.supplier_id
            ORDER BY p.purchase_date DESC
        """

        return self.db.execute(query, fetch=True)

    def get_purchase_details(self, purchase_id):
        query = """
            SELECT
                p.purchase_id,
                p.supplier_id,
                COALESCE(s.company, s.name) AS supplier,
                p.total_amount,
                p.purchase_date,
                pi.purchase_item_id,
                pi.product_id,
                pr.name AS product_name,
                pi.quantity,
                pi.unit_cost,
                pi.subtotal
            FROM purchases p
            JOIN suppliers s
                ON p.supplier_id = s.supplier_id
            JOIN purchase_items pi
                ON p.purchase_id = pi.purchase_id
            JOIN products pr
                ON pi.product_id = pr.product_id
            WHERE p.purchase_id = %s
            ORDER BY pi.purchase_item_id
        """

        rows = self.db.execute(query, (purchase_id,), fetch=True)

        if not rows:
            return None

        first = rows[0]

        return {
            "purchase_id": first["purchase_id"],
            "supplier_id": first["supplier_id"],
            "supplier": first["supplier"],
            "total_amount": first["total_amount"],
            "purchase_date": first["purchase_date"],
            "items": [
                {
                    "purchase_item_id": row["purchase_item_id"],
                    "product_id": row["product_id"],
                    "product_name": row["product_name"],
                    "quantity": row["quantity"],
                    "unit_cost": row["unit_cost"],
                    "subtotal": row["subtotal"],
                }
                for row in rows
            ],
        }
