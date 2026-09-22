from src.database import Database
from mysql.connector import Error


class SalesManager:
    def __init__(self):
        self.db = Database()

    def create_sale(self, customer_name, items):
        connection = self.db.connect()

        if not connection:
            return False

        cursor = connection.cursor(dictionary=True)

        try:
            if not items:
                raise ValueError("At least one sale item is required.")

            total_amount = 0
            validated_items = []

            for item in items:
                quantity = int(item["quantity"])

                if quantity <= 0:
                    raise ValueError("Sale quantity must be greater than 0.")

                cursor.execute(
                    """
                    SELECT product_id, name, price, quantity
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

                if product["quantity"] < quantity:
                    raise ValueError(
                        f"Insufficient stock for {product['name']}. "
                        f"Available: {product['quantity']}."
                    )

                subtotal = product["price"] * quantity
                total_amount += subtotal

                validated_items.append(
                    {
                        "product_id": product["product_id"],
                        "quantity": quantity,
                        "unit_price": product["price"],
                        "subtotal": subtotal,
                    }
                )

            cursor.execute(
                """
                INSERT INTO sales
                (customer_name, total_amount)
                VALUES (%s, %s)
                """,
                (customer_name or None, total_amount)
            )

            sale_id = cursor.lastrowid

            for item in validated_items:
                cursor.execute(
                    """
                    INSERT INTO sale_items
                    (sale_id, product_id, quantity, unit_price, subtotal)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        sale_id,
                        item["product_id"],
                        item["quantity"],
                        item["unit_price"],
                        item["subtotal"],
                    )
                )

                cursor.execute(
                    """
                    UPDATE products
                    SET quantity = quantity - %s
                    WHERE product_id = %s
                    """,
                    (item["quantity"], item["product_id"])
                )

            connection.commit()
            return sale_id

        except (Error, ValueError) as error:
            connection.rollback()
            print(f"Sale failed: {error}")
            return False

        finally:
            cursor.close()
            connection.close()

    def get_sales(self):
        query = """
            SELECT
                sale_id,
                customer_name,
                total_amount,
                sale_date
            FROM sales
            ORDER BY sale_date DESC
        """

        return self.db.execute(query, fetch=True)

    def get_sale_details(self, sale_id):
        query = """
            SELECT
                s.sale_id,
                s.customer_name,
                s.total_amount,
                s.sale_date,
                si.sale_item_id,
                si.product_id,
                p.name AS product_name,
                si.quantity,
                si.unit_price,
                si.subtotal
            FROM sales s
            JOIN sale_items si
                ON s.sale_id = si.sale_id
            JOIN products p
                ON si.product_id = p.product_id
            WHERE s.sale_id = %s
            ORDER BY si.sale_item_id
        """

        rows = self.db.execute(query, (sale_id,), fetch=True)

        if not rows:
            return None

        first = rows[0]

        return {
            "sale_id": first["sale_id"],
            "customer_name": first["customer_name"],
            "total_amount": first["total_amount"],
            "sale_date": first["sale_date"],
            "items": [
                {
                    "sale_item_id": row["sale_item_id"],
                    "product_id": row["product_id"],
                    "product_name": row["product_name"],
                    "quantity": row["quantity"],
                    "unit_price": row["unit_price"],
                    "subtotal": row["subtotal"],
                }
                for row in rows
            ],
        }

    def sales_report(self):
        query = """
            SELECT
                DATE(sale_date) AS date,
                COUNT(*) AS orders,
                SUM(total_amount) AS revenue
            FROM sales
            GROUP BY DATE(sale_date)
            ORDER BY date DESC
        """

        return self.db.execute(query, fetch=True)
