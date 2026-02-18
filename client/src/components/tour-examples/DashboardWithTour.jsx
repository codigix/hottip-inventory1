import React, { useEffect } from 'react';
import { useTour } from '@/hooks/useTour';
import { dashboardTourConfig } from '../tours/dashboardTour';
import StartTourButton from '../StartTourButton';

/**
 * Example Dashboard Component with Tour Integration
 * This shows how to integrate the tour system into your dashboard
 */
const DashboardWithTour = () => {
  const { startTour, isTourDone } = useTour();

  // Auto-start tour on first visit if not completed
  useEffect(() => {
    const shouldAutoStartTour = !isTourDone('dashboardTourDone');
    // Optional: Uncomment to auto-start on first visit
    // if (shouldAutoStartTour) {
    //   setTimeout(() => startTour(dashboardTourConfig, 'dashboardTourDone'), 1000);
    // }
  }, []);

  return (
    <div className="space-y-6">
      {/* Tour Button - Can be placed in header or wherever convenient */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <StartTourButton
          tourConfig={dashboardTourConfig}
          tourName="dashboardTourDone"
          className="flex-shrink-0"
        />
      </div>

      {/* Main Dashboard Content */}
      <div data-tour="dashboard-main" className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome to Your Dashboard</h2>
        <p className="text-gray-600">
          This is your central hub for managing all campus operations.
        </p>
      </div>

      {/* Navigation Bar Section */}
      <nav data-tour="navbar" className="bg-gray-100 rounded-lg p-4">
        <ul className="flex gap-4">
          <li><a href="#" className="text-blue-600 hover:underline">Inventory</a></li>
          <li><a href="#" className="text-blue-600 hover:underline">Sales</a></li>
          <li><a href="#" className="text-blue-600 hover:underline">Accounts</a></li>
          <li><a href="#" className="text-blue-600 hover:underline">Marketing</a></li>
          <li><a href="#" className="text-blue-600 hover:underline">Logistics</a></li>
        </ul>
      </nav>

      {/* Statistics Section */}
      <div data-tour="dashboard-stats" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-500">Total Orders</h3>
          <p className="text-3xl font-bold mt-2">1,234</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-500">Total Revenue</h3>
          <p className="text-3xl font-bold mt-2">$45,678</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-500">Active Users</h3>
          <p className="text-3xl font-bold mt-2">234</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-500">Pending Tasks</h3>
          <p className="text-3xl font-bold mt-2">56</p>
        </div>
      </div>

      {/* Charts Section */}
      <div data-tour="dashboard-charts" className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Sales Trend</h2>
        <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
          <p className="text-gray-500">[Chart Placeholder]</p>
        </div>
      </div>

      {/* Actions Section */}
      <div data-tour="dashboard-actions" className="flex gap-4">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Create New Order
        </button>
        <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          View Reports
        </button>
        <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
          Export Data
        </button>
      </div>
    </div>
  );
};

export default DashboardWithTour;
