import os
os.chdir('d:\\hottip-inventory1\\client\\src\\components\\tours')

content = open('dashboardTour.js', 'r', encoding='utf-8').read()

# Find critical section boundaries
admin_end = content.find('export const adminReportsTour = {')
admin_end = content.find('};', admin_end) + 2

inv_tour_start = content.find('export const inventoryTour = {')
inv_tour_end = content.find('// Inventory Subcomponent Tours', inv_tour_start)

inv_subtours_start = content.find('// Inventory Subcomponent Tours')
sales_start = content.find('// Sales Subcomponent Tours')

print(f"Admin reports end at: {admin_end}")
print(f"Inventory tour start at: {inv_tour_start}")
print(f"Inventory subtours start at: {inv_subtours_start}")
print(f"Sales start at: {sales_start}")

# Split into parts
before_inv_tour = content[:inv_tour_start]
inv_tour = content[inv_tour_start:inv_tour_end]
inv_subtours = content[inv_subtours_start:sales_start]
after = content[sales_start:]

# Reconstruct with subtours before main tour
new_content = before_inv_tour + inv_subtours + '\n' + inv_tour + after

# Save the file
with open('dashboardTour.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('File reorganized successfully')
