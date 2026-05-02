// src/shared/components/Button.jsx
import React, { useMemo } from 'react';

const Button = ({ onClick, children, type = 'button', variant = 'primary', disabled = false }) => {
  
  // Memorizamos las clases base para no recalcularlas en cada render
  const baseClasses = "px-4 py-2 rounded font-medium focus:outline-none transition-colors duration-200";
  
  // Memorizamos la concatenación de clases dependiendo de la variante elegida
  const buttonClasses = useMemo(() => {
    switch (variant) {
      case 'secondary':
        return `${baseClasses} bg-gray-200 text-gray-800 hover:bg-gray-300`;
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
      case 'primary':
      default:
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
    }
  }, [variant]);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${buttonClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

// Envolvemos la exportación con React.memo para evitar re-renderizados innecesarios
export default React.memo(Button);