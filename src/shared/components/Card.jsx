import React from 'react';

const Card = ({ children, title, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow border border-gray-200 p-6 ${className}`}>
      {title && (
        <h2 className="text-xl font-heading font-semibold text-gray-800 mb-4 border-b pb-2">
          {title}
        </h2>
      )}
      <div className="font-sans text-gray-700">
        {children}
      </div>
    </div>
  );
};

export default React.memo(Card);