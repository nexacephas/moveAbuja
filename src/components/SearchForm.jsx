import { useState } from 'react';
import SearchInput from './SearchInput.jsx';

function createFieldValue() {
  return { query: '', selection: null };
}

function sameSelection(first, second) {
  return first?.type === second?.type && first?.id === second?.id;
}

export default function SearchForm({
  searchIndex,
  onSelectionChange,
  onFindRoutes,
}) {
  const [from, setFrom] = useState(createFieldValue);
  const [to, setTo] = useState(createFieldValue);
  const canSearch = Boolean(
    from.selection &&
      to.selection &&
      !sameSelection(from.selection, to.selection),
  );
  const samePlaceSelected =
    from.selection && to.selection && sameSelection(from.selection, to.selection);

  function updateQuery(field, query) {
    const setValue = field === 'from' ? setFrom : setTo;
    setValue({ query, selection: null });
    onSelectionChange(field, null);
  }

  function selectSuggestion(field, selection) {
    const setValue = field === 'from' ? setFrom : setTo;
    setValue({ query: selection.name, selection });
    onSelectionChange(field, selection);
  }

  function swapFields() {
    setFrom(to);
    setTo(from);
    onSelectionChange('from', to.selection);
    onSelectionChange('to', from.selection);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (canSearch) onFindRoutes({ from: from.selection, to: to.selection });
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="search-fields">
        <div className="field">
          <SearchInput
            field="from"
            label="From"
            query={from.query}
            selection={from.selection}
            searchIndex={searchIndex}
            onQueryChange={(query) => updateQuery('from', query)}
            onSelect={(selection) => selectSuggestion('from', selection)}
          />
        </div>
        <button
          className="swap-button"
          type="button"
          onClick={swapFields}
          aria-label="Swap From and To"
          title="Swap From and To"
        >
          <span aria-hidden="true">⇅</span>
        </button>
        <div className="field">
          <SearchInput
            field="to"
            label="To"
            query={to.query}
            selection={to.selection}
            searchIndex={searchIndex}
            onQueryChange={(query) => updateQuery('to', query)}
            onSelect={(selection) => selectSuggestion('to', selection)}
          />
        </div>
      </div>
      <button className="primary-button" type="submit" disabled={!canSearch}>
        Find routes
      </button>
      {samePlaceSelected && (
        <p className="field-hint" role="status">Choose two different places to find a route.</p>
      )}
    </form>
  );
}
