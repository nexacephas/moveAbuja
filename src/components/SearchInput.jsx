import { useEffect, useMemo, useRef, useState } from 'react';
import { searchSuggestions } from '../lib/search.js';
import RecordTrust from './RecordTrust.jsx';

const suggestionGroups = [
  { key: 'stops', label: 'Stops' },
  { key: 'places', label: 'Places' },
];

export default function SearchInput({
  field,
  label,
  query,
  selection,
  searchIndex,
  onQueryChange,
  onSelect,
}) {
  const [suggestions, setSuggestions] = useState({ stops: [], places: [] });
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const blurTimeoutRef = useRef(null);
  const hasSelectedQuery = selection?.name === query;
  const inputId = `${field}-search`;
  const listId = `${field}-suggestions`;
  const options = useMemo(
    () => [...suggestions.stops, ...suggestions.places],
    [suggestions],
  );
  const activeOptionId =
    isOpen && activeIndex >= 0 ? `${field}-option-${activeIndex}` : undefined;
  const selectedRecord = selection
    ? searchIndex.entries.find(
        (entry) => entry.type === selection.type && entry.id === selection.id,
      )
    : null;

  useEffect(() => {
    if (hasSelectedQuery) return undefined;

    const timeout = window.setTimeout(() => {
      setSuggestions(searchSuggestions(searchIndex, query));
      setActiveIndex(-1);
      setIsOpen(isFocused);
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [query, searchIndex, hasSelectedQuery, isFocused]);

  function chooseSuggestion(suggestion) {
    onSelect({
      type: suggestion.type,
      id: suggestion.id,
      name: suggestion.name,
    });
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' && options.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current + 1) % options.length);
    } else if (event.key === 'ArrowUp' && options.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current <= 0 ? options.length - 1 : current - 1));
    } else if (event.key === 'Enter' && isOpen && options.length > 0) {
      event.preventDefault();
      chooseSuggestion(options[activeIndex >= 0 ? activeIndex : 0]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  let optionIndex = 0;
  return (
    <div className="autocomplete">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="search"
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={isOpen && options.length > 0}
        aria-controls={isOpen && options.length > 0 ? listId : undefined}
        aria-activedescendant={activeOptionId}
        value={query}
        onChange={(event) => {
          onQueryChange(event.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          window.clearTimeout(blurTimeoutRef.current);
          setIsFocused(true);
          const suggestionQuery = selection?.name === query ? '' : query;
          setSuggestions(searchSuggestions(searchIndex, suggestionQuery));
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onBlur={() => {
          blurTimeoutRef.current = window.setTimeout(() => {
            setIsFocused(false);
            setIsOpen(false);
            setActiveIndex(-1);
          }, 120);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search stops or places"
        autoComplete="off"
      />
      {selection?.type === 'stop' && (
        <RecordTrust record={selectedRecord} className="selection-trust" />
      )}
      {isOpen && options.length > 0 && (!hasSelectedQuery || isFocused) && (
        <div className="suggestion-list" id={listId} role="listbox" aria-label={`${label} suggestions`}>
          {suggestionGroups.map((group) => {
            const groupItems = suggestions[group.key];
            if (groupItems.length === 0) return null;

            const startIndex = optionIndex;
            optionIndex += groupItems.length;
            return (
              <div className="suggestion-group" key={group.key} role="group" aria-label={group.label}>
                <p className="suggestion-group-label">{group.label}</p>
                {groupItems.map((suggestion, groupIndex) => {
                  const index = startIndex + groupIndex;
                  return (
                    <div
                      className={`suggestion-option${index === activeIndex ? ' is-active' : ''}`}
                      id={`${field}-option-${index}`}
                      key={`${suggestion.type}-${suggestion.id}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => chooseSuggestion(suggestion)}
                    >
                      <span>{suggestion.name}</span>
                      {suggestion.detail && <small>{suggestion.detail}</small>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
