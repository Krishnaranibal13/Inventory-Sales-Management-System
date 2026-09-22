from src.product import ProductManager
from src.supplier import SupplierManager
from src.purchase import PurchaseManager
from src.sales import SalesManager


products = ProductManager()
suppliers = SupplierManager()
purchases = PurchaseManager()
sales = SalesManager()


def add_product():

    print("\n--- ADD PRODUCT ---")

    name = input("Name: ").strip()
    category = input("Category: ").strip()
    price = float(input("Price: "))
    quantity = int(input("Initial stock: "))
    reorder_level = int(input("Reorder level: "))

    supplier = input(
        "Supplier ID (Enter for none): "
    ).strip()

    supplier_id = int(supplier) if supplier else None

    product_id = products.add_product(
        name,
        category,
        price,
        quantity,
        reorder_level,
        supplier_id
    )

    print(f"\nProduct created. ID: {product_id}")


def view_products():

    result = products.get_all_products()

    print("\n" + "=" * 100)

    for p in result:

        print(
            f"ID: {p['product_id']} | "
            f"{p['name']} | "
            f"{p['category']} | "
            f"₹{p['price']} | "
            f"Stock: {p['quantity']} | "
            f"Supplier: {p['supplier'] or 'N/A'}"
        )

    print("=" * 100)


def search_product():

    keyword = input("\nSearch: ")

    result = products.search_product(keyword)

    for p in result:

        print(
            f"{p['product_id']} | "
            f"{p['name']} | "
            f"{p['category']} | "
            f"₹{p['price']} | "
            f"Stock: {p['quantity']}"
        )


def update_product():

    print("\n--- UPDATE PRODUCT ---")

    product_id = int(input("Product ID: "))

    name = input("New name: ").strip()
    category = input("New category: ").strip()
    price = float(input("New price: "))
    reorder_level = int(input("New reorder level: "))

    result = products.update_product(
        product_id,
        name,
        category,
        price,
        reorder_level
    )

    if result is not None:
        print("\nProduct updated successfully.")



def delete_product():

    print("\n--- DELETE PRODUCT ---")

    product_id = int(input("Product ID: "))

    confirm = input(
        "Are you sure? (yes/no): "
    ).strip().lower()

    if confirm != "yes":
        print("Delete cancelled.")
        return

    result = products.delete_product(product_id)

    if result is not None:
        print("\nProduct deleted successfully.")


def add_supplier():

    print("\n--- ADD SUPPLIER ---")

    name = input("Contact Name: ")
    company = input("Company: ")
    phone = input("Phone: ")
    email = input("Email: ")

    supplier_id = suppliers.add_supplier(
        name,
        company,
        phone,
        email
    )

    print(f"\nSupplier created. ID: {supplier_id}")


def view_suppliers():

    result = suppliers.get_all_suppliers()

    print("\n--- SUPPLIERS ---")

    for s in result:

        print(
            f"ID: {s['supplier_id']} | "
            f"{s['name']} | "
            f"{s['company']} | "
            f"{s['phone']} | "
            f"{s['email']}"
        )


def create_purchase():

    print("\n--- PURCHASE STOCK ---")

    supplier_id = int(
        input("Supplier ID: ")
    )

    items = []

    while True:

        product_id = input(
            "Product ID (Enter to finish): "
        ).strip()

        if not product_id:
            break

        quantity = int(
            input("Quantity: ")
        )

        unit_cost = float(
            input("Unit Cost: ")
        )

        items.append({
            "product_id": int(product_id),
            "quantity": quantity,
            "unit_cost": unit_cost
        })

    if not items:
        print("No items added.")
        return

    purchase_id = purchases.create_purchase(
        supplier_id,
        items
    )

    print(
        f"\nPurchase created. ID: {purchase_id}"
    )



def view_purchases():

    result = purchases.get_purchases()

    print("\n--- PURCHASE HISTORY ---")

    if not result:
        print("No purchases found.")
        return

    for purchase in result:
        print(
            f"ID: {purchase['purchase_id']} | "
            f"Supplier: {purchase['supplier']} | "
            f"Amount: ₹{purchase['total_amount']} | "
            f"Date: {purchase['purchase_date']}"
        )



def create_sale():

    print("\n--- AVAILABLE PRODUCTS ---")

    products_list = products.get_all_products()

    if not products_list:
        print("No products available.")
        return

    for product in products_list:
        print(
            f"ID: {product['product_id']} | "
            f"{product['name']} | "
            f"Price: ₹{product['price']} | "
            f"Stock: {product['quantity']}"
        )

    customer_name = input(
        "\nCustomer Name: "
    ).strip()

    items = []

    while True:

        try:
            product_id = int(
                input("Product ID: ")
            )

            quantity = int(
                input("Quantity: ")
            )

            if quantity <= 0:
                print("Quantity must be greater than 0.")
                continue

            items.append({
                "product_id": product_id,
                "quantity": quantity
            })

            more = input(
                "Add another product? (y/n): "
            ).strip().lower()

            if more != "y":
                break

        except ValueError:
            print("Invalid input. Please enter numbers.")

    sale_id = sales.create_sale(
        customer_name,
        items
    )

    if sale_id:
        print(
            f"\nSale created successfully! "
            f"Sale ID: {sale_id}"
        )
    else:
        print("\nSale failed.")


def view_sales():

    result = sales.get_sales()

    print("\n--- SALES HISTORY ---")

    if not result:
        print("No sales found.")
        return

    for sale in result:
        print(
            f"ID: {sale['sale_id']} | "
            f"Customer: {sale['customer_name']} | "
            f"Amount: ₹{sale['total_amount']} | "
            f"Date: {sale['sale_date']}"
        )


def view_sale_details():

    try:
        sale_id = int(
            input("\nEnter Sale ID: ")
        )

        result = sales.get_sale_details(sale_id)

        print("\n--- SALE DETAILS ---")

        if not result:
            print("Sale not found.")
            return

        first = result[0]

        print(f"Sale ID: {first['sale_id']}")
        print(f"Customer: {first['customer_name']}")
        print(f"Date: {first['sale_date']}")

        print("\nItems:")

        total = 0

        for item in result:

            print(
                f"Product: {item['product_name']} | "
                f"Qty: {item['quantity']} | "
                f"Price: ₹{item['unit_price']} | "
                f"Subtotal: ₹{item['subtotal']}"
            )

            total += item["subtotal"]

        print(f"\nTotal Amount: ₹{total}")

    except ValueError:
        print("Invalid Sale ID.")



def low_stock():

    result = products.get_low_stock_products()

    print("\n--- LOW STOCK ---")

    if not result:
        print("No low-stock products.")
        return

    for p in result:

        print(
            f"{p['product_id']} | "
            f"{p['name']} | "
            f"Stock: {p['quantity']} | "
            f"Reorder: {p['reorder_level']}"
        )


def sales_report():

    result = sales.sales_report()

    print("\n--- SALES REPORT ---")

    for row in result:

        print(
            f"{row['date']} | "
            f"Orders: {row['orders']} | "
            f"Revenue: ₹{row['revenue']}"
        )


def main():

    while True:

        print("""
=========================================
   INVENTORY & SALES MANAGEMENT SYSTEM
=========================================

1. Add Product
2. View Products
3. Search Product
4. Update Product
5. Delete Product
6. Add Supplier
7. View Suppliers
8. Purchase Stock
9. Create Sale
10. Low Stock Report
11. Sales Report
12. Purchase History
13. Sales History
14. Sale Details
0. Exit

=========================================
""")

        choice = input("Choice: ")

        try:

            if choice == "1":
                add_product()

            elif choice == "2":
                view_products()

            elif choice == "3":
                search_product()

            elif choice == "4":
                update_product()

            elif choice == "5":
                delete_product()

            elif choice == "6":
                add_supplier()

            elif choice == "7":
                view_suppliers()

            elif choice == "8":
                create_purchase()

            elif choice == "9":
                create_sale()

            elif choice == "10":
                low_stock()

            elif choice == "11":
                sales_report()

            elif choice == "12":
                view_purchases()

            elif choice == "13":
                view_sales()

            elif choice == "14":
                view_sale_details()

            elif choice == "0":
                print("Goodbye!")
                break

            else:
                print("Invalid choice.")

        except (ValueError, TypeError) as error:

            print(f"\nInvalid input: {error}")


if __name__ == "__main__":
    main()