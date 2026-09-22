from src.database import Database


class ProductManager:

    def __init__(self):
        self.db = Database()

    def add_product(
        self,
        name,
        category,
        price,
        quantity,
        reorder_level,
        supplier_id=None
    ):
        query = """
            INSERT INTO products
            (
                name,
                category,
                price,
                quantity,
                reorder_level,
                supplier_id
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """

        return self.db.execute(
            query,
            (
                name,
                category,
                price,
                quantity,
                reorder_level,
                supplier_id
            )
        )

    def get_all_products(self):
        query = """
            SELECT
                p.product_id,
                p.name,
                p.category,
                p.price,
                p.quantity,
                p.reorder_level,
                s.name AS supplier
            FROM products p
            LEFT JOIN suppliers s
                ON p.supplier_id = s.supplier_id
            ORDER BY p.product_id DESC
        """

        return self.db.execute(query, fetch=True)

    def search_product(self, keyword):
        query = """
            SELECT
                p.product_id,
                p.name,
                p.category,
                p.price,
                p.quantity,
                p.reorder_level,
                s.name AS supplier
            FROM products p
            LEFT JOIN suppliers s
                ON p.supplier_id = s.supplier_id
            WHERE p.name LIKE %s
               OR p.category LIKE %s
            ORDER BY p.name
        """

        pattern = f"%{keyword}%"

        return self.db.execute(
            query,
            (pattern, pattern),
            fetch=True
        )

    def update_product(
        self,
        product_id,
        name,
        category,
        price,
        reorder_level
    ):
        query = """
            UPDATE products
            SET
                name = %s,
                category = %s,
                price = %s,
                reorder_level = %s
            WHERE product_id = %s
        """

        return self.db.execute(
            query,
            (
                name,
                category,
                price,
                reorder_level,
                product_id
            )
        )

    def delete_product(self, product_id):
        query = """
            DELETE FROM products
            WHERE product_id = %s
        """

        return self.db.execute(
            query,
            (product_id,)
        )

    def get_low_stock_products(self):
        query = """
            SELECT
                product_id,
                name,
                category,
                quantity,
                reorder_level
            FROM products
            WHERE quantity <= reorder_level
            ORDER BY quantity ASC
        """

        return self.db.execute(
            query,
            fetch=True
        )