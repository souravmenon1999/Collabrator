// src/components/MultiSelectDropdown.tsx
import { log } from "console";
import { useEffect, useState } from "react";

interface MultiSelectDropdownProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onSelect: (id: string, email: string) => void;
  onRemove: (id: string) => void;
}

export default function MultiSelectDropdown({
  options = [],
  selectedValues = [],
  onSelect,
  onRemove,
}: MultiSelectDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Safe filtering with null checks
  const filteredOptions = options.filter((option) => {
    const searchText = searchQuery.toLowerCase();
    return option?.label?.toLowerCase().includes(searchText);
  });

  useEffect(() => {
    console.log("Current options:", options);
    console.log("Search results:", filteredOptions);
    console.log(selectedValues);
    
  }, [searchQuery]);

  return (
    <div className="relative w-full">
      {/* Selected Chips */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedValues.map((value) => {
          const selectedOption = options.find(opt => opt.value === value);
          return (
            <div
              key={value}
              className="bg-gray-600 rounded-full px-3 py-1 text-sm flex items-center gap-2"
            >
              <span>{selectedOption?.label || "Unknown User"}</span>
              <button
                type="button"
                onClick={() => {
                  console.log("Removing value:", value);
                  onRemove(value);
                }}
                className="hover:text-red-400"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search users..."
        className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Dropdown Options */}
      {searchQuery && (
        <div className="absolute z-10 w-full mt-1 max-h-48 overflow-auto bg-[#202c33] border border-gray-600 rounded-lg">
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                console.log("Selected option value:", option); // Added console.log
                onSelect(option.value);
              }}
              className="p-2 hover:bg-gray-600 cursor-pointer"
            >
              <div className="font-medium">{option.label}</div>
              {/* Add email display if needed */}
              {/* <div className="text-xs text-gray-400">{option.email}</div> */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}