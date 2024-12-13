import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import FlappyKite from './FlappyKite';
import { useState, useCallback, useEffect } from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-purple-200 bg-opacity-50 flex items-center justify-center z-50" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const BuildkiteUI = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buildStatus, setBuildStatus] = useState('running');

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Function to get a random build status
  const getRandomBuildStatus = () => {
    const statuses = ['waiting', 'scheduled', 'running', 'failing', 'failed', 'cancelled', 'passed'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  // Effect to change build status randomly every 3 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setBuildStatus(getRandomBuildStatus());
    }, 3000);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm overflow-hidden w-full">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-300 rounded-sm mr-2"></div>
            <h1 className="text-lg font-semibold text-gray-800">Starter pipeline</h1>
          </div>
          {/* <div className="text-sm text-gray-500">An example pipeline for launching a rocket that shows how Buildkite works.</div> */}
          <div className="flex items-center">
            <button className="mr-2 px-4 py-2 rounded border border-gray-300 text-sm">Settings</button>
            <button className="px-4 py-2 rounded bg-green-500 text-white text-sm">New Build</button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow flex flex-col overflow-hidden w-full">
        <div className="px-4 py-4 flex-grow flex flex-col">
          {/* Running build notification */}
          <div className="bg-white border border-amber-300 rounded-md mb-4">
            <div className="bg-amber-50 px-4 py-2 border-b border-amber-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-amber-800 font-semibold">Merge pull request #2 from buildkite/add-next-steps-annotation</h2>
                  <p className="text-amber-700 text-sm">#92 / main / bf46f7d</p>
                </div>
                {buildStatus === 'running' && (
                  <svg className="animate-spin h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </div>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full mr-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Tom Watts</p>
                  <p className="text-xs text-gray-500">Triggered from Web</p>
                </div>
              </div>
              <div className="flex items-center">
                <button 
                  onClick={openModal}
                  className="mr-2 px-4 py-1.5 pl-3.5 rounded border border-purple-300 bg-purple-100 hover:bg-purple-200 transition-colors duration-200"
                >
                  🪁
                </button>
                <button className="px-4 py-2 rounded border border-amber-300 text-sm text-amber-700 hover:bg-amber-50">Cancel build</button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex">
              <a href="#" className="border-b-2 border-indigo-500 py-2 px-4 text-sm font-medium text-indigo-600">Jobs</a>
              <a href="#" className="border-b-2 border-transparent py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">Canvas</a>
              <a href="#" className="border-b-2 border-transparent py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Waterfall
              </a>
            </nav>
          </div>

          {/* Content area */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 flex-grow overflow-auto dot-grid">
            <p className="text-gray-500">Build Status: {buildStatus}</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      {/* <footer className="bg-white border-t border-gray-200 w-full">
        <div className="px-4 py-2 flex items-center justify-between">
          <button className="flex items-center text-sm text-gray-500 px-3 py-1 hover:bg-gray-100 rounded">
            <span className="mr-1">⏵</span> Follow mode
          </button>
          <div className="flex items-center space-x-2">
            <button className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded">↔</button>
            <span className="text-sm text-gray-500">96%</span>
            <button className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded">+</button>
            <button className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded">-</button>
            <button className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded">⤢</button>
          </div>
        </div>
      </footer> */}

      {/* Modal with SimpleFlappyKite game */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {isModalOpen && <FlappyKite buildStatus={buildStatus} />}
      </Modal>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BuildkiteUI />
  </React.StrictMode>
);
