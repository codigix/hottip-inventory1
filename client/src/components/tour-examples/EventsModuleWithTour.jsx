import React, { useState } from 'react';
import { useTour } from '@/hooks/useTour';
import { eventsTourConfig } from '../tours/eventsTour';
import StartTourButton from '../StartTourButton';

/**
 * Example Events Module Component with Tour Integration
 */
const EventsModuleWithTour = () => {
  const [filterCategory, setFilterCategory] = useState('all');
  const [events] = useState([
    { id: 1, title: 'Tech Summit 2024', date: '2024-02-15', location: 'Main Hall', category: 'conference' },
    { id: 2, title: 'Sports Day', date: '2024-02-20', location: 'Sports Complex', category: 'sports' },
  ]);

  return (
    <div className="space-y-6">
      {/* Header with Tour Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Events</h1>
        <StartTourButton
          tourConfig={eventsTourConfig}
          tourName="eventsTourDone"
        />
      </div>

      {/* Main Events Container */}
      <div data-tour="events-main" className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          {/* Calendar Section */}
          <div data-tour="events-calendar" className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Calendar View</h2>
            <div className="bg-gray-50 rounded p-4 h-64 flex items-center justify-center">
              <p className="text-gray-500">[Calendar Component Placeholder]</p>
            </div>
          </div>

          {/* Filters */}
          <div data-tour="events-filters" className="flex gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 mb-2 block">Filter by Category</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Events</option>
                <option value="conference">Conferences</option>
                <option value="sports">Sports</option>
                <option value="cultural">Cultural</option>
              </select>
            </label>
            <button
              data-tour="events-create-btn"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium mt-6"
            >
              + Create Event
            </button>
          </div>

          {/* Events List */}
          <div data-tour="events-list" className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">📅 {event.date}</p>
                    <p className="text-sm text-gray-600">📍 {event.location}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {event.category}
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsModuleWithTour;
