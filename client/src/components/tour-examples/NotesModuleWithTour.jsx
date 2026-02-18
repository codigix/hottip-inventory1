import React, { useState } from 'react';
import { useTour } from '@/hooks/useTour';
import { notesTourConfig } from '../tours/notesTour';
import StartTourButton from '../StartTourButton';

/**
 * Example Notes Module Component with Tour Integration
 */
const NotesModuleWithTour = () => {
  const [notes, setNotes] = useState([
    { id: 1, title: 'Project Kickoff', createdAt: '2024-01-15', updatedAt: '2024-01-16' },
    { id: 2, title: 'Team Meeting Notes', createdAt: '2024-01-14', updatedAt: '2024-01-15' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Header with Tour Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notes</h1>
        <StartTourButton
          tourConfig={notesTourConfig}
          tourName="notesTourDone"
        />
      </div>

      {/* Main Notes Container */}
      <div data-tour="notes-main" className="bg-white rounded-lg shadow">
        <div className="p-6">
          {/* Search Bar */}
          <div data-tour="notes-search" className="mb-6">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Create Note Button */}
          <div className="mb-6">
            <button
              data-tour="notes-create-btn"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              + Create New Note
            </button>
          </div>

          {/* Notes List */}
          <div data-tour="notes-list" className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-semibold text-lg">{note.title}</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Created: {note.createdAt} | Updated: {note.updatedAt}
                </p>
                <div className="flex gap-2 mt-4">
                  <button className="px-4 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition text-sm">
                    Edit
                  </button>
                  <button className="px-4 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition text-sm">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {notes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No notes yet. Click "Create New Note" to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesModuleWithTour;
