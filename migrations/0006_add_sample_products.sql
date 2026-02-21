-- Add sample products for inventory management
INSERT INTO products (name, sku, description, category, price, "costPrice", stock, "lowStockThreshold", unit, "createdAt", "updatedAt")
VALUES
  ('Laptop', 'LAPTOP-001', 'High-performance laptop', 'Electronics', 75000, 55000, 50, 10, 'pcs', NOW(), NOW()),
  ('Office Chair', 'CHAIR-001', 'Ergonomic office chair', 'Furniture', 8000, 5000, 30, 5, 'pcs', NOW(), NOW()),
  ('Desk', 'DESK-001', 'Wooden office desk', 'Furniture', 15000, 9000, 20, 3, 'pcs', NOW(), NOW()),
  ('Monitor', 'MONITOR-001', '27 inch LED monitor', 'Electronics', 18000, 12000, 25, 5, 'pcs', NOW(), NOW()),
  ('Keyboard', 'KB-001', 'Mechanical keyboard', 'Accessories', 5000, 2500, 100, 20, 'pcs', NOW(), NOW())
ON CONFLICT (sku) DO NOTHING;
