import { describe, expect, it } from 'vitest';
import { createSearchIndex, searchSuggestions } from './search.js';

describe('searchSuggestions', () => {
  it('finds a place by an alias and groups it under Places', () => {
    const index = createSearchIndex([], [{
      id: 'civic-office',
      name: 'Sample Civic Office',
      aliases: ['FMT'],
      category: 'government',
      branches: [],
    }]);

    expect(searchSuggestions(index, 'FMT').places[0].name).toBe('Sample Civic Office');
  });

  it('finds stops by landmark and returns no more than eight suggestions', () => {
    const stops = Array.from({ length: 10 }, (_, index) => ({
      id: `stop-${index}`,
      name: `Stop ${index}`,
      landmark: 'Sample market entrance',
    }));
    const index = createSearchIndex(stops);
    const suggestions = searchSuggestions(index, 'market');

    expect(suggestions.stops).toHaveLength(8);
    expect(suggestions.places).toHaveLength(0);
  });

  it('returns empty groups for an unknown alias or missing search data', () => {
    const index = createSearchIndex(null, null);

    expect(searchSuggestions(index, 'unknown-alias')).toEqual({ stops: [], places: [] });
    expect(searchSuggestions(null, 'FMT')).toEqual({ stops: [], places: [] });
  });

  it('provides balanced grouped suggestions when the query is empty', () => {
    const stops = Array.from({ length: 10 }, (_, index) => ({
      id: `stop-${index}`,
      name: `Stop ${index}`,
    }));
    const places = Array.from({ length: 6 }, (_, index) => ({
      id: `place-${index}`,
      name: `Place ${index}`,
    }));
    const suggestions = searchSuggestions(createSearchIndex(stops, places), '');

    expect(suggestions.stops).toHaveLength(4);
    expect(suggestions.places).toHaveLength(4);
  });
});
