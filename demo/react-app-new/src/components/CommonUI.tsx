import { useState } from 'react';

export const Tag: React.FC<{ text: string | null }> = ({ text }) => {
  return (
    <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
      {text}
    </span>
  );
};

export const Card: React.FC<{ children?: React.ReactNode, className: string, id?: string }> = ({ children, className, id }) => {
  const classes = `rounded overflow-hidden shadow-lg h-auto ${className}`;
  return (
    <div className={classes} id={id}>
      {children}
    </div>
  );
};

export const Tabs: React.FC<{ tabs: string[], activeTab: string, onTabClick: (tab: string) => void }> = ({ tabs, activeTab, onTabClick }) => {
  return (
    <div className="flex border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabClick(tab)}
          className={`px-4 py-2 -mb-px text-sm font-medium text-center border-b-2 transition-colors duration-300 ease-in-out ${
            activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export const Select: React.FC<{
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
}> = ({ label, options, value, onChange, multiple = false }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    onChange(selectedOptions);
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          multiple={multiple}
          className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M7 10l5 5 5-5H7z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export const Button: React.FC<{ onClick: () => void; className?: string; children: React.ReactNode }> = ({ onClick, className = '', children }) => {
  const classes = `bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${className}`;
  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
};

export const Toggle: React.FC<{ isOn: boolean; onToggle: () => void; label: string }> = ({ isOn, onToggle, label }) => {
  return (
    <div className="flex items-center">
      <div
        onClick={onToggle}
        className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer ${
          isOn ? 'bg-blue-500' : 'bg-gray-300'
        }`}
      >
        <div
          className={`bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ease-in-out ${
            isOn ? 'translate-x-6' : ''
          }`}
        ></div>
      </div>
      <span className="ml-3 text-gray-700">{label}</span>
    </div>
  );
};

export const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}> = ({ label, value, onChange, placeholder = '', type = 'text', className = '' }) => {
  const classNameValue = `mb-4 ${className}`;
  return (
    <div className={classNameValue}>
      <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      />
    </div>
  );
};

export const ColorPicker: React.FC<{
  label: string;
  color: string;
  onChange: (color: string) => void;
}> = ({ label, color, onChange }) => {
  const [currentColor, setCurrentColor] = useState(color);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCurrentColor(newColor);
    onChange(newColor);
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
      <div className="flex items-center">
        <input
          type="color"
          value={currentColor}
          onChange={handleChange}
          className="w-10 h-10 p-0 border-none"
        />
        <input
          type="text"
          value={currentColor}
          onChange={handleChange}
          className="ml-2 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
    </div>
  );
};