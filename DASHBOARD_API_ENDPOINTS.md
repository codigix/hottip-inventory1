# Dashboard API Endpoints

This document describes all the backend API endpoints available for the admin dashboard.

## Overview Endpoints

### 1. **GET /api/admin/overview**

Returns entity counts for all modules in the system.

**Response:**

```json
{
  "users": 12,
  "leads": 5,
  "products": 20,
  "suppliers": 4,
  "customers": 2,
  "marketingTasks": 15,
  "logisticsTasks": 8,
  "invoices": 10,
  "shipments": 6,
  "fieldVisits": 25,
  "spareParts": 30,
  "fabricationOrders": 7,
  "inventoryTasks": 12,
  "outboundQuotations": 8,
  "inboundQuotations": 6,
  "purchaseOrders": 5,
  "accountTasks": 9,
  "leaveRequests": 3,
  "receivables": 14,
  "payables": 10,
  "gstReturns": 4
}
```

---

### 2. **GET /api/admin/metrics**

Returns key performance indicators (KPIs) for the dashboard.

**Response:**

```json
{
  "totalInvoices": 10,
  "invoicesDue": 3,
  "totalShipments": 6,
  "shipmentsInTransit": 2,
  "stockAlerts": 5,
  "overdueTasks": 4,
  "totalReceivables": 50000.0,
  "totalPayables": 30000.0
}
```

---

### 3. **GET /api/admin/dashboard/module-summary**

Returns grouped entity counts by business module.

**Response:**

```json
{
  "usersAndContacts": {
    "total": 23,
    "breakdown": {
      "users": 12,
      "customers": 2,
      "suppliers": 4,
      "leads": 5
    }
  },
  "marketing": {
    "total": 40,
    "breakdown": {
      "fieldVisits": 25,
      "tasks": 15
    }
  },
  "sales": {
    "total": 29,
    "breakdown": {
      "invoices": 10,
      "outboundQuotations": 8,
      "inboundQuotations": 6,
      "purchaseOrders": 5
    }
  },
  "accounts": {
    "total": 37,
    "breakdown": {
      "receivables": 14,
      "payables": 10,
      "gstReturns": 4,
      "accountTasks": 9
    }
  },
  "logistics": {
    "total": 17,
    "breakdown": {
      "shipments": 6,
      "tasks": 8,
      "leaveRequests": 3
    }
  },
  "inventory": {
    "total": 69,
    "breakdown": {
      "products": 20,
      "spareParts": 30,
      "fabricationOrders": 7,
      "inventoryTasks": 12
    }
  }
}
```

---

## Chart Data Endpoints

### 4. **GET /api/admin/dashboard/users-chart**

Returns chart data for Users & Contacts module.

**Response:**

```json
{
  "labels": ["Users", "Customers", "Suppliers", "Leads"],
  "series": [12, 2, 4, 5],
  "colors": ["#1E3A8A", "#2563EB", "#3B82F6", "#60A5FA"]
}
```

**Usage:** Pie or Donut chart

---

### 5. **GET /api/admin/dashboard/marketing-chart**

Returns chart data for Marketing module.

**Response:**

```json
{
  "labels": ["Field Visits", "Marketing Tasks", "Leads"],
  "series": [25, 15, 5],
  "colors": ["#F59E0B", "#FBBF24", "#FCD34D"]
}
```

**Usage:** Bar or Pie chart

---

### 6. **GET /api/admin/dashboard/sales-chart**

Returns chart data for Sales module.

**Response:**

```json
{
  "labels": [
    "Invoices",
    "Outbound Quotes",
    "Inbound Quotes",
    "Purchase Orders"
  ],
  "series": [10, 8, 6, 5],
  "colors": ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0"]
}
```

**Usage:** Bar or Donut chart

---

### 7. **GET /api/admin/dashboard/accounts-chart**

Returns chart data for Accounts module.

**Response:**

```json
{
  "labels": ["Receivables", "Payables", "GST Returns"],
  "series": [14, 10, 4],
  "colors": ["#8B5CF6", "#A78BFA", "#C4B5FD"]
}
```

**Usage:** Donut or Pie chart

---

### 8. **GET /api/admin/dashboard/logistics-chart**

Returns chart data for Logistics module.

**Response:**

```json
{
  "labels": ["Shipments", "Logistics Tasks", "Leave Requests"],
  "series": [6, 8, 3],
  "colors": ["#EF4444", "#F87171", "#FCA5A5"]
}
```

**Usage:** Bar or Pie chart

---

### 9. **GET /api/admin/dashboard/inventory-chart**

Returns chart data for Inventory module.

**Response:**

```json
{
  "labels": [
    "Products",
    "Spare Parts",
    "Fabrication Orders",
    "Inventory Tasks"
  ],
  "series": [20, 30, 7, 12],
  "colors": ["#06B6D4", "#22D3EE", "#67E8F9", "#A5F3FC"]
}
```

**Usage:** Bar or Donut chart

---

## Activity & Time Series Endpoints

### 10. **GET /api/admin/dashboard/recent-activity**

Returns recent activities across all modules.

**Query Parameters:**

- `limit` (optional): Number of activities to return (default: 20)

**Response:**

```json
[
  {
    "id": "uuid",
    "type": "marketing_task",
    "title": "Follow up with client",
    "status": "pending",
    "createdAt": "2025-01-15T10:30:00Z",
    "assignedTo": "user-uuid"
  },
  {
    "id": "uuid",
    "type": "field_visit",
    "title": "Visit to Mumbai",
    "status": "completed",
    "createdAt": "2025-01-15T09:15:00Z",
    "assignedTo": "user-uuid"
  },
  {
    "id": "uuid",
    "type": "shipment",
    "title": "Shipment: CN12345",
    "status": "in_transit",
    "createdAt": "2025-01-15T08:00:00Z",
    "assignedTo": null
  }
]
```

**Activity Types:**

- `marketing_task`
- `logistics_task`
- `inventory_task`
- `field_visit`
- `shipment`

---

### 11. **GET /api/admin/dashboard/time-series**

Returns time series data for activity trends over specified period.

**Query Parameters:**

- `days` (optional): Number of days to include (default: 30)

**Response:**

```json
{
  "labels": ["2024-12-15", "2024-12-16", "...", "2025-01-15"],
  "datasets": [
    {
      "label": "Marketing Tasks",
      "data": [5, 3, 7, 2, ...],
      "color": "#F59E0B"
    },
    {
      "label": "Field Visits",
      "data": [2, 4, 1, 3, ...],
      "color": "#10B981"
    },
    {
      "label": "Shipments",
      "data": [1, 2, 0, 1, ...],
      "color": "#EF4444"
    }
  ]
}
```

**Usage:** Line chart for trends

---

### 12. **GET /api/admin/dashboard/status-breakdown**

Returns aggregated task status counts across all modules.

**Response:**

```json
[
  {
    "status": "pending",
    "count": 15
  },
  {
    "status": "in_progress",
    "count": 8
  },
  {
    "status": "completed",
    "count": 42
  },
  {
    "status": "cancelled",
    "count": 2
  }
]
```

**Usage:** Pie or Donut chart for status distribution

---

## Frontend Implementation Recommendations

### Charting Library

I recommend **Recharts** for your React frontend because:

- Native React components (no wrapper needed)
- Composable and declarative
- Good documentation
- Supports responsive charts
- Works well with TypeScript

**Installation:**

```bash
npm install recharts
```

### Example Usage with Recharts

```tsx
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

function UsersChart() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/admin/dashboard/users-chart")
      .then((res) => res.json())
      .then((chartData) => {
        // Transform to Recharts format
        const transformed = chartData.labels.map((label, i) => ({
          name: label,
          value: chartData.series[i],
          color: chartData.colors[i],
        }));
        setData(transformed);
      });
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### Count-up Animation

For animated counters, use **react-countup**:

```bash
npm install react-countup
```

```tsx
import CountUp from "react-countup";

function MetricCard({ label, value, icon }) {
  return (
    <div className="metric-card">
      <div className="icon">{icon}</div>
      <div className="value">
        <CountUp end={value} duration={1.5} />
      </div>
      <div className="label">{label}</div>
    </div>
  );
}
```

---

## Color Scheme by Module

- **Users & Contacts:** Blue shades (#1E3A8A, #2563EB, #3B82F6, #60A5FA)
- **Marketing:** Yellow/Orange shades (#F59E0B, #FBBF24, #FCD34D)
- **Sales:** Green shades (#10B981, #34D399, #6EE7B7, #A7F3D0)
- **Accounts:** Purple/Indigo shades (#8B5CF6, #A78BFA, #C4B5FD)
- **Logistics:** Red shades (#EF4444, #F87171, #FCA5A5)
- **Inventory:** Cyan shades (#06B6D4, #22D3EE, #67E8F9, #A5F3FC)

---

## Testing the Endpoints

Start your backend server:

```bash
node server/index.ts
```

Test an endpoint:

```bash
curl http://localhost:5000/api/admin/overview
```

Or use your browser's developer tools to test from the frontend.

---

## Next Steps

1. Install Recharts and react-countup in your frontend
2. Create dashboard page component
3. Fetch data from these endpoints
4. Render charts using Recharts
5. Add animated count-up for metric cards
6. Implement responsive design with Tailwind CSS
7. Add loading states and error handling

Happy coding! 🚀
